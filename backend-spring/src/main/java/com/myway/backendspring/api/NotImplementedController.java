package com.myway.backendspring.api;

import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.domain.CourseCard;
import com.myway.backendspring.domain.CourseDetail;
import com.myway.backendspring.domain.DemoLearningService;
import com.myway.backendspring.domain.EnrollmentItem;
import com.myway.backendspring.domain.LectureItem;
import com.myway.backendspring.feature.FeatureStoreService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class NotImplementedController {
    private final DemoLearningService learningService;
    private final SessionService sessionService;
    private final FeatureStoreService featureStore;

    public NotImplementedController(DemoLearningService learningService, SessionService sessionService, FeatureStoreService featureStore) {
        this.learningService = learningService;
        this.sessionService = sessionService;
        this.featureStore = featureStore;
    }

    @GetMapping("/legacy/courses")
    public ResponseEntity<ApiResponse<List<CourseCard>>> legacyCourses(@RequestHeader(value = "Authorization", required = false) String auth) {
        String userId = sessionService.me(auth) != null ? sessionService.me(auth).user().id() : "guest";
        return ResponseEntity.ok(ApiResponse.success(learningService.listCourseCards(userId), "legacy courses 응답을 /api/v1/courses와 동일하게 반환했습니다."));
    }

    @GetMapping("/legacy/courses/{courseId}")
    public ResponseEntity<ApiResponse<CourseDetail>> legacyCourseDetail(
            @PathVariable String courseId,
            @RequestHeader(value = "Authorization", required = false) String auth
    ) {
        String userId = sessionService.me(auth) != null ? sessionService.me(auth).user().id() : "guest";
        CourseDetail detail = learningService.getCourseDetail(courseId, userId);
        if (detail == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.failure("COURSE_NOT_FOUND", "강의를 찾을 수 없습니다."));
        }
        return ResponseEntity.ok(ApiResponse.success(detail, "legacy course detail 응답을 /api/v1/courses/{courseId}와 동일하게 반환했습니다."));
    }

    @GetMapping("/legacy/courses/{courseId}/lectures")
    public ResponseEntity<ApiResponse<List<LectureItem>>> legacyCourseLectures(@PathVariable String courseId) {
        List<LectureItem> lectures = learningService.getCourseLectures(courseId);
        if (lectures.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.failure("COURSE_NOT_FOUND", "강의를 찾을 수 없습니다."));
        }
        return ResponseEntity.ok(ApiResponse.success(lectures, "legacy course lectures 응답을 /api/v1/courses/{courseId}/lectures와 동일하게 반환했습니다."));
    }

    @GetMapping("/legacy/ai/settings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyAiSettings(@RequestHeader(value = "Authorization", required = false) String auth) {
        if (sessionService.me(auth) == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        }
        String userId = sessionService.me(auth).user().id();
        return ResponseEntity.ok(ApiResponse.success(featureStore.aiSettings(userId), "legacy ai settings 응답을 /api/v1/ai/settings와 동일하게 반환했습니다."));
    }

    @GetMapping("/legacy/ai/providers")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyAiProviders(@RequestHeader(value = "Authorization", required = false) String auth) {
        if (sessionService.me(auth) == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        }
        String userId = sessionService.me(auth).user().id();
        return ResponseEntity.ok(ApiResponse.success(featureStore.aiProviders(userId), "legacy ai providers 응답을 /api/v1/ai/providers와 동일하게 반환했습니다."));
    }

    @GetMapping("/legacy/ai/insights")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyAiInsights(@RequestHeader(value = "Authorization", required = false) String auth) {
        if (sessionService.me(auth) == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        }
        String userId = sessionService.me(auth).user().id();
        return ResponseEntity.ok(ApiResponse.success(featureStore.aiInsights(userId), "legacy ai insights 응답을 /api/v1/ai/insights와 동일하게 반환했습니다."));
    }

    @GetMapping("/legacy/ai/recommendations")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyAiRecommendations(@RequestHeader(value = "Authorization", required = false) String auth) {
        if (sessionService.me(auth) == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        }
        String userId = sessionService.me(auth).user().id();
        return ResponseEntity.ok(ApiResponse.success(featureStore.aiRecommendations(userId), "legacy ai recommendations 응답을 /api/v1/ai/recommendations와 동일하게 반환했습니다."));
    }

    @GetMapping("/legacy/ai/logs")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyAiLogs(@RequestHeader(value = "Authorization", required = false) String auth) {
        if (sessionService.me(auth) == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        }
        String userId = sessionService.me(auth).user().id();
        return ResponseEntity.ok(ApiResponse.success(featureStore.aiLogs(userId), "legacy ai logs 응답을 /api/v1/ai/logs와 동일하게 반환했습니다."));
    }

    @GetMapping("/legacy/media/providers")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyMediaProviders(@RequestHeader(value = "Authorization", required = false) String auth) {
        if (sessionService.me(auth) == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        }
        return ResponseEntity.ok(ApiResponse.success(featureStore.sttProviders(), "legacy media providers 응답을 /api/v1/media/providers와 동일하게 반환했습니다."));
    }

    @GetMapping("/legacy/media/processor-health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyMediaProcessorHealth(@RequestHeader(value = "Authorization", required = false) String auth) {
        if (sessionService.me(auth) == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        }
        return ResponseEntity.ok(ApiResponse.success(featureStore.processorHealth(), "legacy media processor health 응답을 /api/v1/media/processor-health와 동일하게 반환했습니다."));
    }

    @GetMapping("/legacy/media/pipeline/{lectureId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyMediaPipeline(
            @PathVariable String lectureId,
            @RequestHeader(value = "Authorization", required = false) String auth
    ) {
        if (sessionService.me(auth) == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        }
        return ResponseEntity.ok(ApiResponse.success(featureStore.pipeline(lectureId), "legacy media pipeline 응답을 /api/v1/media/pipeline/{lectureId}와 동일하게 반환했습니다."));
    }

    @GetMapping("/legacy/shortform/library")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> legacyShortformLibrary(@RequestHeader(value = "Authorization", required = false) String auth) {
        if (sessionService.me(auth) == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        }
        String userId = sessionService.me(auth).user().id();
        return ResponseEntity.ok(ApiResponse.success(featureStore.shortformLibrary(userId), "legacy shortform library 응답을 /api/v1/shortform/library와 동일하게 반환했습니다."));
    }

    @GetMapping("/legacy/shortform/community")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> legacyShortformCommunity(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestParam(value = "course_id", required = false) String courseId
    ) {
        if (sessionService.me(auth) == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        }
        return ResponseEntity.ok(ApiResponse.success(featureStore.shortformCommunity(courseId), "legacy shortform community 응답을 /api/v1/shortform/community와 동일하게 반환했습니다."));
    }

    @GetMapping("/legacy/shortform/videos/my")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> legacyShortformVideos(@RequestHeader(value = "Authorization", required = false) String auth) {
        if (sessionService.me(auth) == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        }
        String userId = sessionService.me(auth).user().id();
        return ResponseEntity.ok(ApiResponse.success(featureStore.shortformVideos(userId), "legacy shortform videos 응답을 /api/v1/shortform/videos/my와 동일하게 반환했습니다."));
    }

    @GetMapping("/legacy/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyDashboard(@RequestHeader(value = "Authorization", required = false) String auth) {
        if (sessionService.me(auth) == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        }
        String userId = sessionService.me(auth).user().id();
        var dashboard = learningService.getDashboard(userId);
        Map<String, Object> payload = Map.of(
                "courses", dashboard.courses(),
                "active_enrollments", dashboard.enrolled_count()
        );
        return ResponseEntity.ok(ApiResponse.success(payload, "legacy dashboard 응답을 /api/v1/dashboard의 핵심 필드와 호환되게 반환했습니다."));
    }

    @GetMapping("/legacy/enrollments")
    public ResponseEntity<ApiResponse<List<EnrollmentItem>>> legacyEnrollments(@RequestHeader(value = "Authorization", required = false) String auth) {
        if (sessionService.me(auth) == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        }
        String userId = sessionService.me(auth).user().id();
        return ResponseEntity.ok(ApiResponse.success(learningService.listEnrollments(userId), "legacy enrollments 응답을 /api/v1/enrollments와 동일하게 반환했습니다."));
    }

    @GetMapping("/legacy/mappings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyMappings() {
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "status", "migration_in_progress",
                "mappings", List.of(
                        Map.of("legacy", "/api/v1/legacy/courses", "replacement", "/api/v1/courses", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/courses/{courseId}", "replacement", "/api/v1/courses/{courseId}", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/courses/{courseId}/lectures", "replacement", "/api/v1/courses/{courseId}/lectures", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/ai/settings", "replacement", "/api/v1/ai/settings", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/ai/providers", "replacement", "/api/v1/ai/providers", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/ai/insights", "replacement", "/api/v1/ai/insights", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/ai/recommendations", "replacement", "/api/v1/ai/recommendations", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/ai/logs", "replacement", "/api/v1/ai/logs", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/ai/*", "replacement", "/api/v1/ai/*", "status", "migration_in_progress"),
                        Map.of("legacy", "/api/v1/legacy/media/providers", "replacement", "/api/v1/media/providers", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/media/processor-health", "replacement", "/api/v1/media/processor-health", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/media/pipeline/{lectureId}", "replacement", "/api/v1/media/pipeline/{lectureId}", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/media/*", "replacement", "/api/v1/media/*", "status", "migration_in_progress"),
                        Map.of("legacy", "/api/v1/legacy/shortform/library", "replacement", "/api/v1/shortform/library", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/shortform/community", "replacement", "/api/v1/shortform/community", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/shortform/videos/my", "replacement", "/api/v1/shortform/videos/my", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/shortform/*", "replacement", "/api/v1/shortform/*", "status", "migration_in_progress"),
                        Map.of("legacy", "/api/v1/legacy/dashboard", "replacement", "/api/v1/dashboard", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/enrollments", "replacement", "/api/v1/enrollments", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/dashboard/*", "replacement", "/api/v1/dashboard/*", "status", "migration_in_progress"),
                        Map.of("legacy", "/api/v1/legacy/enrollments/*", "replacement", "/api/v1/enrollments/*", "status", "migration_in_progress")
                )
        ), "legacy API 매핑 정보를 반환했습니다."));
    }

    @GetMapping("/legacy/{domain}")
    public ResponseEntity<ApiResponse<Object>> legacyDomain(@PathVariable String domain) {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
                .body(ApiResponse.failure("NOT_IMPLEMENTED", "legacy/" + domain + " API는 이관 중입니다. /api/v1/legacy/mappings를 확인하세요."));
    }

    @RequestMapping(value = {"/legacy", "/legacy/**"})
    public ResponseEntity<ApiResponse<Object>> notImplemented() {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
                .body(ApiResponse.failure("NOT_IMPLEMENTED", "Spring 백엔드 마이그레이션 중인 API입니다. /api/v1/legacy/mappings를 확인하세요."));
    }
}
