package com.myway.backendspring.api;

import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.auth.SessionView;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.feature.media.MediaBatchService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/media")
public class AdminMediaController {

    public record BatchTriggerRequest(String mode) {}

    private final SessionService sessionService;
    private final MediaBatchService mediaBatchService;

    public AdminMediaController(SessionService sessionService, MediaBatchService mediaBatchService) {
        this.sessionService = sessionService;
        this.mediaBatchService = mediaBatchService;
    }

    private SessionView require(String auth) {
        return sessionService.me(auth);
    }

    private boolean isAdmin(SessionView session) {
        return session != null && "admin".equals(session.user().role());
    }

    private <T> ResponseEntity<ApiResponse<T>> unauthenticated() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
    }

    private <T> ResponseEntity<ApiResponse<T>> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("FORBIDDEN", "관리자 권한이 필요합니다."));
    }

    @GetMapping("/batch/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> batchStatus(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView session = require(auth);
        if (session == null) return unauthenticated();
        if (!isAdmin(session)) return forbidden();
        return ResponseEntity.ok(ApiResponse.success(mediaBatchService.getBatchStatus()));
    }

    @PostMapping("/batch/run")
    public ResponseEntity<ApiResponse<Map<String, Object>>> runBatch(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) BatchTriggerRequest request
    ) {
        SessionView session = require(auth);
        if (session == null) return unauthenticated();
        if (!isAdmin(session)) return forbidden();
        String mode = request == null || request.mode() == null ? "all" : request.mode();
        return ResponseEntity.ok(ApiResponse.success(mediaBatchService.runBatch(mode, false), "배치 실행 요청이 완료되었습니다."));
    }

    @GetMapping("/r2-mappings/audit")
    public ResponseEntity<ApiResponse<Map<String, Object>>> auditMappings(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView session = require(auth);
        if (session == null) return unauthenticated();
        if (!isAdmin(session)) return forbidden();
        return ResponseEntity.ok(ApiResponse.success(mediaBatchService.auditLectureVideoAssetMappings()));
    }

    @PostMapping("/r2-mappings/bulk-map")
    public ResponseEntity<ApiResponse<Map<String, Object>>> bulkMapMissing(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView session = require(auth);
        if (session == null) return unauthenticated();
        if (!isAdmin(session)) return forbidden();
        return ResponseEntity.ok(ApiResponse.success(mediaBatchService.bulkMapMissingLectureVideoAssets(), "누락 매핑 일괄 반영이 완료되었습니다."));
    }
}
