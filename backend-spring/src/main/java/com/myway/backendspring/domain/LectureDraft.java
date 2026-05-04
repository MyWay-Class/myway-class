package com.myway.backendspring.domain;

public record LectureDraft(
        String id,
        String course_id,
        String lecture_id,
        String title,
        String content,
        String status
) {}
