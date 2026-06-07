package com.myway.backendspring.domain.learning.model;

public record LectureItem(
        String id,
        String course_id,
        String title,
        int duration_minutes,
        String content_text,
        String transcript_excerpt,
        String instructor_name
) {
    public LectureItem(String id, String course_id, String title, int duration_minutes) {
        this(id, course_id, title, duration_minutes, "", "", "");
    }
}
