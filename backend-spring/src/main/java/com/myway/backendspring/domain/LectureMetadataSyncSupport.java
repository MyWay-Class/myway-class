package com.myway.backendspring.domain;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class LectureMetadataSyncSupport {
    public boolean isLectureMetaMissing(Map<String, Object> meta) {
        if (meta == null) return true;
        return asText(meta.get("content_text")).isBlank()
                && asText(meta.get("transcript_excerpt")).isBlank()
                && asText(meta.get("instructor_name")).isBlank();
    }

    public Map<String, Object> buildLectureMetaFromTranscript(
            LectureItem lecture,
            Map<String, Object> transcript,
            Map<String, Object> speakerReview
    ) {
        String lectureId = lecture == null ? "" : lecture.id();
        String fullText = asText(transcript.get("full_text"));
        if (fullText.isBlank()) {
            fullText = textFromSegments(transcript.get("segments"));
        }

        String instructorName = asText(speakerReview == null ? null : speakerReview.get("instructor_name"));
        if (instructorName.isBlank()) {
            instructorName = asText(lecture == null ? null : lecture.instructor_name());
        }
        String excerpt = trimToLimit(fullText, 180);
        String content = trimToLimit(fullText, 1200);
        Map<String, Object> meta = new HashMap<>();
        meta.put("lecture_id", lectureId);
        meta.put("content_text", content);
        meta.put("transcript_excerpt", excerpt);
        meta.put("instructor_name", instructorName);
        meta.put("updated_at", Instant.now().toString());
        return meta;
    }

    public Map<String, Object> mergeLectureMeta(Map<String, Object> current, Map<String, Object> suggested, boolean overwriteExisting) {
        Map<String, Object> merged = new HashMap<>();
        if (current != null) {
            merged.putAll(current);
        }
        for (String field : List.of("lecture_id", "updated_at")) {
            if (suggested.containsKey(field)) {
                merged.put(field, suggested.get(field));
            }
        }
        for (String field : List.of("content_text", "transcript_excerpt", "instructor_name")) {
            String currentText = asText(merged.get(field));
            String nextText = asText(suggested.get(field));
            if ((overwriteExisting || currentText.isBlank()) && !nextText.isBlank()) {
                merged.put(field, nextText);
            }
        }
        merged.put("updated_at", Instant.now().toString());
        return merged;
    }

    public String chooseText(String first, String second, String fallback) {
        String a = asText(first);
        if (!a.isBlank()) return a;
        String b = asText(second);
        if (!b.isBlank()) return b;
        return fallback == null ? "" : fallback;
    }

    public String asText(Object value) {
        if (value == null) return "";
        return String.valueOf(value).trim();
    }

    private String trimToLimit(String value, int limit) {
        String normalized = asText(value);
        if (normalized.length() <= limit) {
            return normalized;
        }
        return normalized.substring(0, limit).trim();
    }

    private String textFromSegments(Object segmentsRaw) {
        if (!(segmentsRaw instanceof List<?> segments)) {
            return "";
        }
        StringBuilder builder = new StringBuilder();
        for (Object segment : segments) {
            if (!(segment instanceof Map<?, ?> map)) continue;
            Object textRaw = map.containsKey("text") ? map.get("text") : "";
            String text = String.valueOf(textRaw).trim();
            if (!text.isBlank()) {
                if (!builder.isEmpty()) builder.append(' ');
                builder.append(text);
            }
        }
        return builder.toString();
    }
}
