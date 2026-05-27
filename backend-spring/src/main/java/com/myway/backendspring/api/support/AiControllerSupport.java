package com.myway.backendspring.api.support;

import com.myway.backendspring.common.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class AiControllerSupport {
    public ResponseEntity<ApiResponse<Map<String, Object>>> unauthenticated() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
    }

    public ResponseEntity<ApiResponse<Map<String, Object>>> dailyLimitExceeded() {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(ApiResponse.failure("DAILY_LIMIT_EXCEEDED", "일일 사용량을 초과했습니다."));
    }

    public Map<String, Object> intentResponse(Map<String, Object> runtime, String lectureId) {
        Map<String, Object> data = new HashMap<>();
        data.put("intent", "recommendation");
        data.put("confidence", 0.82);
        data.put("action", "show_recommendations");
        data.put("reason", runtime.getOrDefault("text", "Spring demo intent classifier"));
        data.put("lecture_id", lectureId);
        data.put("provider", runtime.getOrDefault("provider", "demo"));
        data.put("model", runtime.getOrDefault("model", "demo-intent-v1"));
        data.put("live", runtime.getOrDefault("live", false));
        if (runtime.containsKey("error")) data.put("error", runtime.get("error"));
        return data;
    }

    public Map<String, Object> searchResponse(String query, List<Map<String, Object>> sources, Map<String, Object> runtime) {
        Map<String, Object> data = new HashMap<>();
        data.put("query", query);
        data.put("hits", List.of(Map.of("id", "hit-1", "title", String.valueOf(runtime.getOrDefault("text", "Spring Boot 시작")), "score", 0.91)));
        data.put("sources", sources);
        data.put("provider", runtime.getOrDefault("provider", "demo"));
        data.put("model", runtime.getOrDefault("model", "demo-search-v1"));
        data.put("live", runtime.getOrDefault("live", false));
        if (runtime.containsKey("error")) data.put("error", runtime.get("error"));
        return data;
    }

    public Map<String, Object> answerResponse(String question, String lectureId, List<Map<String, Object>> sources, Map<String, Object> runtime) {
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
        return data;
    }

    public Map<String, Object> summaryResponse(String lectureId, String style, String language, Map<String, Object> runtime) {
        Map<String, Object> data = new HashMap<>();
        data.put("lecture_id", lectureId);
        data.put("content", runtime.getOrDefault("text", "Spring 백엔드에서 생성한 강의 요약입니다."));
        data.put("style", style);
        data.put("language", language);
        data.put("provider", runtime.getOrDefault("provider", "demo"));
        data.put("model", runtime.getOrDefault("model", "demo-summary-v1"));
        data.put("live", runtime.getOrDefault("live", false));
        if (runtime.containsKey("error")) data.put("error", runtime.get("error"));
        return data;
    }

    public Map<String, Object> quizResponse(String lectureId, Map<String, Object> runtime) {
        Map<String, Object> data = new HashMap<>();
        data.put("lecture_id", lectureId);
        data.put("questions", List.of(Map.of("id", "q-1", "question", String.valueOf(runtime.getOrDefault("text", "Spring Boot의 장점은?")), "answer", "AI 생성 답안")));
        data.put("provider", runtime.getOrDefault("provider", "demo"));
        data.put("model", runtime.getOrDefault("model", "demo-quiz-v1"));
        data.put("live", runtime.getOrDefault("live", false));
        if (runtime.containsKey("error")) data.put("error", runtime.get("error"));
        return data;
    }
}
