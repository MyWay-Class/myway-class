package com.myway.backendspring.domain;

import java.util.List;
import java.util.Map;

public interface ActivityEventStore {
    void insert(
            String id,
            String userId,
            String type,
            String resourceType,
            String resourceId,
            Map<String, Object> metadata
    );

    List<Map<String, Object>> listRecent(String userId, int limit);

    List<Map<String, Object>> listRecent(
            String userId,
            String type,
            String occurredFromIso,
            String occurredToIso,
            int limit
    );
}

