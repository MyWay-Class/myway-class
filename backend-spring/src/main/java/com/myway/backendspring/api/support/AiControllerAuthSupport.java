package com.myway.backendspring.api.support;

import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.auth.SessionView;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.feature.FeatureStoreService;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class AiControllerAuthSupport {
    public SessionView requireSession(
            SessionService sessionService,
            String auth
    ) {
        return sessionService.me(auth);
    }

    public ResponseEntity<ApiResponse<Map<String, Object>>> requireAiEligible(
            FeatureStoreService featureStore,
            SessionView session,
            AiControllerSupport aiControllerSupport
    ) {
        if (session == null) {
            return aiControllerSupport.unauthenticated();
        }
        if (!featureStore.canConsumeAi(session.user().id())) {
            return aiControllerSupport.dailyLimitExceeded();
        }
        return null;
    }
}
