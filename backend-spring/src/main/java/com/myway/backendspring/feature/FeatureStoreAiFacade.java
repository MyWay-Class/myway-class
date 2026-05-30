package com.myway.backendspring.feature;

import com.myway.backendspring.feature.ai.AiFeatureService;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class FeatureStoreAiFacade {
    private final FeatureStoreAiSupport aiSupport;
    private final AiFeatureService aiFeatureService;

    public FeatureStoreAiFacade(FeatureStoreAiSupport aiSupport, AiFeatureService aiFeatureService) {
        this.aiSupport = aiSupport;
        this.aiFeatureService = aiFeatureService;
    }

    public Map<String, Object> aiInsights(String userId) {
        return aiSupport.aiInsights(aiFeatureService, userId);
    }

    public Map<String, Object> aiLogs(String userId) {
        return aiSupport.aiLogs(aiFeatureService, userId);
    }

    public Map<String, Object> aiRecommendations(String userId) {
        return aiSupport.aiRecommendations(aiFeatureService, userId);
    }

    public Map<String, Object> aiSettings(String userId) {
        return aiSupport.aiSettings(aiFeatureService, userId);
    }

    public Map<String, Object> updateAiSettings(String userId, Map<String, Object> patch) {
        return aiSupport.updateAiSettings(aiFeatureService, userId, patch);
    }

    public Map<String, Object> aiProviders(String userId) {
        return aiSupport.aiProviders(aiFeatureService, userId);
    }

    public boolean canConsumeAi(String userId) {
        return aiSupport.canConsumeAi(aiFeatureService, userId);
    }

    public void recordAiUsage(String userId, String feature, boolean success, String inputText) {
        aiSupport.recordAiUsage(aiFeatureService, userId, feature, success, inputText);
    }
}
