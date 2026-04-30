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
@RequestMapping("/api/v1/shortform")
public class ShortformController {
    private final SessionService sessionService;
    private final FeatureStoreService featureStore;

    public ShortformController(SessionService sessionService, FeatureStoreService featureStore) {
        this.sessionService = sessionService;
        this.featureStore = featureStore;
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
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(ApiResponse.success(Map.of("id", shortformId, "export_status", "PROCESSING"), "숏폼 export job이 다시 시작되었습니다."));
    }
}
