package com.myway.backendspring.api;

import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.auth.SessionView;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.domain.DemoLearningService;
import com.myway.backendspring.domain.LectureItem;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/lectures")
public class LecturesController {
    private final SessionService sessionService;
    private final DemoLearningService learningService;

    public LecturesController(SessionService sessionService, DemoLearningService learningService) {
        this.sessionService = sessionService;
        this.learningService = learningService;
    }

    @GetMapping("/{lectureId}")
    public ResponseEntity<ApiResponse<LectureItem>> detail(@PathVariable String lectureId) {
        LectureItem detail = learningService.getLecture(lectureId);
        if (detail == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("LECTURE_NOT_FOUND", "강의를 찾을 수 없습니다."));
        }
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    @PostMapping("/{lectureId}/complete")
    public ResponseEntity<ApiResponse<Map<String, Object>>> complete(@PathVariable String lectureId, @RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView session = sessionService.me(auth);
        if (session == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        }

        Map<String, Object> result = learningService.completeLecture(session.user().id(), lectureId);
        if (result == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("LECTURE_NOT_FOUND", "강의를 찾을 수 없습니다."));
        }
        if ("enrollment_required".equals(result.get("reason"))) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.failure("ENROLLMENT_REQUIRED", "수강 신청 후에 진도를 저장할 수 있습니다."));
        }

        return ResponseEntity.ok(ApiResponse.success(result, "강의 진도가 저장되었습니다."));
    }
}
