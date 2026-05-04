package com.myway.backendspring.api;

import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.auth.SessionView;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.feature.FeatureStoreService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/custom-courses")
public class CustomCoursesController {
    private final SessionService sessionService;
    private final FeatureStoreService featureStore;

    public CustomCoursesController(SessionService sessionService, FeatureStoreService featureStore) {
        this.sessionService = sessionService;
        this.featureStore = featureStore;
    }

    private SessionView require(String auth) { return sessionService.me(auth); }

    @PostMapping("/compose")
    public ResponseEntity<ApiResponse<Map<String, Object>>> compose(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Map<String, Object> body) {
        SessionView s = require(auth);
        if (s == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(featureStore.customCompose(s.user().id(), body), "커스텀 강의가 생성되었습니다."));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> my(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView s = require(auth);
        if (s == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        return ResponseEntity.ok(ApiResponse.success(featureStore.myCustomCourses(s.user().id())));
    }

    @GetMapping("/community")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> community(@RequestHeader(value = "Authorization", required = false) String auth, @RequestParam(value = "course_id", required = false) String courseId) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        return ResponseEntity.ok(ApiResponse.success(featureStore.communityCustomCourses(courseId)));
    }

    @GetMapping("/{customCourseId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> detail(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable String customCourseId) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        Map<String, Object> row = featureStore.customCourse(customCourseId);
        if (row == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("CUSTOM_COURSE_NOT_FOUND", "커스텀 강의를 찾을 수 없습니다."));
        return ResponseEntity.ok(ApiResponse.success(row));
    }

    @PostMapping("/{customCourseId}/share")
    public ResponseEntity<ApiResponse<Map<String, Object>>> share(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable String customCourseId) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(Map.of("shared", true, "custom_course_id", customCourseId), "커스텀 강의가 공유되었습니다."));
    }

    @PostMapping("/{customCourseId}/copy")
    public ResponseEntity<ApiResponse<Map<String, Object>>> copy(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable String customCourseId) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        Map<String, Object> row = featureStore.customCourse(customCourseId);
        if (row == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("CUSTOM_COURSE_NOT_FOUND", "커스텀 강의를 찾을 수 없습니다."));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(row, "커스텀 강의를 담아갔습니다."));
    }
}
