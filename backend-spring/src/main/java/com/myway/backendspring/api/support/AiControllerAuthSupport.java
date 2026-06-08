package com.myway.backendspring.api.support;

import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.auth.SessionView;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.feature.FeatureStoreAiFacade;
import com.myway.backendspring.feature.quota.AiUsageQuotaService;
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
            FeatureStoreAiFacade featureStore,
            SessionView session,
            AiControllerSupport aiControllerSupport,
            String feature
    ) {
        if (session == null) {
            return aiControllerSupport.unauthenticated();
        }
        AiUsageQuotaService.QuotaDecision decision = featureStore.canConsumeAi(session.user().id(), session.user().role(), feature);
        if (!decision.allowed()) {
            return aiControllerSupport.dailyLimitExceeded(decision.meta());
        }
        return null;
    }
}
