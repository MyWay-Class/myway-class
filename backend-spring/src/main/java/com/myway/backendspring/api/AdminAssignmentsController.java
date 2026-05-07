package com.myway.backendspring.api;

import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.auth.SessionView;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.feature.FeatureStoreService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/assignments")
public class AdminAssignmentsController {
    private final SessionService sessionService;
    private final FeatureStoreService featureStore;

    public AdminAssignmentsController(SessionService sessionService, FeatureStoreService featureStore) {
        this.sessionService = sessionService;
        this.featureStore = featureStore;
    }

    private SessionView require(String auth) {
        return sessionService.me(auth);
    }

    private boolean isAdmin(SessionView session) {
        return session != null && "admin".equals(session.user().role());
    }

    @GetMapping("/{courseId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAssignment(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable String courseId
    ) {
        SessionView session = require(auth);
        if (session == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        }
        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("FORBIDDEN", "관리자 권한이 필요합니다."));
        }
        return ResponseEntity.ok(ApiResponse.success(featureStore.getAdminAssignment(courseId)));
    }

    @PutMapping("/{courseId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> saveAssignment(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable String courseId,
            @RequestBody Map<String, Object> body
    ) {
        SessionView session = require(auth);
        if (session == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        }
        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("FORBIDDEN", "관리자 권한이 필요합니다."));
        }

        List<String> studentIds = new ArrayList<>();
        Object rawStudentIds = body == null ? null : body.get("student_ids");
        if (rawStudentIds instanceof List<?> list) {
            for (Object item : list) {
                if (item != null) {
                    studentIds.add(String.valueOf(item));
                }
            }
        }

        Map<String, Object> saved = featureStore.saveAdminAssignment(session.user().id(), courseId, studentIds);
        return ResponseEntity.ok(ApiResponse.success(saved, "배정이 저장되었습니다."));
    }
}
