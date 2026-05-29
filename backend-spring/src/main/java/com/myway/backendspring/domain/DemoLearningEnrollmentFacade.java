package com.myway.backendspring.domain;

import com.myway.backendspring.persistence.FeatureJdbcStore;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.BiFunction;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.function.Supplier;

@Service
public class DemoLearningEnrollmentFacade {

    public EnrollmentItem enroll(
            String userId,
            String courseId,
            boolean useStore,
            FeatureJdbcStore store,
            String enrollmentScope,
            LearningEnrollmentStoreSupport learningEnrollmentStoreSupport,
            List<EnrollmentItem> enrollments,
            BiFunction<String, String, EnrollmentItem> findEnrollment,
            Consumer<EnrollmentItem> onEnrollmentCreated
    ) {
        EnrollmentItem existing = findEnrollment.apply(userId, courseId);
        if (existing != null) return existing;
        EnrollmentItem item = new EnrollmentItem(UUID.randomUUID().toString(), userId, courseId);
        if (useStore) {
            learningEnrollmentStoreSupport.upsertEnrollment(store, enrollmentScope, item);
        } else {
            enrollments.add(item);
        }
        onEnrollmentCreated.accept(item);
        return item;
    }

    public List<EnrollmentItem> listEnrollments(
            String userId,
            boolean useStore,
            FeatureJdbcStore store,
            String enrollmentScope,
            List<EnrollmentItem> enrollments,
            LearningEnrollmentStoreSupport learningEnrollmentStoreSupport
    ) {
        if (!useStore) return enrollments.stream().filter(e -> e.user_id().equals(userId)).toList();
        return learningEnrollmentStoreSupport.listEnrollments(store, enrollmentScope, userId);
    }

    public Map<String, Object> completeLecture(
            String userId,
            String lectureId,
            Function<String, LectureItem> getLecture,
            BiFunction<String, String, EnrollmentItem> findEnrollment,
            boolean useStore,
            FeatureJdbcStore store,
            String lectureCompletionScope,
            LearningEnrollmentStoreSupport learningEnrollmentStoreSupport,
            Set<String> completedLectureKeys,
            Function<String, List<LectureItem>> getCourseLectures,
            Function<String, Set<String>> listCompletedLectureIds,
            LearningProgressCalculator progressCalculator,
            Consumer<Map<String, Object>> onCompletionAppendedActivity
    ) {
        LectureItem lecture = getLecture.apply(lectureId);
        if (lecture == null) return null;
        if (findEnrollment.apply(userId, lecture.course_id()) == null) return Map.of("reason", "enrollment_required");

        if (useStore) {
            learningEnrollmentStoreSupport.upsertLectureCompletion(
                    store,
                    lectureCompletionScope,
                    userId,
                    lectureId,
                    lecture.course_id()
            );
        } else {
            completedLectureKeys.add(learningEnrollmentStoreSupport.completionKey(userId, lectureId));
        }

        List<LectureItem> lectures = getCourseLectures.apply(lecture.course_id());
        Set<String> completedLectureIds = listCompletedLectureIds.apply(userId);
        Map<String, Object> summary = progressCalculator.completionSummary(
                lectureId,
                lecture.course_id(),
                lectures,
                completedLectureIds
        );
        onCompletionAppendedActivity.accept(summary);
        return summary;
    }
}
