package com.myway.backendspring.api;

import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.auth.SessionView;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.domain.DemoLearningService;
import com.myway.backendspring.feature.media.MediaPipelineService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.HandlerMapping;

import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/media")
public class MediaController {
    private static final Set<String> ALLOWED_CALLBACK_STATUSES = Set.of("COMPLETED", "FAILED", "PROCESSING");
    private final SessionService sessionService;
    private final MediaPipelineService mediaPipelineService;
    private final DemoLearningService learningService;
    private final String callbackToken;
    private final String remoteAssetBaseUrl;
    private final String remoteAssetToken;

    public MediaController(
            SessionService sessionService,
            MediaPipelineService mediaPipelineService,
            DemoLearningService learningService,
            @Value("${myway.media.callback.token:dev-media-callback-token}") String callbackToken,
            @Value("${myway.media.asset-proxy.base-url:}") String remoteAssetBaseUrl,
            @Value("${myway.media.asset-proxy.token:}") String remoteAssetToken
    ) {
        this.sessionService = sessionService;
        this.mediaPipelineService = mediaPipelineService;
        this.learningService = learningService;
        this.callbackToken = callbackToken;
        this.remoteAssetBaseUrl = remoteAssetBaseUrl == null ? "" : remoteAssetBaseUrl.trim();
        this.remoteAssetToken = remoteAssetToken == null ? "" : remoteAssetToken.trim();
    }

    public record ExtractionCallbackRequest(
            @NotBlank String extraction_id,
            String lecture_id,
            String status,
            String error_message,
            @Min(1) Long event_version,
            String audio_url,
            String processing_job_id,
            String processing_stage,
            String processing_step,
            String audio_format,
            Integer sample_rate,
            Integer channels
    ) {}

    public record ExtractAudioRequest(
            @NotBlank String lecture_id,
            String audio_url
    ) {}

    public record TranscribeRequest(
            @NotBlank String lecture_id,
            String language,
            Integer duration_ms,
            String stt_provider,
            String stt_model,
            String audio_url
    ) {}

    public record SummarizeRequest(
            @NotBlank String lecture_id,
            String style,
            String language
    ) {}

    public record BindLectureVideoRequest(
            @NotBlank String lecture_id,
            @NotBlank String asset_key,
            String video_url
    ) {}

    private String trimRequired(String value) {
        return value.trim();
    }

    private String trimOptional(String value) {
        return value == null ? "" : value.trim();
    }

    private String optionalOrNull(String value) {
        String trimmed = trimOptional(value);
        return trimmed.isBlank() ? null : trimmed;
    }

    private String optionalOrDefault(String value, String defaultValue) {
        String trimmed = trimOptional(value);
        return trimmed.isBlank() ? defaultValue : trimmed;
    }

    private SessionView require(String auth) { return sessionService.me(auth); }
    private <T> ResponseEntity<ApiResponse<T>> unauthenticated() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
    }
    private boolean requireAuthenticated(String auth) {
        return require(auth) != null;
    }
    private boolean canManageMedia(SessionView session) {
        if (session == null) return false;
        String role = session.user().role();
        return "admin".equals(role) || "instructor".equals(role);
    }

    @PostMapping("/upload-video")
    public ResponseEntity<ApiResponse<Map<String, Object>>> upload(@RequestHeader(value = "Authorization", required = false) String auth, @RequestParam("lecture_id") String lectureId, @RequestParam(value = "video_file", required = false) org.springframework.web.multipart.MultipartFile file) {
        SessionView session = require(auth);
        if (session == null) return unauthenticated();
        if (!canManageMedia(session)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("FORBIDDEN", "영상 업로드는 강사와 운영자만 사용할 수 있습니다."));
        if (lectureId == null || lectureId.isBlank()) return ResponseEntity.badRequest().body(ApiResponse.failure("LECTURE_ID_REQUIRED", "lecture_id가 필요합니다."));
        String fileName = file != null ? file.getOriginalFilename() : "uploaded.mp4";
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(mediaPipelineService.mediaUpload(lectureId.trim(), fileName), "강의 영상이 업로드되었습니다."));
    }

    @PostMapping("/extract-audio")
    public ResponseEntity<ApiResponse<Map<String, Object>>> extract(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody ExtractAudioRequest body) {
        SessionView session = require(auth);
        if (session == null) return unauthenticated();
        if (!canManageMedia(session)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("FORBIDDEN", "오디오 추출은 강사와 운영자만 사용할 수 있습니다."));
        String lectureId = trimRequired(body.lecture_id());
        String audioUrl = optionalOrNull(body.audio_url());
        Map<String, Object> extraction = mediaPipelineService.createExtraction(lectureId, audioUrl);
        Map<String, Object> dispatched = mediaPipelineService.dispatchExtractionJob(String.valueOf(extraction.get("id")), audioUrl);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(dispatched != null ? dispatched : extraction, "오디오 추출 job이 생성되었습니다."));
    }

    @PostMapping("/transcribe")
    public ResponseEntity<ApiResponse<Map<String, Object>>> transcribe(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody TranscribeRequest body) {
        if (!requireAuthenticated(auth)) return unauthenticated();
        String lectureId = trimRequired(body.lecture_id());
        if (learningService.getLecture(lectureId) == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("LECTURE_NOT_FOUND", "강의를 찾을 수 없습니다."));
        String language = optionalOrDefault(body.language(), "ko");
        Integer durationMs = body.duration_ms();
        String sttProvider = optionalOrNull(body.stt_provider());
        String sttModel = optionalOrNull(body.stt_model());
        String audioUrl = optionalOrNull(body.audio_url());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                mediaPipelineService.transcribe(lectureId, language, durationMs, sttProvider, sttModel, audioUrl),
                "트랜스크립트가 생성되었습니다."
        ));
    }

    @PostMapping("/summarize")
    public ResponseEntity<ApiResponse<Map<String, Object>>> summarize(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody SummarizeRequest body) {
        if (!requireAuthenticated(auth)) return unauthenticated();
        String lectureId = trimRequired(body.lecture_id());
        if (learningService.getLecture(lectureId) == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("LECTURE_NOT_FOUND", "강의를 찾을 수 없습니다."));
        String style = optionalOrDefault(body.style(), "brief");
        String language = optionalOrDefault(body.language(), "ko");
        Map<String, Object> note = mediaPipelineService.summarizeLecture(lectureId, style, language);
        Map<String, Object> response = SummaryResponseAssembler.assemble(note, style, mediaPipelineService.pipeline(lectureId));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "요약이 생성되었습니다."));
    }

    @GetMapping("/pipeline/{lectureId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> pipeline(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable String lectureId) {
        if (!requireAuthenticated(auth)) return unauthenticated();
        return ResponseEntity.ok(ApiResponse.success(mediaPipelineService.pipeline(lectureId)));
    }

    @GetMapping("/audio-extractions/{lectureId}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> audioExtractions(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable String lectureId) {
        if (!requireAuthenticated(auth)) return unauthenticated();
        return ResponseEntity.ok(ApiResponse.success(mediaPipelineService.extractions(lectureId)));
    }

    @GetMapping("/transcript/{lectureId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> transcript(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable String lectureId) {
        if (!requireAuthenticated(auth)) return unauthenticated();
        return ResponseEntity.ok(ApiResponse.success(mediaPipelineService.transcript(lectureId)));
    }

    @GetMapping("/notes/{lectureId}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> notes(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable String lectureId) {
        if (!requireAuthenticated(auth)) return unauthenticated();
        return ResponseEntity.ok(ApiResponse.success(mediaPipelineService.notes(lectureId)));
    }

    @GetMapping("/providers")
    public ResponseEntity<ApiResponse<Map<String, Object>>> providers(@RequestHeader(value = "Authorization", required = false) String auth) {
        if (!requireAuthenticated(auth)) return unauthenticated();
        return ResponseEntity.ok(ApiResponse.success(mediaPipelineService.sttProviders()));
    }

    @GetMapping("/processor-health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> processorHealth(@RequestHeader(value = "Authorization", required = false) String auth) {
        if (!requireAuthenticated(auth)) return unauthenticated();
        return ResponseEntity.ok(ApiResponse.success(mediaPipelineService.processorHealth()));
    }

    @GetMapping("/assets/**")
    public ResponseEntity<?> assets(
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
            if (!requireAuthenticated(auth)) return unauthenticated();
        }
        Map<String, Object> asset = mediaPipelineService.mediaAsset(assetKey);
        if (asset != null) return ResponseEntity.ok(ApiResponse.success(asset));
        ResponseEntity<?> proxied = proxyRemoteAsset(assetKey);
        if (proxied != null) return proxied;
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("ASSET_NOT_FOUND", "미디어 파일을 찾을 수 없습니다."));
    }

    @PostMapping("/lecture-video")
    public ResponseEntity<ApiResponse<Map<String, Object>>> bindLectureVideo(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @Valid @RequestBody BindLectureVideoRequest body
    ) {
        SessionView session = require(auth);
        if (session == null) return unauthenticated();
        if (!canManageMedia(session)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("FORBIDDEN", "강의 영상 연결은 강사와 운영자만 사용할 수 있습니다."));
        String lectureId = trimRequired(body.lecture_id());
        if (learningService.getLecture(lectureId) == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("LECTURE_NOT_FOUND", "강의를 찾을 수 없습니다."));
        }
        String assetKey = trimRequired(body.asset_key());
        String videoUrl = optionalOrNull(body.video_url());
        Map<String, Object> payload = mediaPipelineService.bindLectureVideoAsset(lectureId, assetKey, videoUrl);
        if (payload == null) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("INVALID_ASSET_BINDING", "lecture_id와 asset_key를 확인해 주세요."));
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(payload, "강의와 영상 에셋이 연결되었습니다."));
    }

    @GetMapping("/lecture-video/{lectureId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> lectureVideo(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable String lectureId
    ) {
        if (!requireAuthenticated(auth)) return unauthenticated();
        Map<String, Object> payload = mediaPipelineService.lectureVideoAsset(lectureId);
        if (payload == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("LECTURE_VIDEO_NOT_FOUND", "연결된 강의 영상 에셋이 없습니다."));
        }
        return ResponseEntity.ok(ApiResponse.success(payload));
    }

    @PostMapping("/extract-audio/callback")
    public ResponseEntity<ApiResponse<Map<String, Object>>> callback(
            @RequestHeader(value = "X-Callback-Token", required = false) String token,
            @RequestHeader(value = "x-myway-media-callback-secret", required = false) String callbackSecret,
            @Valid @RequestBody ExtractionCallbackRequest body
    ) {
        String resolvedToken = (token != null && !token.isBlank()) ? token : callbackSecret;
        if (resolvedToken == null || resolvedToken.isBlank() || !resolvedToken.equals(callbackToken)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("CALLBACK_UNAUTHORIZED", "유효한 callback token이 필요합니다."));
        }
        String extractionId = trimRequired(body.extraction_id());
        CallbackPolicyDecision decision = CallbackStateTransitionPolicy.decide(body);
        if (!decision.valid()) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("CALLBACK_INVALID_PAYLOAD", decision.errorMessage()));
        }
        String errorMessage = body.error_message();
        String audioUrl = optionalOrNull(body.audio_url());
        Map<String, Object> result = mediaPipelineService.completeExtractionCallback(
                extractionId,
                decision.status(),
                errorMessage,
                decision.eventVersion(),
                audioUrl,
                body.processing_job_id(),
                body.processing_stage(),
                body.processing_step(),
                body.audio_format(),
                body.sample_rate(),
                body.channels()
        );
        if (result == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("CALLBACK_EXTRACTION_NOT_FOUND", "오디오 추출 기록을 찾을 수 없습니다."));
        }
        if (Boolean.TRUE.equals(result.get("callback_ignored"))) {
            return ResponseEntity.ok(ApiResponse.success(
                    Map.of("extraction", result, "pipeline", mediaPipelineService.pipeline(String.valueOf(result.getOrDefault("lecture_id", "")))),
                    "오래된 callback 이벤트를 무시했습니다."
            ));
        }
        String lectureId = String.valueOf(result.getOrDefault("lecture_id", "")).trim();
        Map<String, Object> transcribeResult = null;
        boolean shouldStartStt = "COMPLETED".equalsIgnoreCase(decision.status())
                || "transcribing".equalsIgnoreCase(String.valueOf(result.getOrDefault("processing_stage", "")));
        if (shouldStartStt && !lectureId.isBlank()) {
            transcribeResult = mediaPipelineService.transcribe(
                    lectureId,
                    "ko",
                    null,
                    null,
                    null,
                    audioUrl,
                    extractionId
            );
        }

        if (transcribeResult == null) {
            return ResponseEntity.ok(ApiResponse.success(Map.of("extraction", result, "pipeline", mediaPipelineService.pipeline(lectureId)), "오디오 추출 callback이 반영되었습니다."));
        }

        return ResponseEntity.ok(ApiResponse.success(
                Map.of(
                        "extraction", result,
                        "pipeline", mediaPipelineService.pipeline(lectureId),
                        "transcript", transcribeResult
                ),
                "오디오 추출 callback이 반영되어 STT가 자동 시작되었습니다."
        ));
    }

    private record CallbackPolicyDecision(boolean valid, String status, long eventVersion, String errorMessage) {
        static CallbackPolicyDecision valid(String status, long eventVersion) {
            return new CallbackPolicyDecision(true, status, eventVersion, null);
        }

        static CallbackPolicyDecision invalid(String errorMessage) {
            return new CallbackPolicyDecision(false, null, 0L, errorMessage);
        }
    }

    private static final class CallbackStateTransitionPolicy {
        private static CallbackPolicyDecision decide(ExtractionCallbackRequest body) {
            long eventVersion = body.event_version() != null ? body.event_version() : 1L;
            if (eventVersion < 1L) {
                return CallbackPolicyDecision.invalid("event_version은 1 이상이어야 합니다.");
            }
            String status = body.status() == null ? "COMPLETED" : body.status().trim().toUpperCase();
            if (!ALLOWED_CALLBACK_STATUSES.contains(status)) {
                return CallbackPolicyDecision.invalid("status는 COMPLETED, FAILED, PROCESSING 중 하나여야 합니다.");
            }
            return CallbackPolicyDecision.valid(status, eventVersion);
        }
    }

    private static final class SummaryResponseAssembler {
        private static Map<String, Object> assemble(Map<String, Object> note, String style, Map<String, Object> pipeline) {
            return Map.of(
                    "note_id", note.get("id"),
                    "lecture_id", note.get("lecture_id"),
                    "title", note.get("title"),
                    "content", note.get("content"),
                    "key_concepts", note.get("key_concepts"),
                    "keywords", note.get("keywords"),
                    "timestamps", note.get("timestamps"),
                    "style", style,
                    "pipeline", pipeline
            );
        }
    }

    private ResponseEntity<?> proxyRemoteAsset(String assetKey) {
        if (remoteAssetBaseUrl.isBlank()) return null;
        try {
            String encoded = java.net.URLEncoder.encode(assetKey, java.nio.charset.StandardCharsets.UTF_8);
            String target = remoteAssetBaseUrl.endsWith("/")
                    ? remoteAssetBaseUrl + encoded
                    : remoteAssetBaseUrl + "/" + encoded;
            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(target))
                    .GET();
            if (!remoteAssetToken.isBlank()) {
                builder.header("X-Processor-Token", remoteAssetToken);
            }
            HttpResponse<byte[]> response = HttpClient.newHttpClient().send(builder.build(), HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() < 200 || response.statusCode() >= 300) return null;
            ResponseEntity.BodyBuilder bodyBuilder = ResponseEntity.status(response.statusCode());
            String contentType = response.headers().firstValue("content-type").orElse(null);
            String contentDisposition = response.headers().firstValue("content-disposition").orElse(null);
            if (contentType != null && !contentType.isBlank()) {
                bodyBuilder.header("Content-Type", contentType);
            }
            if (contentDisposition != null && !contentDisposition.isBlank()) {
                bodyBuilder.header("Content-Disposition", contentDisposition);
            }
            return bodyBuilder.body(response.body());
        } catch (Exception ignored) {
            return null;
        }
    }

}
