package com.myway.backendspring.api;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.feature.FeatureStoreService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.HandlerMapping;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

@RestController
@RequestMapping("/api/v1/legacy/media")
public class LegacyMediaBridgeController {
    public static final class LegacyBody {
        private final Map<String, Object> payload = new HashMap<>();

        @JsonAnySetter
        public void put(String key, Object value) {
            payload.put(key, value);
        }

        public Map<String, Object> payload() {
            return payload;
        }
    }

    private final MediaController mediaController;
    private final MediaSttOrchestrationController mediaSttOrchestrationController;
    private final FeatureStoreService featureStore;
    private final SessionService sessionService;

    public LegacyMediaBridgeController(
            MediaController mediaController,
            MediaSttOrchestrationController mediaSttOrchestrationController,
            FeatureStoreService featureStore,
            SessionService sessionService
    ) {
        this.mediaController = mediaController;
        this.mediaSttOrchestrationController = mediaSttOrchestrationController;
        this.featureStore = featureStore;
        this.sessionService = sessionService;
    }

    @GetMapping("/providers")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyMediaProviders(@RequestHeader(value = "Authorization", required = false) String auth) {
        return withUserId(auth, userId ->
                ResponseEntity.ok(ApiResponse.success(featureStore.sttProviders(), "legacy media providers 응답을 /api/v1/media/providers와 동일하게 반환했습니다."))
        );
    }

    @GetMapping("/processor-health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyMediaProcessorHealth(@RequestHeader(value = "Authorization", required = false) String auth) {
        return withUserId(auth, userId ->
                ResponseEntity.ok(ApiResponse.success(featureStore.processorHealth(), "legacy media processor health 응답을 /api/v1/media/processor-health와 동일하게 반환했습니다."))
        );
    }

    @GetMapping("/pipeline/{lectureId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyMediaPipeline(
            @PathVariable String lectureId,
            @RequestHeader(value = "Authorization", required = false) String auth
    ) {
        return withUserId(auth, userId ->
                ResponseEntity.ok(ApiResponse.success(featureStore.pipeline(lectureId), "legacy media pipeline 응답을 /api/v1/media/pipeline/{lectureId}와 동일하게 반환했습니다."))
        );
    }

    @PostMapping("/extract-audio")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyMediaExtractAudio(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) LegacyBody body
    ) {
        Map<String, Object> payload = payloadOf(body);
        return mediaController.extract(auth, new MediaController.ExtractAudioRequest(
                text(payload, "lecture_id"),
                text(payload, "audio_url")
        ));
    }

    @PostMapping("/transcribe")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyMediaTranscribe(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) LegacyBody body
    ) {
        Map<String, Object> payload = payloadOf(body);
        return mediaController.transcribe(auth, new MediaController.TranscribeRequest(
                text(payload, "lecture_id"),
                text(payload, "language"),
                intOrNull(payload, "duration_ms"),
                text(payload, "stt_provider"),
                text(payload, "stt_model"),
                text(payload, "audio_url")
        ));
    }

    @PostMapping("/summarize")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyMediaSummarize(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) LegacyBody body
    ) {
        Map<String, Object> payload = payloadOf(body);
        return mediaController.summarize(auth, new MediaController.SummarizeRequest(
                text(payload, "lecture_id"),
                text(payload, "style"),
                text(payload, "language")
        ));
    }

    @GetMapping("/audio-extractions/{lectureId}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> legacyMediaAudioExtractions(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable String lectureId
    ) {
        return mediaController.audioExtractions(auth, lectureId);
    }

    @GetMapping("/transcript/{lectureId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyMediaTranscript(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable String lectureId
    ) {
        return mediaController.transcript(auth, lectureId);
    }

    @GetMapping("/notes/{lectureId}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> legacyMediaNotes(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable String lectureId
    ) {
        return mediaController.notes(auth, lectureId);
    }

    @PostMapping("/extract-audio/callback")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyMediaExtractAudioCallback(
            @RequestHeader(value = "X-Callback-Token", required = false) String token,
            @RequestHeader(value = "x-myway-media-callback-secret", required = false) String callbackSecret,
            @RequestBody MediaSttOrchestrationController.ExtractionCallbackRequest body
    ) {
        return mediaSttOrchestrationController.callback(token, callbackSecret, body);
    }

    @PostMapping("/upload-video")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyMediaUploadVideo(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestParam("lecture_id") String lectureId,
            @RequestParam(value = "video_file", required = false) MultipartFile file
    ) {
        return mediaController.upload(auth, lectureId, file);
    }

    @GetMapping("/assets/**")
    public ResponseEntity<?> legacyMediaAssets(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestHeader(value = "X-Processor-Token", required = false) String processorToken,
            HttpServletRequest request
    ) {
        String path = String.valueOf(request.getAttribute(HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE));
        String legacyPrefix = "/api/v1/legacy/media/assets/";
        if (path.startsWith(legacyPrefix)) {
            String suffix = path.substring(legacyPrefix.length());
            request.setAttribute(HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE, "/api/v1/media/assets/" + suffix);
        }
        return mediaController.assets(auth, processorToken, request);
    }

    private String text(Map<String, Object> body, String key) {
        if (body == null || body.get(key) == null) return "";
        return String.valueOf(body.get(key)).trim();
    }

    private Map<String, Object> payloadOf(LegacyBody body) {
        return body == null ? Map.of() : body.payload();
    }

    private Integer intOrNull(Map<String, Object> body, String key) {
        if (body == null) return null;
        Object raw = body.get(key);
        if (raw instanceof Number number) return number.intValue();
        if (raw == null) return null;
        try {
            return Integer.parseInt(String.valueOf(raw));
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private String requireUserId(String auth) {
        var session = sessionService.me(auth);
        return session == null ? null : session.user().id();
    }

    private <T> ResponseEntity<ApiResponse<T>> withUserId(String auth, Function<String, ResponseEntity<ApiResponse<T>>> action) {
        String userId = requireUserId(auth);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        }
        return action.apply(userId);
    }
}
