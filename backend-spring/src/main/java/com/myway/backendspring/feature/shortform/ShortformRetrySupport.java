package com.myway.backendspring.feature.shortform;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;

@Component
public class ShortformRetrySupport {
    public Map<String, Object> applyExportCallback(
            Map<String, Object> video,
            String status,
            long eventVersion,
            String videoUrl,
            String errorMessage,
            int shortformMaxRetry
    ) {
        long currentVersion = asLong(video.get("last_event_version"));
        if (eventVersion <= currentVersion) {
            video.put("callback_ignored", true);
            return video;
        }

        video.put("last_event_version", eventVersion);
        video.put("updated_at", Instant.now().toString());
        if ("FAILED".equalsIgnoreCase(status)) {
            int retryCount = asInt(video.get("retry_count"));
            video.put("export_status", retryCount >= shortformMaxRetry ? "FAILED_PERMANENT" : "FAILED");
            video.put("error_message", errorMessage != null ? errorMessage : "export callback failure");
        } else {
            video.put("export_status", "COMPLETED");
            if (videoUrl != null && !videoUrl.isBlank()) {
                video.put("video_url", videoUrl);
                video.put("export_result_url", videoUrl);
            }
            video.put("error_message", null);
        }
        return video;
    }

    public Map<String, Object> retryExport(Map<String, Object> video, int shortformMaxRetry) {
        int retryCount = asInt(video.get("retry_count"));
        if (retryCount >= shortformMaxRetry) {
            video.put("export_status", "FAILED_PERMANENT");
            video.put("updated_at", Instant.now().toString());
            return video;
        }
        video.put("retry_count", retryCount + 1);
        video.put("export_status", "PROCESSING");
        video.put("error_message", null);
        video.put("updated_at", Instant.now().toString());
        return video;
    }

    public int asInt(Object value) {
        if (value == null) return 0;
        if (value instanceof Number n) return n.intValue();
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (Exception ignored) {
            return 0;
        }
    }

    public long asLong(Object value) {
        if (value == null) return 0L;
        if (value instanceof Number number) return number.longValue();
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (Exception ignored) {
            return 0L;
        }
    }
}
