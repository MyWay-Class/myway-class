package com.myway.backendspring.domain;

import com.myway.backendspring.persistence.FeatureJdbcStore;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class DemoLearningCourseWriteSupport {
    public CourseDetail createCourse(
            boolean useStore,
            FeatureJdbcStore store,
            String courseScope,
            LearningPayloadMapper payloadMapper,
            Map<String, CourseDetail> courses,
            String instructorId,
            String title,
            List<String> lectureTitles
    ) {
        String courseId = "crs_" + UUID.randomUUID();
        List<String> titles = lectureTitles == null || lectureTitles.isEmpty() ? List.of(title) : lectureTitles;
        List<LectureItem> lectures = new ArrayList<>();
        for (int i = 0; i < titles.size(); i++) {
            lectures.add(new LectureItem("lec_" + UUID.randomUUID(), courseId, titles.get(i), 25 + (i * 5)));
        }
        CourseDetail detail = new CourseDetail(courseId, title, instructorId, List.copyOf(lectures), 0);
        if (useStore) {
            store.upsertKv(courseScope, courseId, payloadMapper.toCoursePayload(detail));
        } else {
            courses.put(courseId, detail);
        }
        return detail;
    }
}
