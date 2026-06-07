package com.myway.backendspring.feature;

import com.myway.backendspring.persistence.FeatureJdbcStore;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class FeatureStoreReadSupport {
    public Map<String, Object> transcript(FeatureJdbcStore store, String transcriptScope, String lectureId) {
        return store.getKv(transcriptScope, lectureId);
    }

    public Map<String, Object> pipeline(
            FeatureJdbcStore store,
            String pipelineScope,
            String lectureId,
            FeatureStorePipelineSupport pipelineSupport
    ) {
        Map<String, Object> row = store.getKv(pipelineScope, lectureId);
        if (row == null) {
            return pipelineSupport.buildEmptyPipeline(lectureId);
        }
        return pipelineSupport.hydratePipelineRow(row);
    }
}
