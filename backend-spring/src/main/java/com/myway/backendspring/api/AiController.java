package com.myway.backendspring.api;

import com.fasterxml.jackson.annotation.JsonAnySetter;
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
import java.util.ArrayList;
import java.util.stream.Collectors;

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
    private record RagScope(String lectureId, String courseId) {}
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

    public AiController(SessionService sessionService, FeatureStoreService featureStore, DemoLearningService learningService, AiRuntimeService aiRuntimeService) {
        this.sessionService = sessionService;
        this.featureStore = featureStore;
        this.learningService = learningService;
        this.aiRuntimeService = aiRuntimeService;
    }

    private SessionView require(String auth) { return sessionService.me(auth); }
    private ResponseEntity<ApiResponse<Map<String, Object>>> unauthenticated() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
    }

    private ResponseEntity<ApiResponse<Map<String, Object>>> dailyLimitExceeded() {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(ApiResponse.failure("DAILY_LIMIT_EXCEEDED", "일일 사용량을 초과했습니다."));
    }

    @GetMapping("/insights")
    public ResponseEntity<ApiResponse<Map<String, Object>>> insights(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView session = require(auth);
        if (session == null) return unauthenticated();
        return ResponseEntity.ok(ApiResponse.success(featureStore.aiInsights(session.user().id())));
    }

    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<Map<String, Object>>> logs(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView session = require(auth);
        if (session == null) return unauthenticated();
        return ResponseEntity.ok(ApiResponse.success(featureStore.aiLogs(session.user().id())));
    }

    @GetMapping("/recommendations")
    public ResponseEntity<ApiResponse<Map<String, Object>>> recs(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView session = require(auth);
        if (session == null) return unauthenticated();
        return ResponseEntity.ok(ApiResponse.success(featureStore.aiRecommendations(session.user().id())));
    }

    @GetMapping("/settings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> settings(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView session = require(auth);
        if (session == null) return unauthenticated();
        return ResponseEntity.ok(ApiResponse.success(featureStore.aiSettings(session.user().id())));
    }

    @PostMapping("/settings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateSettings(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody(required = false) AiSettingsUpdateRequest body) {
        SessionView session = require(auth);
        if (session == null) return unauthenticated();
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
        if (session == null) return unauthenticated();
        return ResponseEntity.ok(ApiResponse.success(featureStore.aiProviders(session.user().id())));
    }

    @PostMapping("/rag")
    public ResponseEntity<ApiResponse<Map<String, Object>>> rag(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody RagRequest body) {
        SessionView session = require(auth);
        if (session == null) return unauthenticated();
        if (!featureStore.canConsumeAi(session.user().id())) return dailyLimitExceeded();

        String query = normalize(body.query());

        RagScope scope = resolveRagScope(body.lecture_id(), body.course_id());
        ResponseEntity<ApiResponse<Map<String, Object>>> scopeError = validateRagScope(scope);
        if (scopeError != null) return scopeError;

        Integer limit = body.limit();
        Double minScore = body.min_score();
        boolean includeDebug = Boolean.TRUE.equals(body.include_debug());
        Map<String, Object> data = featureStore.ragOverview(
                query,
                optionalNormalized(scope.lectureId()),
                optionalNormalized(scope.courseId()),
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
        if (session == null) return unauthenticated();
        Map<String, Object> data = featureStore.ragIndexOverview(
                optionalNormalized(lectureId),
                optionalNormalized(courseId)
        );
        return ResponseEntity.ok(ApiResponse.success(data, "RAG 인덱스 현황을 조회했습니다."));
    }

    @PostMapping("/rag/index/rebuild")
    public ResponseEntity<ApiResponse<Map<String, Object>>> rebuildRagIndex(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody RagIndexMutationRequest body
    ) {
        SessionView session = require(auth);
        if (session == null) return unauthenticated();
        RagScope scope = resolveRagScope(body.lecture_id(), body.course_id());
        ResponseEntity<ApiResponse<Map<String, Object>>> scopeError = validateRagScope(scope);
        if (scopeError != null) return scopeError;
        Map<String, Object> data = featureStore.rebuildRagIndex(
                optionalNormalized(scope.lectureId()),
                optionalNormalized(scope.courseId())
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(data, "RAG 인덱스를 재생성했습니다."));
    }

    @PostMapping("/rag/index/clear")
    public ResponseEntity<ApiResponse<Map<String, Object>>> clearRagIndex(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody RagIndexMutationRequest body
    ) {
        SessionView session = require(auth);
        if (session == null) return unauthenticated();
        RagScope scope = resolveRagScope(body.lecture_id(), body.course_id());
        ResponseEntity<ApiResponse<Map<String, Object>>> scopeError = validateRagScope(scope);
        if (scopeError != null) return scopeError;
        Map<String, Object> data = featureStore.clearRagIndex(
                optionalNormalized(scope.lectureId()),
                optionalNormalized(scope.courseId())
        );
        return ResponseEntity.ok(ApiResponse.success(data, "RAG 인덱스를 초기화했습니다."));
    }

    @PostMapping("/rag/evaluate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> evaluateRag(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) RagEvaluateRequest body
    ) {
        SessionView session = require(auth);
        if (session == null) return unauthenticated();
        Integer topK = body == null ? null : body.top_k();
        List<Map<String, Object>> cases = body == null || body.cases() == null
                ? List.of()
                : body.cases().stream().map(RagEvaluateCaseRequest::payload).collect(Collectors.toList());
        Map<String, Object> data = featureStore.evaluateRagBatch(cases, topK);
        return ResponseEntity.ok(ApiResponse.success(data, "RAG 배치 평가를 완료했습니다."));
    }

    @PostMapping("/intent")
    public ResponseEntity<ApiResponse<Map<String, Object>>> intent(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody IntentRequest body) {
        SessionView session = require(auth);
        if (session == null) return unauthenticated();
        if (!featureStore.canConsumeAi(session.user().id())) return dailyLimitExceeded();
        String message = normalize(body.message());
        Map<String, Object> runtime = aiRuntimeService.generate(
                "intent",
                "메시지 의도를 한 단어로 분류하고 이유를 한 줄로 설명하세요: " + message,
                featureStore.aiSettings(session.user().id())
        );
        Map<String, Object> data = new HashMap<>();
        data.put("intent", "recommendation");
        data.put("confidence", 0.82);
        data.put("action", "show_recommendations");
        data.put("reason", runtime.getOrDefault("text", "Spring demo intent classifier"));
        data.put("lecture_id", optionalNormalized(body.lecture_id()));
        data.put("provider", runtime.getOrDefault("provider", "demo"));
        data.put("model", runtime.getOrDefault("model", "demo-intent-v1"));
        data.put("live", runtime.getOrDefault("live", false));
        if (runtime.containsKey("error")) data.put("error", runtime.get("error"));
        featureStore.recordAiUsage(session.user().id(), "intent", true, message);
        return ResponseEntity.ok(ApiResponse.success(data, "인텐트가 분류되었습니다."));
    }

    @PostMapping("/search")
    public ResponseEntity<ApiResponse<Map<String, Object>>> search(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody SearchRequest body) {
        SessionView session = require(auth);
        if (session == null) return unauthenticated();
        if (!featureStore.canConsumeAi(session.user().id())) return dailyLimitExceeded();
        String query = normalize(body.query());
        String lectureId = optionalNormalized(body.lecture_id());
        ResponseEntity<ApiResponse<Map<String, Object>>> lectureError = validateLecture(body.lecture_id());
        if (lectureError != null) return lectureError;
        Map<String, Object> runtime = aiRuntimeService.generate(
                "search",
                "다음 질의와 관련된 강의 검색 결과를 요약하세요: " + query,
                featureStore.aiSettings(session.user().id())
        );
        Map<String, Object> data = new HashMap<>();
        data.put("query", query);
        data.put("hits", List.of(Map.of("id", "hit-1", "title", String.valueOf(runtime.getOrDefault("text", "Spring Boot 시작")), "score", 0.91)));
        data.put("sources", resolveRagSources(query, lectureId, null, 4));
        data.put("provider", runtime.getOrDefault("provider", "demo"));
        data.put("model", runtime.getOrDefault("model", "demo-search-v1"));
        data.put("live", runtime.getOrDefault("live", false));
        if (runtime.containsKey("error")) data.put("error", runtime.get("error"));
        featureStore.recordAiUsage(session.user().id(), "search", true, query);
        return ResponseEntity.ok(ApiResponse.success(data, "검색 결과를 조회했습니다."));
    }

    @PostMapping("/answer")
    public ResponseEntity<ApiResponse<Map<String, Object>>> answer(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody AnswerRequest body) {
        SessionView session = require(auth);
        if (session == null) return unauthenticated();
        if (!featureStore.canConsumeAi(session.user().id())) return dailyLimitExceeded();
        String question = normalize(body.question());
        String lectureId = optionalNormalized(body.lecture_id());
        ResponseEntity<ApiResponse<Map<String, Object>>> lectureError = validateLecture(body.lecture_id());
        if (lectureError != null) return lectureError;
        Map<String, Object> runtime = aiRuntimeService.generate("answer", question, featureStore.aiSettings(session.user().id()));
        List<Map<String, Object>> sources = resolveRagSources(question, lectureId, null, 4);
        Map<String, Object> data = new HashMap<>();
        data.put("answer", runtime.getOrDefault("text", "[Spring AI 응답] " + question));
        data.put("sources", sources);
        data.put("source_ids", sources.stream()
                .map(source -> String.valueOf(source.getOrDefault("lecture_id", "")))
                .filter(id -> !id.isBlank())
                .distinct()
                .map(id -> "lecture:" + id)
                .toList());
        data.put("lecture_id", lectureId);
        data.put("provider", runtime.getOrDefault("provider", "demo"));
        data.put("model", runtime.getOrDefault("model", "demo-answer-v1"));
        data.put("live", runtime.getOrDefault("live", false));
        if (runtime.containsKey("error")) data.put("error", runtime.get("error"));
        featureStore.recordAiUsage(session.user().id(), "answer", true, question);
        return ResponseEntity.ok(ApiResponse.success(data, "답변을 생성했습니다."));
    }

    @PostMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> summary(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody SummaryRequest body) {
        SessionView session = require(auth);
        if (session == null) return unauthenticated();
        if (!featureStore.canConsumeAi(session.user().id())) return dailyLimitExceeded();
        String lectureId = requireLectureId(body.lecture_id());
        if (learningService.getLecture(lectureId) == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("LECTURE_NOT_FOUND", "강의를 찾을 수 없습니다."));
        String style = defaultIfBlank(body.style(), "brief");
        String language = defaultIfBlank(body.language(), "ko");
        Map<String, Object> runtime = aiRuntimeService.generate(
                "summary",
                lectureId + " 강의 내용을 " + style + " 스타일로 " + language + " 요약",
                featureStore.aiSettings(session.user().id())
        );
        Map<String, Object> data = new HashMap<>();
        data.put("lecture_id", lectureId);
        data.put("content", runtime.getOrDefault("text", "Spring 백엔드에서 생성한 강의 요약입니다."));
        data.put("style", style);
        data.put("language", language);
        data.put("provider", runtime.getOrDefault("provider", "demo"));
        data.put("model", runtime.getOrDefault("model", "demo-summary-v1"));
        data.put("live", runtime.getOrDefault("live", false));
        if (runtime.containsKey("error")) data.put("error", runtime.get("error"));
        featureStore.recordAiUsage(session.user().id(), "summary", true, lectureId);
        return ResponseEntity.ok(ApiResponse.success(data, "요약이 생성되었습니다."));
    }

    @PostMapping("/quiz")
    public ResponseEntity<ApiResponse<Map<String, Object>>> quiz(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody QuizRequest body) {
        SessionView session = require(auth);
        if (session == null) return unauthenticated();
        if (!featureStore.canConsumeAi(session.user().id())) return dailyLimitExceeded();
        String lectureId = requireLectureId(body.lecture_id());
        if (learningService.getLecture(lectureId) == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("LECTURE_NOT_FOUND", "강의를 찾을 수 없습니다."));
        Map<String, Object> runtime = aiRuntimeService.generate(
                "quiz",
                lectureId + " 강의 기반 객관식 퀴즈 1문항 생성",
                featureStore.aiSettings(session.user().id())
        );
        Map<String, Object> data = new HashMap<>();
        data.put("lecture_id", lectureId);
        data.put("questions", List.of(Map.of("id", "q-1", "question", String.valueOf(runtime.getOrDefault("text", "Spring Boot의 장점은?")), "answer", "AI 생성 답안")));
        data.put("provider", runtime.getOrDefault("provider", "demo"));
        data.put("model", runtime.getOrDefault("model", "demo-quiz-v1"));
        data.put("live", runtime.getOrDefault("live", false));
        if (runtime.containsKey("error")) data.put("error", runtime.get("error"));
        featureStore.recordAiUsage(session.user().id(), "quiz", true, lectureId);
        return ResponseEntity.ok(ApiResponse.success(data, "퀴즈가 생성되었습니다."));
    }

    private ResponseEntity<ApiResponse<Map<String, Object>>> validateLecture(String lectureIdRaw) {
        String lectureId = lectureIdRaw == null ? "" : lectureIdRaw.trim();
        if (!lectureId.isBlank() && learningService.getLecture(lectureId) == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("LECTURE_NOT_FOUND", "강의를 찾을 수 없습니다."));
        }
        return null;
    }

    private RagScope resolveRagScope(String lectureIdRaw, String courseIdRaw) {
        return new RagScope(normalize(lectureIdRaw), normalize(courseIdRaw));
    }

    private ResponseEntity<ApiResponse<Map<String, Object>>> validateRagScope(RagScope scope) {
        if (scope.lectureId().isBlank() && scope.courseId().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("LECTURE_OR_COURSE_REQUIRED", "lecture_id 또는 course_id가 필요합니다."));
        }
        if (!scope.lectureId().isBlank() && learningService.getLecture(scope.lectureId()) == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("LECTURE_NOT_FOUND", "강의를 찾을 수 없습니다."));
        }
        if (!scope.courseId().isBlank() && learningService.getCourseLectures(scope.courseId()).isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("COURSE_NOT_FOUND", "강의를 찾을 수 없습니다."));
        }
        return null;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private String optionalNormalized(String value) {
        String normalized = normalize(value);
        return normalized.isBlank() ? null : normalized;
    }

    private String defaultIfBlank(String value, String fallback) {
        String normalized = normalize(value);
        return normalized.isBlank() ? fallback : normalized;
    }

    private String requireLectureId(String lectureIdRaw) {
        String lectureId = normalize(lectureIdRaw);
        return lectureId.isBlank() ? null : lectureId;
    }

    private List<Map<String, Object>> resolveRagSources(String query, String lectureId, String courseId, int limit) {
        try {
            Map<String, Object> rag = featureStore.ragOverview(query, lectureId, courseId, limit, 0.0, false);
            List<Map<String, Object>> chunks = extractChunkList(rag);
            List<Map<String, Object>> sources = new ArrayList<>();
            for (Map<String, Object> chunk : chunks) {
                String sourceLectureId = normalize(String.valueOf(chunk.getOrDefault("lecture_id", lectureId == null ? "" : lectureId)));
                int startMs = asInt(chunk.get("start_ms"));
                int endMs = asInt(chunk.get("end_ms"));
                String text = firstNotBlank(
                        String.valueOf(chunk.getOrDefault("excerpt", "")),
                        String.valueOf(chunk.getOrDefault("content", "")),
                        String.valueOf(chunk.getOrDefault("title", ""))
                );
                double score = asDouble(chunk.get("similarity"));
                Map<String, Object> source = new HashMap<>();
                source.put("lecture_id", sourceLectureId.isBlank() ? lectureId : sourceLectureId);
                source.put("start_ms", Math.max(0, startMs));
                source.put("end_ms", Math.max(Math.max(0, startMs), endMs));
                source.put("text", text);
                source.put("score", score);
                sources.add(source);
            }
            if (!sources.isEmpty()) {
                return sources;
            }
        } catch (Exception ignored) {
            // Keep response contract stable even when RAG retrieval fails.
        }
        return List.of(Map.of(
                "lecture_id", lectureId == null ? "" : lectureId,
                "start_ms", 0,
                "end_ms", 0,
                "text", "근거를 준비 중입니다.",
                "score", 0.0
        ));
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> extractChunkList(Map<String, Object> ragPayload) {
        if (ragPayload == null || ragPayload.isEmpty()) {
            return List.of();
        }
        Object chunks = ragPayload.get("chunks");
        if (chunks instanceof List<?> list) {
            return list.stream()
                    .filter(Map.class::isInstance)
                    .map(item -> (Map<String, Object>) item)
                    .toList();
        }
        Object search = ragPayload.get("search");
        if (search instanceof Map<?, ?> searchMap) {
            Object hits = searchMap.get("hits");
            if (hits instanceof List<?> list) {
                return list.stream()
                        .filter(Map.class::isInstance)
                        .map(item -> (Map<String, Object>) item)
                        .toList();
            }
        }
        return List.of();
    }

    private int asInt(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (Exception ignored) {
            return 0;
        }
    }

    private double asDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (Exception ignored) {
            return 0.0;
        }
    }

    private String firstNotBlank(String... values) {
        for (String value : values) {
            String normalized = normalize(value);
            if (!normalized.isBlank()) {
                return normalized;
            }
        }
        return "";
    }
}
