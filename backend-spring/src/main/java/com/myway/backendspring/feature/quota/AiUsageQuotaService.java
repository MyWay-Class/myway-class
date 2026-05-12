package com.myway.backendspring.feature.quota;

import com.myway.backendspring.domain.ActivityEventService;
import com.myway.backendspring.feature.repository.FeatureStoreRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class AiUsageQuotaService {
    private final FeatureStoreRepository repository;
    private final ActivityEventService activityEventService;

    public AiUsageQuotaService(FeatureStoreRepository repository, ActivityEventService activityEventService) {
        this.repository = repository;
        this.activityEventService = activityEventService;
    }

    public boolean canConsumeAi(String userId, Map<String, Object> settings) {
        int limit = asInt(settings == null ? null : settings.get("daily_limit"));
        if (limit <= 0) {
            limit = 100;
        }
        int usedToday = repository.getAiUsageDailyCount(userId, LocalDate.now());
        Instant quotaWindowStart = parseInstantOrNull(settings == null ? null : settings.get("quota_window_started_at"));
        int usedByLogs = repository.listAiUsageLogs(userId).size();
        if (quotaWindowStart != null) {
            usedByLogs = (int) repository.listAiUsageLogs(userId).stream()
                    .filter(item -> {
                        Instant createdAt = parseInstantOrNull(item.get("created_at"));
                        return createdAt != null && !createdAt.isBefore(quotaWindowStart);
                    })
                    .count();
        } else if (usedByLogs == 0) {
            usedByLogs = (int) repository.listActivityEvents(userId, 100).stream()
                    .map(item -> String.valueOf(item.getOrDefault("type", "")))
                    .filter(type -> type.startsWith("ai_"))
                    .count();
        }
        int used = quotaWindowStart != null ? usedByLogs : Math.max(usedToday, usedByLogs);
        return used < limit;
    }

    public void recordAiUsage(String userId, String feature, boolean success, String inputText) {
        LocalDate today = LocalDate.now();
        String key = userId + ":" + today;
        int used = repository.getAiUsageDailyCount(userId, today);
        repository.upsertAiUsageDaily(userId, today, used + 1);

        Map<String, Object> usage = new HashMap<>();
        usage.put("user_id", userId);
        usage.put("day", today.toString());
        usage.put("count", used + 1);
        usage.put("updated_at", Instant.now().toString());
        repository.upsertKv(FeatureStoreRepository.AI_USAGE_SCOPE, key, usage);

        String logId = UUID.randomUUID().toString();
        repository.insertAiUsageLog(logId, userId, feature, success, inputText);
        if (activityEventService != null) {
            activityEventService.append(
                    userId,
                    "ai_" + (feature == null || feature.isBlank() ? "request" : feature),
                    "ai",
                    logId,
                    Map.of("success", success, "feature", feature == null ? "" : feature)
            );
        }
    }

    private int asInt(Object value) {
        if (value == null) return 0;
        if (value instanceof Number n) return n.intValue();
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (Exception ignored) {
            return 0;
        }
    }

    private Instant parseInstantOrNull(Object raw) {
        if (raw == null) return null;
        String value = String.valueOf(raw).trim();
        if (value.isBlank()) return null;
        try {
            return Instant.parse(value);
        } catch (DateTimeParseException ignored) {
            return null;
        }
    }
}
