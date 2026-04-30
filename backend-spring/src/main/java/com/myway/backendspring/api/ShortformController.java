package com.myway.backendspring.api;

import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.auth.SessionView;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.feature.FeatureStoreService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/shortform")
public class ShortformController {
    private final SessionService sessionService;
    private final FeatureStoreService featureStore;
    private final String callbackToken;

    public ShortformController(
            SessionService sessionService,
            FeatureStoreService featureStore,
            @Value("${myway.shortform.callback.token:dev-shortform-callback-token}") String callbackToken
    ) {
        this.sessionService = sessionService;
        this.featureStore = featureStore;
        this.callbackToken = callbackToken;
    }

    private SessionView require(String auth) { return sessionService.me(auth); }

    @GetMapping("/library")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> library(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView s = require(auth);
        if (s == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        return ResponseEntity.ok(ApiResponse.success(featureStore.shortformLibrary(s.user().id())));
    }

    @GetMapping("/community")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> community(@RequestHeader(value = "Authorization", required = false) String auth, @RequestParam(value = "course_id", required = false) String courseId) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        return ResponseEntity.ok(ApiResponse.success(featureStore.shortformCommunity(courseId)));
    }

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generate(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Map<String, Object> body) {
        SessionView s = require(auth);
        if (s == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(featureStore.createShortformExtraction(s.user().id(), body), "숏폼 후보가 생성되었습니다."));
    }

    @GetMapping("/extraction/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> extraction(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable String id) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        Map<String, Object> row = featureStore.getShortformExtraction(id);
        if (row == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("EXTRACTION_NOT_FOUND", "추출 결과를 찾을 수 없습니다."));
        return ResponseEntity.ok(ApiResponse.success(row));
    }

    @PostMapping("/compose")
    public ResponseEntity<ApiResponse<Map<String, Object>>> compose(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Map<String, Object> body) {
        SessionView s = require(auth);
        if (s == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(featureStore.composeShortform(s.user().id(), body), "숏폼이 생성되었습니다."));
    }

    @GetMapping("/video/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> video(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable String id) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        Map<String, Object> row = featureStore.shortformVideo(id);
        if (row == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("SHORTFORM_NOT_FOUND", "숏폼을 찾을 수 없습니다."));
        return ResponseEntity.ok(ApiResponse.success(row));
    }

    @PostMapping("/share")
    public ResponseEntity<ApiResponse<Map<String, Object>>> share(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Map<String, Object> body) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(Map.of("shared", true, "video_id", body.get("video_id")), "숏폼이 공유되었습니다."));
    }

    @PostMapping("/save")
    public ResponseEntity<ApiResponse<Map<String, Object>>> save(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Map<String, Object> body) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(Map.of("saved", true, "video_id", body.get("video_id")), "숏폼이 담아가기 되었습니다."));
    }

    @PostMapping("/like")
    public ResponseEntity<ApiResponse<Map<String, Object>>> like(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Map<String, Object> body) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        return ResponseEntity.ok(ApiResponse.success(Map.of("liked", true, "video_id", body.get("video_id")), "좋아요 상태가 반영되었습니다."));
    }

    @PostMapping("/{shortformId}/export/retry")
    public ResponseEntity<ApiResponse<Map<String, Object>>> retry(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable String shortformId) {
        SessionView s = require(auth);
        if (s == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));

        Map<String, Object> updated = featureStore.retryShortformExport(s.user().id(), shortformId);
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

        Map<String, Object> updated = featureStore.applyShortformExportCallback(
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
