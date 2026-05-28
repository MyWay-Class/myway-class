package com.myway.backendspring.api;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.myway.backendspring.api.support.AiControllerRagSupport;
import com.myway.backendspring.api.support.AiControllerSupport;
import com.myway.backendspring.api.support.AiRequestSupport;
import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.auth.SessionView;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.domain.DemoLearningService;
import com.myway.backendspring.feature.FeatureStoreService;
import com.myway.backendspring.feature.ai.AiRuntimeService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
public class AiController {
    public record RagRequest(@NotBlank String query, String lecture_id, String course_id, Integer limit, Double min_score, Boolean include_debug) {}
    public record RagIndexMutationRequest(String lecture_id, String course_id) {}
    public record RagEvaluateRequest(Integer top_k, List<RagEvaluateCaseRequest> cases) {}
    public record IntentRequest(@NotBlank String message, String lecture_id) {}
    public record SearchRequest(@NotBlank String query, String lecture_id) {}
    public record AnswerRequest(@NotBlank String question, String lecture_id) {}
    public record SummaryRequest(@NotBlank String lecture_id, String style, String language) {}
    public record QuizRequest(@NotBlank String lecture_id) {}
    public static final class AiSettingsUpdateRequest {
        private Map<String, Object> settings;
        private final Map<String, Object> extras = new HashMap<>();

        public AiSettingsUpdateRequest() {
        }

        public AiSettingsUpdateRequest(Map<String, Object> settings) {
            this.settings = settings;
        }

        public Map<String, Object> settings() {
            return settings;
        }

        public void setSettings(Map<String, Object> settings) {
            this.settings = settings;
        }

        @JsonAnySetter
        public void addExtra(String key, Object value) {
            extras.put(key, value);
        }

        public Map<String, Object> toPatch() {
            if (settings != null) {
                return settings;
            }
            return extras;
        }
    }

    public static final class RagEvaluateCaseRequest {
        private final Map<String, Object> payload = new HashMap<>();

        @JsonAnySetter
        public void put(String key, Object value) {
            payload.put(key, value);
        }

        public Map<String, Object> payload() {
            return payload;
        }
    }

    private final SessionService sessionService;
    private final FeatureStoreService featureStore;
    private final DemoLearningService learningService;
    private final AiRuntimeService aiRuntimeService;
    private final AiRequestSupport aiRequestSupport;
    private final AiControllerSupport aiControllerSupport;
    private final AiControllerRagSupport aiControllerRagSupport;

    public AiController(
            SessionService sessionService,
            FeatureStoreService featureStore,
            DemoLearningService learningService,
            AiRuntimeService aiRuntimeService,
            AiRequestSupport aiRequestSupport,
            AiControllerSupport aiControllerSupport,
            AiControllerRagSupport aiControllerRagSupport
    ) {
        this.sessionService = sessionService;
        this.featureStore = featureStore;
        this.learningService = learningService;
        this.aiRuntimeService = aiRuntimeService;
        this.aiRequestSupport = aiRequestSupport;
        this.aiControllerSupport = aiControllerSupport;
        this.aiControllerRagSupport = aiControllerRagSupport;
    }

    private SessionView require(String auth) { return sessionService.me(auth); }

    @GetMapping("/insights")
    public ResponseEntity<ApiResponse<Map<String, Object>>> insights(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView session = require(auth);
        if (session == null) return aiControllerSupport.unauthenticated();
        return ResponseEntity.ok(ApiResponse.success(featureStore.aiInsights(session.user().id())));
    }

    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<Map<String, Object>>> logs(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView session = require(auth);
        if (session == null) return aiControllerSupport.unauthenticated();
        return ResponseEntity.ok(ApiResponse.success(featureStore.aiLogs(session.user().id())));
    }

    @GetMapping("/recommendations")
    public ResponseEntity<ApiResponse<Map<String, Object>>> recs(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView session = require(auth);
        if (session == null) return aiControllerSupport.unauthenticated();
        return ResponseEntity.ok(ApiResponse.success(featureStore.aiRecommendations(session.user().id())));
    }

    @GetMapping("/settings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> settings(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView session = require(auth);
        if (session == null) return aiControllerSupport.unauthenticated();
        return ResponseEntity.ok(ApiResponse.success(featureStore.aiSettings(session.user().id())));
    }

    @PostMapping("/settings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateSettings(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody(required = false) AiSettingsUpdateRequest body) {
        SessionView session = require(auth);
        if (session == null) return aiControllerSupport.unauthenticated();
        Map<String, Object> patch = body == null ? Map.of() : body.toPatch();
        return ResponseEntity.ok(ApiResponse.success(featureStore.updateAiSettings(session.user().id(), patch), "설정이 저장되었습니다."));
    }

    @PutMapping("/settings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> putSettings(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody(required = false) AiSettingsUpdateRequest body) {
        return updateSettings(auth, body);
    }

    @GetMapping("/providers")
    public ResponseEntity<ApiResponse<Map<String, Object>>> providers(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView session = require(auth);
        if (session == null) return aiControllerSupport.unauthenticated();
        return ResponseEntity.ok(ApiResponse.success(featureStore.aiProviders(session.user().id())));
    }

    @PostMapping("/rag")
    public ResponseEntity<ApiResponse<Map<String, Object>>> rag(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody RagRequest body) {
        SessionView session = require(auth);
        if (session == null) return aiControllerSupport.unauthenticated();
        if (!featureStore.canConsumeAi(session.user().id())) return aiControllerSupport.dailyLimitExceeded();

        String query = aiRequestSupport.normalize(body.query());

        AiRequestSupport.RagScope scope = aiRequestSupport.resolveRagScope(body.lecture_id(), body.course_id());
        ResponseEntity<ApiResponse<Map<String, Object>>> scopeError = aiRequestSupport.validateRagScope(scope);
        if (scopeError != null) return scopeError;

        Integer limit = body.limit();
        Double minScore = body.min_score();
        boolean includeDebug = aiControllerRagSupport.includeDebug(body.include_debug());
        Map<String, Object> data = featureStore.ragOverview(
                query,
                aiRequestSupport.optionalNormalized(scope.lectureId()),
                aiRequestSupport.optionalNormalized(scope.courseId()),
                limit,
                minScore,
                includeDebug
        );
        featureStore.recordAiUsage(session.user().id(), "rag", true, query);
        return ResponseEntity.ok(ApiResponse.success(data, "RAG 응답을 생성했습니다."));
    }

    @GetMapping("/rag/index")
    public ResponseEntity<ApiResponse<Map<String, Object>>> ragIndex(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestParam(value = "lecture_id", required = false) String lectureId,
            @RequestParam(value = "course_id", required = false) String courseId
    ) {
        SessionView session = require(auth);
        if (session == null) return aiControllerSupport.unauthenticated();
        Map<String, Object> data = featureStore.ragIndexOverview(
                aiRequestSupport.optionalNormalized(lectureId),
                aiRequestSupport.optionalNormalized(courseId)
        );
        return ResponseEntity.ok(ApiResponse.success(data, "RAG 인덱스 현황을 조회했습니다."));
    }

    @PostMapping("/rag/index/rebuild")
    public ResponseEntity<ApiResponse<Map<String, Object>>> rebuildRagIndex(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody RagIndexMutationRequest body
    ) {
        SessionView session = require(auth);
        if (session == null) return aiControllerSupport.unauthenticated();
        AiRequestSupport.RagScope scope = aiRequestSupport.resolveRagScope(body.lecture_id(), body.course_id());
        ResponseEntity<ApiResponse<Map<String, Object>>> scopeError = aiRequestSupport.validateRagScope(scope);
        if (scopeError != null) return scopeError;
        Map<String, Object> data = featureStore.rebuildRagIndex(
                aiRequestSupport.optionalNormalized(scope.lectureId()),
                aiRequestSupport.optionalNormalized(scope.courseId())
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(data, "RAG 인덱스를 재생성했습니다."));
    }

    @PostMapping("/rag/index/clear")
    public ResponseEntity<ApiResponse<Map<String, Object>>> clearRagIndex(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody RagIndexMutationRequest body
    ) {
        SessionView session = require(auth);
        if (session == null) return aiControllerSupport.unauthenticated();
        AiRequestSupport.RagScope scope = aiRequestSupport.resolveRagScope(body.lecture_id(), body.course_id());
        ResponseEntity<ApiResponse<Map<String, Object>>> scopeError = aiRequestSupport.validateRagScope(scope);
        if (scopeError != null) return scopeError;
        Map<String, Object> data = featureStore.clearRagIndex(
                aiRequestSupport.optionalNormalized(scope.lectureId()),
                aiRequestSupport.optionalNormalized(scope.courseId())
        );
        return ResponseEntity.ok(ApiResponse.success(data, "RAG 인덱스를 초기화했습니다."));
    }

    @PostMapping("/rag/evaluate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> evaluateRag(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) RagEvaluateRequest body
    ) {
        SessionView session = require(auth);
        if (session == null) return aiControllerSupport.unauthenticated();
        Integer topK = aiControllerRagSupport.topK(body);
        List<Map<String, Object>> cases = aiControllerRagSupport.evaluateCases(body);
        Map<String, Object> data = featureStore.evaluateRagBatch(cases, topK);
        return ResponseEntity.ok(ApiResponse.success(data, "RAG 배치 평가를 완료했습니다."));
    }

    @PostMapping("/intent")
    public ResponseEntity<ApiResponse<Map<String, Object>>> intent(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody IntentRequest body) {
        SessionView session = require(auth);
        if (session == null) return aiControllerSupport.unauthenticated();
        if (!featureStore.canConsumeAi(session.user().id())) return aiControllerSupport.dailyLimitExceeded();
        String message = aiRequestSupport.normalize(body.message());
        Map<String, Object> runtime = aiRuntimeService.generate(
                "intent",
                "메시지 의도를 한 단어로 분류하고 이유를 한 줄로 설명하세요: " + message,
                featureStore.aiSettings(session.user().id())
        );
        Map<String, Object> data = aiControllerSupport.intentResponse(runtime, aiRequestSupport.optionalNormalized(body.lecture_id()));
        featureStore.recordAiUsage(session.user().id(), "intent", true, message);
        return ResponseEntity.ok(ApiResponse.success(data, "인텐트가 분류되었습니다."));
    }

    @PostMapping("/search")
    public ResponseEntity<ApiResponse<Map<String, Object>>> search(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody SearchRequest body) {
        SessionView session = require(auth);
        if (session == null) return aiControllerSupport.unauthenticated();
        if (!featureStore.canConsumeAi(session.user().id())) return aiControllerSupport.dailyLimitExceeded();
        String query = aiRequestSupport.normalize(body.query());
        String lectureId = aiRequestSupport.optionalNormalized(body.lecture_id());
        ResponseEntity<ApiResponse<Map<String, Object>>> lectureError = aiRequestSupport.validateLecture(body.lecture_id());
        if (lectureError != null) return lectureError;
        Map<String, Object> runtime = aiRuntimeService.generate(
                "search",
                "다음 질의와 관련된 강의 검색 결과를 요약하세요: " + query,
                featureStore.aiSettings(session.user().id())
        );
        Map<String, Object> data = aiControllerSupport.searchResponse(
                query,
                aiRequestSupport.resolveRagSources(query, lectureId, null, 4),
                runtime
        );
        featureStore.recordAiUsage(session.user().id(), "search", true, query);
        return ResponseEntity.ok(ApiResponse.success(data, "검색 결과를 조회했습니다."));
    }

    @PostMapping("/answer")
    public ResponseEntity<ApiResponse<Map<String, Object>>> answer(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody AnswerRequest body) {
        SessionView session = require(auth);
        if (session == null) return aiControllerSupport.unauthenticated();
        if (!featureStore.canConsumeAi(session.user().id())) return aiControllerSupport.dailyLimitExceeded();
        String question = aiRequestSupport.normalize(body.question());
        String lectureId = aiRequestSupport.optionalNormalized(body.lecture_id());
        ResponseEntity<ApiResponse<Map<String, Object>>> lectureError = aiRequestSupport.validateLecture(body.lecture_id());
        if (lectureError != null) return lectureError;
        Map<String, Object> runtime = aiRuntimeService.generate("answer", question, featureStore.aiSettings(session.user().id()));
        List<Map<String, Object>> sources = aiRequestSupport.resolveRagSources(question, lectureId, null, 4);
        Map<String, Object> data = aiControllerSupport.answerResponse(question, lectureId, sources, runtime);
        featureStore.recordAiUsage(session.user().id(), "answer", true, question);
        return ResponseEntity.ok(ApiResponse.success(data, "답변을 생성했습니다."));
    }

    @PostMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> summary(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody SummaryRequest body) {
        SessionView session = require(auth);
        if (session == null) return aiControllerSupport.unauthenticated();
        if (!featureStore.canConsumeAi(session.user().id())) return aiControllerSupport.dailyLimitExceeded();
        String lectureId = aiRequestSupport.requireLectureId(body.lecture_id());
        if (learningService.getLecture(lectureId) == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("LECTURE_NOT_FOUND", "강의를 찾을 수 없습니다."));
        String style = aiRequestSupport.defaultIfBlank(body.style(), "brief");
        String language = aiRequestSupport.defaultIfBlank(body.language(), "ko");
        Map<String, Object> runtime = aiRuntimeService.generate(
                "summary",
                lectureId + " 강의 내용을 " + style + " 스타일로 " + language + " 요약",
                featureStore.aiSettings(session.user().id())
        );
        Map<String, Object> data = aiControllerSupport.summaryResponse(lectureId, style, language, runtime);
        featureStore.recordAiUsage(session.user().id(), "summary", true, lectureId);
        return ResponseEntity.ok(ApiResponse.success(data, "요약이 생성되었습니다."));
    }

    @PostMapping("/quiz")
    public ResponseEntity<ApiResponse<Map<String, Object>>> quiz(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody QuizRequest body) {
        SessionView session = require(auth);
        if (session == null) return aiControllerSupport.unauthenticated();
        if (!featureStore.canConsumeAi(session.user().id())) return aiControllerSupport.dailyLimitExceeded();
        String lectureId = aiRequestSupport.requireLectureId(body.lecture_id());
        if (learningService.getLecture(lectureId) == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("LECTURE_NOT_FOUND", "강의를 찾을 수 없습니다."));
        Map<String, Object> runtime = aiRuntimeService.generate(
                "quiz",
                lectureId + " 강의 기반 객관식 퀴즈 1문항 생성",
                featureStore.aiSettings(session.user().id())
        );
        Map<String, Object> data = aiControllerSupport.quizResponse(lectureId, runtime);
        featureStore.recordAiUsage(session.user().id(), "quiz", true, lectureId);
        return ResponseEntity.ok(ApiResponse.success(data, "퀴즈가 생성되었습니다."));
    }

}
