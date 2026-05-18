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

    public MediaController(
            SessionService sessionService,
            MediaPipelineService mediaPipelineService,
            DemoLearningService learningService,
            @Value("${myway.media.callback.token:dev-media-callback-token}") String callbackToken
    ) {
        this.sessionService = sessionService;
        this.mediaPipelineService = mediaPipelineService;
        this.learningService = learningService;
        this.callbackToken = callbackToken;
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
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(mediaPipelineService.mediaUpload(lectureId.trim(), fileName), "강의 영상이 업로드되었습니다."));
    }

    @PostMapping("/extract-audio")
    public ResponseEntity<ApiResponse<Map<String, Object>>> extract(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody ExtractAudioRequest body) {
        SessionView session = require(auth);
        if (session == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        if (!canManageMedia(session)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("FORBIDDEN", "오디오 추출은 강사와 운영자만 사용할 수 있습니다."));
        if (body == null) return ResponseEntity.badRequest().body(ApiResponse.failure("INVALID_PAYLOAD", "요청 본문이 필요합니다."));
        String lectureId = body.lecture_id() == null ? "" : body.lecture_id().trim();
        String audioUrl = body.audio_url() == null ? "" : body.audio_url().trim();
        if (lectureId.isEmpty()) return ResponseEntity.badRequest().body(ApiResponse.failure("LECTURE_ID_REQUIRED", "lecture_id가 필요합니다."));
        Map<String, Object> extraction = mediaPipelineService.createExtraction(lectureId, audioUrl.isBlank() ? null : audioUrl);
        Map<String, Object> dispatched = mediaPipelineService.dispatchExtractionJob(String.valueOf(extraction.get("id")), audioUrl.isBlank() ? null : audioUrl);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(dispatched != null ? dispatched : extraction, "오디오 추출 job이 생성되었습니다."));
    }

    @PostMapping("/transcribe")
    public ResponseEntity<ApiResponse<Map<String, Object>>> transcribe(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody TranscribeRequest body) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        if (body == null) return ResponseEntity.badRequest().body(ApiResponse.failure("INVALID_PAYLOAD", "요청 본문이 필요합니다."));
        String lectureId = body.lecture_id() == null ? "" : body.lecture_id().trim();
        if (lectureId.isEmpty()) return ResponseEntity.badRequest().body(ApiResponse.failure("LECTURE_ID_REQUIRED", "lecture_id가 필요합니다."));
        if (learningService.getLecture(lectureId) == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("LECTURE_NOT_FOUND", "강의를 찾을 수 없습니다."));
        String language = body.language() == null || body.language().isBlank() ? "ko" : body.language().trim();
        Integer durationMs = body.duration_ms();
        String sttProvider = body.stt_provider() == null ? "" : body.stt_provider().trim();
        String sttModel = body.stt_model() == null ? "" : body.stt_model().trim();
        String audioUrl = body.audio_url() == null ? "" : body.audio_url().trim();
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                mediaPipelineService.transcribe(lectureId, language, durationMs, sttProvider.isBlank() ? null : sttProvider, sttModel.isBlank() ? null : sttModel, audioUrl.isBlank() ? null : audioUrl),
                "트랜스크립트가 생성되었습니다."
        ));
    }

    @PostMapping("/summarize")
    public ResponseEntity<ApiResponse<Map<String, Object>>> summarize(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody SummarizeRequest body) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        if (body == null) return ResponseEntity.badRequest().body(ApiResponse.failure("INVALID_PAYLOAD", "요청 본문이 필요합니다."));
        String lectureId = body.lecture_id() == null ? "" : body.lecture_id().trim();
        if (lectureId.isEmpty()) return ResponseEntity.badRequest().body(ApiResponse.failure("LECTURE_ID_REQUIRED", "lecture_id가 필요합니다."));
        if (learningService.getLecture(lectureId) == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("LECTURE_NOT_FOUND", "강의를 찾을 수 없습니다."));
        String style = body.style() == null || body.style().isBlank() ? "brief" : body.style().trim();
        String language = body.language() == null || body.language().isBlank() ? "ko" : body.language().trim();
        Map<String, Object> note = mediaPipelineService.summarizeLecture(lectureId, style, language);
        Map<String, Object> response = SummaryResponseAssembler.assemble(note, style, mediaPipelineService.pipeline(lectureId));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "요약이 생성되었습니다."));
    }

    @GetMapping("/pipeline/{lectureId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> pipeline(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable String lectureId) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        return ResponseEntity.ok(ApiResponse.success(mediaPipelineService.pipeline(lectureId)));
    }

    @GetMapping("/audio-extractions/{lectureId}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> audioExtractions(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable String lectureId) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        return ResponseEntity.ok(ApiResponse.success(mediaPipelineService.extractions(lectureId)));
    }

    @GetMapping("/transcript/{lectureId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> transcript(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable String lectureId) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        return ResponseEntity.ok(ApiResponse.success(mediaPipelineService.transcript(lectureId)));
    }

    @GetMapping("/notes/{lectureId}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> notes(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable String lectureId) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        return ResponseEntity.ok(ApiResponse.success(mediaPipelineService.notes(lectureId)));
    }

    @GetMapping("/providers")
    public ResponseEntity<ApiResponse<Map<String, Object>>> providers(@RequestHeader(value = "Authorization", required = false) String auth) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        return ResponseEntity.ok(ApiResponse.success(mediaPipelineService.sttProviders()));
    }

    @GetMapping("/processor-health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> processorHealth(@RequestHeader(value = "Authorization", required = false) String auth) {
        if (require(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        return ResponseEntity.ok(ApiResponse.success(mediaPipelineService.processorHealth()));
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
        Map<String, Object> asset = mediaPipelineService.mediaAsset(assetKey);
        if (asset == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("ASSET_NOT_FOUND", "미디어 파일을 찾을 수 없습니다."));
        return ResponseEntity.ok(ApiResponse.success(asset));
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
        if (body == null) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("CALLBACK_INVALID_PAYLOAD", "callback payload가 올바르지 않습니다."));
        }
        String extractionId = body.extraction_id() == null ? "" : body.extraction_id().trim();
        if (extractionId.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("CALLBACK_INVALID_PAYLOAD", "callback payload가 올바르지 않습니다."));
        }
        long eventVersion = body.event_version() != null ? body.event_version() : 1L;
        if (eventVersion < 1L) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("CALLBACK_INVALID_PAYLOAD", "event_version은 1 이상이어야 합니다."));
        }
        String status = body.status() == null ? "COMPLETED" : body.status().trim().toUpperCase();
        if (!ALLOWED_CALLBACK_STATUSES.contains(status)) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("CALLBACK_INVALID_PAYLOAD", "status는 COMPLETED, FAILED, PROCESSING 중 하나여야 합니다."));
        }
        String errorMessage = body.error_message();
        String audioUrl = body.audio_url() == null ? null : body.audio_url().trim();
        Map<String, Object> result = mediaPipelineService.completeExtractionCallback(
                extractionId,
                status,
                errorMessage,
                eventVersion,
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
        boolean shouldStartStt = "COMPLETED".equalsIgnoreCase(status)
                || "transcribing".equalsIgnoreCase(String.valueOf(result.getOrDefault("processing_stage", "")));
        if (shouldStartStt && !lectureId.isBlank()) {
            transcribeResult = mediaPipelineService.transcribe(
                    lectureId,
                    "ko",
                    null,
                    "cloudflare",
                    "cf-whisper",
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

}
