package com.myway.backendspring.api;

import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.auth.SessionView;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.domain.DemoLearningService;
import com.myway.backendspring.feature.FeatureStoreService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
public class AiController {
    private final SessionService sessionService;
    private final FeatureStoreService featureStore;
    private final DemoLearningService learningService;

    public AiController(SessionService sessionService, FeatureStoreService featureStore, DemoLearningService learningService) {
        this.sessionService = sessionService;
        this.featureStore = featureStore;
        this.learningService = learningService;
    }

    private SessionView require(String auth) { return sessionService.me(auth); }

    @GetMapping("/insights")
    public ResponseEntity<ApiResponse<Map<String, Object>>> insights(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView session = require(auth);
        if (session == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        return ResponseEntity.ok(ApiResponse.success(featureStore.aiInsights(session.user().id())));
    }

    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<Map<String, Object>>> logs(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView session = require(auth);
        if (session == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        return ResponseEntity.ok(ApiResponse.success(featureStore.aiLogs(session.user().id())));
    }

    @GetMapping("/recommendations")
    public ResponseEntity<ApiResponse<Map<String, Object>>> recs(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView session = require(auth);
        if (session == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        return ResponseEntity.ok(ApiResponse.success(featureStore.aiRecommendations(session.user().id())));
    }

    @GetMapping("/settings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> settings(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView session = require(auth);
        if (session == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        return ResponseEntity.ok(ApiResponse.success(featureStore.aiSettings(session.user().id())));
    }

    @PostMapping("/settings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateSettings(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Map<String, Object> body) {
        SessionView session = require(auth);
        if (session == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        return ResponseEntity.ok(ApiResponse.success(featureStore.updateAiSettings(session.user().id(), body), "설정이 저장되었습니다."));
    }

    @PutMapping("/settings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> putSettings(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Map<String, Object> body) {
        return updateSettings(auth, body);
    }

    @GetMapping("/providers")
    public ResponseEntity<ApiResponse<Map<String, Object>>> providers(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView session = require(auth);
        if (session == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        return ResponseEntity.ok(ApiResponse.success(featureStore.aiProviders(session.user().id())));
    }

    @PostMapping("/rag")
    public ResponseEntity<ApiResponse<Map<String, Object>>> rag(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Map<String, Object> body) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        return ResponseEntity.ok(ApiResponse.success(Map.of("answer", "RAG 샘플 응답", "query", body.getOrDefault("query", ""), "hits", java.util.List.of())));
    }

    @PostMapping("/intent")
    public ResponseEntity<ApiResponse<Map<String, Object>>> intent(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Map<String, Object> body) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        String message = text(body, "message");
        if (message.isBlank()) return ResponseEntity.badRequest().body(ApiResponse.failure("MESSAGE_REQUIRED", "message가 필요합니다."));
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "intent", "recommendation",
                "confidence", 0.82,
                "action", "show_recommendations",
                "reason", "Spring demo intent classifier",
                "lecture_id", textOrNull(body, "lecture_id"),
                "provider", "demo",
                "model", "demo-intent-v1"
        ), "인텐트가 분류되었습니다."));
    }

    @PostMapping("/search")
    public ResponseEntity<ApiResponse<Map<String, Object>>> search(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Map<String, Object> body) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        String query = text(body, "query");
        if (query.isBlank()) return ResponseEntity.badRequest().body(ApiResponse.failure("QUERY_REQUIRED", "query가 필요합니다."));
        ResponseEntity<ApiResponse<Map<String, Object>>> lectureError = validateLecture(body);
        if (lectureError != null) return lectureError;
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "query", query,
                "hits", List.of(Map.of("id", "hit-1", "title", "Spring Boot 시작", "score", 0.91)),
                "provider", "demo",
                "model", "demo-search-v1"
        ), "검색 결과를 조회했습니다."));
    }

    @PostMapping("/answer")
    public ResponseEntity<ApiResponse<Map<String, Object>>> answer(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Map<String, Object> body) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        String question = text(body, "question");
        if (question.isBlank()) return ResponseEntity.badRequest().body(ApiResponse.failure("QUESTION_REQUIRED", "question가 필요합니다."));
        ResponseEntity<ApiResponse<Map<String, Object>>> lectureError = validateLecture(body);
        if (lectureError != null) return lectureError;
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "answer", "[Spring AI 응답] " + question,
                "sources", List.of("lecture:lec_java_01"),
                "lecture_id", textOrNull(body, "lecture_id"),
                "provider", "demo",
                "model", "demo-answer-v1"
        ), "답변을 생성했습니다."));
    }

    @PostMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> summary(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Map<String, Object> body) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        String lectureId = text(body, "lecture_id");
        if (lectureId.isBlank()) return ResponseEntity.badRequest().body(ApiResponse.failure("LECTURE_ID_REQUIRED", "lecture_id가 필요합니다."));
        if (learningService.getLecture(lectureId) == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("LECTURE_NOT_FOUND", "강의를 찾을 수 없습니다."));
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "lecture_id", lectureId,
                "content", "Spring 백엔드에서 생성한 강의 요약입니다.",
                "style", text(body, "style").isBlank() ? "brief" : text(body, "style"),
                "language", text(body, "language").isBlank() ? "ko" : text(body, "language"),
                "provider", "demo",
                "model", "demo-summary-v1"
        ), "요약이 생성되었습니다."));
    }

    @PostMapping("/quiz")
    public ResponseEntity<ApiResponse<Map<String, Object>>> quiz(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Map<String, Object> body) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        String lectureId = text(body, "lecture_id");
        if (lectureId.isBlank()) return ResponseEntity.badRequest().body(ApiResponse.failure("LECTURE_ID_REQUIRED", "lecture_id가 필요합니다."));
        if (learningService.getLecture(lectureId) == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("LECTURE_NOT_FOUND", "강의를 찾을 수 없습니다."));
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "lecture_id", lectureId,
                "questions", List.of(Map.of("id", "q-1", "question", "Spring Boot의 장점은?", "answer", "빠른 REST API 개발")),
                "provider", "demo",
                "model", "demo-quiz-v1"
        ), "퀴즈가 생성되었습니다."));
    }

    private ResponseEntity<ApiResponse<Map<String, Object>>> validateLecture(Map<String, Object> body) {
        String lectureId = text(body, "lecture_id");
        if (!lectureId.isBlank() && learningService.getLecture(lectureId) == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("LECTURE_NOT_FOUND", "강의를 찾을 수 없습니다."));
        }
        return null;
    }

    private String text(Map<String, Object> body, String key) {
        if (body == null || body.get(key) == null) return "";
        return String.valueOf(body.get(key)).trim();
    }

    private Object textOrNull(Map<String, Object> body, String key) {
        String value = text(body, key);
        return value.isBlank() ? null : value;
    }
}
