package com.myway.backendspring.feature;

import com.myway.backendspring.feature.admin.AdminAssignmentService;
import com.myway.backendspring.feature.course.CustomCourseService;
import com.myway.backendspring.feature.shortform.ShortformService;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Component
public class FeatureStoreDomainOpsSupport {
    public Map<String, Object> createShortformExtraction(ShortformService shortformService, String userId, Map<String, Object> payload) {
        return shortformService == null ? Map.of() : shortformService.createShortformExtraction(userId, payload);
    }

    public Map<String, Object> getShortformExtraction(ShortformService shortformService, String id) {
        return shortformService == null ? null : shortformService.getShortformExtraction(id);
    }

    public Map<String, Object> selectShortformCandidates(ShortformService shortformService, String extractionId, List<String> candidateIds) {
        return shortformService == null ? null : shortformService.selectShortformCandidates(extractionId, candidateIds);
    }

    public Map<String, Object> composeShortform(ShortformService shortformService, String userId, Map<String, Object> payload) {
        return shortformService == null ? Map.of() : shortformService.composeShortform(userId, payload);
    }

    public Map<String, Object> shortformVideo(ShortformService shortformService, String id) {
        return shortformService == null ? null : shortformService.shortformVideo(id);
    }

    public List<Map<String, Object>> shortformVideos(ShortformService shortformService, String userId) {
        return shortformService == null ? List.of() : shortformService.shortformVideos(userId);
    }

    public Map<String, Object> shareShortform(ShortformService shortformService, String userId, Map<String, Object> payload) {
        return shortformService == null ? null : shortformService.shareShortform(userId, payload);
    }

    public Map<String, Object> saveShortform(ShortformService shortformService, String userId, Map<String, Object> payload) {
        return shortformService == null ? null : shortformService.saveShortform(userId, payload);
    }

    public Map<String, Object> toggleShortformLike(ShortformService shortformService, String userId, String videoId) {
        return shortformService == null ? null : shortformService.toggleShortformLike(userId, videoId);
    }

    public Map<String, Object> retryShortformExport(ShortformService shortformService, String userId, String shortformId) {
        return shortformService == null ? null : shortformService.retryShortformExport(userId, shortformId);
    }

    public Map<String, Object> applyShortformExportCallback(ShortformService shortformService, String shortformId, String status, long eventVersion, String videoUrl, String errorMessage) {
        return shortformService == null ? null : shortformService.applyShortformExportCallback(shortformId, status, eventVersion, videoUrl, errorMessage);
    }

    public List<Map<String, Object>> shortformLibrary(ShortformService shortformService, String userId) {
        return shortformService == null ? List.of() : shortformService.shortformLibrary(userId);
    }

    public List<Map<String, Object>> shortformCommunity(ShortformService shortformService, String courseId) {
        return shortformService == null ? List.of() : shortformService.shortformCommunity(courseId);
    }

    public Map<String, Object> customCompose(CustomCourseService customCourseService, String userId, Map<String, Object> payload) {
        return customCourseService == null ? Map.of() : customCourseService.customCompose(userId, payload);
    }

    public List<Map<String, Object>> myCustomCourses(CustomCourseService customCourseService, String userId) {
        return customCourseService == null ? List.of() : customCourseService.myCustomCourses(userId);
    }

    public Map<String, Object> customCourse(CustomCourseService customCourseService, String id) {
        return customCourseService == null ? null : customCourseService.customCourse(id);
    }

    public List<Map<String, Object>> communityCustomCourses(CustomCourseService customCourseService, String courseId) {
        return customCourseService == null ? List.of() : customCourseService.communityCustomCourses(courseId);
    }

    public Map<String, Object> getAdminAssignment(AdminAssignmentService adminAssignmentService, String courseId) {
        return adminAssignmentService == null
                ? Map.of("course_id", courseId, "student_ids", List.of(), "updated_at", Instant.now().toString())
                : adminAssignmentService.getAdminAssignment(courseId);
    }

    public Map<String, Object> saveAdminAssignment(AdminAssignmentService adminAssignmentService, String actorUserId, String courseId, List<String> studentIds) {
        return adminAssignmentService == null ? Map.of() : adminAssignmentService.saveAdminAssignment(actorUserId, courseId, studentIds);
    }
}
