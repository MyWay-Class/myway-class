package com.myway.backendspring.api;

import com.myway.backendspring.api.support.ApiAuthGuards;
import com.myway.backendspring.api.support.MediaAssetPlaybackSupport;
import com.myway.backendspring.api.support.MediaControllerAssetSupport;
import com.myway.backendspring.api.support.MediaControllerAdminSupport;
import com.myway.backendspring.api.support.MediaControllerSupport;
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
    private final MediaControllerAssetSupport assetSupport;
    private final MediaControllerSupport support;
    private final MediaControllerAdminSupport adminSupport;

    public MediaController(
            SessionService sessionService,
            MediaPipelineService mediaPipelineService,
            DemoLearningService learningService,
            @Value("${myway.media.callback.token:dev-media-callback-token}") String callbackToken,
            MediaAssetPlaybackSupport playbackSupport,
            MediaControllerAssetSupport assetSupport,
            MediaControllerSupport support,
            MediaControllerAdminSupport adminSupport
    ) {
        this.sessionService = sessionService;
        this.mediaPipelineService = mediaPipelineService;
        this.learningService = learningService;
        this.callbackToken = callbackToken;
        this.playbackSupport = playbackSupport;
        this.assetSupport = assetSupport;
        this.support = support;
        this.adminSupport = adminSupport;
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

    private SessionView require(String auth) { return ApiAuthGuards.requireSession(sessionService, auth); }
    private <T> ResponseEntity<ApiResponse<T>> unauthenticated() { return ApiAuthGuards.unauthenticated(); }
    private boolean requireAuthenticated(String auth) { return require(auth) != null; }

    @PostMapping("/upload-video")
    public ResponseEntity<ApiResponse<Map<String, Object>>> upload(@RequestHeader(value = "Authorization", required = false) String auth, @RequestParam("lecture_id") String lectureId, @RequestParam(value = "video_file", required = false) org.springframework.web.multipart.MultipartFile file) {
        SessionView session = require(auth);
        if (session == null) return unauthenticated();
        if (!support.canManageMedia(session)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("FORBIDDEN", "영상 업로드는 강사와 운영자만 사용할 수 있습니다."));
        if (lectureId == null || lectureId.isBlank()) return ResponseEntity.badRequest().body(ApiResponse.failure("LECTURE_ID_REQUIRED", "lecture_id가 필요합니다."));
        String fileName = file != null ? file.getOriginalFilename() : "uploaded.mp4";
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(mediaPipelineService.mediaUpload(lectureId.trim(), fileName), "강의 영상이 업로드되었습니다."));
    }

    @PostMapping("/extract-audio")
    public ResponseEntity<ApiResponse<Map<String, Object>>> extract(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody ExtractAudioRequest body) {
        SessionView session = require(auth);
        if (session == null) return unauthenticated();
        if (!support.canManageMedia(session)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("FORBIDDEN", "오디오 추출은 강사와 운영자만 사용할 수 있습니다."));
        String lectureId = support.trimRequired(body.lecture_id());
        String audioUrl = support.optionalOrNull(body.audio_url());
        Map<String, Object> extraction = mediaPipelineService.createExtraction(lectureId, audioUrl);
        Map<String, Object> dispatched = mediaPipelineService.dispatchExtractionJob(String.valueOf(extraction.get("id")), audioUrl);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(dispatched != null ? dispatched : extraction, "오디오 추출 job이 생성되었습니다."));
    }

    @PostMapping("/transcribe")
    public ResponseEntity<ApiResponse<Map<String, Object>>> transcribe(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody TranscribeRequest body) {
        if (!requireAuthenticated(auth)) return unauthenticated();
        String lectureId = support.trimRequired(body.lecture_id());
        if (learningService.getLecture(lectureId) == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("LECTURE_NOT_FOUND", "강의를 찾을 수 없습니다."));
        String language = support.optionalOrDefault(body.language(), "ko");
        Integer durationMs = body.duration_ms();
        String sttProvider = support.optionalOrNull(body.stt_provider());
        String sttModel = support.optionalOrNull(body.stt_model());
        String audioUrl = support.optionalOrNull(body.audio_url());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                support.withLectureMetaSync(
                        lectureId,
                        mediaPipelineService.transcribe(lectureId, language, durationMs, sttProvider, sttModel, audioUrl),
                        learningService.syncLectureMetadataForLectureFromTranscript(lectureId, false)
                ),
                "트랜스크립트가 생성되었습니다."
        ));
    }

    @PostMapping("/summarize")
    public ResponseEntity<ApiResponse<Map<String, Object>>> summarize(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody SummarizeRequest body) {
        if (!requireAuthenticated(auth)) return unauthenticated();
        String lectureId = support.trimRequired(body.lecture_id());
        if (learningService.getLecture(lectureId) == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("LECTURE_NOT_FOUND", "강의를 찾을 수 없습니다."));
        String style = support.optionalOrDefault(body.style(), "brief");
        String language = support.optionalOrDefault(body.language(), "ko");
        Map<String, Object> note = mediaPipelineService.summarizeLecture(lectureId, style, language);
        Map<String, Object> response = support.assembleSummaryResponse(note, style, mediaPipelineService.pipeline(lectureId));
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
        String instructorName = support.optionalOrNull(body == null ? null : body.instructor_name());
        String speakerLabel = support.optionalOrDefault(body == null ? null : body.speaker_label(), "SPEAKER_01");
        String note = support.optionalOrNull(body == null ? null : body.note());
        return adminSupport.upsertTranscriptSpeakerReview(
                session,
                lectureId,
                speakerLabel,
                instructorName,
                body == null ? null : body.confidence(),
                note
        );
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
        return assetSupport.handleAssets(
                auth,
                processorToken,
                queryToken,
                request,
                callbackToken,
                this::require,
                this::unauthenticated,
                playbackSupport,
                mediaPipelineService
        );
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
        String lectureId = support.trimRequired(body.lecture_id());
        String assetKey = support.trimRequired(body.asset_key());
        String videoUrl = support.optionalOrNull(body.video_url());
        return adminSupport.bindLectureVideo(session, lectureId, assetKey, videoUrl);
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
        List<String> lectureIds = body == null ? null : body.lecture_ids();
        Integer retryCount = body == null ? 0 : body.retry_count();
        boolean forceRun = body != null && Boolean.TRUE.equals(body.force_run());
        String language = body == null ? null : body.language();
        String sttProvider = body == null ? null : body.stt_provider();
        String sttModel = body == null ? null : body.stt_model();
        return adminSupport.runBatchPipeline(
                session,
                lectureIds,
                retryCount,
                forceRun,
                language,
                sttProvider,
                sttModel
        );
    }
}
