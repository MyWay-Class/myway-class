package com.myway.backendspring.domain;

import com.myway.backendspring.persistence.FeatureJdbcStore;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.function.BiFunction;

@Component
public class DemoLearningBootstrapSupport {
    void ensureDefaultDemoStudentEnrollmentsInMemory(
            String defaultDemoStudentId,
            List<EnrollmentItem> enrollments,
            List<CourseDetail> courses,
            BiFunction<String, String, EnrollmentItem> findEnrollment
    ) {
        for (CourseDetail course : new ArrayList<>(courses)) {
            if (findEnrollment.apply(defaultDemoStudentId, course.id()) == null) {
                enrollments.add(new EnrollmentItem(UUID.randomUUID().toString(), defaultDemoStudentId, course.id()));
            }
        }
    }

    void ensureDefaultDemoStudentEnrollmentsInStore(
            FeatureJdbcStore store,
            String enrollmentScope,
            String defaultDemoStudentId,
            List<CourseDetail> courses,
            LearningEnrollmentStoreSupport learningEnrollmentStoreSupport
    ) {
        for (CourseDetail course : courses) {
            learningEnrollmentStoreSupport.ensureDefaultEnrollment(
                    store,
                    enrollmentScope,
                    defaultDemoStudentId,
                    course.id()
            );
        }
    }
}
