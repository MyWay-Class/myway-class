package com.myway.backendspring.feature.media;

import com.myway.backendspring.feature.FeatureStoreService;
import com.myway.backendspring.feature.repository.FeatureStoreRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class MediaPipelineService {
    private static final String TRANSCRIPT_SCOPE = "media_transcript";
    private static final String EXTRACTION_SCOPE = "media_extraction";
    private static final String PIPELINE_SCOPE = "media_pipeline";
    private static final String MEDIA_NOTE_SCOPE = "media_note";
    private static final String MEDIA_ASSET_SCOPE = "media_asset";
    private static final String LECTURE_VIDEO_ASSET_SCOPE = "lecture_video_asset";
    private static final String MEDIA_BATCH_STATUS_SCOPE = "media_batch_status";
    private static final String SPEAKER_REVIEW_SCOPE = "media_speaker_review";

    private final FeatureStoreRepository repository;
    private final FeatureStoreService featureStoreService;
    private final MediaPipelineQuerySupport querySupport;

    public MediaPipelineService(
            FeatureStoreRepository repository,
            FeatureStoreService featureStoreService,
            MediaPipelineQuerySupport querySupport
    ) {
        this.repository = repository;
        this.featureStoreService = featureStoreService;
        this.querySupport = querySupport;
    }

    public Map<String, Object> mediaUpload(String lectureId, String fileName) {
        String key = "asset/" + lectureId + "/" + UUID.randomUUID();
        Map<String, Object> payload = Map.of(
                "lecture_id", lectureId,
                "asset_key", key,
                "video_url", "/api/v1/media/assets/" + key,
                "file_name", fileName
        );
        repository.upsertKv(MEDIA_ASSET_SCOPE, key, payload);
        upsertLectureVideoAssetMapping(lectureId, key);
        return payload;
    }

    public Map<String, Object> createExtraction(String lectureId, String audioUrl) {
        String id = UUID.randomUUID().toString();
        String now = Instant.now().toString();
        Map<String, Object> item = new ExtractionSeed(id, lectureId, audioUrl, now).toMap();
        repository.insertEvent(EXTRACTION_SCOPE, lectureId, id, item);
        repository.upsertKv(EXTRACTION_SCOPE, id, item);

        Map<String, Object> pipeline = new PipelineSeed(lectureId, id, now).toMap();
        repository.upsertKv(PIPELINE_SCOPE, lectureId, pipeline);
        return item;
    }

    public Map<String, Object> dispatchExtractionJob(String extractionId, String audioUrl) {
        return featureStoreService.dispatchExtractionJob(extractionId, audioUrl);
    }

    public Map<String, Object> transcribe(String lectureId, String language, Integer durationMs, String sttProvider, String sttModel, String audioUrl) {
        return featureStoreService.transcribe(lectureId, language, durationMs, sttProvider, sttModel, audioUrl);
    }

    public Map<String, Object> transcribe(String lectureId, String language, Integer durationMs, String sttProvider, String sttModel, String audioUrl, String extractionId) {
        return featureStoreService.transcribe(lectureId, language, durationMs, sttProvider, sttModel, audioUrl, extractionId);
    }

    public Map<String, Object> summarizeLecture(String lectureId, String style, String language) {
        Map<String, Object> note = new HashMap<>();
        note.put("id", UUID.randomUUID().toString());
        note.put("lecture_id", lectureId);
        note.put("title", "자동 요약 노트");
        note.put("content", "Spring 백엔드에서 생성한 요약입니다.");
        note.put("key_concepts", List.of("핵심 개념", "핵심 정리"));
        note.put("keywords", List.of("spring", "summary"));
        note.put("timestamps", List.of(Map.of("start_ms", 0, "end_ms", 30000, "label", "인트로")));
        note.put("style", style == null || style.isBlank() ? "brief" : style);
        note.put("language", language == null || language.isBlank() ? "ko" : language);
        note.put("created_at", Instant.now().toString());
        repository.insertEvent(MEDIA_NOTE_SCOPE, lectureId, String.valueOf(note.get("id")), note);
        return note;
    }

    public Map<String, Object> pipeline(String lectureId) {
        return querySupport.pipeline(repository, PIPELINE_SCOPE, lectureId);
    }

    public List<Map<String, Object>> extractions(String lectureId) {
        return repository.listEventsByOwner(EXTRACTION_SCOPE, lectureId);
    }

    public Map<String, Object> transcript(String lectureId) {
        return querySupport.transcript(repository, TRANSCRIPT_SCOPE, lectureId, speakerReview(lectureId));
    }

    public Map<String, Object> speakerReview(String lectureId) {
        return querySupport.speakerReview(repository, SPEAKER_REVIEW_SCOPE, lectureId);
    }

    public Map<String, Object> upsertSpeakerReview(String lectureId, String speakerLabel, String instructorName, Double confidence, String note, String reviewerId) {
        if (lectureId == null || lectureId.isBlank()) {
            return null;
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put("lecture_id", lectureId.trim());
        payload.put("speaker_label", speakerLabel == null || speakerLabel.isBlank() ? "SPEAKER_01" : speakerLabel.trim());
        payload.put("instructor_name", instructorName == null ? "" : instructorName.trim());
        payload.put("confidence", confidence == null ? 0.0 : Math.max(0.0, Math.min(1.0, confidence)));
        payload.put("note", note == null ? "" : note.trim());
        payload.put("reviewer_id", reviewerId == null ? "" : reviewerId.trim());
        payload.put("status", "CONFIRMED");
        payload.put("updated_at", Instant.now().toString());
        repository.upsertKv(SPEAKER_REVIEW_SCOPE, lectureId.trim(), payload);
        return payload;
    }

    public List<Map<String, Object>> notes(String lectureId) {
        return repository.listEventsByOwner(MEDIA_NOTE_SCOPE, lectureId);
    }

    public Map<String, Object> sttProviders() {
        return featureStoreService.sttProviders();
    }

    public Map<String, Object> processorHealth() {
        return featureStoreService.processorHealth();
    }

    public Map<String, Object> mediaAsset(String assetKey) {
        return repository.getKv(MEDIA_ASSET_SCOPE, assetKey);
    }

    public Map<String, Object> bindLectureVideoAsset(String lectureId, String assetKey, String videoUrl) {
        String normalizedLectureId = lectureId == null ? "" : lectureId.trim();
        String normalizedAssetKey = assetKey == null ? "" : assetKey.trim();
        if (normalizedLectureId.isBlank() || normalizedAssetKey.isBlank()) {
            return null;
        }
        String resolvedVideoUrl = (videoUrl == null || videoUrl.trim().isBlank())
                ? "/api/v1/media/assets/" + normalizedAssetKey
                : videoUrl.trim();
        Map<String, Object> payload = new HashMap<>();
        payload.put("lecture_id", normalizedLectureId);
        payload.put("asset_key", normalizedAssetKey);
        payload.put("video_url", resolvedVideoUrl);
        payload.put("updated_at", Instant.now().toString());
        repository.upsertKv(LECTURE_VIDEO_ASSET_SCOPE, normalizedLectureId, payload);
        return payload;
    }

    public Map<String, Object> lectureVideoAsset(String lectureId) {
        if (lectureId == null || lectureId.isBlank()) return null;
        return repository.getKv(LECTURE_VIDEO_ASSET_SCOPE, lectureId.trim());
    }

    public Map<String, Object> runBatchPipeline(
            List<String> lectureIds,
            Integer retryCountInput,
            boolean forceRun,
            String language,
            String sttProvider,
            String sttModel
    ) {
        Set<String> targets = new LinkedHashSet<>();
        if (lectureIds != null) {
            for (String lectureId : lectureIds) {
                if (lectureId != null && !lectureId.trim().isBlank()) {
                    targets.add(lectureId.trim());
                }
            }
        }
        if (targets.isEmpty()) {
            targets.addAll(lectureVideoAssetMap().keySet());
        }

        List<Map<String, Object>> items = new ArrayList<>();
        int success = 0;
        int failed = 0;
        int pending = 0;
        for (String lectureId : targets) {
            Map<String, Object> mapping = lectureVideoAsset(lectureId);
            if (mapping == null) {
                pending++;
                items.add(Map.of("lecture_id", lectureId, "status", "PENDING", "error_code", "MAPPING_MISSING"));
                continue;
            }
            String assetKey = String.valueOf(mapping.getOrDefault("asset_key", "")).trim();
            if (assetKey.isBlank()) {
                pending++;
                items.add(Map.of("lecture_id", lectureId, "status", "PENDING", "error_code", "ASSET_KEY_MISSING"));
                continue;
            }

            String audioUrl = "/api/v1/media/assets/" + assetKey;
            Map<String, Object> extraction = createExtraction(lectureId, audioUrl);
            String extractionId = String.valueOf(extraction.getOrDefault("id", ""));
            Map<String, Object> dispatched = dispatchExtractionJob(extractionId, audioUrl);
            String status = String.valueOf(dispatched == null ? "" : dispatched.getOrDefault("status", "")).toUpperCase();
            if ("FAILED".equals(status)) {
                failed++;
            } else if ("PROCESSING".equals(status) || "PENDING".equals(status) || status.isBlank()) {
                pending++;
            } else {
                success++;
            }
            items.add(Map.of("lecture_id", lectureId, "status", status.isBlank() ? "PENDING" : status, "extraction_id", extractionId));
        }

        return Map.of(
                "batch_scope", "mapped_lectures",
                "requested_count", targets.size(),
                "processed_count", items.size(),
                "retry_count", retryCountInput == null ? 0 : Math.max(0, retryCountInput),
                "force_run", forceRun,
                "summary", Map.of("success", success, "failed", failed, "pending", pending),
                "items", items,
                "updated_at", Instant.now().toString()
        );
    }

    public void upsertMediaAsset(String assetKey, String lectureId) {
        repository.upsertKv(MEDIA_ASSET_SCOPE, assetKey, Map.of(
                "lecture_id", lectureId,
                "asset_key", assetKey,
                "video_url", "/api/v1/media/assets/" + assetKey,
                "file_name", "auto-mapped.mp4",
                "updated_at", Instant.now().toString()
        ));
    }

    public void upsertLectureVideoAssetMapping(String lectureId, String assetKey) {
        bindLectureVideoAsset(lectureId, assetKey, null);
    }

    public Map<String, Object> lectureVideoAssetMapping(String lectureId) {
        return repository.getKv(LECTURE_VIDEO_ASSET_SCOPE, lectureId);
    }

    public Map<String, String> lectureVideoAssetMap() {
        return querySupport.lectureVideoAssetMap(repository, LECTURE_VIDEO_ASSET_SCOPE);
    }

    public void upsertBatchStatus(Map<String, Object> payload) {
        repository.upsertKv(MEDIA_BATCH_STATUS_SCOPE, "pipeline", payload);
    }

    public Map<String, Object> batchStatus() {
        return repository.getKv(MEDIA_BATCH_STATUS_SCOPE, "pipeline");
    }

    public Map<String, Object> completeExtractionCallback(
            String extractionId,
            String status,
            String errorMessage,
            long eventVersion,
            String audioUrl,
            String processingJobId,
            String processingStage,
            String processingStep,
            String audioFormat,
            Integer sampleRate,
            Integer channels,
            String syncMode,
            String overwritePolicy,
            String approvalState,
            String notificationChannel
    ) {
        return featureStoreService.completeExtractionCallback(
                extractionId,
                status,
                errorMessage,
                eventVersion,
                audioUrl,
                processingJobId,
                processingStage,
                processingStep,
                audioFormat,
                sampleRate,
                channels,
                syncMode,
                overwritePolicy,
                approvalState,
                notificationChannel
        );
    }

    private record ExtractionSeed(String id, String lectureId, String audioUrl, String now) {
        Map<String, Object> toMap() {
            Map<String, Object> map = new HashMap<>();
            map.put("id", id);
            map.put("lecture_id", lectureId);
            map.put("status", MediaStatus.PROCESSING.name());
            map.put("audio_url", audioUrl);
            map.put("processing_stage", PipelineStage.QUEUED.value());
            map.put("processing_step", "job_requested");
            map.put("processing_error_code", null);
            map.put("processing_error", null);
            map.put("stt_status", MediaStatus.PENDING.name());
            map.put("transcript_id", null);
            map.put("last_event_version", 0L);
            map.put("created_at", now);
            map.put("updated_at", now);
            return map;
        }
    }

    private record PipelineSeed(String lectureId, String extractionId, String now) {
        Map<String, Object> toMap() {
            Map<String, Object> map = new HashMap<>();
            map.put("lecture_id", lectureId);
            map.put("transcript_status", MediaStatus.PENDING.name());
            map.put("summary_status", MediaStatus.PENDING.name());
            map.put("audio_status", MediaStatus.PROCESSING.name());
            map.put("processing_stage", PipelineStage.QUEUED.value());
            map.put("processing_step", "job_requested");
            map.put("processing_error_code", null);
            map.put("processing_error", null);
            map.put("transcript_id", null);
            map.put("note_id", null);
            map.put("extraction_id", extractionId);
            map.put("updated_at", now);
            return map;
        }
    }
}
