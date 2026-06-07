package com.myway.backendspring.api;

import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.domain.CourseCard;
import com.myway.backendspring.domain.CourseDetail;
import com.myway.backendspring.domain.DemoLearningService;
import com.myway.backendspring.domain.EnrollmentItem;
import com.myway.backendspring.domain.LectureItem;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class NotImplementedController {
    private final DemoLearningService learningService;
    private final SessionService sessionService;

    public NotImplementedController(
            DemoLearningService learningService,
            SessionService sessionService
    ) {
        this.learningService = learningService;
        this.sessionService = sessionService;
    }

    @GetMapping("/legacy/courses")
    public ResponseEntity<ApiResponse<List<CourseCard>>> legacyCourses(@RequestHeader(value = "Authorization", required = false) String auth) {
        String userId = userIdOrGuest(auth);
        return ResponseEntity.ok(ApiResponse.success(learningService.listCourseCards(userId), "legacy courses 응답을 /api/v1/courses와 동일하게 반환했습니다."));
    }

    @GetMapping("/legacy/courses/{courseId}")
    public ResponseEntity<ApiResponse<CourseDetail>> legacyCourseDetail(
            @PathVariable String courseId,
            @RequestHeader(value = "Authorization", required = false) String auth
    ) {
        String userId = userIdOrGuest(auth);
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

    @GetMapping("/legacy/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyDashboard(@RequestHeader(value = "Authorization", required = false) String auth) {
        String userId = requireUserId(auth);
        if (userId == null) {
            return unauthenticated();
        }
        var dashboard = learningService.getDashboard(userId);
        Map<String, Object> payload = Map.of(
                "courses", dashboard.courses(),
                "active_enrollments", dashboard.enrolled_count()
        );
        return ResponseEntity.ok(ApiResponse.success(payload, "legacy dashboard 응답을 /api/v1/dashboard의 핵심 필드와 호환되게 반환했습니다."));
    }

    @GetMapping("/legacy/enrollments")
    public ResponseEntity<ApiResponse<List<EnrollmentItem>>> legacyEnrollments(@RequestHeader(value = "Authorization", required = false) String auth) {
        String userId = requireUserId(auth);
        if (userId == null) {
            return unauthenticated();
        }
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
                        Map.of("legacy", "/api/v1/legacy/ai/settings(POST|PUT)", "replacement", "/api/v1/ai/settings(POST|PUT)", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/ai/intent", "replacement", "/api/v1/ai/intent", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/ai/search", "replacement", "/api/v1/ai/search", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/ai/answer", "replacement", "/api/v1/ai/answer", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/ai/summary", "replacement", "/api/v1/ai/summary", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/ai/quiz", "replacement", "/api/v1/ai/quiz", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/ai/*", "replacement", "/api/v1/ai/*", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/media/providers", "replacement", "/api/v1/media/providers", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/media/processor-health", "replacement", "/api/v1/media/processor-health", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/media/pipeline/{lectureId}", "replacement", "/api/v1/media/pipeline/{lectureId}", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/media/extract-audio", "replacement", "/api/v1/media/extract-audio", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/media/transcribe", "replacement", "/api/v1/media/transcribe", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/media/summarize", "replacement", "/api/v1/media/summarize", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/media/audio-extractions/{lectureId}", "replacement", "/api/v1/media/audio-extractions/{lectureId}", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/media/transcript/{lectureId}", "replacement", "/api/v1/media/transcript/{lectureId}", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/media/notes/{lectureId}", "replacement", "/api/v1/media/notes/{lectureId}", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/media/extract-audio/callback", "replacement", "/api/v1/media/extract-audio/callback", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/media/upload-video", "replacement", "/api/v1/media/upload-video", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/media/assets/**", "replacement", "/api/v1/media/assets/**", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/media/*", "replacement", "/api/v1/media/*", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/shortform/library", "replacement", "/api/v1/shortform/library", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/shortform/community", "replacement", "/api/v1/shortform/community", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/shortform/videos/my", "replacement", "/api/v1/shortform/videos/my", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/shortform/generate", "replacement", "/api/v1/shortform/generate", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/shortform/candidates/select", "replacement", "/api/v1/shortform/candidates/select", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/shortform/extraction/{id}", "replacement", "/api/v1/shortform/extraction/{id}", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/shortform/compose", "replacement", "/api/v1/shortform/compose", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/shortform/video/{id}", "replacement", "/api/v1/shortform/video/{id}", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/shortform/share", "replacement", "/api/v1/shortform/share", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/shortform/save", "replacement", "/api/v1/shortform/save", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/shortform/like", "replacement", "/api/v1/shortform/like", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/shortform/{shortformId}/export/retry", "replacement", "/api/v1/shortform/{shortformId}/export/retry", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/shortform/*", "replacement", "/api/v1/shortform/*", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/dashboard", "replacement", "/api/v1/dashboard", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/enrollments", "replacement", "/api/v1/enrollments", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/dashboard/*", "replacement", "/api/v1/dashboard/*", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/enrollments/*", "replacement", "/api/v1/enrollments/*", "status", "available")
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

    private String requireUserId(String auth) {
        var session = sessionService.me(auth);
        return session == null ? null : session.user().id();
    }

    private String userIdOrGuest(String auth) {
        String userId = requireUserId(auth);
        return userId == null ? "guest" : userId;
    }

    private <T> ResponseEntity<ApiResponse<T>> unauthenticated() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
    }

}
