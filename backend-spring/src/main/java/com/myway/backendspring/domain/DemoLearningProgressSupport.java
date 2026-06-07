package com.myway.backendspring.domain;

import com.myway.backendspring.persistence.FeatureJdbcStore;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class DemoLearningProgressSupport {

    int progressPercent(
            String userId,
            String courseId,
            List<LectureItem> lectures,
            Set<String> completedLectureKeys,
            boolean useStore,
            FeatureJdbcStore store,
            LearningEnrollmentStoreSupport learningEnrollmentStoreSupport,
            LearningProgressCalculator progressCalculator,
            String lectureCompletionScope
    ) {
        Set<String> completedLectureIds = listCompletedLectureIds(
                userId,
                completedLectureKeys,
                useStore,
                store,
                learningEnrollmentStoreSupport,
                lectureCompletionScope
        );
        return progressCalculator.progressPercent(lectures, completedLectureIds);
    }

    EnrollmentItem findEnrollment(
            String userId,
            String courseId,
            List<EnrollmentItem> enrollments,
            boolean useStore,
            FeatureJdbcStore store,
            LearningEnrollmentStoreSupport learningEnrollmentStoreSupport,
            String enrollmentScope
    ) {
        if (!useStore) {
            return enrollments.stream()
                    .filter(e -> e.user_id().equals(userId) && e.course_id().equals(courseId))
                    .findFirst()
                    .orElse(null);
        }
        return learningEnrollmentStoreSupport.findEnrollment(store, enrollmentScope, userId, courseId);
    }

    Set<String> listCompletedLectureIds(
            String userId,
            Set<String> completedLectureKeys,
            boolean useStore,
            FeatureJdbcStore store,
            LearningEnrollmentStoreSupport learningEnrollmentStoreSupport,
            String lectureCompletionScope
    ) {
        if (!useStore) {
            return completedLectureKeys.stream()
                    .filter(key -> key.startsWith(userId + ":"))
                    .map(key -> key.substring((userId + ":").length()))
                    .collect(Collectors.toSet());
        }
        return learningEnrollmentStoreSupport.listCompletedLectureIds(store, lectureCompletionScope, userId);
    }

    String completionKey(String userId, String lectureId, LearningEnrollmentStoreSupport learningEnrollmentStoreSupport) {
        return learningEnrollmentStoreSupport.completionKey(userId, lectureId);
    }
}
