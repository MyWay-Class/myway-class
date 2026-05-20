package com.myway.backendspring.feature.media;

import com.myway.backendspring.feature.FeatureStoreService;
import com.myway.backendspring.feature.repository.FeatureStoreRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Service
public class MediaPipelineService {
    private static final String TRANSCRIPT_SCOPE = "media_transcript";
    private static final String EXTRACTION_SCOPE = "media_extraction";
    private static final String PIPELINE_SCOPE = "media_pipeline";
    private static final String MEDIA_NOTE_SCOPE = "media_note";
    private static final String MEDIA_ASSET_SCOPE = "media_asset";
    private static final String LECTURE_VIDEO_SCOPE = "lecture_video_asset";

    private final FeatureStoreRepository repository;
    private final FeatureStoreService featureStoreService;

    public MediaPipelineService(FeatureStoreRepository repository, FeatureStoreService featureStoreService) {
        this.repository = repository;
        this.featureStoreService = featureStoreService;
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
        // Keep existing upload contract and persist lecture->asset mapping automatically.
        bindLectureVideoAsset(lectureId, key, null);
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
        Map<String, Object> row = repository.getKv(PIPELINE_SCOPE, lectureId);
        Map<String, Object> hydrated = row == null ? new HashMap<>() : new HashMap<>(row);
        hydrated.putIfAbsent("lecture_id", lectureId);
        hydrated.putIfAbsent("status", row == null ? "EMPTY" : "IN_PROGRESS");
        hydrated.putIfAbsent("audio_status", MediaStatus.PENDING.name());
        hydrated.putIfAbsent("transcript_status", MediaStatus.PENDING.name());
        hydrated.putIfAbsent("summary_status", MediaStatus.PENDING.name());
        hydrated.putIfAbsent("processing_stage", PipelineStage.IDLE.value());
        hydrated.putIfAbsent("processing_step", "not_started");
        hydrated.putIfAbsent("processing_error_code", null);
        hydrated.putIfAbsent("processing_error", null);
        hydrated.putIfAbsent("transcript_id", null);
        hydrated.putIfAbsent("note_id", null);
        hydrated.putIfAbsent("extraction_id", null);
        hydrated.putIfAbsent("updated_at", Instant.now().toString());
        return hydrated;
    }

    public List<Map<String, Object>> extractions(String lectureId) {
        return repository.listEventsByOwner(EXTRACTION_SCOPE, lectureId);
    }

    public Map<String, Object> transcript(String lectureId) {
        return repository.getKv(TRANSCRIPT_SCOPE, lectureId);
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
        repository.upsertKv(LECTURE_VIDEO_SCOPE, normalizedLectureId, payload);
        return payload;
    }

    public Map<String, Object> lectureVideoAsset(String lectureId) {
        if (lectureId == null || lectureId.isBlank()) return null;
        return repository.getKv(LECTURE_VIDEO_SCOPE, lectureId.trim());
    }

    public Map<String, Object> runBatchPipeline(
            List<String> lectureIds,
            Integer retryCountInput,
            boolean forceRun,
            String language,
            String sttProvider,
            String sttModel
    ) {
        List<Map<String, Object>> mappings = repository.listKvByScope(LECTURE_VIDEO_SCOPE);
        Map<String, Map<String, Object>> mappedByLecture = new LinkedHashMap<>();
        for (Map<String, Object> mapping : mappings) {
            String lectureId = String.valueOf(mapping.getOrDefault("lecture_id", "")).trim();
            if (!lectureId.isBlank()) {
                mappedByLecture.put(lectureId, mapping);
            }
        }

        Set<String> targetLectures = resolveTargetLectures(lectureIds, mappedByLecture.keySet());
        int retryCount = normalizeRetryCount(retryCountInput);
        int maxAttempts = retryCount + 1;
        String normalizedLanguage = normalizeOrDefault(language, "ko");

        List<Map<String, Object>> items = new ArrayList<>();
        int success = 0;
        int failed = 0;
        int pending = 0;

        for (String lectureId : targetLectures) {
            Map<String, Object> mapping = mappedByLecture.get(lectureId);
            if (mapping == null) {
                pending++;
                items.add(batchPending(lectureId, "MAPPING_MISSING", "강의에 연결된 영상 에셋이 없어 대기 상태로 남겼습니다."));
                continue;
            }

            Map<String, Object> currentPipeline = pipeline(lectureId);
            if (!forceRun && isPipelineRunning(currentPipeline)) {
                pending++;
                items.add(batchPending(lectureId, "PIPELINE_IN_PROGRESS", "기존 파이프라인이 처리 중이라 이번 배치에서 건너뛰었습니다."));
                continue;
            }

            BatchAttemptResult result = executeSingleLecture(
                    lectureId,
                    mapping,
                    maxAttempts,
                    normalizedLanguage,
                    sttProvider,
                    sttModel
            );
            if ("SUCCESS".equals(result.status())) {
                success++;
            } else if ("FAILED".equals(result.status())) {
                failed++;
            } else {
                pending++;
            }
            items.add(result.toMap());
        }

        return Map.of(
                "batch_scope", "mapped_lectures",
                "requested_count", targetLectures.size(),
                "processed_count", items.size(),
                "retry_count", retryCount,
                "force_run", forceRun,
                "summary", Map.of(
                        "success", success,
                        "failed", failed,
                        "pending", pending
                ),
                "items", items,
                "updated_at", Instant.now().toString()
        );
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
            Integer channels
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
                channels
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

    private BatchAttemptResult executeSingleLecture(
            String lectureId,
            Map<String, Object> mapping,
            int maxAttempts,
            String language,
            String sttProvider,
            String sttModel
    ) {
        String assetKey = String.valueOf(mapping.getOrDefault("asset_key", "")).trim();
        String audioUrl = String.valueOf(mapping.getOrDefault("video_url", "")).trim();
        if (audioUrl.isBlank() && !assetKey.isBlank()) {
            audioUrl = "/api/v1/media/assets/" + assetKey;
        }
        if (audioUrl.isBlank()) {
            return new BatchAttemptResult(lectureId, "FAILED", 1, "ASSET_URL_MISSING", "영상 URL을 찾을 수 없습니다.", null, null, null, null);
        }

        int attemptsUsed = 0;
        String lastErrorCode = null;
        String lastErrorMessage = null;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            attemptsUsed = attempt;
            try {
                Map<String, Object> extraction = createExtraction(lectureId, audioUrl);
                String extractionId = String.valueOf(extraction.getOrDefault("id", "")).trim();
                Map<String, Object> dispatch = dispatchExtractionJob(extractionId, audioUrl);
                if (dispatch == null) {
                    throw new IllegalStateException("오디오 추출 작업 디스패치에 실패했습니다.");
                }
                Map<String, Object> transcript = transcribe(
                        lectureId,
                        language,
                        null,
                        normalizeNullable(sttProvider),
                        normalizeNullable(sttModel),
                        audioUrl,
                        extractionId
                );
                Map<String, Object> ragIndex = featureStoreService.rebuildRagIndex(lectureId, null);
                Map<String, Object> pipeline = pipeline(lectureId);
                return new BatchAttemptResult(
                        lectureId,
                        "SUCCESS",
                        attemptsUsed,
                        null,
                        null,
                        extractionId,
                        transcript,
                        ragIndex,
                        pipeline
                );
            } catch (RuntimeException ex) {
                lastErrorCode = "PIPELINE_EXECUTION_FAILED";
                lastErrorMessage = ex.getMessage() == null ? "파이프라인 실행 중 오류가 발생했습니다." : ex.getMessage();
            }
        }
        return new BatchAttemptResult(
                lectureId,
                "FAILED",
                attemptsUsed,
                lastErrorCode,
                lastErrorMessage,
                null,
                null,
                null,
                pipeline(lectureId)
        );
    }

    private Map<String, Object> batchPending(String lectureId, String code, String message) {
        return Map.of(
                "lecture_id", lectureId,
                "status", "PENDING",
                "attempts_used", 0,
                "error_code", code,
                "error_message", message
        );
    }

    private Set<String> resolveTargetLectures(List<String> requestedLectureIds, Set<String> mappedLectureIds) {
        if (requestedLectureIds == null || requestedLectureIds.isEmpty()) {
            return new LinkedHashSet<>(mappedLectureIds);
        }
        Set<String> resolved = new LinkedHashSet<>();
        for (String lectureId : requestedLectureIds) {
            String normalized = lectureId == null ? "" : lectureId.trim();
            if (!normalized.isBlank()) {
                resolved.add(normalized);
            }
        }
        return resolved;
    }

    private boolean isPipelineRunning(Map<String, Object> pipeline) {
        String stage = String.valueOf(pipeline.getOrDefault("processing_stage", "")).toLowerCase();
        return "queued".equals(stage) || "transcribing".equals(stage) || "callback".equals(stage);
    }

    private int normalizeRetryCount(Integer retryCountInput) {
        if (retryCountInput == null) return 0;
        return Math.max(0, Math.min(5, retryCountInput));
    }

    private String normalizeOrDefault(String value, String defaultValue) {
        if (value == null) return defaultValue;
        String trimmed = value.trim();
        return trimmed.isBlank() ? defaultValue : trimmed;
    }

    private String normalizeNullable(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private record BatchAttemptResult(
            String lectureId,
            String status,
            int attemptsUsed,
            String errorCode,
            String errorMessage,
            String extractionId,
            Map<String, Object> transcript,
            Map<String, Object> ragIndex,
            Map<String, Object> pipeline
    ) {
        Map<String, Object> toMap() {
            Map<String, Object> map = new HashMap<>();
            map.put("lecture_id", lectureId);
            map.put("status", status);
            map.put("attempts_used", attemptsUsed);
            map.put("error_code", errorCode);
            map.put("error_message", errorMessage);
            map.put("extraction_id", extractionId);
            map.put("transcript", transcript);
            map.put("rag_index", ragIndex);
            map.put("pipeline", pipeline);
            return map;
        }
    }
}
