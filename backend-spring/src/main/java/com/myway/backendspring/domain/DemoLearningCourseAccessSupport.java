package com.myway.backendspring.domain;

import com.myway.backendspring.persistence.FeatureJdbcStore;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class DemoLearningCourseAccessSupport {
    List<CourseDetail> listAllCourses(
            boolean useStore,
            Map<String, CourseDetail> courses,
            FeatureJdbcStore store,
            String courseScope,
            CourseCatalogStoreSupport courseCatalogStoreSupport,
            LearningPayloadMapper learningPayloadMapper
    ) {
        if (!useStore) {
            return new ArrayList<>(courses.values());
        }
        return courseCatalogStoreSupport.listAllCourses(store, courseScope, learningPayloadMapper);
    }

    CourseDetail findCourse(
            boolean useStore,
            Map<String, CourseDetail> courses,
            FeatureJdbcStore store,
            String courseScope,
            String courseId,
            CourseCatalogStoreSupport courseCatalogStoreSupport,
            LearningPayloadMapper learningPayloadMapper
    ) {
        if (!useStore) {
            return courses.get(courseId);
        }
        return courseCatalogStoreSupport.findCourse(store, courseScope, courseId, learningPayloadMapper);
    }
}
