package com.myway.backendspring.feature.quota;

import com.myway.backendspring.domain.ActivityEventService;
import com.myway.backendspring.feature.ai.AiUsageLogService;
import com.myway.backendspring.feature.repository.FeatureStoreRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AiUsageQuotaService {
    private static final String AI_USAGE_SCOPE = "ai_usage_daily";
    private static final String AI_USAGE_WINDOW_SCOPE = "ai_usage_window";

    private final FeatureStoreRepository repository;
    private final ActivityEventService activityEventService;
    private final AiUsageLogService aiUsageLogService;
    private final AiUsageDailyStore aiUsageDailyStore;

    public AiUsageQuotaService(
            FeatureStoreRepository repository,
            ActivityEventService activityEventService,
            AiUsageLogService aiUsageLogService,
            AiUsageDailyStore aiUsageDailyStore
    ) {
        this.repository = repository;
        this.activityEventService = activityEventService;
        this.aiUsageLogService = aiUsageLogService;
        this.aiUsageDailyStore = aiUsageDailyStore;
    }

    public boolean canConsumeAi(String userId, Map<String, Object> settings) {
        int limit = asInt(settings == null ? null : settings.get("daily_limit"));
        if (limit <= 0) {
            limit = 100;
        }
        LocalDate today = LocalDate.now();
        int usedToday = aiUsageDailyStore.getCount(userId, today);
        Map<String, Object> kvUsage = repository.getKv(AI_USAGE_SCOPE, userId + ":" + today);
        int usedByKv = asInt(kvUsage == null ? null : kvUsage.get("count"));
        Instant quotaWindowStart = parseInstantOrNull(settings == null ? null : settings.get("quota_window_started_at"));
        int usedByLogs = aiUsageLogService == null ? 0 : aiUsageLogService.listRaw(userId).size();
        int usedByEvents = 0;
        if (quotaWindowStart != null) {
            usedByLogs = (int) (aiUsageLogService == null ? List.<Map<String, Object>>of() : aiUsageLogService.listRaw(userId)).stream()
                    .filter(item -> {
                        Instant createdAt = parseInstantOrNull(item.get("created_at"));
                        return createdAt != null && !createdAt.isBefore(quotaWindowStart);
                    })
                    .count();
            usedByEvents = (int) repository.listActivityEvents(userId, 200).stream()
                    .filter(item -> String.valueOf(item.getOrDefault("type", "")).startsWith("ai_"))
                    .filter(item -> {
                        Instant occurredAt = parseInstantOrNull(item.get("occurred_at"));
                        return occurredAt != null && !occurredAt.isBefore(quotaWindowStart);
                    })
                    .count();
        } else if (usedByLogs == 0) {
            usedByLogs = (int) repository.listActivityEvents(userId, 100).stream()
                    .map(item -> String.valueOf(item.getOrDefault("type", "")))
                    .filter(type -> type.startsWith("ai_"))
                    .count();
        }
        int usedByWindow = 0;
        if (quotaWindowStart != null) {
            Map<String, Object> windowUsage = repository.getKv(AI_USAGE_WINDOW_SCOPE, usageWindowKey(userId, quotaWindowStart));
            usedByWindow = asInt(windowUsage == null ? null : windowUsage.get("count"));
        }
        int used = quotaWindowStart != null
                ? Math.max(Math.max(usedByLogs, usedByEvents), usedByWindow)
                : Math.max(Math.max(usedToday, usedByLogs), usedByKv);
        return used < limit;
    }

    public void recordAiUsage(String userId, String feature, boolean success, String inputText, Map<String, Object> settings) {
        LocalDate today = LocalDate.now();
        String key = userId + ":" + today;
        int used = aiUsageDailyStore.getCount(userId, today);
        aiUsageDailyStore.upsertCount(userId, today, used + 1);

        Map<String, Object> usage = new HashMap<>();
        usage.put("user_id", userId);
        usage.put("day", today.toString());
        usage.put("count", used + 1);
        usage.put("updated_at", Instant.now().toString());
        repository.upsertKv(AI_USAGE_SCOPE, key, usage);

        Instant quotaWindowStart = parseInstantOrNull(settings == null ? null : settings.get("quota_window_started_at"));
        if (quotaWindowStart != null) {
            String windowKey = usageWindowKey(userId, quotaWindowStart);
            Map<String, Object> existing = repository.getKv(AI_USAGE_WINDOW_SCOPE, windowKey);
            int windowCount = asInt(existing == null ? null : existing.get("count"));
            Map<String, Object> windowUsage = new HashMap<>();
            windowUsage.put("user_id", userId);
            windowUsage.put("window_started_at", quotaWindowStart.toString());
            windowUsage.put("count", windowCount + 1);
            windowUsage.put("updated_at", Instant.now().toString());
            repository.upsertKv(AI_USAGE_WINDOW_SCOPE, windowKey, windowUsage);
        }

        String logId = aiUsageLogService == null
                ? UUID.randomUUID().toString()
                : aiUsageLogService.append(userId, feature, success, inputText);
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

    private String usageWindowKey(String userId, Instant windowStart) {
        return userId + ":" + windowStart;
    }
}
