package com.myway.backendspring.feature.media;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class MediaPipelineBatchSupport {
    public Map<String, Object> runBatchPipeline(
            List<String> lectureIds,
            Integer retryCountInput,
            boolean forceRun,
            String language,
            String sttProvider,
            String sttModel,
            java.util.function.Function<String, Map<String, Object>> lectureVideoAssetReader,
            java.util.function.Supplier<Map<String, String>> lectureVideoAssetMapSupplier,
            java.util.function.BiFunction<String, String, Map<String, Object>> createExtraction,
            java.util.function.BiFunction<String, String, Map<String, Object>> dispatchExtractionJob
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
            targets.addAll(lectureVideoAssetMapSupplier.get().keySet());
        }

        List<Map<String, Object>> items = new ArrayList<>();
        int success = 0;
        int failed = 0;
        int pending = 0;
        for (String lectureId : targets) {
            Map<String, Object> mapping = lectureVideoAssetReader.apply(lectureId);
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
            Map<String, Object> extraction = createExtraction.apply(lectureId, audioUrl);
            String extractionId = String.valueOf(extraction.getOrDefault("id", ""));
            Map<String, Object> dispatched = dispatchExtractionJob.apply(extractionId, audioUrl);
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

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("batch_scope", "mapped_lectures");
        result.put("requested_count", targets.size());
        result.put("processed_count", items.size());
        result.put("retry_count", retryCountInput == null ? 0 : Math.max(0, retryCountInput));
        result.put("force_run", forceRun);
        result.put("language", language);
        result.put("stt_provider", sttProvider);
        result.put("stt_model", sttModel);
        result.put("summary", Map.of("success", success, "failed", failed, "pending", pending));
        result.put("items", items);
        result.put("updated_at", Instant.now().toString());
        return result;
    }
}
