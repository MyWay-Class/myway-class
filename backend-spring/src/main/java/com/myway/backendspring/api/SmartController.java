package com.myway.backendspring.api;

import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.auth.SessionView;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.domain.DemoLearningService;
import com.myway.backendspring.domain.SmartChatResult;
import com.myway.backendspring.feature.FeatureStoreService;
import com.myway.backendspring.feature.understanding.InputUnderstandingService;
import com.myway.backendspring.feature.understanding.UnderstandingResult;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/smart")
public class SmartController {
    private final SessionService sessionService;
    private final DemoLearningService learningService;
    private final FeatureStoreService featureStore;
    private final InputUnderstandingService inputUnderstandingService;

    public SmartController(
            SessionService sessionService,
            DemoLearningService learningService,
            FeatureStoreService featureStore,
            InputUnderstandingService inputUnderstandingService
    ) {
        this.sessionService = sessionService;
        this.learningService = learningService;
        this.featureStore = featureStore;
        this.inputUnderstandingService = inputUnderstandingService;
    }

    public record SmartChatRequest(@NotBlank String message) {}
    private SessionView require(String auth) {
        return sessionService.me(auth);
    }
    private <T> ResponseEntity<ApiResponse<T>> unauthenticated() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
    }

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<SmartChatResult>> chat(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody SmartChatRequest body) {
        SessionView session = require(auth);
        if (session == null) {
            return unauthenticated();
        }

        UnderstandingResult understanding = inputUnderstandingService.understandMessage(session.user().id(), body.message(), null, null);
        SmartChatResult result = buildChatResult(body.message(), understanding);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    private SmartChatResult buildChatResult(String message, UnderstandingResult understanding) {
        if (!"rag".equals(understanding.route())) {
            return learningService.chat(message);
        }

        Map<String, Object> rag = featureStore.ragOverview(
                message,
                understanding.lectureId(),
                understanding.courseId(),
                4,
                0.0,
                false,
                understanding.entities()
        );
        String answer = String.valueOf(rag.getOrDefault("answer", "")).trim();
        if (answer.isBlank()) {
            answer = learningService.chat(message).answer();
        }
        return new SmartChatResult(answer, extractReferences(rag));
    }

    @SuppressWarnings("unchecked")
    private List<String> extractReferences(Map<String, Object> rag) {
        Object chunks = rag.get("chunks");
        if (!(chunks instanceof List<?> list)) {
            return List.of();
        }
        List<String> refs = new ArrayList<>();
        for (Object item : list) {
            if (!(item instanceof Map<?, ?> map)) {
                continue;
            }
            Object lectureValue = map.containsKey("lecture_id") ? map.get("lecture_id") : "";
            String lectureId = String.valueOf(lectureValue).trim();
            if (lectureId.isBlank()) {
                continue;
            }
            refs.add("lecture:" + lectureId);
        }
        return refs.stream().distinct().toList();
    }
}
