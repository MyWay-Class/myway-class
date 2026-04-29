package com.myway.backendspring.api;

import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.auth.SessionView;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/enrollments")
public class EnrollmentsController {
    private final SessionService sessionService;
    private final DemoLearningService learningService;

    public EnrollmentsController(SessionService sessionService, DemoLearningService learningService) {
        this.sessionService = sessionService;
        this.learningService = learningService;
    }

    public record EnrollmentRequest(String courseId) {}

    @GetMapping
    public ResponseEntity<ApiResponse<List<EnrollmentItem>>> list(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView session = sessionService.me(auth);
        if (session == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        }
        return ResponseEntity.ok(ApiResponse.success(learningService.listEnrollments(session.user().id())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> enroll(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody EnrollmentRequest body) {
        SessionView session = sessionService.me(auth);
        if (session == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        }

        if (body == null || body.courseId() == null || body.courseId().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("COURSE_ID_REQUIRED", "강의 식별자가 필요합니다."));
        }

        CourseDetail course = learningService.getCourseDetail(body.courseId().trim(), session.user().id());
        if (course == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("COURSE_NOT_FOUND", "강의를 찾을 수 없습니다."));
        }

        EnrollmentItem enrollment = learningService.enroll(session.user().id(), body.courseId().trim());
        return ResponseEntity.ok(ApiResponse.success(Map.of("enrollmentId", enrollment.id(), "course", course), "수강 신청이 완료되었습니다."));
    }
}
