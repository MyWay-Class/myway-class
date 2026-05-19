package com.myway.backendspring.api;

import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.auth.SessionView;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.feature.FeatureStoreService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin/assignments")
public class AdminAssignmentsController {
    public record AssignmentUpdateRequest(@NotNull List<@NotBlank String> student_ids) {}

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
            @Valid @RequestBody AssignmentUpdateRequest body
    ) {
        SessionView session = require(auth);
        if (session == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        }
        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("FORBIDDEN", "관리자 권한이 필요합니다."));
        }

        List<String> studentIds = normalizeStudentIds(body.student_ids());

        Map<String, Object> saved = featureStore.saveAdminAssignment(session.user().id(), courseId, studentIds);
        return ResponseEntity.ok(ApiResponse.success(saved, "배정이 저장되었습니다."));
    }

    private List<String> normalizeStudentIds(List<String> studentIds) {
        return studentIds.stream()
                .map(String::trim)
                .collect(Collectors.toList());
    }
}
