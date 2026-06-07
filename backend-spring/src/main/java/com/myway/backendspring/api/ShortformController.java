package com.myway.backendspring.api;

import com.myway.backendspring.api.support.ShortformControllerSupport;
import com.myway.backendspring.api.support.ShortformComposeValidationSupport;
import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.auth.SessionView;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.feature.shortform.ShortformService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/shortform")
public class ShortformController {
    public record GenerateRequest(String course_id, String mode) {}
    public record SelectCandidatesRequest(@NotBlank String extraction_id, @NotEmpty List<@NotBlank String> candidate_ids) {}
    public record ComposeClipRequest(
            @NotBlank String lecture_id,
            @NotNull @PositiveOrZero Long start_ms,
            @NotNull @PositiveOrZero Long end_ms
    ) {}
    public record ComposeRequest(String title, String description, String course_id, String extraction_id, List<@Valid ComposeClipRequest> clips) {
        public ComposeRequest(String title, String description, String course_id) {
            this(title, description, course_id, null, List.of());
        }
    }
    public record ShareRequest(@NotBlank String video_id, String course_id, String visibility, String message) {}
    public record SaveRequest(@NotBlank String video_id, String note, String folder) {}
    public record LikeRequest(@NotBlank String video_id) {}
    public record RetryFailedExportsRequest(Boolean include_permanent, Integer limit) {}

    private final SessionService sessionService;
    private final ShortformService shortformService;
    private final String callbackToken;
    private final long maxClipDurationMs;
    private final ShortformControllerSupport support;
    private final ShortformComposeValidationSupport composeSupport;

    public ShortformController(
            SessionService sessionService,
            ShortformService shortformService,
            @Value("${myway.shortform.callback.token:dev-shortform-callback-token}") String callbackToken,
            @Value("${myway.shortform.compose.max-clip-duration-ms:300000}") long maxClipDurationMs,
            ShortformControllerSupport support,
            ShortformComposeValidationSupport composeSupport
    ) {
        this.sessionService = sessionService;
        this.shortformService = shortformService;
        this.callbackToken = callbackToken;
        this.maxClipDurationMs = Math.max(1000L, maxClipDurationMs);
        this.support = support;
        this.composeSupport = composeSupport;
    }

    private SessionView require(String auth) { return sessionService.me(auth); }

    @GetMapping("/library")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> library(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView s = require(auth);
        if (s == null) return support.unauthenticated();
        return ResponseEntity.ok(ApiResponse.success(shortformService.shortformLibrary(s.user().id())));
    }

    @GetMapping("/community")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> community(@RequestHeader(value = "Authorization", required = false) String auth, @RequestParam(value = "course_id", required = false) String courseId) {
        if (require(auth) == null) return support.unauthenticated();
        return ResponseEntity.ok(ApiResponse.success(shortformService.shortformCommunity(courseId)));
    }

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generate(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody GenerateRequest body) {
        SessionView s = require(auth);
        if (s == null) return support.unauthenticated();
        Map<String, Object> payload = Map.of(
                "course_id", support.orEmpty(body.course_id()),
                "mode", support.orEmpty(body.mode())
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(shortformService.createShortformExtraction(s.user().id(), payload), "숏폼 후보가 생성되었습니다."));
    }

    @PutMapping("/candidates/select")
    public ResponseEntity<ApiResponse<Map<String, Object>>> select(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody SelectCandidatesRequest body) {
        if (require(auth) == null) return support.unauthenticated();
        String extractionId = support.trimRequired(body.extraction_id());
        List<String> candidateIds = body.candidate_ids().stream().map(String::trim).toList();
        Map<String, Object> updated = shortformService.selectShortformCandidates(extractionId, candidateIds);
        if (updated == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("EXTRACTION_NOT_FOUND", "추출 결과를 찾을 수 없습니다."));
        return ResponseEntity.ok(ApiResponse.success(updated, "후보 선택이 반영되었습니다."));
    }

    @GetMapping("/extraction/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> extraction(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable String id) {
        if (require(auth) == null) return support.unauthenticated();
        Map<String, Object> row = shortformService.getShortformExtraction(id);
        if (row == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("EXTRACTION_NOT_FOUND", "추출 결과를 찾을 수 없습니다."));
        return ResponseEntity.ok(ApiResponse.success(row));
    }

    @PostMapping("/compose")
    public ResponseEntity<ApiResponse<Map<String, Object>>> compose(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody ComposeRequest body) {
        SessionView s = require(auth);
        if (s == null) return support.unauthenticated();
        List<ComposeClipRequest> sourceClips = body.clips() == null ? List.of() : body.clips();
        List<ShortformComposeValidationSupport.ComposeClipInput> clipInputs = sourceClips.stream()
                .map(clip -> new ShortformComposeValidationSupport.ComposeClipInput(clip.lecture_id(), clip.start_ms(), clip.end_ms()))
                .toList();
        ShortformComposeValidationSupport.ComposeValidationResult clipValidation = composeSupport.validateAndBuildClips(
                s,
                body.course_id(),
                clipInputs,
                maxClipDurationMs
        );
        if (!clipValidation.valid()) {
            return clipValidation.errorResponse();
        }
        List<Map<String, Object>> clips = clipValidation.clips();
        Map<String, Object> payload = Map.of(
                "title", support.orEmpty(body.title()),
                "description", support.orEmpty(body.description()),
                "course_id", support.orEmpty(body.course_id()),
                "clips", clips,
                "extraction_id", support.orEmpty(body.extraction_id())
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(shortformService.composeShortform(s.user().id(), payload), "숏폼이 생성되었습니다."));
    }

    @GetMapping("/video/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> video(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable String id) {
        if (require(auth) == null) return support.unauthenticated();
        Map<String, Object> row = shortformService.shortformVideo(id);
        if (row == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("SHORTFORM_NOT_FOUND", "숏폼을 찾을 수 없습니다."));
        return ResponseEntity.ok(ApiResponse.success(row));
    }

    @GetMapping("/videos/my")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> videos(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView session = require(auth);
        if (session == null) return support.unauthenticated();
        return ResponseEntity.ok(ApiResponse.success(shortformService.shortformVideos(session.user().id())));
    }

    @PostMapping("/share")
    public ResponseEntity<ApiResponse<Map<String, Object>>> share(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody ShareRequest body) {
        SessionView session = require(auth);
        if (session == null) return support.unauthenticated();
        Map<String, Object> payload = Map.of(
                "video_id", body.video_id(),
                "course_id", support.orEmpty(body.course_id()),
                "visibility", support.orEmpty(body.visibility()),
                "message", support.orEmpty(body.message())
        );
        Map<String, Object> row = shortformService.shareShortform(session.user().id(), payload);
        if (row == null) return ResponseEntity.badRequest().body(ApiResponse.failure("SHORTFORM_SHARE_FAILED", "숏폼을 공유할 수 없습니다."));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(row, "숏폼이 공유되었습니다."));
    }

    @PostMapping("/save")
    public ResponseEntity<ApiResponse<Map<String, Object>>> save(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody SaveRequest body) {
        SessionView session = require(auth);
        if (session == null) return support.unauthenticated();
        Map<String, Object> payload = Map.of(
                "video_id", body.video_id(),
                "note", support.orEmpty(body.note()),
                "folder", support.orEmpty(body.folder())
        );
        Map<String, Object> row = shortformService.saveShortform(session.user().id(), payload);
        if (row == null) return ResponseEntity.badRequest().body(ApiResponse.failure("SHORTFORM_SAVE_FAILED", "숏폼을 담아갈 수 없습니다."));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(row, "숏폼이 담아가기 되었습니다."));
    }

    @PostMapping("/like")
    public ResponseEntity<ApiResponse<Map<String, Object>>> like(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody LikeRequest body) {
        SessionView session = require(auth);
        if (session == null) return support.unauthenticated();
        String videoId = support.trimRequired(body.video_id());
        Map<String, Object> row = shortformService.toggleShortformLike(session.user().id(), videoId);
        if (row == null) return ResponseEntity.badRequest().body(ApiResponse.failure("SHORTFORM_LIKE_FAILED", "좋아요를 처리할 수 없습니다."));
        return ResponseEntity.ok(ApiResponse.success(row, "좋아요 상태가 반영되었습니다."));
    }

    @PostMapping("/{shortformId}/export/retry")
    public ResponseEntity<ApiResponse<Map<String, Object>>> retry(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable String shortformId) {
        SessionView s = require(auth);
        if (s == null) return support.unauthenticated();

        Map<String, Object> updated = shortformService.retryShortformExport(s.user().id(), shortformId);
        if (updated == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("SHORTFORM_NOT_FOUND", "숏폼을 찾을 수 없습니다."));
        }
        if ("FORBIDDEN".equals(updated.get("error"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("FORBIDDEN", "본인 숏폼만 다시 내보낼 수 있습니다."));
        }

        String status = String.valueOf(updated.getOrDefault("export_status", "PROCESSING"));
        if ("FAILED_PERMANENT".equals(status)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.success(updated, "최대 재시도 횟수를 초과했습니다."));
        }
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(ApiResponse.success(updated, "숏폼 export job이 다시 시작되었습니다."));
    }

    @GetMapping("/admin/export-status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> exportStatus(
            @RequestHeader(value = "Authorization", required = false) String auth
    ) {
        SessionView session = require(auth);
        if (session == null) return support.unauthenticated();
        if (!support.isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("FORBIDDEN", "운영자 권한이 필요합니다."));
        }
        return ResponseEntity.ok(ApiResponse.success(shortformService.shortformExportStatus()));
    }

    @PostMapping("/admin/export/retry-failed")
    public ResponseEntity<ApiResponse<Map<String, Object>>> retryFailedExports(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) RetryFailedExportsRequest body
    ) {
        SessionView session = require(auth);
        if (session == null) return support.unauthenticated();
        if (!support.isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("FORBIDDEN", "운영자 권한이 필요합니다."));
        }
        boolean includePermanent = body != null && Boolean.TRUE.equals(body.include_permanent());
        int limit = body == null || body.limit() == null ? 20 : body.limit();
        Map<String, Object> result = shortformService.retryFailedShortformExports(includePermanent, limit);
        return ResponseEntity.ok(ApiResponse.success(result, "실패한 숏폼 export 재시도가 실행되었습니다."));
    }

    public record ExportCallbackRequest(
            @NotBlank String shortform_id,
            String video_id,
            String status,
            String video_url,
            String error_message,
            @NotNull Long event_version
    ) {}

    @PostMapping("/export/callback")
    public ResponseEntity<ApiResponse<Map<String, Object>>> exportCallback(
            @RequestHeader(value = "X-Callback-Token", required = false) String token,
            @RequestHeader(value = "x-myway-media-callback-secret", required = false) String callbackSecret,
            @Valid @RequestBody ExportCallbackRequest body
    ) {
        String resolvedToken = (token != null && !token.isBlank()) ? token : callbackSecret;
        if (resolvedToken == null || resolvedToken.isBlank() || !resolvedToken.equals(callbackToken)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("FORBIDDEN", "유효한 callback token이 필요합니다."));
        }
        String shortformId = support.trimRequired(body.shortform_id());

        ShortformControllerSupport.CallbackPolicyDecision decision = support.decideExportCallbackState(body.status(), body.event_version());
        if (!decision.valid()) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("INVALID_BODY", decision.errorMessage()));
        }

        Map<String, Object> updated = shortformService.applyShortformExportCallback(
                shortformId,
                decision.status(),
                decision.eventVersion(),
                body.video_url(),
                body.error_message()
        );

        if (updated == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("SHORTFORM_NOT_FOUND", "숏폼을 찾을 수 없습니다."));
        }

        if (Boolean.TRUE.equals(updated.get("callback_ignored"))) {
            return ResponseEntity.ok(ApiResponse.success(updated, "오래된 callback 이벤트를 무시했습니다."));
        }

        if ("FAILED_PERMANENT".equals(updated.get("export_status"))) {
            return ResponseEntity.ok(ApiResponse.success(updated, "숏폼 export가 영구 실패 상태로 전환되었습니다."));
        }
        if ("FAILED".equals(updated.get("export_status"))) {
            return ResponseEntity.ok(ApiResponse.success(updated, "숏폼 export가 실패했습니다."));
        }
        return ResponseEntity.ok(ApiResponse.success(updated, "숏폼 export가 완료되었습니다."));
    }

}
