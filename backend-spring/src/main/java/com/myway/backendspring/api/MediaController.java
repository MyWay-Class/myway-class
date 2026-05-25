package com.myway.backendspring.api;

import com.myway.backendspring.api.support.ApiAuthGuards;
import com.myway.backendspring.api.support.MediaAssetPlaybackSupport;
import com.myway.backendspring.auth.RolePolicy;
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

@RestController
@RequestMapping("/api/v1/media")
public class MediaController {
    private final SessionService sessionService;
    private final MediaPipelineService mediaPipelineService;
    private final DemoLearningService learningService;
    private final String callbackToken;
    private final MediaAssetPlaybackSupport playbackSupport;

    public MediaController(
            SessionService sessionService,
            MediaPipelineService mediaPipelineService,
            DemoLearningService learningService,
            @Value("${myway.media.callback.token:dev-media-callback-token}") String callbackToken,
            MediaAssetPlaybackSupport playbackSupport
    ) {
        this.sessionService = sessionService;
        this.mediaPipelineService = mediaPipelineService;
        this.learningService = learningService;
        this.callbackToken = callbackToken;
        this.playbackSupport = playbackSupport;
    }

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

    public record RunBatchPipelineRequest(
            List<String> lecture_ids,
            @Min(0) Integer retry_count,
            Boolean force_run,
            String language,
            String stt_provider,
            String stt_model
    ) {}

    public record SpeakerReviewRequest(
            String speaker_label,
            String instructor_name,
            Double confidence,
            String note
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

    private SessionView require(String auth) { return ApiAuthGuards.requireSession(sessionService, auth); }
    private <T> ResponseEntity<ApiResponse<T>> unauthenticated() { return ApiAuthGuards.unauthenticated(); }
    private boolean requireAuthenticated(String auth) { return require(auth) != null; }
    private boolean canManageMedia(SessionView session) {
        return session != null && RolePolicy.canManageCourses(session.user().role());
    }

    private boolean isAdmin(SessionView session) {
        return session != null && RolePolicy.isAdmin(session.user().role());
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
                triggerLectureMetadataAutoSync(
                        lectureId,
                        mediaPipelineService.transcribe(lectureId, language, durationMs, sttProvider, sttModel, audioUrl)
                ),
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

    @GetMapping("/transcript/{lectureId}/speaker-review")
    public ResponseEntity<ApiResponse<Map<String, Object>>> transcriptSpeakerReview(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable String lectureId
    ) {
        if (!requireAuthenticated(auth)) return unauthenticated();
        return ResponseEntity.ok(ApiResponse.success(mediaPipelineService.speakerReview(lectureId)));
    }

    @PostMapping("/transcript/{lectureId}/speaker-review")
    public ResponseEntity<ApiResponse<Map<String, Object>>> upsertTranscriptSpeakerReview(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable String lectureId,
            @RequestBody SpeakerReviewRequest body
    ) {
        SessionView session = require(auth);
        if (session == null) return unauthenticated();
        if (!canManageMedia(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.failure("FORBIDDEN", "화자 검수는 강사와 운영자만 사용할 수 있습니다."));
        }
        if (learningService.getLecture(lectureId) == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.failure("LECTURE_NOT_FOUND", "강의를 찾을 수 없습니다."));
        }
        String instructorName = optionalOrNull(body == null ? null : body.instructor_name());
        if (instructorName == null || instructorName.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.failure("INSTRUCTOR_NAME_REQUIRED", "instructor_name이 필요합니다."));
        }
        String speakerLabel = optionalOrDefault(body == null ? null : body.speaker_label(), "SPEAKER_01");
        String note = optionalOrNull(body == null ? null : body.note());
        Map<String, Object> payload = mediaPipelineService.upsertSpeakerReview(
                lectureId,
                speakerLabel,
                instructorName,
                body == null ? null : body.confidence(),
                note,
                session.user().id()
        );
        return ResponseEntity.ok(ApiResponse.success(payload, "화자/강사 검수가 저장되었습니다."));
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
            @RequestParam(value = "token", required = false) String queryToken,
            HttpServletRequest request
    ) {
        String path = String.valueOf(request.getAttribute(HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE));
        String prefix = "/api/v1/media/assets/";
        String assetKey = path.startsWith(prefix) ? path.substring(prefix.length()) : "";
        if (assetKey.isBlank()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("ASSET_NOT_FOUND", "미디어 파일을 찾을 수 없습니다."));
        }
        String resolvedQueryToken = playbackSupport.resolveQueryToken(queryToken, request);
        String resolvedAuth = auth;
        if ((resolvedAuth == null || resolvedAuth.isBlank()) && resolvedQueryToken != null && !resolvedQueryToken.isBlank()) {
            resolvedAuth = "Bearer " + resolvedQueryToken;
        }
        boolean playbackMode = playbackSupport.isPlaybackRequest(request, resolvedQueryToken);
        boolean processorBypass = processorToken != null && processorToken.equals(callbackToken);
        SessionView session = null;
        if (!processorBypass) {
            session = require(resolvedAuth);
            if (session == null) {
                if (playbackMode) {
                    return playbackSupport.playbackFailure(HttpStatus.UNAUTHORIZED, "MEDIA_PLAYBACK_TOKEN_INVALID", "유효한 재생 토큰이 필요합니다.");
                }
                return unauthenticated();
            }
        }
        ResponseEntity<?> proxied = playbackSupport.proxyRemoteAsset(assetKey);
        if (playbackMode && proxied != null) return proxied;
        Map<String, Object> asset = mediaPipelineService.mediaAsset(assetKey);
        if (asset != null) {
            if (playbackMode) {
                ResponseEntity<?> localPlayback = playbackSupport.fallbackLocalPlaybackAsset(assetKey);
                if (localPlayback != null) return localPlayback;
                return playbackSupport.playbackFailure(HttpStatus.BAD_GATEWAY, "MEDIA_PLAYBACK_SOURCE_UNAVAILABLE", "재생 가능한 원본 영상을 찾을 수 없습니다.");
            }
            return ResponseEntity.ok(ApiResponse.success(asset));
        }
        if (playbackMode) {
            return playbackSupport.playbackFailure(HttpStatus.BAD_GATEWAY, "MEDIA_ASSET_PROXY_UNAVAILABLE", "영상 원본 서버에 연결할 수 없습니다.");
        }
        if (proxied != null) return proxied;
        return playbackSupport.assetNotFound();
    }

    public ResponseEntity<?> assets(
            String auth,
            String processorToken,
            HttpServletRequest request
    ) {
        return assets(auth, processorToken, null, request);
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

    @PostMapping("/pipeline/run-batch")
    public ResponseEntity<ApiResponse<Map<String, Object>>> runBatchPipeline(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) @Valid RunBatchPipelineRequest body
    ) {
        SessionView session = require(auth);
        if (session == null) return unauthenticated();
        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.failure("FORBIDDEN", "배치 파이프라인 실행은 운영자만 사용할 수 있습니다."));
        }
        List<String> lectureIds = body == null ? null : body.lecture_ids();
        Integer retryCount = body == null ? 0 : body.retry_count();
        boolean forceRun = body != null && Boolean.TRUE.equals(body.force_run());
        String language = body == null ? null : body.language();
        String sttProvider = body == null ? null : body.stt_provider();
        String sttModel = body == null ? null : body.stt_model();
        Map<String, Object> result = mediaPipelineService.runBatchPipeline(
                lectureIds,
                retryCount,
                forceRun,
                language,
                sttProvider,
                sttModel
        );
        return ResponseEntity.ok(ApiResponse.success(result, "STT/RAG 배치 파이프라인 실행이 완료되었습니다."));
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

    private Map<String, Object> triggerLectureMetadataAutoSync(String lectureId, Map<String, Object> transcribeResult) {
        if (lectureId == null || lectureId.isBlank() || transcribeResult == null) {
            return transcribeResult;
        }
        Map<String, Object> merged = new java.util.LinkedHashMap<>(transcribeResult);
        merged.put("lecture_meta_sync", learningService.syncLectureMetadataForLectureFromTranscript(lectureId, false));
        return merged;
    }

}
