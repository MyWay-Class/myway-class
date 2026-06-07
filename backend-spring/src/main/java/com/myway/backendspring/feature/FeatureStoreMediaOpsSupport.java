package com.myway.backendspring.feature;

import com.myway.backendspring.feature.media.MediaProcessingService;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Component
public class FeatureStoreMediaOpsSupport {
    public Map<String, Object> sttProviders(MediaProcessingService mediaProcessingService) {
        return mediaProcessingService == null
                ? Map.of("generated_at", Instant.now().toString(), "providers", List.of(), "plans", List.of())
                : mediaProcessingService.sttProviders();
    }

    public Map<String, Object> processorHealth(MediaProcessingService mediaProcessingService) {
        return mediaProcessingService == null
                ? Map.of(
                "ok", false,
                "jobs", Map.of("total", 0, "processing", 0, "completed", 0, "failed", 0),
                "recent_jobs", List.of(),
                "updated_at", Instant.now().toString()
        )
                : mediaProcessingService.processorHealth();
    }

    public Map<String, Object> dispatchExtractionJob(MediaProcessingService mediaProcessingService, String extractionId, String sourceVideoUrl) {
        if (mediaProcessingService == null) return null;
        return mediaProcessingService.dispatchExtractionJob(extractionId, sourceVideoUrl);
    }
}
