package com.myway.backendspring.persistence;

import com.myway.backendspring.domain.ActivityEventStore;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public class JdbcActivityEventStore implements ActivityEventStore {
    private final FeatureJdbcStore store;

    public JdbcActivityEventStore(FeatureJdbcStore store) {
        this.store = store;
    }

    @Override
    public void insert(String id, String userId, String type, String resourceType, String resourceId, Map<String, Object> metadata) {
        store.insertActivityEvent(id, userId, type, resourceType, resourceId, metadata);
    }

    @Override
    public List<Map<String, Object>> listRecent(String userId, int limit) {
        return store.listActivityEvents(userId, limit);
    }

    @Override
    public List<Map<String, Object>> listRecent(String userId, String type, String occurredFromIso, String occurredToIso, int limit) {
        return store.listActivityEvents(userId, type, occurredFromIso, occurredToIso, limit);
    }
}

