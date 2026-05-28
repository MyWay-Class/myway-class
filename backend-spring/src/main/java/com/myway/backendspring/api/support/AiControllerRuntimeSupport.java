package com.myway.backendspring.api.support;

import com.myway.backendspring.auth.SessionView;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.feature.FeatureStoreService;
import com.myway.backendspring.feature.ai.AiRuntimeService;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class AiControllerRuntimeSupport {
    public ResponseEntity<ApiResponse<Map<String, Object>>> requireAiEligible(
            FeatureStoreService featureStore,
            SessionView session,
            AiControllerSupport aiControllerSupport,
            AiControllerAuthSupport aiControllerAuthSupport
    ) {
        return aiControllerAuthSupport.requireAiEligible(featureStore, session, aiControllerSupport);
    }

    public Map<String, Object> generate(
            AiRuntimeService aiRuntimeService,
            FeatureStoreService featureStore,
            String userId,
            String mode,
            String prompt
    ) {
        return aiRuntimeService.generate(mode, prompt, featureStore.aiSettings(userId));
    }

    public void recordUsage(
            FeatureStoreService featureStore,
            String userId,
            String mode,
            String token
    ) {
        featureStore.recordAiUsage(userId, mode, true, token);
    }
}
