package com.myway.backendspring.feature.ai;

import com.myway.backendspring.feature.quota.AiUsageQuotaService;
import com.myway.backendspring.feature.quota.AiUsageDailyStore;
import com.myway.backendspring.feature.repository.FeatureStoreRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiFeatureService {
    private static final String AI_SETTINGS_SCOPE = "ai_settings";
    private static final String DEV_AI_PROVIDER = "ollama";
    private static final String NON_DEV_AI_PROVIDER = "demo";
    private static final String DEV_AI_MODEL = "llama3.1:8b";
    private static final String NON_DEV_AI_MODEL = "demo-v1";

    private final FeatureStoreRepository repository;
    private final AiUsageQuotaService aiUsageQuotaService;
    private final AiUsageLogService aiUsageLogService;
    private final AiUsageDailyStore aiUsageDailyStore;
    private final String runtimeEnv;

    public AiFeatureService(
            FeatureStoreRepository repository,
            AiUsageQuotaService aiUsageQuotaService,
            AiUsageLogService aiUsageLogService,
            AiUsageDailyStore aiUsageDailyStore,
            @Value("${myway.runtime.env:${SPRING_PROFILES_ACTIVE:dev}}") String runtimeEnv
    ) {
        this.repository = repository;
        this.aiUsageQuotaService = aiUsageQuotaService;
        this.aiUsageLogService = aiUsageLogService;
        this.aiUsageDailyStore = aiUsageDailyStore;
        this.runtimeEnv = runtimeEnv == null ? "dev" : runtimeEnv.trim();
        ensureDefaults();
    }

    public Map<String, Object> aiInsights(String userId) {
        Map<String, Object> settings = aiSettings(userId);
        return Map.of(
                "user_id", userId,
                "total_requests", 0,
                "success_rate", 1.0,
                "provider", settings.getOrDefault("provider", "demo"),
                "model", settings.getOrDefault("model", "demo-v1"),
                "last_updated", Instant.now().toString()
        );
    }

    public Map<String, Object> aiLogs(String userId) {
        List<Map<String, Object>> rows = aiUsageLogService == null ? List.of() : aiUsageLogService.listNormalized(userId);
        return Map.of("user_id", userId, "items", rows, "count", rows.size());
    }

    public Map<String, Object> aiRecommendations(String userId) {
        return Map.of(
                "user_id", userId,
                "items", List.of(
                        Map.of("id", "rec-1", "type", "study", "title", "최근 질문 기반 복습 추천")
                ),
                "count", 1
        );
    }

    public Map<String, Object> aiSettings(String userId) {
        Map<String, Object> global = repository.getKv(AI_SETTINGS_SCOPE, "global");
        Map<String, Object> settings = repository.getKv(AI_SETTINGS_SCOPE, userId);
        Map<String, Object> merged = new HashMap<>();
        if (global != null) {
            merged.putAll(global);
        }
        if (settings != null) {
            merged.putAll(settings);
        }
        merged.putIfAbsent("provider", resolvePolicyAiProvider());
        merged.putIfAbsent("model", resolvePolicyAiModel());
        return merged;
    }

    public Map<String, Object> updateAiSettings(String userId, Map<String, Object> patch) {
        Map<String, Object> settings = new HashMap<>(aiSettings(userId));
        if (patch != null) {
            settings.putAll(patch);
            if (patch.containsKey("daily_limit") && patch.size() == 1) {
                settings.put("quota_window_started_at", Instant.now().toString());
                if (aiUsageDailyStore != null) {
                    aiUsageDailyStore.upsertCount(userId, LocalDate.now(), 0);
                }
            } else if (patch.containsKey("daily_limit")) {
                settings.remove("quota_window_started_at");
            }
        }
        repository.upsertKv(AI_SETTINGS_SCOPE, userId, settings);
        return settings;
    }

    public Map<String, Object> aiProviders(String userId) {
        return Map.of("providers", List.of("demo", "ollama", "gemini"), "current", aiSettings(userId).getOrDefault("provider", "demo"));
    }

    public boolean canConsumeAi(String userId) {
        if (aiUsageQuotaService == null) {
            return true;
        }
        return aiUsageQuotaService.canConsumeAi(userId, aiSettings(userId));
    }

    public void recordAiUsage(String userId, String feature, boolean success, String inputText) {
        if (aiUsageQuotaService != null) {
            aiUsageQuotaService.recordAiUsage(userId, feature, success, inputText, aiSettings(userId));
        }
    }

    private void ensureDefaults() {
        Map<String, Object> settings = repository.getKv(AI_SETTINGS_SCOPE, "global");
        String policyProvider = resolvePolicyAiProvider();
        String policyModel = resolvePolicyAiModel();
        if (settings == null) {
            repository.upsertKv(AI_SETTINGS_SCOPE, "global", new HashMap<>(Map.of(
                    "daily_limit", 100,
                    "provider", policyProvider,
                    "model", policyModel
            )));
            return;
        }

        boolean changed = false;
        if (!settings.containsKey("daily_limit")) {
            settings.put("daily_limit", 100);
            changed = true;
        }
        if (!settings.containsKey("provider") || !policyProvider.equals(String.valueOf(settings.get("provider")))) {
            settings.put("provider", policyProvider);
            changed = true;
        }
        if (!settings.containsKey("model") || !policyModel.equals(String.valueOf(settings.get("model")))) {
            settings.put("model", policyModel);
            changed = true;
        }
        if (changed) {
            repository.upsertKv(AI_SETTINGS_SCOPE, "global", settings);
        }
    }

    private String resolvePolicyAiProvider() {
        return isNonDevRuntime() ? NON_DEV_AI_PROVIDER : DEV_AI_PROVIDER;
    }

    private String resolvePolicyAiModel() {
        return isNonDevRuntime() ? NON_DEV_AI_MODEL : DEV_AI_MODEL;
    }

    private boolean isNonDevRuntime() {
        String normalized = runtimeEnv.trim().toLowerCase();
        if (normalized.isBlank()) {
            return false;
        }
        String[] tokens = normalized.split("[,;\\s]+");
        for (String token : tokens) {
            if ("prod".equals(token) || "production".equals(token) || "staging".equals(token) || "stage".equals(token)) {
                return true;
            }
        }
        return false;
    }
}
