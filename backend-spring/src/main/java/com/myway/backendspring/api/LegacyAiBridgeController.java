package com.myway.backendspring.api;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.feature.FeatureStoreAiFacade;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@RestController
@RequestMapping("/api/v1/legacy/ai")
public class LegacyAiBridgeController {
    public static final class LegacyBody {
        private final Map<String, Object> payload = new HashMap<>();

        @JsonAnySetter
        public void put(String key, Object value) {
            payload.put(key, value);
        }

        public Map<String, Object> payload() {
            return payload;
        }
    }

    private final AiController aiController;
    private final SessionService sessionService;
    private final FeatureStoreAiFacade featureStore;

    public LegacyAiBridgeController(
            AiController aiController,
            SessionService sessionService,
            FeatureStoreAiFacade featureStore
    ) {
        this.aiController = aiController;
        this.sessionService = sessionService;
        this.featureStore = featureStore;
    }

    @GetMapping("/settings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyAiSettings(@RequestHeader(value = "Authorization", required = false) String auth) {
        return withUserId(auth, userId ->
                ResponseEntity.ok(ApiResponse.success(featureStore.aiSettings(userId), "legacy ai settings 응답을 /api/v1/ai/settings와 동일하게 반환했습니다."))
        );
    }

    @GetMapping("/providers")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyAiProviders(@RequestHeader(value = "Authorization", required = false) String auth) {
        return withUserId(auth, userId ->
                ResponseEntity.ok(ApiResponse.success(featureStore.aiProviders(userId), "legacy ai providers 응답을 /api/v1/ai/providers와 동일하게 반환했습니다."))
        );
    }

    @GetMapping("/insights")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyAiInsights(@RequestHeader(value = "Authorization", required = false) String auth) {
        return withUserId(auth, userId ->
                ResponseEntity.ok(ApiResponse.success(featureStore.aiInsights(userId), "legacy ai insights 응답을 /api/v1/ai/insights와 동일하게 반환했습니다."))
        );
    }

    @GetMapping("/recommendations")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyAiRecommendations(@RequestHeader(value = "Authorization", required = false) String auth) {
        return withUserId(auth, userId ->
                ResponseEntity.ok(ApiResponse.success(featureStore.aiRecommendations(userId), "legacy ai recommendations 응답을 /api/v1/ai/recommendations와 동일하게 반환했습니다."))
        );
    }

    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyAiLogs(@RequestHeader(value = "Authorization", required = false) String auth) {
        return withUserId(auth, userId ->
                ResponseEntity.ok(ApiResponse.success(featureStore.aiLogs(userId), "legacy ai logs 응답을 /api/v1/ai/logs와 동일하게 반환했습니다."))
        );
    }

    @PostMapping("/settings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyAiUpdateSettings(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) LegacyBody body
    ) {
        return aiController.updateSettings(auth, new AiController.AiSettingsUpdateRequest(payloadOf(body)));
    }

    @PutMapping("/settings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyAiPutSettings(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) LegacyBody body
    ) {
        return aiController.putSettings(auth, new AiController.AiSettingsUpdateRequest(payloadOf(body)));
    }

    @PostMapping("/intent")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyAiIntent(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) LegacyBody body
    ) {
        Map<String, Object> payload = payloadOf(body);
        return aiController.intent(auth, new AiController.IntentRequest(
                text(payload, "message"),
                text(payload, "lecture_id")
        ));
    }

    @PostMapping("/search")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyAiSearch(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) LegacyBody body
    ) {
        Map<String, Object> payload = payloadOf(body);
        return aiController.search(auth, new AiController.SearchRequest(
                text(payload, "query"),
                text(payload, "lecture_id")
        ));
    }

    @PostMapping("/answer")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyAiAnswer(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) LegacyBody body
    ) {
        Map<String, Object> payload = payloadOf(body);
        return aiController.answer(auth, new AiController.AnswerRequest(
                text(payload, "question"),
                text(payload, "lecture_id")
        ));
    }

    @PostMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyAiSummary(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) LegacyBody body
    ) {
        Map<String, Object> payload = payloadOf(body);
        return aiController.summary(auth, new AiController.SummaryRequest(
                text(payload, "lecture_id"),
                text(payload, "style"),
                text(payload, "language")
        ));
    }

    @PostMapping("/quiz")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyAiQuiz(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) LegacyBody body
    ) {
        Map<String, Object> payload = payloadOf(body);
        return aiController.quiz(auth, new AiController.QuizRequest(text(payload, "lecture_id")));
    }

    private Map<String, Object> payloadOf(LegacyBody body) {
        return body == null ? Map.of() : body.payload();
    }

    private String text(Map<String, Object> body, String key) {
        if (body == null || body.get(key) == null) return "";
        return String.valueOf(body.get(key)).trim();
    }

    private String requireUserId(String auth) {
        var session = sessionService.me(auth);
        return session == null ? null : session.user().id();
    }

    private <T> ResponseEntity<ApiResponse<T>> withUserId(String auth, Function<String, ResponseEntity<ApiResponse<T>>> action) {
        String userId = requireUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        }
        return action.apply(userId);
    }
}
