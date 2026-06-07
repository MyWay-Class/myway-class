package com.myway.backendspring.feature.shortform;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class ShortformStatusSupport {
    Map<String, Object> shortformExportStatus(List<Map<String, Object>> videos, long staleProcessingThresholdMs, ShortformRetrySupport retrySupport) {
        long pending = 0L;
        long processing = 0L;
        long completed = 0L;
        long failed = 0L;
        long failedPermanent = 0L;
        long staleProcessing = 0L;
        String lastUpdatedAt = null;
        List<Map<String, Object>> failedItems = new ArrayList<>();
        Instant now = Instant.now();

        for (Map<String, Object> video : videos) {
            String status = String.valueOf(video.getOrDefault("export_status", "PENDING")).toUpperCase();
            String updatedAt = String.valueOf(video.getOrDefault("updated_at", ""));
            if (!updatedAt.isBlank() && (lastUpdatedAt == null || updatedAt.compareTo(lastUpdatedAt) > 0)) {
                lastUpdatedAt = updatedAt;
            }
            switch (status) {
                case "PROCESSING" -> {
                    processing += 1L;
                    if (isStaleProcessing(updatedAt, now, staleProcessingThresholdMs)) {
                        staleProcessing += 1L;
                    }
                }
                case "COMPLETED" -> completed += 1L;
                case "FAILED" -> {
                    failed += 1L;
                    failedItems.add(buildFailedItem(video, retrySupport));
                }
                case "FAILED_PERMANENT" -> {
                    failedPermanent += 1L;
                    failedItems.add(buildFailedItem(video, retrySupport));
                }
                default -> pending += 1L;
            }
        }

        failedItems.sort((left, right) -> String.valueOf(right.getOrDefault("updated_at", ""))
                .compareTo(String.valueOf(left.getOrDefault("updated_at", ""))));
        if (failedItems.size() > 20) {
            failedItems = new ArrayList<>(failedItems.subList(0, 20));
        }

        Map<String, Object> result = new HashMap<>();
        result.put("pending_count", pending);
        result.put("processing_count", processing);
        result.put("completed_count", completed);
        result.put("failed_count", failed);
        result.put("failed_permanent_count", failedPermanent);
        result.put("stale_processing_count", staleProcessing);
        result.put("failure_ratio", toRatio(failed + failedPermanent, videos.size()));
        result.put("last_updated_at", lastUpdatedAt);
        result.put("failed_items", failedItems);
        return result;
    }

    private boolean isStaleProcessing(String updatedAt, Instant now, long staleProcessingThresholdMs) {
        if (updatedAt == null || updatedAt.isBlank()) {
            return false;
        }
        try {
            Instant updated = Instant.parse(updatedAt);
            return now.toEpochMilli() - updated.toEpochMilli() > staleProcessingThresholdMs;
        } catch (Exception ignored) {
            return false;
        }
    }

    private double toRatio(long numerator, int denominator) {
        if (denominator <= 0) {
            return 0.0d;
        }
        double ratio = ((double) numerator) / ((double) denominator);
        return Math.round(ratio * 10000.0d) / 10000.0d;
    }

    private Map<String, Object> buildFailedItem(Map<String, Object> video, ShortformRetrySupport retrySupport) {
        Map<String, Object> item = new HashMap<>();
        item.put("id", String.valueOf(video.getOrDefault("id", "")));
        item.put("title", String.valueOf(video.getOrDefault("title", "")));
        item.put("user_id", String.valueOf(video.getOrDefault("user_id", "")));
        item.put("export_status", String.valueOf(video.getOrDefault("export_status", "")));
        item.put("retry_count", retrySupport.asInt(video.get("retry_count")));
        item.put("error_message", String.valueOf(video.getOrDefault("error_message", "")));
        item.put("updated_at", String.valueOf(video.getOrDefault("updated_at", "")));
        return item;
    }
}
