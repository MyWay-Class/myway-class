package com.myway.backendspring.api;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.domain.CourseCard;
import com.myway.backendspring.domain.CourseDetail;
import com.myway.backendspring.domain.DemoLearningService;
import com.myway.backendspring.domain.EnrollmentItem;
import com.myway.backendspring.domain.LectureItem;
import com.myway.backendspring.feature.FeatureStoreService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.HandlerMapping;

import jakarta.servlet.http.HttpServletRequest;

import java.util.List;
import java.util.Map;
import java.util.function.Function;

@RestController
@RequestMapping("/api/v1")
public class NotImplementedController {
    public static final class LegacyBody {
        private final Map<String, Object> payload = new java.util.HashMap<>();

        @JsonAnySetter
        public void put(String key, Object value) {
            payload.put(key, value);
        }

        public Map<String, Object> payload() {
            return payload;
        }
    }

    private final AiController aiController;
    private final MediaController mediaController;
    private final ShortformController shortformController;
    private final DemoLearningService learningService;
    private final SessionService sessionService;
    private final FeatureStoreService featureStore;

    public NotImplementedController(
            AiController aiController,
            MediaController mediaController,
            ShortformController shortformController,
            DemoLearningService learningService,
            SessionService sessionService,
            FeatureStoreService featureStore
    ) {
        this.aiController = aiController;
        this.mediaController = mediaController;
        this.shortformController = shortformController;
        this.learningService = learningService;
        this.sessionService = sessionService;
        this.featureStore = featureStore;
    }

    @GetMapping("/legacy/courses")
    public ResponseEntity<ApiResponse<List<CourseCard>>> legacyCourses(@RequestHeader(value = "Authorization", required = false) String auth) {
        String userId = userIdOrGuest(auth);
        return ResponseEntity.ok(ApiResponse.success(learningService.listCourseCards(userId), "legacy courses 응답을 /api/v1/courses와 동일하게 반환했습니다."));
    }

    @GetMapping("/legacy/courses/{courseId}")
    public ResponseEntity<ApiResponse<CourseDetail>> legacyCourseDetail(
            @PathVariable String courseId,
            @RequestHeader(value = "Authorization", required = false) String auth
    ) {
        String userId = userIdOrGuest(auth);
        CourseDetail detail = learningService.getCourseDetail(courseId, userId);
        if (detail == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.failure("COURSE_NOT_FOUND", "강의를 찾을 수 없습니다."));
        }
        return ResponseEntity.ok(ApiResponse.success(detail, "legacy course detail 응답을 /api/v1/courses/{courseId}와 동일하게 반환했습니다."));
    }

    @GetMapping("/legacy/courses/{courseId}/lectures")
    public ResponseEntity<ApiResponse<List<LectureItem>>> legacyCourseLectures(@PathVariable String courseId) {
        List<LectureItem> lectures = learningService.getCourseLectures(courseId);
        if (lectures.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.failure("COURSE_NOT_FOUND", "강의를 찾을 수 없습니다."));
        }
        return ResponseEntity.ok(ApiResponse.success(lectures, "legacy course lectures 응답을 /api/v1/courses/{courseId}/lectures와 동일하게 반환했습니다."));
    }

    @GetMapping("/legacy/ai/settings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyAiSettings(@RequestHeader(value = "Authorization", required = false) String auth) {
        return withUserId(auth, userId ->
                ResponseEntity.ok(ApiResponse.success(featureStore.aiSettings(userId), "legacy ai settings 응답을 /api/v1/ai/settings와 동일하게 반환했습니다."))
        );
    }

    @GetMapping("/legacy/ai/providers")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyAiProviders(@RequestHeader(value = "Authorization", required = false) String auth) {
        return withUserId(auth, userId ->
                ResponseEntity.ok(ApiResponse.success(featureStore.aiProviders(userId), "legacy ai providers 응답을 /api/v1/ai/providers와 동일하게 반환했습니다."))
        );
    }

    @GetMapping("/legacy/ai/insights")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyAiInsights(@RequestHeader(value = "Authorization", required = false) String auth) {
        return withUserId(auth, userId ->
                ResponseEntity.ok(ApiResponse.success(featureStore.aiInsights(userId), "legacy ai insights 응답을 /api/v1/ai/insights와 동일하게 반환했습니다."))
        );
    }

    @GetMapping("/legacy/ai/recommendations")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyAiRecommendations(@RequestHeader(value = "Authorization", required = false) String auth) {
        return withUserId(auth, userId ->
                ResponseEntity.ok(ApiResponse.success(featureStore.aiRecommendations(userId), "legacy ai recommendations 응답을 /api/v1/ai/recommendations와 동일하게 반환했습니다."))
        );
    }

    @GetMapping("/legacy/ai/logs")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyAiLogs(@RequestHeader(value = "Authorization", required = false) String auth) {
        return withUserId(auth, userId ->
                ResponseEntity.ok(ApiResponse.success(featureStore.aiLogs(userId), "legacy ai logs 응답을 /api/v1/ai/logs와 동일하게 반환했습니다."))
        );
    }

    @PostMapping("/legacy/ai/settings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyAiUpdateSettings(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) LegacyBody body
    ) {
        return aiController.updateSettings(auth, new AiController.AiSettingsUpdateRequest(payloadOf(body)));
    }

    @PutMapping("/legacy/ai/settings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyAiPutSettings(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) LegacyBody body
    ) {
        return aiController.putSettings(auth, new AiController.AiSettingsUpdateRequest(payloadOf(body)));
    }

    @PostMapping("/legacy/ai/intent")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyAiIntent(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) LegacyBody body
    ) {
        Map<String, Object> payload = payloadOf(body);
        return aiController.intent(auth, new AiController.IntentRequest(
                text(payload, "message"),
                text(payload, "lecture_id")
        ));
    }

    @PostMapping("/legacy/ai/search")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyAiSearch(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) LegacyBody body
    ) {
        Map<String, Object> payload = payloadOf(body);
        return aiController.search(auth, new AiController.SearchRequest(
                text(payload, "query"),
                text(payload, "lecture_id")
        ));
    }

    @PostMapping("/legacy/ai/answer")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyAiAnswer(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) LegacyBody body
    ) {
        Map<String, Object> payload = payloadOf(body);
        return aiController.answer(auth, new AiController.AnswerRequest(
                text(payload, "question"),
                text(payload, "lecture_id")
        ));
    }

    @PostMapping("/legacy/ai/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyAiSummary(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) LegacyBody body
    ) {
        Map<String, Object> payload = payloadOf(body);
        return aiController.summary(auth, new AiController.SummaryRequest(
                text(payload, "lecture_id"),
                text(payload, "style"),
                text(payload, "language")
        ));
    }

    @PostMapping("/legacy/ai/quiz")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyAiQuiz(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) LegacyBody body
    ) {
        Map<String, Object> payload = payloadOf(body);
        return aiController.quiz(auth, new AiController.QuizRequest(
                text(payload, "lecture_id")
        ));
    }

    @GetMapping("/legacy/media/providers")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyMediaProviders(@RequestHeader(value = "Authorization", required = false) String auth) {
        if (requireUserId(auth) == null) {
            return unauthenticated();
        }
        return ResponseEntity.ok(ApiResponse.success(featureStore.sttProviders(), "legacy media providers 응답을 /api/v1/media/providers와 동일하게 반환했습니다."));
    }

    @GetMapping("/legacy/media/processor-health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyMediaProcessorHealth(@RequestHeader(value = "Authorization", required = false) String auth) {
        if (requireUserId(auth) == null) {
            return unauthenticated();
        }
        return ResponseEntity.ok(ApiResponse.success(featureStore.processorHealth(), "legacy media processor health 응답을 /api/v1/media/processor-health와 동일하게 반환했습니다."));
    }

    @GetMapping("/legacy/media/pipeline/{lectureId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyMediaPipeline(
            @PathVariable String lectureId,
            @RequestHeader(value = "Authorization", required = false) String auth
    ) {
        if (requireUserId(auth) == null) {
            return unauthenticated();
        }
        return ResponseEntity.ok(ApiResponse.success(featureStore.pipeline(lectureId), "legacy media pipeline 응답을 /api/v1/media/pipeline/{lectureId}와 동일하게 반환했습니다."));
    }

    @PostMapping("/legacy/media/extract-audio")
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

    @PostMapping("/legacy/media/transcribe")
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

    @PostMapping("/legacy/media/summarize")
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

    @GetMapping("/legacy/media/audio-extractions/{lectureId}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> legacyMediaAudioExtractions(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable String lectureId
    ) {
        return mediaController.audioExtractions(auth, lectureId);
    }

    @GetMapping("/legacy/media/transcript/{lectureId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyMediaTranscript(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable String lectureId
    ) {
        return mediaController.transcript(auth, lectureId);
    }

    @GetMapping("/legacy/media/notes/{lectureId}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> legacyMediaNotes(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable String lectureId
    ) {
        return mediaController.notes(auth, lectureId);
    }

    @PostMapping("/legacy/media/extract-audio/callback")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyMediaExtractAudioCallback(
            @RequestHeader(value = "X-Callback-Token", required = false) String token,
            @RequestHeader(value = "x-myway-media-callback-secret", required = false) String callbackSecret,
            @RequestBody MediaController.ExtractionCallbackRequest body
    ) {
        return mediaController.callback(token, callbackSecret, body);
    }

    @PostMapping("/legacy/media/upload-video")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyMediaUploadVideo(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestParam("lecture_id") String lectureId,
            @RequestParam(value = "video_file", required = false) MultipartFile file
    ) {
        return mediaController.upload(auth, lectureId, file);
    }

    @GetMapping("/legacy/media/assets/**")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyMediaAssets(
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

    @GetMapping("/legacy/shortform/library")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> legacyShortformLibrary(@RequestHeader(value = "Authorization", required = false) String auth) {
        String userId = requireUserId(auth);
        if (userId == null) {
            return unauthenticated();
        }
        return ResponseEntity.ok(ApiResponse.success(featureStore.shortformLibrary(userId), "legacy shortform library 응답을 /api/v1/shortform/library와 동일하게 반환했습니다."));
    }

    @GetMapping("/legacy/shortform/community")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> legacyShortformCommunity(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestParam(value = "course_id", required = false) String courseId
    ) {
        if (requireUserId(auth) == null) {
            return unauthenticated();
        }
        return ResponseEntity.ok(ApiResponse.success(featureStore.shortformCommunity(courseId), "legacy shortform community 응답을 /api/v1/shortform/community와 동일하게 반환했습니다."));
    }

    @GetMapping("/legacy/shortform/videos/my")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> legacyShortformVideos(@RequestHeader(value = "Authorization", required = false) String auth) {
        String userId = requireUserId(auth);
        if (userId == null) {
            return unauthenticated();
        }
        return ResponseEntity.ok(ApiResponse.success(featureStore.shortformVideos(userId), "legacy shortform videos 응답을 /api/v1/shortform/videos/my와 동일하게 반환했습니다."));
    }

    @PostMapping("/legacy/shortform/generate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyShortformGenerate(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) LegacyBody body
    ) {
        Map<String, Object> payload = payloadOf(body);
        return shortformController.generate(auth, new ShortformController.GenerateRequest(
                text(payload, "course_id"),
                text(payload, "mode")
        ));
    }

    @PutMapping("/legacy/shortform/candidates/select")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyShortformSelect(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) LegacyBody body
    ) {
        Map<String, Object> payload = payloadOf(body);
        return shortformController.select(auth, new ShortformController.SelectCandidatesRequest(
                text(payload, "extraction_id"),
                listOfString(payload, "candidate_ids")
        ));
    }

    @GetMapping("/legacy/shortform/extraction/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyShortformExtraction(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable String id
    ) {
        return shortformController.extraction(auth, id);
    }

    @PostMapping("/legacy/shortform/compose")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyShortformCompose(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) LegacyBody body
    ) {
        Map<String, Object> payload = payloadOf(body);
        return shortformController.compose(auth, new ShortformController.ComposeRequest(
                text(payload, "title"),
                text(payload, "description"),
                text(payload, "course_id")
        ));
    }

    @GetMapping("/legacy/shortform/video/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyShortformVideo(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable String id
    ) {
        return shortformController.video(auth, id);
    }

    @PostMapping("/legacy/shortform/share")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyShortformShare(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) LegacyBody body
    ) {
        Map<String, Object> payload = payloadOf(body);
        return shortformController.share(auth, new ShortformController.ShareRequest(
                text(payload, "video_id"),
                text(payload, "course_id"),
                text(payload, "visibility"),
                text(payload, "message")
        ));
    }

    @PostMapping("/legacy/shortform/save")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyShortformSave(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) LegacyBody body
    ) {
        Map<String, Object> payload = payloadOf(body);
        return shortformController.save(auth, new ShortformController.SaveRequest(
                text(payload, "video_id"),
                text(payload, "note"),
                text(payload, "folder")
        ));
    }

    @PostMapping("/legacy/shortform/like")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyShortformLike(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) LegacyBody body
    ) {
        Map<String, Object> payload = payloadOf(body);
        return shortformController.like(auth, new ShortformController.LikeRequest(
                text(payload, "video_id")
        ));
    }

    @PostMapping("/legacy/shortform/{shortformId}/export/retry")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyShortformRetry(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable String shortformId
    ) {
        return shortformController.retry(auth, shortformId);
    }

    @GetMapping("/legacy/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyDashboard(@RequestHeader(value = "Authorization", required = false) String auth) {
        String userId = requireUserId(auth);
        if (userId == null) {
            return unauthenticated();
        }
        var dashboard = learningService.getDashboard(userId);
        Map<String, Object> payload = Map.of(
                "courses", dashboard.courses(),
                "active_enrollments", dashboard.enrolled_count()
        );
        return ResponseEntity.ok(ApiResponse.success(payload, "legacy dashboard 응답을 /api/v1/dashboard의 핵심 필드와 호환되게 반환했습니다."));
    }

    @GetMapping("/legacy/enrollments")
    public ResponseEntity<ApiResponse<List<EnrollmentItem>>> legacyEnrollments(@RequestHeader(value = "Authorization", required = false) String auth) {
        String userId = requireUserId(auth);
        if (userId == null) {
            return unauthenticated();
        }
        return ResponseEntity.ok(ApiResponse.success(learningService.listEnrollments(userId), "legacy enrollments 응답을 /api/v1/enrollments와 동일하게 반환했습니다."));
    }

    @GetMapping("/legacy/mappings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyMappings() {
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "status", "migration_in_progress",
                "mappings", List.of(
                        Map.of("legacy", "/api/v1/legacy/courses", "replacement", "/api/v1/courses", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/courses/{courseId}", "replacement", "/api/v1/courses/{courseId}", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/courses/{courseId}/lectures", "replacement", "/api/v1/courses/{courseId}/lectures", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/ai/settings", "replacement", "/api/v1/ai/settings", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/ai/providers", "replacement", "/api/v1/ai/providers", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/ai/insights", "replacement", "/api/v1/ai/insights", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/ai/recommendations", "replacement", "/api/v1/ai/recommendations", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/ai/logs", "replacement", "/api/v1/ai/logs", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/ai/settings(POST|PUT)", "replacement", "/api/v1/ai/settings(POST|PUT)", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/ai/intent", "replacement", "/api/v1/ai/intent", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/ai/search", "replacement", "/api/v1/ai/search", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/ai/answer", "replacement", "/api/v1/ai/answer", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/ai/summary", "replacement", "/api/v1/ai/summary", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/ai/quiz", "replacement", "/api/v1/ai/quiz", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/ai/*", "replacement", "/api/v1/ai/*", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/media/providers", "replacement", "/api/v1/media/providers", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/media/processor-health", "replacement", "/api/v1/media/processor-health", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/media/pipeline/{lectureId}", "replacement", "/api/v1/media/pipeline/{lectureId}", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/media/extract-audio", "replacement", "/api/v1/media/extract-audio", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/media/transcribe", "replacement", "/api/v1/media/transcribe", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/media/summarize", "replacement", "/api/v1/media/summarize", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/media/audio-extractions/{lectureId}", "replacement", "/api/v1/media/audio-extractions/{lectureId}", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/media/transcript/{lectureId}", "replacement", "/api/v1/media/transcript/{lectureId}", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/media/notes/{lectureId}", "replacement", "/api/v1/media/notes/{lectureId}", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/media/extract-audio/callback", "replacement", "/api/v1/media/extract-audio/callback", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/media/upload-video", "replacement", "/api/v1/media/upload-video", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/media/assets/**", "replacement", "/api/v1/media/assets/**", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/media/*", "replacement", "/api/v1/media/*", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/shortform/library", "replacement", "/api/v1/shortform/library", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/shortform/community", "replacement", "/api/v1/shortform/community", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/shortform/videos/my", "replacement", "/api/v1/shortform/videos/my", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/shortform/generate", "replacement", "/api/v1/shortform/generate", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/shortform/candidates/select", "replacement", "/api/v1/shortform/candidates/select", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/shortform/extraction/{id}", "replacement", "/api/v1/shortform/extraction/{id}", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/shortform/compose", "replacement", "/api/v1/shortform/compose", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/shortform/video/{id}", "replacement", "/api/v1/shortform/video/{id}", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/shortform/share", "replacement", "/api/v1/shortform/share", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/shortform/save", "replacement", "/api/v1/shortform/save", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/shortform/like", "replacement", "/api/v1/shortform/like", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/shortform/{shortformId}/export/retry", "replacement", "/api/v1/shortform/{shortformId}/export/retry", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/shortform/*", "replacement", "/api/v1/shortform/*", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/dashboard", "replacement", "/api/v1/dashboard", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/enrollments", "replacement", "/api/v1/enrollments", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/dashboard/*", "replacement", "/api/v1/dashboard/*", "status", "available"),
                        Map.of("legacy", "/api/v1/legacy/enrollments/*", "replacement", "/api/v1/enrollments/*", "status", "available")
                )
        ), "legacy API 매핑 정보를 반환했습니다."));
    }

    @GetMapping("/legacy/{domain}")
    public ResponseEntity<ApiResponse<Object>> legacyDomain(@PathVariable String domain) {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
                .body(ApiResponse.failure("NOT_IMPLEMENTED", "legacy/" + domain + " API는 이관 중입니다. /api/v1/legacy/mappings를 확인하세요."));
    }

    @RequestMapping(value = {"/legacy", "/legacy/**"})
    public ResponseEntity<ApiResponse<Object>> notImplemented() {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
                .body(ApiResponse.failure("NOT_IMPLEMENTED", "Spring 백엔드 마이그레이션 중인 API입니다. /api/v1/legacy/mappings를 확인하세요."));
    }

    private String text(Map<String, Object> body, String key) {
        if (body == null || body.get(key) == null) {
            return "";
        }
        return String.valueOf(body.get(key)).trim();
    }

    private Map<String, Object> payloadOf(LegacyBody body) {
        return body == null ? Map.of() : body.payload();
    }

    private String requireUserId(String auth) {
        var session = sessionService.me(auth);
        return session == null ? null : session.user().id();
    }

    private String userIdOrGuest(String auth) {
        String userId = requireUserId(auth);
        return userId == null ? "guest" : userId;
    }

    private <T> ResponseEntity<ApiResponse<T>> withUserId(String auth, Function<String, ResponseEntity<ApiResponse<T>>> action) {
        String userId = requireUserId(auth);
        if (userId == null) {
            return unauthenticated();
        }
        return action.apply(userId);
    }

    private <T> ResponseEntity<ApiResponse<T>> unauthenticated() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
    }

    private Integer intOrNull(Map<String, Object> body, String key) {
        if (body == null) {
            return null;
        }
        Object raw = body.get(key);
        if (raw instanceof Number number) {
            return number.intValue();
        }
        if (raw == null) {
            return null;
        }
        try {
            return Integer.parseInt(String.valueOf(raw));
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private List<String> listOfString(Map<String, Object> body, String key) {
        if (body == null) {
            return List.of();
        }
        Object raw = body.get(key);
        if (!(raw instanceof List<?> items)) {
            return List.of();
        }
        return items.stream().map(String::valueOf).toList();
    }
}
