package com.myway.backendspring.domain;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.function.Supplier;

@Component
public class DemoLearningLectureQuerySupport {

    public LectureItem getLecture(String lectureId, Supplier<List<CourseDetail>> coursesSupplier) {
        return coursesSupplier.get().stream()
                .flatMap(course -> course.lectures().stream())
                .filter(lecture -> lecture.id().equals(lectureId))
                .findFirst()
                .orElse(null);
    }

    public LectureItem getCourseLecture(String courseId, String lectureId, Supplier<List<LectureItem>> courseLecturesSupplier) {
        return courseLecturesSupplier.get().stream()
                .filter(lecture -> lecture.id().equals(lectureId))
                .findFirst()
                .orElse(null);
    }

    public List<LectureItem> listAllLectures(Supplier<List<CourseDetail>> coursesSupplier) {
        return coursesSupplier.get().stream()
                .flatMap(course -> course.lectures().stream())
                .toList();
    }
}
