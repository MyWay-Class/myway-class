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
        int usedToday = aiUsageDailyStore.getCount(userId, LocalDate.now());
        Instant quotaWindowStart = parseInstantOrNull(settings == null ? null : settings.get("quota_window_started_at"));
        int usedByLogs = aiUsageLogService == null ? 0 : aiUsageLogService.listRaw(userId).size();
        if (quotaWindowStart != null) {
            usedByLogs = (int) (aiUsageLogService == null ? List.<Map<String, Object>>of() : aiUsageLogService.listRaw(userId)).stream()
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
        // Prefer deterministic daily counter to avoid clock-skew issues between app and DB hosts.
        int used = Math.max(usedToday, usedByLogs);
        return used < limit;
    }

    public void recordAiUsage(String userId, String feature, boolean success, String inputText) {
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
}
