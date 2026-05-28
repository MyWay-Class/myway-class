package com.myway.backendspring.domain;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;

@Component
public class DemoLearningDashboardSupport {
    public List<CourseCard> listCourseCards(
            String userId,
            List<CourseDetail> courses,
            ProgressPercentResolver progressPercentResolver
    ) {
        return courses.stream()
                .map(course -> new CourseCard(
                        course.id(),
                        course.title(),
                        course.instructor_id(),
                        progressPercentResolver.resolve(userId, course.id())
                ))
                .toList();
    }

    public List<CourseCard> listManagedCourseCards(
            String userId,
            String role,
            List<CourseDetail> courses,
            ProgressPercentResolver progressPercentResolver
    ) {
        return courses.stream()
                .filter(course -> "admin".equals(role) || course.instructor_id().equals(userId))
                .map(course -> new CourseCard(
                        course.id(),
                        course.title(),
                        course.instructor_id(),
                        progressPercentResolver.resolve(userId, course.id())
                ))
                .toList();
    }

    public DashboardView buildDashboard(
            String userId,
            List<CourseCard> cards,
            List<EnrollmentItem> enrollments,
            Set<String> completedLectureIds
    ) {
        return new DashboardView(cards, enrollments.size(), completedLectureIds.size());
    }

    @FunctionalInterface
    public interface ProgressPercentResolver {
        int resolve(String userId, String courseId);
    }
}
