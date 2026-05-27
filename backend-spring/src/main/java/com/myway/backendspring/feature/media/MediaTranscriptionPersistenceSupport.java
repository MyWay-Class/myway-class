package com.myway.backendspring.feature.media;

import com.myway.backendspring.feature.repository.FeatureStoreRepository;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class MediaTranscriptionPersistenceSupport {

    Map<String, Object> markExtractionInProgress(FeatureStoreRepository repository, String extractionScope, Map<String, Object> extraction, String now) {
        Map<String, Object> payload = new HashMap<>(extraction);
        applyExtractionStatusUpdate(payload, new ExtractionStatusUpdate(
                MediaStatus.PROCESSING.name(),
                MediaStatus.PROCESSING.name(),
                PipelineStage.TRANSCRIBING.value(),
                "stt_started",
                null,
                null,
                now
        ));
        String extractionId = String.valueOf(payload.getOrDefault("id", ""));
        repository.upsertKv(extractionScope, extractionId, payload);
        return payload;
    }

    Map<String, Object> persistPipeline(FeatureStoreRepository repository, String pipelineScope, String lectureId, Object extractionId, String transcriptId, String now) {
        PipelinePayload payload = PipelinePayload.completed(lectureId, transcriptId, extractionId, now);
        repository.upsertKv(pipelineScope, lectureId, payload.toMap());
        return payload.toMap();
    }

    void persistCompletedExtraction(FeatureStoreRepository repository, String extractionScope, Map<String, Object> extractionInProgress, String transcriptId, int durationMs, String language, String provider, String model, String audioUrl, Map<String, Object> quality, String now) {
        Map<String, Object> extractionPayload = new HashMap<>(extractionInProgress);
        applyExtractionStatusUpdate(extractionPayload, new ExtractionStatusUpdate(
                MediaStatus.COMPLETED.name(),
                MediaStatus.COMPLETED.name(),
                PipelineStage.COMPLETED.value(),
                "stt_completed",
                null,
                null,
                now
        ));
        extractionPayload.put("transcript_id", transcriptId);
        extractionPayload.put("audio_duration_ms", durationMs);
        extractionPayload.put("processed_at", now);
        extractionPayload.put("language", language);
        extractionPayload.put("requested_stt_provider", provider);
        extractionPayload.put("requested_stt_model", model);
        extractionPayload.put("audio_url", audioUrl);
        extractionPayload.put("stt_quality", quality);
        repository.upsertKv(extractionScope, transcriptId, extractionPayload);
    }

    ExtractionSnapshot findExtraction(FeatureStoreRepository repository, String extractionScope, String extractionId) {
        Map<String, Object> extraction = repository.getKv(extractionScope, extractionId);
        if (extraction != null) return ExtractionSnapshot.from(extraction);
        for (Map<String, Object> row : repository.listEventsByScope(extractionScope)) {
            if (extractionId.equals(String.valueOf(row.getOrDefault("id", "")))) return ExtractionSnapshot.from(row);
        }
        return null;
    }

    Map<String, Object> normalizeExtractionForResponse(Map<String, Object> extraction) {
        Map<String, Object> hydrated = new HashMap<>(extraction);
        hydrated.putIfAbsent("processing_stage", PipelineStage.QUEUED.value());
        hydrated.putIfAbsent("processing_step", "job_requested");
        hydrated.putIfAbsent("processing_error_code", null);
        hydrated.putIfAbsent("processing_error", null);
        hydrated.putIfAbsent("stt_status", MediaStatus.PENDING.name());
        hydrated.putIfAbsent("error_message", null);
        hydrated.putIfAbsent("callback_ignored", false);
        hydrated.putIfAbsent("callback_status", "APPLIED");
        hydrated.putIfAbsent("last_event_version", 0L);
        return hydrated;
    }

    private void applyExtractionStatusUpdate(Map<String, Object> extraction, ExtractionStatusUpdate update) {
        extraction.put("status", update.status());
        extraction.put("stt_status", update.sttStatus());
        extraction.put("processing_stage", update.processingStage());
        extraction.put("processing_step", update.processingStep());
        extraction.put("processing_error_code", update.processingErrorCode());
        extraction.put("processing_error", update.processingError());
        extraction.put("updated_at", update.updatedAt());
    }

    record ExtractionStatusUpdate(
            String status,
            String sttStatus,
            String processingStage,
            String processingStep,
            Object processingErrorCode,
            Object processingError,
            String updatedAt
    ) {
    }

    record PipelinePayload(
            String lectureId,
            String transcriptStatus,
            String summaryStatus,
            String audioStatus,
            String processingStage,
            String processingStep,
            Object processingErrorCode,
            Object processingError,
            String transcriptId,
            Object noteId,
            Object extractionId,
            String updatedAt
    ) {
        static PipelinePayload completed(String lectureId, String transcriptId, Object extractionId, String now) {
            return new PipelinePayload(
                    lectureId,
                    MediaStatus.COMPLETED.name(),
                    MediaStatus.PENDING.name(),
                    MediaStatus.COMPLETED.name(),
                    PipelineStage.COMPLETED.value(),
                    "stt_completed",
                    null,
                    null,
                    transcriptId,
                    null,
                    extractionId,
                    now
            );
        }

        Map<String, Object> toMap() {
            Map<String, Object> map = new HashMap<>();
            map.put("lecture_id", lectureId);
            map.put("transcript_status", transcriptStatus);
            map.put("summary_status", summaryStatus);
            map.put("audio_status", audioStatus);
            map.put("processing_stage", processingStage);
            map.put("processing_step", processingStep);
            map.put("processing_error_code", processingErrorCode);
            map.put("processing_error", processingError);
            map.put("transcript_id", transcriptId);
            map.put("note_id", noteId);
            map.put("extraction_id", extractionId);
            map.put("updated_at", updatedAt);
            return map;
        }
    }

    record ExtractionSnapshot(String id, String lectureId, String transcriptId, Map<String, Object> raw) {
        static ExtractionSnapshot from(Map<String, Object> row) {
            Map<String, Object> copy = new HashMap<>(row);
            return new ExtractionSnapshot(
                    String.valueOf(copy.getOrDefault("id", "")).trim(),
                    String.valueOf(copy.getOrDefault("lecture_id", "")).trim(),
                    copy.get("transcript_id") == null ? null : String.valueOf(copy.get("transcript_id")).trim(),
                    copy
            );
        }

        Map<String, Object> toMap() {
            return new HashMap<>(raw);
        }
    }
}
