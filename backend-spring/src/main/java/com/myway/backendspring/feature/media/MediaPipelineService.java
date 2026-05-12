package com.myway.backendspring.feature.media;

import com.myway.backendspring.feature.FeatureStoreService;
import com.myway.backendspring.feature.repository.FeatureStoreRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class MediaPipelineService {
    private static final String TRANSCRIPT_SCOPE = "media_transcript";
    private static final String EXTRACTION_SCOPE = "media_extraction";
    private static final String PIPELINE_SCOPE = "media_pipeline";
    private static final String MEDIA_NOTE_SCOPE = "media_note";
    private static final String MEDIA_ASSET_SCOPE = "media_asset";

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
        return payload;
    }

    public Map<String, Object> createExtraction(String lectureId, String audioUrl) {
        String id = UUID.randomUUID().toString();
        String now = Instant.now().toString();
        Map<String, Object> item = new HashMap<>();
        item.put("id", id);
        item.put("lecture_id", lectureId);
        item.put("status", "PROCESSING");
        item.put("audio_url", audioUrl);
        item.put("processing_stage", "queued");
        item.put("processing_step", "job_requested");
        item.put("processing_error_code", null);
        item.put("processing_error", null);
        item.put("stt_status", "PENDING");
        item.put("transcript_id", null);
        item.put("last_event_version", 0L);
        item.put("created_at", now);
        item.put("updated_at", now);
        repository.insertEvent(EXTRACTION_SCOPE, lectureId, id, item);
        repository.upsertKv(EXTRACTION_SCOPE, id, item);

        Map<String, Object> pipeline = new HashMap<>();
        pipeline.put("lecture_id", lectureId);
        pipeline.put("transcript_status", "PENDING");
        pipeline.put("summary_status", "PENDING");
        pipeline.put("audio_status", "PROCESSING");
        pipeline.put("processing_stage", "queued");
        pipeline.put("processing_step", "job_requested");
        pipeline.put("processing_error_code", null);
        pipeline.put("processing_error", null);
        pipeline.put("transcript_id", null);
        pipeline.put("note_id", null);
        pipeline.put("extraction_id", id);
        pipeline.put("updated_at", now);
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
        hydrated.putIfAbsent("audio_status", "PENDING");
        hydrated.putIfAbsent("transcript_status", "PENDING");
        hydrated.putIfAbsent("summary_status", "PENDING");
        hydrated.putIfAbsent("processing_stage", "idle");
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
}
