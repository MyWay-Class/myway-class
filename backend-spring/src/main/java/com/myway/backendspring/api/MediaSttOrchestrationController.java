package com.myway.backendspring.api;

import com.myway.backendspring.api.support.MediaCallbackPolicy;
import com.myway.backendspring.auth.RolePolicy;
import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.auth.SessionView;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.domain.DemoLearningService;
import com.myway.backendspring.feature.media.MediaPipelineService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/media")
public class MediaSttOrchestrationController {
    public record ExtractionCallbackRequest(
            @NotBlank String extraction_id,
            String lecture_id,
            String status,
            String error_message,
            Long event_version,
            String audio_url,
            String processing_job_id,
            String processing_stage,
            String processing_step,
            String audio_format,
            Integer sample_rate,
            Integer channels,
            String sync_mode,
            String overwrite_policy,
            String approval_state,
            String notification_channel
    ) {}

    public record ApproveSttRequest(
            @NotBlank String lecture_id,
            String language,
            Integer duration_ms,
            String stt_provider,
            String stt_model
    ) {}

    private final SessionService sessionService;
    private final MediaPipelineService mediaPipelineService;
    private final DemoLearningService learningService;
    private final String callbackToken;

    public MediaSttOrchestrationController(
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
        String extractionId = body.extraction_id().trim();
        MediaCallbackPolicy.CallbackPolicyDecision decision = MediaCallbackPolicy.decideCallback(body.event_version(), body.status());
        if (!decision.valid()) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("CALLBACK_INVALID_PAYLOAD", decision.errorMessage()));
        }
        MediaCallbackPolicy.SttSyncPolicyDecision sttPolicy = MediaCallbackPolicy.decideSttSync(
                body.sync_mode(), body.overwrite_policy(), body.approval_state(), body.notification_channel()
        );
        if (!sttPolicy.valid()) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("CALLBACK_INVALID_PAYLOAD", sttPolicy.errorMessage()));
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
                body.channels(),
                sttPolicy.syncMode(),
                sttPolicy.overwritePolicy(),
                sttPolicy.approvalState(),
                sttPolicy.notificationChannel()
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
        boolean callbackWantsStt = "COMPLETED".equalsIgnoreCase(decision.status())
                || "transcribing".equalsIgnoreCase(String.valueOf(result.getOrDefault("processing_stage", "")));
        boolean hasTranscript = !lectureId.isBlank() && mediaPipelineService.transcript(lectureId) != null;
        String syncDecision = "started";
        if ("APPROVAL".equals(sttPolicy.syncMode()) && !"APPROVED".equals(sttPolicy.approvalState())) {
            syncDecision = "awaiting_approval";
        } else if ("SKIP_IF_EXISTS".equals(sttPolicy.overwritePolicy()) && hasTranscript) {
            syncDecision = "skipped_existing_transcript";
        }
        boolean shouldStartStt = callbackWantsStt && "started".equals(syncDecision) && !lectureId.isBlank();
        if (shouldStartStt) {
            transcribeResult = mediaPipelineService.transcribe(lectureId, "ko", null, null, null, audioUrl, extractionId);
        }
        Map<String, Object> syncPolicyPayload = Map.of(
                "mode", sttPolicy.syncMode().toLowerCase(),
                "approval_state", sttPolicy.approvalState().toLowerCase(),
                "overwrite_policy", sttPolicy.overwritePolicy().toLowerCase(),
                "notification_channel", sttPolicy.notificationChannel(),
                "decision", syncDecision
        );
        Map<String, Object> syncMetricsPayload = Map.of(
                "callback_events", 1,
                "auto_started", shouldStartStt ? 1 : 0,
                "approval_pending", "awaiting_approval".equals(syncDecision) ? 1 : 0,
                "overwrite_skipped", "skipped_existing_transcript".equals(syncDecision) ? 1 : 0,
                "notifications", 1
        );

        if (transcribeResult == null) {
            return ResponseEntity.ok(ApiResponse.success(
                    Map.of("extraction", result, "pipeline", mediaPipelineService.pipeline(lectureId), "stt_sync_policy", syncPolicyPayload, "stt_sync_metrics", syncMetricsPayload),
                    "오디오 추출 callback이 반영되었습니다."
            ));
        }

        Map<String, Object> transcribeWithMeta = triggerLectureMetadataAutoSync(lectureId, transcribeResult);
        return ResponseEntity.ok(ApiResponse.success(
                Map.of("extraction", result, "pipeline", mediaPipelineService.pipeline(lectureId), "transcript", transcribeWithMeta, "stt_sync_policy", syncPolicyPayload, "stt_sync_metrics", syncMetricsPayload),
                "오디오 추출 callback이 반영되어 STT가 자동 시작되었습니다."
        ));
    }

    @PostMapping("/extract-audio/{extractionId}/approve-stt")
    public ResponseEntity<ApiResponse<Map<String, Object>>> approveStt(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable String extractionId,
            @Valid @RequestBody ApproveSttRequest body
    ) {
        SessionView session = sessionService.me(auth);
        if (session == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        }
        if (!RolePolicy.canManageCourses(session.user().role())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("FORBIDDEN", "STT 승인 실행은 강사와 운영자만 사용할 수 있습니다."));
        }
        String lectureId = body.lecture_id().trim();
        Map<String, Object> extraction = mediaPipelineService.extractions(lectureId).stream()
                .filter(item -> extractionId.equals(String.valueOf(item.getOrDefault("id", ""))))
                .findFirst()
                .orElse(null);
        if (extraction == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("EXTRACTION_NOT_FOUND", "오디오 추출 기록을 찾을 수 없습니다."));
        }
        String approvalState = String.valueOf(extraction.getOrDefault("stt_approval_state", "pending"));
        if (!"pending".equalsIgnoreCase(approvalState)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.failure("STT_APPROVAL_NOT_PENDING", "승인 대기 상태가 아닌 STT입니다."));
        }

        String language = optionalOrDefault(body.language(), "ko");
        Integer durationMs = body.duration_ms();
        String sttProvider = optionalOrNull(body.stt_provider());
        String sttModel = optionalOrNull(body.stt_model());
        String audioUrl = optionalOrNull(String.valueOf(extraction.getOrDefault("audio_url", "")));

        Map<String, Object> transcript = triggerLectureMetadataAutoSync(
                lectureId,
                mediaPipelineService.transcribe(lectureId, language, durationMs, sttProvider, sttModel, audioUrl, extractionId)
        );
        Map<String, Object> syncPolicy = Map.of(
                "mode", "approval",
                "approval_state", "approved",
                "overwrite_policy", String.valueOf(extraction.getOrDefault("stt_overwrite_policy", "overwrite")),
                "notification_channel", String.valueOf(extraction.getOrDefault("stt_sync_notification_channel", "dashboard")),
                "decision", "started_by_approval"
        );
        return ResponseEntity.ok(ApiResponse.success(
                Map.of("extraction_id", extractionId, "lecture_id", lectureId, "transcript", transcript, "pipeline", mediaPipelineService.pipeline(lectureId), "stt_sync_policy", syncPolicy),
                "STT 승인 실행이 완료되었습니다."
        ));
    }

    private Map<String, Object> triggerLectureMetadataAutoSync(String lectureId, Map<String, Object> transcribeResult) {
        if (lectureId == null || lectureId.isBlank() || transcribeResult == null) return transcribeResult;
        Map<String, Object> merged = new java.util.LinkedHashMap<>(transcribeResult);
        merged.put("lecture_meta_sync", learningService.syncLectureMetadataForLectureFromTranscript(lectureId, false));
        return merged;
    }

    private String optionalOrNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private String optionalOrDefault(String value, String defaultValue) {
        if (value == null) return defaultValue;
        String trimmed = value.trim();
        return trimmed.isBlank() ? defaultValue : trimmed;
    }
}
