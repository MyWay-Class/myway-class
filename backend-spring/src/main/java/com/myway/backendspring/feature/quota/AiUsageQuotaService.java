package com.myway.backendspring.feature.quota;

import com.myway.backendspring.domain.ActivityEventService;
import com.myway.backendspring.feature.ai.AiUsageLogService;
import com.myway.backendspring.feature.repository.FeatureStoreRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class AiUsageQuotaService {
    private static final String AI_USAGE_SCOPE = "ai_usage_daily";
    private static final String AI_USAGE_WINDOW_SCOPE = "ai_usage_window";
    private static final Map<String, Integer> DEFAULT_ROLE_LIMITS = Map.of(
            "student", 100,
            "instructor", 200,
            "admin", 500
    );
    private static final Map<String, Double> DEFAULT_FEATURE_WEIGHTS = Map.of(
            "intent", 1.0,
            "search", 1.0,
            "answer", 1.0,
            "summary", 1.2,
            "quiz", 1.1,
            "smart", 1.25,
            "stt", 1.5,
            "rag", 1.5
    );

    public record QuotaDecision(
            boolean allowed,
            int limit,
            int used,
            int remaining,
            String role,
            String feature,
            String resetAt,
            Map<String, Object> meta
    ) {}

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

    public QuotaDecision evaluateQuota(String userId, String role, String feature, Map<String, Object> settings) {
        String normalizedRole = normalizeRole(role);
        String normalizedFeature = normalizeFeature(feature);
        int limit = resolveEffectiveLimit(normalizedRole, normalizedFeature, settings);
        LocalDate today = LocalDate.now();
        int used = resolveUsedCount(userId, today, settings);
        int remaining = Math.max(0, limit - used);
        boolean allowed = used < limit;
        String resetAt = today.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant().toString();
        Map<String, Object> meta = new HashMap<>();
        meta.put("role", normalizedRole);
        meta.put("feature", normalizedFeature);
        meta.put("limit", limit);
        meta.put("used", used);
        meta.put("remaining", remaining);
        meta.put("reset_at", resetAt);
        meta.put("base_limit", resolveBaseLimit(normalizedRole, settings));
        meta.put("feature_weight", resolveFeatureWeight(normalizedFeature, settings));
        return new QuotaDecision(allowed, limit, used, remaining, normalizedRole, normalizedFeature, resetAt, meta);
    }

    public boolean canConsumeAi(String userId, String role, String feature, Map<String, Object> settings) {
        return evaluateQuota(userId, role, feature, settings).allowed();
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

    private int resolveEffectiveLimit(String role, String feature, Map<String, Object> settings) {
        int baseLimit = resolveBaseLimit(role, settings);
        double weight = resolveFeatureWeight(feature, settings);
        return weight <= 0 ? baseLimit : Math.max(1, (int) Math.floor(baseLimit / weight));
    }

    private int resolveBaseLimit(String role, Map<String, Object> settings) {
        int explicitLimit = asInt(settings == null ? null : settings.get("daily_limit"));
        if (explicitLimit > 0) {
            return explicitLimit;
        }

        Map<String, Object> roleLimits = asMap(settings == null ? null : settings.get("role_daily_limits"));
        int roleLimit = asInt(roleLimits == null ? null : roleLimits.get(role));
        if (roleLimit > 0) {
            return roleLimit;
        }

        return DEFAULT_ROLE_LIMITS.getOrDefault(role, DEFAULT_ROLE_LIMITS.get("student"));
    }

    private double resolveFeatureWeight(String feature, Map<String, Object> settings) {
        Map<String, Object> featureWeights = asMap(settings == null ? null : settings.get("feature_weights"));
        double configuredWeight = asDouble(featureWeights == null ? null : featureWeights.get(feature));
        if (configuredWeight > 0) {
            return configuredWeight;
        }

        return DEFAULT_FEATURE_WEIGHTS.getOrDefault(feature, 1.0);
    }

    private int resolveUsedCount(String userId, LocalDate today, Map<String, Object> settings) {
        int usedToday = aiUsageDailyStore.getCount(userId, today);
        Map<String, Object> kvUsage = repository.getKv(AI_USAGE_SCOPE, userId + ":" + today);
        int usedByKv = asInt(kvUsage == null ? null : kvUsage.get("count"));
        Instant quotaWindowStart = parseInstantOrNull(settings == null ? null : settings.get("quota_window_started_at"));
        int usedByLogs = aiUsageLogService == null ? 0 : aiUsageLogService.listRaw(userId).size();
        int usedByEvents = 0;
        if (quotaWindowStart != null) {
            List<Map<String, Object>> rawLogs = aiUsageLogService == null ? List.of() : aiUsageLogService.listRaw(userId);
            usedByLogs = (int) rawLogs.stream()
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
        return quotaWindowStart != null
                ? Math.max(Math.max(usedByLogs, usedByEvents), usedByWindow)
                : Math.max(Math.max(usedToday, usedByLogs), usedByKv);
    }

    private String normalizeRole(String role) {
        if (role == null || role.isBlank()) {
            return "student";
        }
        String normalized = role.trim().toLowerCase(Locale.ROOT);
        if ("instructor".equals(normalized) || "admin".equals(normalized)) {
            return normalized;
        }
        return "student";
    }

    private String normalizeFeature(String feature) {
        if (feature == null || feature.isBlank()) {
            return "intent";
        }
        return feature.trim().toLowerCase(Locale.ROOT);
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

    private double asDouble(Object value) {
        if (value == null) return 0;
        if (value instanceof Number n) return n.doubleValue();
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (Exception ignored) {
            return 0;
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> asMap(Object value) {
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return null;
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
