package com.myway.backendspring.feature.repository;

import com.myway.backendspring.persistence.FeatureJdbcStore;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public class FeatureStoreRepository {
    public static final String MEDIA_TRANSCRIPT_SCOPE = "media_transcript";
    public static final String MEDIA_NOTE_SCOPE = "media_note";
    public static final String RAG_INDEX_SCOPE = "rag_chunk_index";

    private final FeatureJdbcStore store;

    public FeatureStoreRepository(FeatureJdbcStore store) {
        this.store = store;
    }

    public Map<String, Object> getKv(String scope, String id) {
        return store.getKv(scope, id);
    }

    public void upsertKv(String scope, String id, Map<String, Object> payload) {
        store.upsertKv(scope, id, payload);
    }

    public List<Map<String, Object>> listEventsByOwner(String scope, String ownerId) {
        return store.listEventsByOwner(scope, ownerId);
    }

    public List<Map<String, Object>> listEventsByScope(String scope) {
        return store.listEventsByScope(scope);
    }

    public void insertEvent(String scope, String ownerId, String id, Map<String, Object> payload) {
        store.insertEvent(scope, ownerId, id, payload);
    }

    public List<Map<String, Object>> listKvByScope(String scope) {
        return store.listKvByScope(scope);
    }

    public void insertAiUsageLog(String id, String userId, String feature, boolean success, String inputText) {
        store.insertAiUsageLog(id, userId, feature, success, inputText);
    }

    public List<Map<String, Object>> listAiUsageLogs(String userId) {
        return store.listAiUsageLogs(userId);
    }

    public List<Map<String, Object>> listActivityEvents(String userId, int limit) {
        return store.listActivityEvents(userId, limit);
    }
}
