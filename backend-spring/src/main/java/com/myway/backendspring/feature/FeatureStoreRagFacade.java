package com.myway.backendspring.feature;

import com.myway.backendspring.feature.rag.RagService;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class FeatureStoreRagFacade {
    private final FeatureStoreRagSupport ragSupport;
    private final RagService ragService;

    public FeatureStoreRagFacade(FeatureStoreRagSupport ragSupport, RagService ragService) {
        this.ragSupport = ragSupport;
        this.ragService = ragService;
    }

    public Map<String, Object> ragOverview(
            String query,
            String lectureId,
            String courseId,
            Integer limit,
            Double minScore,
            boolean includeDebug
    ) {
        return ragSupport.ragOverview(ragService, query, lectureId, courseId, limit, minScore, includeDebug);
    }

    public Map<String, Object> ragOverview(
            String query,
            String lectureId,
            String courseId,
            Integer limit,
            Double minScore,
            boolean includeDebug,
            List<Map<String, Object>> entities
    ) {
        return ragSupport.ragOverview(ragService, query, lectureId, courseId, limit, minScore, includeDebug, entities);
    }

    public Map<String, Object> ragIndexOverview(String lectureId, String courseId) {
        return ragSupport.ragIndexOverview(ragService, lectureId, courseId);
    }

    public Map<String, Object> rebuildRagIndex(String lectureId, String courseId) {
        return ragSupport.rebuildRagIndex(ragService, lectureId, courseId);
    }

    public Map<String, Object> clearRagIndex(String lectureId, String courseId) {
        return ragSupport.clearRagIndex(ragService, lectureId, courseId);
    }

    public Map<String, Object> evaluateRagBatch(List<Map<String, Object>> cases, Integer topK) {
        return ragSupport.evaluateRagBatch(ragService, cases, topK);
    }
}
