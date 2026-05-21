package com.myway.backendspring.feature.admin;

import com.myway.backendspring.feature.repository.FeatureStoreRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

@Service
public class AdminAssignmentService {
    private static final String ADMIN_ASSIGNMENT_SCOPE = "admin_assignment";

    private final FeatureStoreRepository repository;

    public AdminAssignmentService(FeatureStoreRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> getAdminAssignment(String courseId) {
        Map<String, Object> current = repository.getKv(ADMIN_ASSIGNMENT_SCOPE, courseId);
        if (current != null) {
            return current;
        }
        Map<String, Object> empty = new HashMap<>();
        empty.put("course_id", courseId);
        empty.put("student_ids", List.of());
        empty.put("updated_at", Instant.now().toString());
        return empty;
    }

    public Map<String, Object> saveAdminAssignment(String actorUserId, String courseId, List<String> studentIds) {
        LinkedHashSet<String> deduped = new LinkedHashSet<>();
        if (studentIds != null) {
            for (String studentId : studentIds) {
                if (studentId != null) {
                    String normalized = studentId.trim();
                    if (!normalized.isBlank()) {
                        deduped.add(normalized);
                    }
                }
            }
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put("course_id", courseId);
        payload.put("student_ids", List.copyOf(deduped));
        payload.put("updated_by", actorUserId);
        payload.put("updated_at", Instant.now().toString());
        repository.upsertKv(ADMIN_ASSIGNMENT_SCOPE, courseId, payload);
        return payload;
    }
}
