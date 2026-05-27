package com.myway.backendspring.domain;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class LearningPayloadMapper {
    public Map<String, Object> toCoursePayload(CourseDetail detail) {
        List<Map<String, Object>> lectures = detail.lectures().stream()
                .map(l -> {
                    Map<String, Object> row = new HashMap<>();
                    row.put("id", l.id());
                    row.put("course_id", l.course_id());
                    row.put("title", l.title());
                    row.put("duration_minutes", l.duration_minutes());
                    row.put("content_text", l.content_text());
                    row.put("transcript_excerpt", l.transcript_excerpt());
                    row.put("instructor_name", l.instructor_name());
                    return row;
                })
                .toList();
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", detail.id());
        payload.put("title", detail.title());
        payload.put("instructor_id", detail.instructor_id());
        payload.put("lectures", lectures);
        return payload;
    }

    @SuppressWarnings("unchecked")
    public CourseDetail fromCoursePayload(Map<String, Object> payload) {
        if (payload == null) return null;
        String id = String.valueOf(payload.getOrDefault("id", "")).trim();
        if (id.isBlank()) return null;
        String title = String.valueOf(payload.getOrDefault("title", "")).trim();
        String instructorId = String.valueOf(payload.getOrDefault("instructor_id", "")).trim();
        List<LectureItem> lectures = new ArrayList<>();
        Object rawLectures = payload.get("lectures");
        if (rawLectures instanceof List<?> list) {
            for (Object row : list) {
                if (!(row instanceof Map<?, ?> map)) continue;
                String lectureId = String.valueOf(map.containsKey("id") ? map.get("id") : "").trim();
                String courseId = String.valueOf(map.containsKey("course_id") ? map.get("course_id") : id).trim();
                String lectureTitle = String.valueOf(map.containsKey("title") ? map.get("title") : "").trim();
                int duration = parseInt(map.get("duration_minutes"), 0);
                String contentText = String.valueOf(map.containsKey("content_text") ? map.get("content_text") : "").trim();
                String transcriptExcerpt = String.valueOf(map.containsKey("transcript_excerpt") ? map.get("transcript_excerpt") : "").trim();
                String instructorName = String.valueOf(map.containsKey("instructor_name") ? map.get("instructor_name") : "").trim();
                if (!lectureId.isBlank() && !lectureTitle.isBlank()) {
                    lectures.add(new LectureItem(lectureId, courseId, lectureTitle, duration, contentText, transcriptExcerpt, instructorName));
                }
            }
        }
        return new CourseDetail(id, title, instructorId, lectures, 0);
    }

    public Map<String, Object> toMaterialPayload(MaterialItem item) {
        return Map.of(
                "id", item.id(),
                "course_id", item.course_id(),
                "title", item.title(),
                "summary", item.summary(),
                "file_name", item.file_name()
        );
    }

    public MaterialItem fromMaterialPayload(Map<String, Object> payload) {
        if (payload == null) return null;
        String id = String.valueOf(payload.getOrDefault("id", "")).trim();
        String courseId = String.valueOf(payload.getOrDefault("course_id", "")).trim();
        if (id.isBlank() || courseId.isBlank()) return null;
        return new MaterialItem(
                id,
                courseId,
                String.valueOf(payload.getOrDefault("title", "")),
                String.valueOf(payload.getOrDefault("summary", "")),
                String.valueOf(payload.getOrDefault("file_name", ""))
        );
    }

    public Map<String, Object> toNoticePayload(NoticeItem item) {
        return Map.of(
                "id", item.id(),
                "course_id", item.course_id(),
                "title", item.title(),
                "content", item.content(),
                "pinned", item.pinned()
        );
    }

    public NoticeItem fromNoticePayload(Map<String, Object> payload) {
        if (payload == null) return null;
        String id = String.valueOf(payload.getOrDefault("id", "")).trim();
        String courseId = String.valueOf(payload.getOrDefault("course_id", "")).trim();
        if (id.isBlank() || courseId.isBlank()) return null;
        return new NoticeItem(
                id,
                courseId,
                String.valueOf(payload.getOrDefault("title", "")),
                String.valueOf(payload.getOrDefault("content", "")),
                Boolean.parseBoolean(String.valueOf(payload.getOrDefault("pinned", false)))
        );
    }

    private int parseInt(Object value, int fallback) {
        if (value instanceof Number n) return n.intValue();
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (Exception ignored) {
            return fallback;
        }
    }
}
