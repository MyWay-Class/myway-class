package com.myway.backendspring.feature.rag;

import com.myway.backendspring.domain.DemoLearningService;
import com.myway.backendspring.domain.LectureItem;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class RagServiceSupport {
    private final DemoLearningService learningService;

    public RagServiceSupport(DemoLearningService learningService) {
        this.learningService = learningService;
    }

    public List<String> targetLectureIds(String lectureId, String courseId) {
        if (lectureId != null && !lectureId.isBlank()) return List.of(lectureId);
        if (courseId != null && !courseId.isBlank()) {
            return learningService.getCourseLectures(courseId).stream().map(LectureItem::id).toList();
        }
        return learningService.listCourseCards("usr_std_001").stream()
                .flatMap(card -> learningService.getCourseLectures(card.id()).stream())
                .map(LectureItem::id)
                .distinct()
                .toList();
    }

    public String ragIndexKey(String lectureId, String courseId) {
        if (lectureId != null && !lectureId.isBlank()) return "lecture:" + lectureId;
        if (courseId != null && !courseId.isBlank()) return "course:" + courseId;
        return "global:all";
    }

    public String inferIntent(String query) {
        String normalized = normalizeText(query).toLowerCase();
        if (normalized.contains("요약") || normalized.contains("핵심")) return "summary";
        if (normalized.contains("문제") || normalized.contains("시험") || normalized.contains("퀴즈")) return "quiz";
        if (normalized.contains("숏폼") || normalized.contains("복습")) return "shortform";
        return "qa";
    }

    public List<Map<String, Object>> ensureChunkTimestamps(List<Map<String, Object>> chunks) {
        if (chunks == null || chunks.isEmpty()) return List.of();
        List<Map<String, Object>> normalized = new ArrayList<>(chunks.size());
        for (Map<String, Object> chunk : chunks) {
            Map<String, Object> row = new HashMap<>(chunk);
            long start = row.get("start_ms") instanceof Number number ? number.longValue() : 0L;
            long end;
            if (row.get("end_ms") instanceof Number number) {
                end = number.longValue();
            } else {
                String lectureId = normalizeText(String.valueOf(row.getOrDefault("lecture_id", "")));
                LectureItem lecture = lectureId.isBlank() ? null : learningService.getLecture(lectureId);
                end = lecture == null ? 60_000L : Math.max(60_000L, lecture.duration_minutes() * 60_000L);
            }
            if (end < start) {
                end = start + 1_000L;
            }
            row.put("start_ms", start);
            row.put("end_ms", end);
            normalized.add(row);
        }
        return normalized;
    }

    private String normalizeText(String text) {
        if (text == null) return "";
        return text.replaceAll("\\s+", " ").trim();
    }
}
