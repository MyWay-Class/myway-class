package com.myway.backendspring.api;

import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.auth.SessionView;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.domain.DemoLearningService;
import com.myway.backendspring.feature.FeatureStoreService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.HandlerMapping;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/media")
public class MediaController {
    private final SessionService sessionService;
    private final FeatureStoreService featureStore;
    private final DemoLearningService learningService;
    private final String callbackToken;

    public MediaController(
            SessionService sessionService,
            FeatureStoreService featureStore,
            DemoLearningService learningService,
            @Value("${myway.media.callback.token:dev-media-callback-token}") String callbackToken
    ) {
        this.sessionService = sessionService;
        this.featureStore = featureStore;
        this.learningService = learningService;
        this.callbackToken = callbackToken;
    }

    private SessionView require(String auth) { return sessionService.me(auth); }
    private boolean canManageMedia(SessionView session) {
        if (session == null) return false;
        String role = session.user().role();
        return "admin".equals(role) || "instructor".equals(role);
    }

    @PostMapping("/upload-video")
    public ResponseEntity<ApiResponse<Map<String, Object>>> upload(@RequestHeader(value = "Authorization", required = false) String auth, @RequestParam("lecture_id") String lectureId, @RequestParam(value = "video_file", required = false) org.springframework.web.multipart.MultipartFile file) {
        SessionView session = require(auth);
        if (session == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        if (!canManageMedia(session)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("FORBIDDEN", "영상 업로드는 강사와 운영자만 사용할 수 있습니다."));
        if (lectureId == null || lectureId.isBlank()) return ResponseEntity.badRequest().body(ApiResponse.failure("LECTURE_ID_REQUIRED", "lecture_id가 필요합니다."));
        String fileName = file != null ? file.getOriginalFilename() : "uploaded.mp4";
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(featureStore.mediaUpload(lectureId.trim(), fileName), "강의 영상이 업로드되었습니다."));
    }

    @PostMapping("/extract-audio")
    public ResponseEntity<ApiResponse<Map<String, Object>>> extract(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Map<String, Object> body) {
        SessionView session = require(auth);
        if (session == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        if (!canManageMedia(session)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("FORBIDDEN", "오디오 추출은 강사와 운영자만 사용할 수 있습니다."));
        String lectureId = String.valueOf(body.getOrDefault("lecture_id", "")).trim();
        if (lectureId.isEmpty()) return ResponseEntity.badRequest().body(ApiResponse.failure("LECTURE_ID_REQUIRED", "lecture_id가 필요합니다."));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(featureStore.createExtraction(lectureId), "오디오 추출 job이 생성되었습니다."));
    }

    @PostMapping("/transcribe")
    public ResponseEntity<ApiResponse<Map<String, Object>>> transcribe(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Map<String, Object> body) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        String lectureId = String.valueOf(body.getOrDefault("lecture_id", "")).trim();
        if (lectureId.isEmpty()) return ResponseEntity.badRequest().body(ApiResponse.failure("LECTURE_ID_REQUIRED", "lecture_id가 필요합니다."));
        if (learningService.getLecture(lectureId) == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("LECTURE_NOT_FOUND", "강의를 찾을 수 없습니다."));
        String language = String.valueOf(body.getOrDefault("language", "ko"));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(featureStore.transcribe(lectureId, language), "트랜스크립트가 생성되었습니다."));
    }

    @PostMapping("/summarize")
    public ResponseEntity<ApiResponse<Map<String, Object>>> summarize(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Map<String, Object> body) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        String lectureId = String.valueOf(body.getOrDefault("lecture_id", "")).trim();
        if (lectureId.isEmpty()) return ResponseEntity.badRequest().body(ApiResponse.failure("LECTURE_ID_REQUIRED", "lecture_id가 필요합니다."));
        if (learningService.getLecture(lectureId) == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("LECTURE_NOT_FOUND", "강의를 찾을 수 없습니다."));
        String style = String.valueOf(body.getOrDefault("style", "brief"));
        String language = String.valueOf(body.getOrDefault("language", "ko"));
        Map<String, Object> note = featureStore.summarizeLecture(lectureId, style, language);
        Map<String, Object> response = Map.of(
                "note_id", note.get("id"),
                "lecture_id", note.get("lecture_id"),
                "title", note.get("title"),
                "content", note.get("content"),
                "key_concepts", note.get("key_concepts"),
                "keywords", note.get("keywords"),
                "timestamps", note.get("timestamps"),
                "style", style,
                "pipeline", featureStore.pipeline(lectureId)
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "요약이 생성되었습니다."));
    }

    @GetMapping("/pipeline/{lectureId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> pipeline(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable String lectureId) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        return ResponseEntity.ok(ApiResponse.success(featureStore.pipeline(lectureId)));
    }

    @GetMapping("/audio-extractions/{lectureId}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> audioExtractions(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable String lectureId) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        return ResponseEntity.ok(ApiResponse.success(featureStore.extractions(lectureId)));
    }

    @GetMapping("/transcript/{lectureId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> transcript(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable String lectureId) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        return ResponseEntity.ok(ApiResponse.success(featureStore.transcript(lectureId)));
    }

    @GetMapping("/notes/{lectureId}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> notes(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable String lectureId) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        return ResponseEntity.ok(ApiResponse.success(featureStore.notes(lectureId)));
    }

    @GetMapping("/providers")
    public ResponseEntity<ApiResponse<Map<String, Object>>> providers(@RequestHeader(value = "Authorization", required = false) String auth) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        return ResponseEntity.ok(ApiResponse.success(Map.of("providers", List.of("demo-stt"), "default", "demo-stt")));
    }

    @GetMapping("/processor-health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> processorHealth(@RequestHeader(value = "Authorization", required = false) String auth) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        return ResponseEntity.ok(ApiResponse.success(Map.of("status", "ok", "service", "spring-media-processor")));
    }

    @GetMapping("/assets/**")
    public ResponseEntity<ApiResponse<Map<String, Object>>> assets(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestHeader(value = "X-Processor-Token", required = false) String processorToken,
            HttpServletRequest request
    ) {
        String path = String.valueOf(request.getAttribute(HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE));
        String prefix = "/api/v1/media/assets/";
        String assetKey = path.startsWith(prefix) ? path.substring(prefix.length()) : "";
        if (assetKey.isBlank()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("ASSET_NOT_FOUND", "미디어 파일을 찾을 수 없습니다."));
        }
        if (processorToken == null || !processorToken.equals(callbackToken)) {
            if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        }
        Map<String, Object> asset = featureStore.mediaAsset(assetKey);
        if (asset == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("ASSET_NOT_FOUND", "미디어 파일을 찾을 수 없습니다."));
        return ResponseEntity.ok(ApiResponse.success(asset));
    }

    @PostMapping("/extract-audio/callback")
    public ResponseEntity<ApiResponse<Map<String, Object>>> callback(
            @RequestHeader(value = "X-Callback-Token", required = false) String token,
            @RequestBody Map<String, Object> body
    ) {
        if (token == null || token.isBlank() || !token.equals(callbackToken)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("FORBIDDEN", "유효한 callback token이 필요합니다."));
        }
        if (body == null) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("CALLBACK_INVALID", "callback payload가 올바르지 않습니다."));
        }
        String extractionId = String.valueOf(body.getOrDefault("extraction_id", "")).trim();
        if (extractionId.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("CALLBACK_INVALID", "callback payload가 올바르지 않습니다."));
        }
        String status = String.valueOf(body.getOrDefault("status", "COMPLETED"));
        String errorMessage = body.get("error_message") == null ? null : String.valueOf(body.get("error_message"));
        Map<String, Object> result = featureStore.completeExtractionCallback(extractionId, status, errorMessage);
        if (result == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("EXTRACTION_NOT_FOUND", "오디오 추출 기록을 찾을 수 없습니다."));
        }
        return ResponseEntity.ok(ApiResponse.success(Map.of("extraction", result, "pipeline", featureStore.pipeline(String.valueOf(result.getOrDefault("lecture_id", "")))), "오디오 추출 callback이 반영되었습니다."));
    }
}
