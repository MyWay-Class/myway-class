package com.myway.backendspring.domain;

import com.myway.backendspring.persistence.FeatureJdbcStore;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ActivityEventService {
    private final FeatureJdbcStore store;

    public ActivityEventService(FeatureJdbcStore store) {
        this.store = store;
    }

    public void append(String userId, String type, String resourceType, String resourceId, Map<String, Object> metadata) {
        if (userId == null || userId.isBlank()) {
            return;
        }
        store.insertActivityEvent(
                UUID.randomUUID().toString(),
                userId,
                type == null || type.isBlank() ? "unknown" : type,
                resourceType,
                resourceId,
                metadata
        );
    }

    public List<Map<String, Object>> recent(String userId, int limit) {
        return store.listActivityEvents(userId, limit);
    }
}
