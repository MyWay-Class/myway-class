package com.myway.backendspring.domain.learning.model;

import java.util.List;

public record CourseDetail(String id, String title, String instructor_id, List<LectureItem> lectures, int progress_percent) {}
