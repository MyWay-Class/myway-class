package com.myway.backendspring.api.support;

import com.myway.backendspring.api.AiController;
import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.auth.SessionView;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.domain.DemoLearningService;
import com.myway.backendspring.feature.FeatureStoreService;
import com.myway.backendspring.feature.ai.AiRuntimeService;
import com.myway.backendspring.feature.understanding.InputUnderstandingService;
import com.myway.backendspring.feature.understanding.UnderstandingResult;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class AiControllerGenerationSupport {
    private final SessionService sessionService;
    private final FeatureStoreService featureStore;
    private final DemoLearningService learningService;
    private final AiRuntimeService aiRuntimeService;
    private final InputUnderstandingService inputUnderstandingService;
    private final AiRequestSupport aiRequestSupport;
    private final AiControllerSupport aiControllerSupport;
    private final AiControllerAuthSupport aiControllerAuthSupport;
    private final AiControllerRuntimeSupport aiControllerRuntimeSupport;

    public AiControllerGenerationSupport(
            SessionService sessionService,
            FeatureStoreService featureStore,
            DemoLearningService learningService,
            AiRuntimeService aiRuntimeService,
            InputUnderstandingService inputUnderstandingService,
            AiRequestSupport aiRequestSupport,
            AiControllerSupport aiControllerSupport,
            AiControllerAuthSupport aiControllerAuthSupport,
            AiControllerRuntimeSupport aiControllerRuntimeSupport
    ) {
        this.sessionService = sessionService;
        this.featureStore = featureStore;
        this.learningService = learningService;
        this.aiRuntimeService = aiRuntimeService;
        this.inputUnderstandingService = inputUnderstandingService;
        this.aiRequestSupport = aiRequestSupport;
        this.aiControllerSupport = aiControllerSupport;
        this.aiControllerAuthSupport = aiControllerAuthSupport;
        this.aiControllerRuntimeSupport = aiControllerRuntimeSupport;
    }

    public ResponseEntity<ApiResponse<Map<String, Object>>> intent(String auth, AiController.IntentRequest body) {
        SessionView session = require(auth);
        ResponseEntity<ApiResponse<Map<String, Object>>> guard = requireAiGuard(session);
        if (guard != null) return guard;
        String message = aiRequestSupport.normalize(body.message());
        UnderstandingResult result = inputUnderstandingService.understandMessage(
                session.user().id(),
                message,
                aiRequestSupport.optionalNormalized(body.lecture_id()),
                null
        );
        aiControllerRuntimeSupport.recordUsage(featureStore, session.user().id(), "intent", message);
        Map<String, Object> data = aiControllerSupport.intentResponse(result);
        return ResponseEntity.ok(ApiResponse.success(data, "인텐트가 분류되었습니다."));
    }

    public ResponseEntity<ApiResponse<Map<String, Object>>> search(String auth, AiController.SearchRequest body) {
        SessionView session = require(auth);
        ResponseEntity<ApiResponse<Map<String, Object>>> guard = requireAiGuard(session);
        if (guard != null) return guard;
        String query = aiRequestSupport.normalize(body.query());
        String lectureId = aiRequestSupport.optionalNormalized(body.lecture_id());
        ResponseEntity<ApiResponse<Map<String, Object>>> lectureError = aiRequestSupport.validateLecture(body.lecture_id());
        if (lectureError != null) return lectureError;
        UnderstandingResult result = inputUnderstandingService.understandMessage(session.user().id(), query, lectureId, null);
        Map<String, Object> runtime = generateAndRecord(
                session.user().id(),
                "search",
                "다음 질의와 관련된 강의 검색 결과를 요약하세요: " + query,
                query
        );
        Map<String, Object> data = aiControllerSupport.searchResponse(
                query,
                aiRequestSupport.resolveRagSources(query, lectureId, null, 4, result.entities()),
                runtime
        );
        return ResponseEntity.ok(ApiResponse.success(data, "검색 결과를 조회했습니다."));
    }

    public ResponseEntity<ApiResponse<Map<String, Object>>> answer(String auth, AiController.AnswerRequest body) {
        SessionView session = require(auth);
        ResponseEntity<ApiResponse<Map<String, Object>>> guard = requireAiGuard(session);
        if (guard != null) return guard;
        String question = aiRequestSupport.normalize(body.question());
        String lectureId = aiRequestSupport.optionalNormalized(body.lecture_id());
        ResponseEntity<ApiResponse<Map<String, Object>>> lectureError = aiRequestSupport.validateLecture(body.lecture_id());
        if (lectureError != null) return lectureError;
        UnderstandingResult result = inputUnderstandingService.understandMessage(session.user().id(), question, lectureId, null);
        Map<String, Object> runtime = generateAndRecord(session.user().id(), "answer", question, question);
        List<Map<String, Object>> sources = aiRequestSupport.resolveRagSources(question, lectureId, null, 4, result.entities());
        Map<String, Object> data = aiControllerSupport.answerResponse(question, lectureId, sources, runtime);
        return ResponseEntity.ok(ApiResponse.success(data, "답변을 생성했습니다."));
    }

    public ResponseEntity<ApiResponse<Map<String, Object>>> summary(String auth, AiController.SummaryRequest body) {
        SessionView session = require(auth);
        ResponseEntity<ApiResponse<Map<String, Object>>> guard = requireAiGuard(session);
        if (guard != null) return guard;
        String lectureId = aiRequestSupport.requireLectureId(body.lecture_id());
        ResponseEntity<ApiResponse<Map<String, Object>>> lectureError = validateLectureExists(lectureId);
        if (lectureError != null) return lectureError;
        String style = aiRequestSupport.defaultIfBlank(body.style(), "brief");
        String language = aiRequestSupport.defaultIfBlank(body.language(), "ko");
        Map<String, Object> runtime = generateAndRecord(
                session.user().id(),
                "summary",
                lectureId + " 강의 내용을 " + style + " 스타일로 " + language + " 요약",
                lectureId
        );
        Map<String, Object> data = aiControllerSupport.summaryResponse(lectureId, style, language, runtime);
        return ResponseEntity.ok(ApiResponse.success(data, "요약이 생성되었습니다."));
    }

    public ResponseEntity<ApiResponse<Map<String, Object>>> quiz(String auth, AiController.QuizRequest body) {
        SessionView session = require(auth);
        ResponseEntity<ApiResponse<Map<String, Object>>> guard = requireAiGuard(session);
        if (guard != null) return guard;
        String lectureId = aiRequestSupport.requireLectureId(body.lecture_id());
        ResponseEntity<ApiResponse<Map<String, Object>>> lectureError = validateLectureExists(lectureId);
        if (lectureError != null) return lectureError;
        Map<String, Object> runtime = generateAndRecord(
                session.user().id(),
                "quiz",
                lectureId + " 강의 기반 객관식 퀴즈 1문항 생성",
                lectureId
        );
        Map<String, Object> data = aiControllerSupport.quizResponse(lectureId, runtime);
        return ResponseEntity.ok(ApiResponse.success(data, "퀴즈가 생성되었습니다."));
    }

    private SessionView require(String auth) {
        return aiControllerAuthSupport.requireSession(sessionService, auth);
    }

    private ResponseEntity<ApiResponse<Map<String, Object>>> requireAiGuard(SessionView session) {
        return aiControllerAuthSupport.requireAiEligible(featureStore, session, aiControllerSupport);
    }

    private ResponseEntity<ApiResponse<Map<String, Object>>> validateLectureExists(String lectureId) {
        if (learningService.getLecture(lectureId) == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("LECTURE_NOT_FOUND", "강의를 찾을 수 없습니다."));
        }
        return null;
    }

    private Map<String, Object> generateAndRecord(String userId, String feature, String prompt, String usageInput) {
        Map<String, Object> runtime = aiControllerRuntimeSupport.generate(
                aiRuntimeService,
                featureStore,
                userId,
                feature,
                prompt
        );
        aiControllerRuntimeSupport.recordUsage(featureStore, userId, feature, usageInput);
        return runtime;
    }
}
