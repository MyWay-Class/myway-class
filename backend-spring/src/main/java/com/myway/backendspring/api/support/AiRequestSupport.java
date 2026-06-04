package com.myway.backendspring.api.support;

import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.domain.DemoLearningService;
import com.myway.backendspring.feature.FeatureStoreRagFacade;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class AiRequestSupport {
    public record RagScope(String lectureId, String courseId) {}

    private final FeatureStoreRagFacade ragFacade;
    private final DemoLearningService learningService;

    public AiRequestSupport(FeatureStoreRagFacade ragFacade, DemoLearningService learningService) {
        this.ragFacade = ragFacade;
        this.learningService = learningService;
    }

    public ResponseEntity<ApiResponse<Map<String, Object>>> validateLecture(String lectureIdRaw) {
        String lectureId = lectureIdRaw == null ? "" : lectureIdRaw.trim();
        if (!lectureId.isBlank() && learningService.getLecture(lectureId) == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("LECTURE_NOT_FOUND", "강의를 찾을 수 없습니다."));
        }
        return null;
    }

    public RagScope resolveRagScope(String lectureIdRaw, String courseIdRaw) {
        return new RagScope(normalize(lectureIdRaw), normalize(courseIdRaw));
    }

    public ResponseEntity<ApiResponse<Map<String, Object>>> validateRagScope(RagScope scope) {
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

    public String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    public String optionalNormalized(String value) {
        String normalized = normalize(value);
        return normalized.isBlank() ? null : normalized;
    }

    public String defaultIfBlank(String value, String fallback) {
        String normalized = normalize(value);
        return normalized.isBlank() ? fallback : normalized;
    }

    public String requireLectureId(String lectureIdRaw) {
        String lectureId = normalize(lectureIdRaw);
        return lectureId.isBlank() ? null : lectureId;
    }

    public List<Map<String, Object>> resolveRagSources(String query, String lectureId, String courseId, int limit) {
        return resolveRagSources(query, lectureId, courseId, limit, List.of());
    }

    public List<Map<String, Object>> resolveRagSources(String query, String lectureId, String courseId, int limit, List<Map<String, Object>> entities) {
        try {
            Map<String, Object> rag = ragFacade.ragOverview(query, lectureId, courseId, limit, 0.0, false, entities);
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
