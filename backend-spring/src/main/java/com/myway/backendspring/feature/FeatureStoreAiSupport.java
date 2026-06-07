package com.myway.backendspring.feature;

import com.myway.backendspring.feature.ai.AiFeatureService;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class FeatureStoreAiSupport {
    public Map<String, Object> aiInsights(AiFeatureService aiFeatureService, String userId) {
        return aiFeatureService == null ? Map.of() : aiFeatureService.aiInsights(userId);
    }

    public Map<String, Object> aiLogs(AiFeatureService aiFeatureService, String userId) {
        return aiFeatureService == null
                ? Map.of("user_id", userId, "items", List.of(), "count", 0)
                : aiFeatureService.aiLogs(userId);
    }

    public Map<String, Object> aiRecommendations(AiFeatureService aiFeatureService, String userId) {
        return aiFeatureService == null
                ? Map.of("user_id", userId, "items", List.of(), "count", 0)
                : aiFeatureService.aiRecommendations(userId);
    }

    public Map<String, Object> aiSettings(AiFeatureService aiFeatureService, String userId) {
        return aiFeatureService == null ? Map.of() : aiFeatureService.aiSettings(userId);
    }

    public Map<String, Object> updateAiSettings(AiFeatureService aiFeatureService, String userId, Map<String, Object> patch) {
        return aiFeatureService == null ? Map.of() : aiFeatureService.updateAiSettings(userId, patch);
    }

    public Map<String, Object> aiProviders(AiFeatureService aiFeatureService, String userId) {
        return aiFeatureService == null
                ? Map.of("providers", List.of("demo", "ollama", "gemini"), "current", "demo")
                : aiFeatureService.aiProviders(userId);
    }

    public boolean canConsumeAi(AiFeatureService aiFeatureService, String userId) {
        return aiFeatureService == null || aiFeatureService.canConsumeAi(userId);
    }

    public void recordAiUsage(
            AiFeatureService aiFeatureService,
            String userId,
            String feature,
            boolean success,
            String inputText
    ) {
        if (aiFeatureService != null) {
            aiFeatureService.recordAiUsage(userId, feature, success, inputText);
        }
    }
}
