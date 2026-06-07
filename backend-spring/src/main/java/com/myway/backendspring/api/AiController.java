package com.myway.backendspring.api;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.myway.backendspring.api.support.AiControllerSupport;
import com.myway.backendspring.api.support.AiControllerGenerationSupport;
import com.myway.backendspring.api.support.AiControllerQuerySupport;
import com.myway.backendspring.common.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
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

    private final AiControllerSupport aiControllerSupport;
    private final AiControllerQuerySupport aiControllerQuerySupport;
    private final AiControllerGenerationSupport aiControllerGenerationSupport;

    public AiController(
            AiControllerSupport aiControllerSupport,
            AiControllerQuerySupport aiControllerQuerySupport,
            AiControllerGenerationSupport aiControllerGenerationSupport
    ) {
        this.aiControllerSupport = aiControllerSupport;
        this.aiControllerQuerySupport = aiControllerQuerySupport;
        this.aiControllerGenerationSupport = aiControllerGenerationSupport;
    }

    @GetMapping("/insights")
    public ResponseEntity<ApiResponse<Map<String, Object>>> insights(@RequestHeader(value = "Authorization", required = false) String auth) {
        return aiControllerQuerySupport.insights(auth);
    }

    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<Map<String, Object>>> logs(@RequestHeader(value = "Authorization", required = false) String auth) {
        return aiControllerQuerySupport.logs(auth);
    }

    @GetMapping("/recommendations")
    public ResponseEntity<ApiResponse<Map<String, Object>>> recs(@RequestHeader(value = "Authorization", required = false) String auth) {
        return aiControllerQuerySupport.recommendations(auth);
    }

    @GetMapping("/settings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> settings(@RequestHeader(value = "Authorization", required = false) String auth) {
        return aiControllerQuerySupport.settings(auth);
    }

    @PostMapping("/settings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateSettings(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody(required = false) AiSettingsUpdateRequest body) {
        return aiControllerQuerySupport.updateSettings(auth, body);
    }

    @PutMapping("/settings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> putSettings(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody(required = false) AiSettingsUpdateRequest body) {
        return updateSettings(auth, body);
    }

    @GetMapping("/providers")
    public ResponseEntity<ApiResponse<Map<String, Object>>> providers(@RequestHeader(value = "Authorization", required = false) String auth) {
        return aiControllerQuerySupport.providers(auth);
    }

    @PostMapping("/rag")
    public ResponseEntity<ApiResponse<Map<String, Object>>> rag(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody RagRequest body) {
        return aiControllerQuerySupport.rag(auth, body);
    }

    @GetMapping("/rag/index")
    public ResponseEntity<ApiResponse<Map<String, Object>>> ragIndex(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestParam(value = "lecture_id", required = false) String lectureId,
            @RequestParam(value = "course_id", required = false) String courseId
    ) {
        return aiControllerQuerySupport.ragIndex(auth, lectureId, courseId);
    }

    @PostMapping("/rag/index/rebuild")
    public ResponseEntity<ApiResponse<Map<String, Object>>> rebuildRagIndex(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody RagIndexMutationRequest body
    ) {
        return aiControllerQuerySupport.rebuildRagIndex(auth, body);
    }

    @PostMapping("/rag/index/clear")
    public ResponseEntity<ApiResponse<Map<String, Object>>> clearRagIndex(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody RagIndexMutationRequest body
    ) {
        return aiControllerQuerySupport.clearRagIndex(auth, body);
    }

    @PostMapping("/rag/evaluate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> evaluateRag(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) RagEvaluateRequest body
    ) {
        return aiControllerQuerySupport.evaluateRag(auth, body);
    }

    @PostMapping("/intent")
    public ResponseEntity<ApiResponse<Map<String, Object>>> intent(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody IntentRequest body) {
        return aiControllerGenerationSupport.intent(auth, body);
    }

    @PostMapping("/search")
    public ResponseEntity<ApiResponse<Map<String, Object>>> search(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody SearchRequest body) {
        return aiControllerGenerationSupport.search(auth, body);
    }

    @PostMapping("/answer")
    public ResponseEntity<ApiResponse<Map<String, Object>>> answer(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody AnswerRequest body) {
        return aiControllerGenerationSupport.answer(auth, body);
    }

    @PostMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> summary(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody SummaryRequest body) {
        return aiControllerGenerationSupport.summary(auth, body);
    }

    @PostMapping("/quiz")
    public ResponseEntity<ApiResponse<Map<String, Object>>> quiz(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody QuizRequest body) {
        return aiControllerGenerationSupport.quiz(auth, body);
    }

}
