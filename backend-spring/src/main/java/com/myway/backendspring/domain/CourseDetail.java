package com.myway.backendspring.domain;

public record CourseDetail(String id, String title, String instructor_id, java.util.List<LectureItem> lectures, int progress_percent) {}
