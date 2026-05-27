package com.myway.backendspring.feature.media;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class MediaExtractionCallbackSupport {
    public boolean isStaleCallback(Map<String, Object> extraction, long eventVersion) {
        return eventVersion <= asLong(extraction.get("last_event_version"));
    }

    public Map<String, Object> staleCallbackResponse(Map<String, Object> extraction) {
        extraction.put("callback_ignored", true);
        extraction.put("callback_status", "IGNORED_STALE");
        return extraction;
    }

    public String resolveErrorMessage(MediaStatus status, String errorMessage) {
        if (status == MediaStatus.FAILED && (errorMessage == null || errorMessage.isBlank())) {
            return "media processor callback failed";
        }
        return errorMessage;
    }

    public void applyCallbackMetadata(
            Map<String, Object> extraction,
            long eventVersion,
            MediaStatus callbackStatus,
            String errorMessage,
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
            String notificationChannel,
            String now
    ) {
        extraction.put("last_event_version", eventVersion);
        extraction.put("status", callbackStatus.name());
        extraction.put("error_message", errorMessage);
        putIfText(extraction, "audio_url", audioUrl);
        putIfText(extraction, "processing_job_id", processingJobId);
        putIfText(extraction, "processing_stage", processingStage);
        putIfText(extraction, "processing_step", processingStep);
        putIfText(extraction, "audio_format", audioFormat);
        if (sampleRate != null && sampleRate > 0) extraction.put("sample_rate", sampleRate);
        if (channels != null && channels > 0) extraction.put("channels", channels);
        extraction.put("stt_sync_mode", normalizeOrDefault(syncMode, "AUTO").toLowerCase());
        extraction.put("stt_overwrite_policy", normalizeOrDefault(overwritePolicy, "OVERWRITE").toLowerCase());
        extraction.put("stt_approval_state", normalizeOrDefault(approvalState, "PENDING").toLowerCase());
        extraction.put("stt_sync_notification_channel", normalizeOrDefault(notificationChannel, "dashboard"));
        extraction.put("stt_sync_notified_at", now);
        extraction.put("stt_sync_metrics", Map.of("callback_events", 1, "notifications", 1));

        if (callbackStatus == MediaStatus.COMPLETED) {
            extraction.put("status", MediaStatus.PROCESSING.name());
            extraction.put("processing_stage", PipelineStage.TRANSCRIBING.value());
            extraction.put("processing_step", "stt_started");
            extraction.put("stt_status", MediaStatus.PROCESSING.name());
            extraction.put("processing_error_code", null);
            extraction.put("processing_error", null);
        } else if (callbackStatus == MediaStatus.FAILED) {
            extraction.put("processing_stage", PipelineStage.FAILED.value());
            extraction.put("processing_step", "callback_failed");
            extraction.put("stt_status", MediaStatus.FAILED.name());
            extraction.put("processing_error_code", "PROCESSOR_CALLBACK_FAILED");
            extraction.put("processing_error", errorMessage);
        } else {
            extraction.put("processing_stage", PipelineStage.CALLBACK.value());
            extraction.put("processing_step", "callback_received");
        }
        extraction.put("processed_at", now);
        extraction.put("callback_ignored", false);
        extraction.put("callback_status", "APPLIED");
        extraction.put("updated_at", now);
    }

    public Map<String, Object> buildPipelineFromCallback(String lectureId, String transcriptId, String extractionId, MediaStatus callbackStatus, String errorMessage, String now) {
        boolean failed = callbackStatus == MediaStatus.FAILED;
        Map<String, Object> map = new HashMap<>();
        map.put("lecture_id", lectureId);
        map.put("audio_status", failed ? MediaStatus.FAILED.name() : MediaStatus.COMPLETED.name());
        map.put("transcript_status", failed ? MediaStatus.FAILED.name() : MediaStatus.PROCESSING.name());
        map.put("summary_status", MediaStatus.PENDING.name());
        map.put("processing_stage", failed ? PipelineStage.FAILED.value() : PipelineStage.TRANSCRIBING.value());
        map.put("processing_step", failed ? "callback_failed" : "stt_started");
        map.put("processing_error_code", failed ? "PROCESSOR_CALLBACK_FAILED" : null);
        map.put("processing_error", failed ? errorMessage : null);
        map.put("transcript_id", transcriptId);
        map.put("note_id", null);
        map.put("extraction_id", extractionId);
        map.put("updated_at", now);
        return map;
    }

    private void putIfText(Map<String, Object> target, String key, String value) {
        if (value != null && !value.isBlank()) target.put(key, value);
    }

    private String normalizeOrDefault(String value, String defaultValue) {
        if (value == null) return defaultValue;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? defaultValue : trimmed;
    }

    private long asLong(Object value) {
        if (value == null) return 0L;
        if (value instanceof Number n) return n.longValue();
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (Exception ignored) {
            return 0L;
        }
    }
}
