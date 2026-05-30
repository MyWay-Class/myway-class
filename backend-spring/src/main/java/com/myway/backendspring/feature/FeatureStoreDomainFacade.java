package com.myway.backendspring.feature;

import com.myway.backendspring.feature.admin.AdminAssignmentService;
import com.myway.backendspring.feature.course.CustomCourseService;
import com.myway.backendspring.feature.shortform.ShortformService;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class FeatureStoreDomainFacade {
    private final FeatureStoreDomainOpsSupport domainOpsSupport;
    private final ShortformService shortformService;
    private final CustomCourseService customCourseService;
    private final AdminAssignmentService adminAssignmentService;

    public FeatureStoreDomainFacade(
            FeatureStoreDomainOpsSupport domainOpsSupport,
            ShortformService shortformService,
            CustomCourseService customCourseService,
            AdminAssignmentService adminAssignmentService
    ) {
        this.domainOpsSupport = domainOpsSupport;
        this.shortformService = shortformService;
        this.customCourseService = customCourseService;
        this.adminAssignmentService = adminAssignmentService;
    }

    public Map<String, Object> createShortformExtraction(String userId, Map<String, Object> payload) {
        return domainOpsSupport.createShortformExtraction(shortformService, userId, payload);
    }

    public Map<String, Object> getShortformExtraction(String id) {
        return domainOpsSupport.getShortformExtraction(shortformService, id);
    }

    public Map<String, Object> selectShortformCandidates(String extractionId, List<String> candidateIds) {
        return domainOpsSupport.selectShortformCandidates(shortformService, extractionId, candidateIds);
    }

    public Map<String, Object> composeShortform(String userId, Map<String, Object> payload) {
        return domainOpsSupport.composeShortform(shortformService, userId, payload);
    }

    public Map<String, Object> shortformVideo(String id) {
        return domainOpsSupport.shortformVideo(shortformService, id);
    }

    public List<Map<String, Object>> shortformVideos(String userId) {
        return domainOpsSupport.shortformVideos(shortformService, userId);
    }

    public Map<String, Object> shareShortform(String userId, Map<String, Object> payload) {
        return domainOpsSupport.shareShortform(shortformService, userId, payload);
    }

    public Map<String, Object> saveShortform(String userId, Map<String, Object> payload) {
        return domainOpsSupport.saveShortform(shortformService, userId, payload);
    }

    public Map<String, Object> toggleShortformLike(String userId, String videoId) {
        return domainOpsSupport.toggleShortformLike(shortformService, userId, videoId);
    }

    public Map<String, Object> retryShortformExport(String userId, String shortformId) {
        return domainOpsSupport.retryShortformExport(shortformService, userId, shortformId);
    }

    public Map<String, Object> applyShortformExportCallback(String shortformId, String status, long eventVersion, String videoUrl, String errorMessage) {
        return domainOpsSupport.applyShortformExportCallback(shortformService, shortformId, status, eventVersion, videoUrl, errorMessage);
    }

    public List<Map<String, Object>> shortformLibrary(String userId) {
        return domainOpsSupport.shortformLibrary(shortformService, userId);
    }

    public List<Map<String, Object>> shortformCommunity(String courseId) {
        return domainOpsSupport.shortformCommunity(shortformService, courseId);
    }

    public Map<String, Object> customCompose(String userId, Map<String, Object> payload) {
        return domainOpsSupport.customCompose(customCourseService, userId, payload);
    }

    public List<Map<String, Object>> myCustomCourses(String userId) {
        return domainOpsSupport.myCustomCourses(customCourseService, userId);
    }

    public Map<String, Object> customCourse(String id) {
        return domainOpsSupport.customCourse(customCourseService, id);
    }

    public List<Map<String, Object>> communityCustomCourses(String courseId) {
        return domainOpsSupport.communityCustomCourses(customCourseService, courseId);
    }

    public Map<String, Object> getAdminAssignment(String courseId) {
        return domainOpsSupport.getAdminAssignment(adminAssignmentService, courseId);
    }

    public Map<String, Object> saveAdminAssignment(String actorUserId, String courseId, List<String> studentIds) {
        return domainOpsSupport.saveAdminAssignment(adminAssignmentService, actorUserId, courseId, studentIds);
    }
}
