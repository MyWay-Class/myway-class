package com.myway.backendspring.feature.ai;

import com.myway.backendspring.feature.repository.FeatureStoreRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AiUsageLogService {
    private final FeatureStoreRepository repository;

    public AiUsageLogService(FeatureStoreRepository repository) {
        this.repository = repository;
    }

    public String append(String userId, String feature, boolean success, String inputText) {
        String logId = UUID.randomUUID().toString();
        repository.insertAiUsageLog(logId, userId, feature, success, inputText);
        return logId;
    }

    public List<Map<String, Object>> listRaw(String userId) {
        return repository.listAiUsageLogs(userId);
    }

    public List<Map<String, Object>> listNormalized(String userId) {
        return listRaw(userId).stream()
                .map(item -> {
                    Map<String, Object> mapped = new HashMap<>();
                    mapped.put("id", String.valueOf(item.getOrDefault("id", "")));
                    mapped.put("user_id", String.valueOf(item.getOrDefault("user_id", userId)));
                    mapped.put("feature", String.valueOf(item.getOrDefault("feature", "request")));
                    mapped.put("success", asBoolean(item.get("success"), false));
                    mapped.put("input_text", String.valueOf(item.getOrDefault("input_text", "")));
                    mapped.put("created_at", String.valueOf(item.getOrDefault("created_at", Instant.now().toString())));
                    return mapped;
                })
                .toList();
    }

    private boolean asBoolean(Object value, boolean defaultValue) {
        if (value == null) return defaultValue;
        if (value instanceof Boolean bool) return bool;
        String normalized = String.valueOf(value).trim().toLowerCase();
        if (normalized.isEmpty()) return defaultValue;
        if ("true".equals(normalized) || "1".equals(normalized) || "y".equals(normalized) || "yes".equals(normalized)) return true;
        if ("false".equals(normalized) || "0".equals(normalized) || "n".equals(normalized) || "no".equals(normalized)) return false;
        return defaultValue;
    }
}

