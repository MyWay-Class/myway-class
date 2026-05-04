package com.myway.backendspring.domain;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class LearningStoreAdminService {
    private final AtomicInteger reloadCount = new AtomicInteger();
    private volatile Instant lastReloadedAt;

    public Map<String, Object> reload() {
        int count = reloadCount.incrementAndGet();
        lastReloadedAt = Instant.now();
        return Map.of(
                "reloaded", true,
                "reload_count", count,
                "last_reloaded_at", lastReloadedAt.toString()
        );
    }
}
