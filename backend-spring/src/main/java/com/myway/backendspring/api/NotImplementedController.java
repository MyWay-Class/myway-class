package com.myway.backendspring.api;

import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.domain.CourseCard;
import com.myway.backendspring.domain.CourseDetail;
import com.myway.backendspring.domain.DemoLearningService;
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

    public NotImplementedController(DemoLearningService learningService, SessionService sessionService) {
        this.learningService = learningService;
        this.sessionService = sessionService;
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

    @GetMapping("/legacy/mappings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyMappings() {
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "status", "migration_in_progress",
                "mappings", List.of(
                        Map.of("legacy", "/api/v1/legacy/courses", "replacement", "/api/v1/courses", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/courses/{courseId}", "replacement", "/api/v1/courses/{courseId}", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/courses/{courseId}/lectures", "replacement", "/api/v1/courses/{courseId}/lectures", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/ai/*", "replacement", "/api/v1/ai/*"),
                        Map.of("legacy", "/api/v1/legacy/media/*", "replacement", "/api/v1/media/*"),
                        Map.of("legacy", "/api/v1/legacy/shortform/*", "replacement", "/api/v1/shortform/*")
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
