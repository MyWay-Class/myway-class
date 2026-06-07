package com.myway.backendspring.feature;

import com.myway.backendspring.persistence.FeatureJdbcStore;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Component
public class FeatureStoreAssetSupport {
    public Map<String, Object> mediaUpload(
            FeatureJdbcStore store,
            String mediaAssetScope,
            FeatureStorePayloadSupport payloadSupport,
            String lectureId,
            String fileName
    ) {
        String key = "asset/" + lectureId + "/" + UUID.randomUUID();
        Map<String, Object> payload = payloadSupport.mediaUploadPayload(
                lectureId, key, "/api/v1/media/assets/" + key, fileName
        );
        store.upsertKv(mediaAssetScope, key, payload);
        return payload;
    }

    public Map<String, Object> createExtraction(
            FeatureJdbcStore store,
            String extractionScope,
            String pipelineScope,
            FeatureStorePayloadSupport payloadSupport,
            String lectureId,
            String audioUrl
    ) {
        String id = UUID.randomUUID().toString();
        String now = Instant.now().toString();
        Map<String, Object> item = payloadSupport.extractionSeed(id, lectureId, audioUrl, now);
        store.insertEvent(extractionScope, lectureId, id, item);
        store.upsertKv(extractionScope, id, item);
        Map<String, Object> pipeline = payloadSupport.pipelineSeed(lectureId, id, now);
        store.upsertKv(pipelineScope, lectureId, pipeline);
        return item;
    }
}
