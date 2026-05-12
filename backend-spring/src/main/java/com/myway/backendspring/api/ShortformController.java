package com.myway.backendspring.api;

import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.auth.SessionView;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.feature.shortform.ShortformService;
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
    public record SelectCandidatesRequest(String extraction_id, List<String> candidate_ids) {}
    public record ComposeRequest(String title, String description, String course_id) {}
    public record ShareRequest(String video_id, String course_id, String visibility, String message) {}
    public record SaveRequest(String video_id, String note, String folder) {}
    public record LikeRequest(String video_id) {}

    private final SessionService sessionService;
    private final ShortformService shortformService;
    private final String callbackToken;

    public ShortformController(
            SessionService sessionService,
            ShortformService shortformService,
            @Value("${myway.shortform.callback.token:dev-shortform-callback-token}") String callbackToken
    ) {
        this.sessionService = sessionService;
        this.shortformService = shortformService;
        this.callbackToken = callbackToken;
    }

    private SessionView require(String auth) { return sessionService.me(auth); }

    @GetMapping("/library")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> library(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView s = require(auth);
        if (s == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        return ResponseEntity.ok(ApiResponse.success(shortformService.shortformLibrary(s.user().id())));
    }

    @GetMapping("/community")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> community(@RequestHeader(value = "Authorization", required = false) String auth, @RequestParam(value = "course_id", required = false) String courseId) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        return ResponseEntity.ok(ApiResponse.success(shortformService.shortformCommunity(courseId)));
    }

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generate(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody GenerateRequest body) {
        SessionView s = require(auth);
        if (s == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        Map<String, Object> payload = Map.of(
                "course_id", body != null && body.course_id() != null ? body.course_id() : "",
                "mode", body != null && body.mode() != null ? body.mode() : ""
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(shortformService.createShortformExtraction(s.user().id(), payload), "숏폼 후보가 생성되었습니다."));
    }

    @PutMapping("/candidates/select")
    public ResponseEntity<ApiResponse<Map<String, Object>>> select(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody SelectCandidatesRequest body) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        String extractionId = body == null || body.extraction_id() == null ? "" : body.extraction_id().trim();
        if (extractionId.isBlank()) return ResponseEntity.badRequest().body(ApiResponse.failure("EXTRACTION_ID_REQUIRED", "extraction_id가 필요합니다."));
        List<String> candidateIds = body == null || body.candidate_ids() == null ? List.of() : body.candidate_ids().stream().map(String::valueOf).toList();
        if (candidateIds.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("CANDIDATE_IDS_REQUIRED", "candidate_ids가 필요합니다."));
        }
        Map<String, Object> updated = shortformService.selectShortformCandidates(extractionId, candidateIds);
        if (updated == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("EXTRACTION_NOT_FOUND", "추출 결과를 찾을 수 없습니다."));
        return ResponseEntity.ok(ApiResponse.success(updated, "후보 선택이 반영되었습니다."));
    }

    @GetMapping("/extraction/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> extraction(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable String id) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        Map<String, Object> row = shortformService.getShortformExtraction(id);
        if (row == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("EXTRACTION_NOT_FOUND", "추출 결과를 찾을 수 없습니다."));
        return ResponseEntity.ok(ApiResponse.success(row));
    }

    @PostMapping("/compose")
    public ResponseEntity<ApiResponse<Map<String, Object>>> compose(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody ComposeRequest body) {
        SessionView s = require(auth);
        if (s == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        Map<String, Object> payload = Map.of(
                "title", body != null && body.title() != null ? body.title() : "",
                "description", body != null && body.description() != null ? body.description() : "",
                "course_id", body != null && body.course_id() != null ? body.course_id() : ""
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(shortformService.composeShortform(s.user().id(), payload), "숏폼이 생성되었습니다."));
    }

    @GetMapping("/video/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> video(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable String id) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        Map<String, Object> row = shortformService.shortformVideo(id);
        if (row == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("SHORTFORM_NOT_FOUND", "숏폼을 찾을 수 없습니다."));
        return ResponseEntity.ok(ApiResponse.success(row));
    }

    @GetMapping("/videos/my")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> videos(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView session = require(auth);
        if (session == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        return ResponseEntity.ok(ApiResponse.success(shortformService.shortformVideos(session.user().id())));
    }

    @PostMapping("/share")
    public ResponseEntity<ApiResponse<Map<String, Object>>> share(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody ShareRequest body) {
        SessionView session = require(auth);
        if (session == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        Map<String, Object> payload = Map.of(
                "video_id", body != null && body.video_id() != null ? body.video_id() : "",
                "course_id", body != null && body.course_id() != null ? body.course_id() : "",
                "visibility", body != null && body.visibility() != null ? body.visibility() : "",
                "message", body != null && body.message() != null ? body.message() : ""
        );
        Map<String, Object> row = shortformService.shareShortform(session.user().id(), payload);
        if (row == null) return ResponseEntity.badRequest().body(ApiResponse.failure("SHORTFORM_SHARE_FAILED", "숏폼을 공유할 수 없습니다."));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(row, "숏폼이 공유되었습니다."));
    }

    @PostMapping("/save")
    public ResponseEntity<ApiResponse<Map<String, Object>>> save(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody SaveRequest body) {
        SessionView session = require(auth);
        if (session == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        Map<String, Object> payload = Map.of(
                "video_id", body != null && body.video_id() != null ? body.video_id() : "",
                "note", body != null && body.note() != null ? body.note() : "",
                "folder", body != null && body.folder() != null ? body.folder() : ""
        );
        Map<String, Object> row = shortformService.saveShortform(session.user().id(), payload);
        if (row == null) return ResponseEntity.badRequest().body(ApiResponse.failure("SHORTFORM_SAVE_FAILED", "숏폼을 담아갈 수 없습니다."));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(row, "숏폼이 담아가기 되었습니다."));
    }

    @PostMapping("/like")
    public ResponseEntity<ApiResponse<Map<String, Object>>> like(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody LikeRequest body) {
        SessionView session = require(auth);
        if (session == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        String videoId = body == null || body.video_id() == null ? "" : body.video_id().trim();
        if (videoId.isBlank()) return ResponseEntity.badRequest().body(ApiResponse.failure("VIDEO_ID_REQUIRED", "video_id가 필요합니다."));
        Map<String, Object> row = shortformService.toggleShortformLike(session.user().id(), videoId);
        if (row == null) return ResponseEntity.badRequest().body(ApiResponse.failure("SHORTFORM_LIKE_FAILED", "좋아요를 처리할 수 없습니다."));
        return ResponseEntity.ok(ApiResponse.success(row, "좋아요 상태가 반영되었습니다."));
    }

    @PostMapping("/{shortformId}/export/retry")
    public ResponseEntity<ApiResponse<Map<String, Object>>> retry(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable String shortformId) {
        SessionView s = require(auth);
        if (s == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));

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

    public record ExportCallbackRequest(
            String shortform_id,
            String video_id,
            String status,
            String video_url,
            String error_message,
            Long event_version
    ) {}

    @PostMapping("/export/callback")
    public ResponseEntity<ApiResponse<Map<String, Object>>> exportCallback(
            @RequestHeader(value = "X-Callback-Token", required = false) String token,
            @RequestBody ExportCallbackRequest body
    ) {
        if (token == null || token.isBlank() || !token.equals(callbackToken)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("FORBIDDEN", "유효한 callback token이 필요합니다."));
        }
        if (body == null) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("INVALID_BODY", "요청 본문이 올바르지 않습니다."));
        }
        String shortformId = body.shortform_id() != null && !body.shortform_id().isBlank()
                ? body.shortform_id().trim()
                : (body.video_id() != null ? body.video_id().trim() : "");
        if (shortformId.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("SHORTFORM_ID_REQUIRED", "shortform_id가 필요합니다."));
        }

        long eventVersion = body.event_version() != null ? body.event_version() : 1L;
        String status = body.status() != null ? body.status() : "COMPLETED";

        Map<String, Object> updated = shortformService.applyShortformExportCallback(
                shortformId,
                status,
                eventVersion,
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
