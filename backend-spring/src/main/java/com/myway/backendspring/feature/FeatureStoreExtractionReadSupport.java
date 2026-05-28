package com.myway.backendspring.feature;

import com.myway.backendspring.persistence.FeatureJdbcStore;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class FeatureStoreExtractionReadSupport {
    public List<Map<String, Object>> extractions(
            FeatureJdbcStore store,
            String extractionScope,
            String lectureId,
            FeatureStorePipelineSupport pipelineSupport
    ) {
        List<Map<String, Object>> rows = store.listEventsByOwner(extractionScope, lectureId);
        List<Map<String, Object>> merged = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            merged.add(hydrateExtractionRow(store, extractionScope, row, pipelineSupport));
        }
        return merged;
    }

    private Map<String, Object> hydrateExtractionRow(
            FeatureJdbcStore store,
            String extractionScope,
            Map<String, Object> row,
            FeatureStorePipelineSupport pipelineSupport
    ) {
        String extractionId = String.valueOf(row.getOrDefault("id", "")).trim();
        Map<String, Object> latest = extractionId.isBlank() ? null : store.getKv(extractionScope, extractionId);
        return pipelineSupport.hydrateExtractionRow(row, latest);
    }
}
