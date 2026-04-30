package com.myway.backendspring.domain;

public record DashboardView(java.util.List<CourseCard> courses, int enrolled_count, int completed_lectures) {}
