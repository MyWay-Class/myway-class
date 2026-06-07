package com.myway.backendspring.domain;

import com.myway.backendspring.persistence.FeatureJdbcStore;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class LearningEnrollmentStoreSupport {
    public EnrollmentItem findEnrollment(FeatureJdbcStore store, String scope, String userId, String courseId) {
        Map<String, Object> found = store.getKv(scope, enrollmentKey(userId, courseId));
        if (found == null) return null;
        return new EnrollmentItem(
                String.valueOf(found.getOrDefault("id", "")),
                String.valueOf(found.getOrDefault("user_id", "")),
                String.valueOf(found.getOrDefault("course_id", ""))
        );
    }

    public List<EnrollmentItem> listEnrollments(FeatureJdbcStore store, String scope, String userId) {
        return store.listKvByScope(scope).stream()
                .filter(item -> userId.equals(String.valueOf(item.getOrDefault("user_id", ""))))
                .map(item -> new EnrollmentItem(
                        String.valueOf(item.getOrDefault("id", "")),
                        String.valueOf(item.getOrDefault("user_id", "")),
                        String.valueOf(item.getOrDefault("course_id", ""))
                ))
                .filter(item -> !item.id().isBlank() && !item.course_id().isBlank())
                .toList();
    }

    public void upsertEnrollment(FeatureJdbcStore store, String scope, EnrollmentItem item) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", item.id());
        payload.put("user_id", item.user_id());
        payload.put("course_id", item.course_id());
        payload.put("created_at", java.time.Instant.now().toString());
        store.upsertKv(scope, enrollmentKey(item.user_id(), item.course_id()), payload);
    }

    public Set<String> listCompletedLectureIds(FeatureJdbcStore store, String scope, String userId) {
        return store.listKvByScope(scope).stream()
                .filter(item -> userId.equals(String.valueOf(item.getOrDefault("user_id", ""))))
                .map(item -> String.valueOf(item.getOrDefault("lecture_id", "")))
                .filter(lectureId -> !lectureId.isBlank())
                .collect(Collectors.toSet());
    }

    public void upsertLectureCompletion(FeatureJdbcStore store, String scope, String userId, String lectureId, String courseId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", completionKey(userId, lectureId));
        payload.put("user_id", userId);
        payload.put("lecture_id", lectureId);
        payload.put("course_id", courseId);
        payload.put("completed_at", java.time.Instant.now().toString());
        store.upsertKv(scope, completionKey(userId, lectureId), payload);
    }

    public void ensureDefaultEnrollment(FeatureJdbcStore store, String scope, String userId, String courseId) {
        if (findEnrollment(store, scope, userId, courseId) != null) return;
        upsertEnrollment(store, scope, new EnrollmentItem(UUID.randomUUID().toString(), userId, courseId));
    }

    public String enrollmentKey(String userId, String courseId) {
        return userId + ":" + courseId;
    }

    public String completionKey(String userId, String lectureId) {
        return userId + ":" + lectureId;
    }
}
