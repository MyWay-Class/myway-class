package com.myway.backendspring.api.support;

import com.myway.backendspring.api.AiController;
import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.auth.SessionView;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.feature.FeatureStoreAiFacade;
import com.myway.backendspring.feature.FeatureStoreRagFacade;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class AiControllerQuerySupport {
    private final SessionService sessionService;
    private final FeatureStoreAiFacade featureStore;
    private final FeatureStoreRagFacade ragFacade;
    private final AiControllerSupport aiControllerSupport;
    private final AiControllerAuthSupport aiControllerAuthSupport;
    private final AiControllerRagSupport aiControllerRagSupport;
    private final AiRequestSupport aiRequestSupport;
    private final AiControllerRuntimeSupport aiControllerRuntimeSupport;

    public AiControllerQuerySupport(
            SessionService sessionService,
            FeatureStoreAiFacade featureStore,
            FeatureStoreRagFacade ragFacade,
            AiControllerSupport aiControllerSupport,
            AiControllerAuthSupport aiControllerAuthSupport,
            AiControllerRagSupport aiControllerRagSupport,
            AiRequestSupport aiRequestSupport,
            AiControllerRuntimeSupport aiControllerRuntimeSupport
    ) {
        this.sessionService = sessionService;
        this.featureStore = featureStore;
        this.ragFacade = ragFacade;
        this.aiControllerSupport = aiControllerSupport;
        this.aiControllerAuthSupport = aiControllerAuthSupport;
        this.aiControllerRagSupport = aiControllerRagSupport;
        this.aiRequestSupport = aiRequestSupport;
        this.aiControllerRuntimeSupport = aiControllerRuntimeSupport;
    }

    public ResponseEntity<ApiResponse<Map<String, Object>>> insights(String auth) {
        SessionView session = require(auth);
        if (session == null) return aiControllerSupport.unauthenticated();
        return ResponseEntity.ok(ApiResponse.success(featureStore.aiInsights(session.user().id())));
    }

    public ResponseEntity<ApiResponse<Map<String, Object>>> logs(String auth) {
        SessionView session = require(auth);
        if (session == null) return aiControllerSupport.unauthenticated();
        return ResponseEntity.ok(ApiResponse.success(featureStore.aiLogs(session.user().id())));
    }

    public ResponseEntity<ApiResponse<Map<String, Object>>> recommendations(String auth) {
        SessionView session = require(auth);
        if (session == null) return aiControllerSupport.unauthenticated();
        return ResponseEntity.ok(ApiResponse.success(featureStore.aiRecommendations(session.user().id())));
    }

    public ResponseEntity<ApiResponse<Map<String, Object>>> settings(String auth) {
        SessionView session = require(auth);
        if (session == null) return aiControllerSupport.unauthenticated();
        return ResponseEntity.ok(ApiResponse.success(featureStore.aiSettings(session.user().id())));
    }

    public ResponseEntity<ApiResponse<Map<String, Object>>> updateSettings(String auth, AiController.AiSettingsUpdateRequest body) {
        SessionView session = require(auth);
        if (session == null) return aiControllerSupport.unauthenticated();
        Map<String, Object> patch = body == null ? Map.of() : body.toPatch();
        return ResponseEntity.ok(ApiResponse.success(featureStore.updateAiSettings(session.user().id(), patch), "설정이 저장되었습니다."));
    }

    public ResponseEntity<ApiResponse<Map<String, Object>>> providers(String auth) {
        SessionView session = require(auth);
        if (session == null) return aiControllerSupport.unauthenticated();
        return ResponseEntity.ok(ApiResponse.success(featureStore.aiProviders(session.user().id())));
    }

    public ResponseEntity<ApiResponse<Map<String, Object>>> rag(String auth, AiController.RagRequest body) {
        SessionView session = require(auth);
        ResponseEntity<ApiResponse<Map<String, Object>>> guard = requireAiGuard(session);
        if (guard != null) return guard;

        String query = aiRequestSupport.normalize(body.query());

        AiRequestSupport.RagScope scope = aiRequestSupport.resolveRagScope(body.lecture_id(), body.course_id());
        ResponseEntity<ApiResponse<Map<String, Object>>> scopeError = aiRequestSupport.validateRagScope(scope);
        if (scopeError != null) return scopeError;

        Integer limit = body.limit();
        Double minScore = body.min_score();
        boolean includeDebug = aiControllerRagSupport.includeDebug(body.include_debug());
        Map<String, Object> data = ragFacade.ragOverview(
                query,
                aiRequestSupport.optionalNormalized(scope.lectureId()),
                aiRequestSupport.optionalNormalized(scope.courseId()),
                limit,
                minScore,
                includeDebug
        );
        aiControllerRuntimeSupport.recordUsage(featureStore, session.user().id(), "rag", query);
        return ResponseEntity.ok(ApiResponse.success(data, "RAG 응답을 생성했습니다."));
    }

    public ResponseEntity<ApiResponse<Map<String, Object>>> ragIndex(String auth, String lectureId, String courseId) {
        SessionView session = require(auth);
        if (session == null) return aiControllerSupport.unauthenticated();
        Map<String, Object> data = ragFacade.ragIndexOverview(
                aiRequestSupport.optionalNormalized(lectureId),
                aiRequestSupport.optionalNormalized(courseId)
        );
        return ResponseEntity.ok(ApiResponse.success(data, "RAG 인덱스 현황을 조회했습니다."));
    }

    public ResponseEntity<ApiResponse<Map<String, Object>>> rebuildRagIndex(String auth, AiController.RagIndexMutationRequest body) {
        SessionView session = require(auth);
        if (session == null) return aiControllerSupport.unauthenticated();
        AiRequestSupport.RagScope scope = aiRequestSupport.resolveRagScope(body.lecture_id(), body.course_id());
        ResponseEntity<ApiResponse<Map<String, Object>>> scopeError = aiRequestSupport.validateRagScope(scope);
        if (scopeError != null) return scopeError;
        Map<String, Object> data = ragFacade.rebuildRagIndex(
                aiRequestSupport.optionalNormalized(scope.lectureId()),
                aiRequestSupport.optionalNormalized(scope.courseId())
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(data, "RAG 인덱스를 재생성했습니다."));
    }

    public ResponseEntity<ApiResponse<Map<String, Object>>> clearRagIndex(String auth, AiController.RagIndexMutationRequest body) {
        SessionView session = require(auth);
        if (session == null) return aiControllerSupport.unauthenticated();
        AiRequestSupport.RagScope scope = aiRequestSupport.resolveRagScope(body.lecture_id(), body.course_id());
        ResponseEntity<ApiResponse<Map<String, Object>>> scopeError = aiRequestSupport.validateRagScope(scope);
        if (scopeError != null) return scopeError;
        Map<String, Object> data = ragFacade.clearRagIndex(
                aiRequestSupport.optionalNormalized(scope.lectureId()),
                aiRequestSupport.optionalNormalized(scope.courseId())
        );
        return ResponseEntity.ok(ApiResponse.success(data, "RAG 인덱스를 초기화했습니다."));
    }

    public ResponseEntity<ApiResponse<Map<String, Object>>> evaluateRag(String auth, AiController.RagEvaluateRequest body) {
        SessionView session = require(auth);
        if (session == null) return aiControllerSupport.unauthenticated();
        Integer topK = aiControllerRagSupport.topK(body);
        List<Map<String, Object>> cases = aiControllerRagSupport.evaluateCases(body);
        Map<String, Object> data = ragFacade.evaluateRagBatch(cases, topK);
        return ResponseEntity.ok(ApiResponse.success(data, "RAG 배치 평가를 완료했습니다."));
    }

    private SessionView require(String auth) {
        return aiControllerAuthSupport.requireSession(sessionService, auth);
    }

    private ResponseEntity<ApiResponse<Map<String, Object>>> requireAiGuard(SessionView session) {
        return aiControllerAuthSupport.requireAiEligible(featureStore, session, aiControllerSupport);
    }
}
