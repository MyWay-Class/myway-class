package com.myway.backendspring.api;

import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.auth.SessionView;
import com.myway.backendspring.api.support.ApiAuthGuards;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.domain.DemoLearningService;
import com.myway.backendspring.feature.media.MediaBatchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/media")
public class AdminMediaController {

    public record BatchTriggerRequest(String mode) {}
    public record LectureMetadataSyncRequest(Boolean overwrite_existing) {}

    private final SessionService sessionService;
    private final MediaBatchService mediaBatchService;
    private final DemoLearningService learningService;

    public AdminMediaController(SessionService sessionService, MediaBatchService mediaBatchService, DemoLearningService learningService) {
        this.sessionService = sessionService;
        this.mediaBatchService = mediaBatchService;
        this.learningService = learningService;
    }

    @GetMapping("/batch/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> batchStatus(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView session = ApiAuthGuards.requireSession(sessionService, auth);
        if (session == null) return ApiAuthGuards.unauthenticated();
        if (!ApiAuthGuards.isAdmin(session)) return ApiAuthGuards.forbidden("관리자 권한이 필요합니다.");
        return ResponseEntity.ok(ApiResponse.success(mediaBatchService.getBatchStatus()));
    }

    @PostMapping("/batch/run")
    public ResponseEntity<ApiResponse<Map<String, Object>>> runBatch(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) BatchTriggerRequest request
    ) {
        SessionView session = ApiAuthGuards.requireSession(sessionService, auth);
        if (session == null) return ApiAuthGuards.unauthenticated();
        if (!ApiAuthGuards.isAdmin(session)) return ApiAuthGuards.forbidden("관리자 권한이 필요합니다.");
        String mode = request == null || request.mode() == null ? "all" : request.mode();
        return ResponseEntity.ok(ApiResponse.success(mediaBatchService.runBatch(mode, false), "배치 실행 요청이 완료되었습니다."));
    }

    @GetMapping("/r2-mappings/audit")
    public ResponseEntity<ApiResponse<Map<String, Object>>> auditMappings(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView session = ApiAuthGuards.requireSession(sessionService, auth);
        if (session == null) return ApiAuthGuards.unauthenticated();
        if (!ApiAuthGuards.isAdmin(session)) return ApiAuthGuards.forbidden("관리자 권한이 필요합니다.");
        return ResponseEntity.ok(ApiResponse.success(mediaBatchService.auditLectureVideoAssetMappings()));
    }

    @PostMapping("/r2-mappings/bulk-map")
    public ResponseEntity<ApiResponse<Map<String, Object>>> bulkMapMissing(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView session = ApiAuthGuards.requireSession(sessionService, auth);
        if (session == null) return ApiAuthGuards.unauthenticated();
        if (!ApiAuthGuards.isAdmin(session)) return ApiAuthGuards.forbidden("관리자 권한이 필요합니다.");
        return ResponseEntity.ok(ApiResponse.success(mediaBatchService.bulkMapMissingLectureVideoAssets(), "누락 매핑 일괄 반영이 완료되었습니다."));
    }

    @GetMapping("/r2-mappings/media-assets/audit")
    public ResponseEntity<ApiResponse<Map<String, Object>>> auditMappedMediaAssets(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView session = ApiAuthGuards.requireSession(sessionService, auth);
        if (session == null) return ApiAuthGuards.unauthenticated();
        if (!ApiAuthGuards.isAdmin(session)) return ApiAuthGuards.forbidden("관리자 권한이 필요합니다.");
        return ResponseEntity.ok(ApiResponse.success(mediaBatchService.auditMappedLecturesMissingMediaAssets()));
    }

    @PostMapping("/r2-mappings/media-assets/backfill")
    public ResponseEntity<ApiResponse<Map<String, Object>>> backfillMappedMediaAssets(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView session = ApiAuthGuards.requireSession(sessionService, auth);
        if (session == null) return ApiAuthGuards.unauthenticated();
        if (!ApiAuthGuards.isAdmin(session)) return ApiAuthGuards.forbidden("관리자 권한이 필요합니다.");
        return ResponseEntity.ok(ApiResponse.success(mediaBatchService.backfillMissingMediaAssetsForMappedLectures(), "누락 media_asset 백필이 완료되었습니다."));
    }

    @PostMapping("/lecture-metadata/sync")
    public ResponseEntity<ApiResponse<Map<String, Object>>> syncLectureMetadataFromTranscripts(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) LectureMetadataSyncRequest request
    ) {
        SessionView session = ApiAuthGuards.requireSession(sessionService, auth);
        if (session == null) return ApiAuthGuards.unauthenticated();
        if (!ApiAuthGuards.isAdmin(session)) return ApiAuthGuards.forbidden("관리자 권한이 필요합니다.");
        boolean overwriteExisting = request != null && Boolean.TRUE.equals(request.overwrite_existing());
        Map<String, Object> result = learningService.syncLectureMetadataFromTranscripts(overwriteExisting);
        return ResponseEntity.ok(ApiResponse.success(result, "STT 기반 강의 메타 동기화가 완료되었습니다."));
    }
}
