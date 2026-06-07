package com.myway.backendspring.feature;

import com.myway.backendspring.feature.rag.RagService;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class FeatureStoreRagSupport {
    public Map<String, Object> ragOverview(
            RagService ragService,
            String query,
            String lectureId,
            String courseId,
            Integer limit,
            Double minScore,
            boolean includeDebug
    ) {
        if (ragService == null) return Map.of();
        return ragService.ragOverview(query, lectureId, courseId, limit, minScore, includeDebug);
    }

    public Map<String, Object> ragOverview(
            RagService ragService,
            String query,
            String lectureId,
            String courseId,
            Integer limit,
            Double minScore,
            boolean includeDebug,
            List<Map<String, Object>> entities
    ) {
        if (ragService == null) return Map.of();
        return ragService.ragOverview(query, lectureId, courseId, limit, minScore, includeDebug, entities);
    }

    public Map<String, Object> ragIndexOverview(RagService ragService, String lectureId, String courseId) {
        if (ragService == null) return Map.of();
        return ragService.ragIndexOverview(lectureId, courseId);
    }

    public Map<String, Object> rebuildRagIndex(RagService ragService, String lectureId, String courseId) {
        if (ragService == null) return Map.of();
        return ragService.rebuildRagIndex(lectureId, courseId);
    }

    public Map<String, Object> clearRagIndex(RagService ragService, String lectureId, String courseId) {
        if (ragService == null) return Map.of();
        return ragService.clearRagIndex(lectureId, courseId);
    }

    public Map<String, Object> evaluateRagBatch(
            RagService ragService,
            List<Map<String, Object>> cases,
            Integer topK
    ) {
        if (ragService == null) return Map.of();
        return ragService.evaluateBatch(cases, topK);
    }
}
