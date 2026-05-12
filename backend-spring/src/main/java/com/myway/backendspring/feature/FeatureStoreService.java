package com.myway.backendspring.feature;

import com.myway.backendspring.domain.DemoLearningService;
import com.myway.backendspring.domain.ActivityEventService;
import com.myway.backendspring.feature.admin.AdminAssignmentService;
import com.myway.backendspring.feature.ai.AiFeatureService;
import com.myway.backendspring.feature.course.CustomCourseService;
import com.myway.backendspring.feature.media.MediaProcessingService;
import com.myway.backendspring.feature.media.PipelineStage;
import com.myway.backendspring.feature.media.MediaTranscriptionService;
import com.myway.backendspring.feature.quota.AiUsageQuotaService;
import com.myway.backendspring.feature.repository.FeatureStoreRepository;
import com.myway.backendspring.feature.rag.RagService;
import com.myway.backendspring.feature.shortform.ShortformService;
import com.myway.backendspring.persistence.FeatureJdbcStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class FeatureStoreService {
    private static final String TRANSCRIPT_SCOPE = "media_transcript";
    private static final String EXTRACTION_SCOPE = "media_extraction";
    private static final String PIPELINE_SCOPE = "media_pipeline";
    private static final String MEDIA_NOTE_SCOPE = "media_note";
    private static final String MEDIA_ASSET_SCOPE = "media_asset";
    private static final String SHORTFORM_EXTRACTION_SCOPE = "shortform_extraction";
    private static final String SHORTFORM_VIDEO_SCOPE = "shortform_video";
    private static final String SHORTFORM_SAVE_SCOPE = "shortform_save";
    private static final String SHORTFORM_SHARE_SCOPE = "shortform_share";
    private static final String SHORTFORM_LIKE_SCOPE = "shortform_like";
    private static final String AI_USAGE_SCOPE = "ai_usage_daily";
    private final FeatureJdbcStore store;
    private final int shortformMaxRetry;
    private final ActivityEventService activityEventService;
    private final String mediaProcessorUrl;
    private final String mediaProcessorToken;
    private final String mediaCallbackSecret;
    private final String mediaPublicBaseUrl;
    private final RagService ragService;
    private final AiUsageQuotaService aiUsageQuotaService;
    private final ShortformService shortformService;
    private final AiFeatureService aiFeatureService;
    private final MediaProcessingService mediaProcessingService;
    private final MediaTranscriptionService mediaTranscriptionService;
    private final CustomCourseService customCourseService;
    private final AdminAssignmentService adminAssignmentService;

    @Autowired
    public FeatureStoreService(
            FeatureJdbcStore store,
            DemoLearningService learningService,
            ActivityEventService activityEventService,
            @Value("${myway.shortform.retry.max-attempts:3}") int shortformMaxRetry,
            @Value("${myway.media.processor.url:}") String mediaProcessorUrl,
            @Value("${myway.media.processor.token:}") String mediaProcessorToken,
            @Value("${myway.media.callback.secret:}") String mediaCallbackSecret,
            @Value("${myway.media.public-base-url:http://127.0.0.1:8787}") String mediaPublicBaseUrl,
            RagService ragService,
            AiUsageQuotaService aiUsageQuotaService,
            ShortformService shortformService,
            AiFeatureService aiFeatureService,
            MediaProcessingService mediaProcessingService,
            MediaTranscriptionService mediaTranscriptionService,
            CustomCourseService customCourseService,
            AdminAssignmentService adminAssignmentService
    ) {
        this.store = store;
        this.activityEventService = activityEventService;
        this.shortformMaxRetry = Math.max(1, shortformMaxRetry);
        this.mediaProcessorUrl = mediaProcessorUrl == null ? "" : mediaProcessorUrl.trim();
        this.mediaProcessorToken = mediaProcessorToken == null ? "" : mediaProcessorToken.trim();
        this.mediaCallbackSecret = mediaCallbackSecret == null ? "" : mediaCallbackSecret.trim();
        this.mediaPublicBaseUrl = mediaPublicBaseUrl == null ? "http://127.0.0.1:8787" : mediaPublicBaseUrl.trim();
        this.ragService = ragService;
        this.aiUsageQuotaService = aiUsageQuotaService;
        this.shortformService = shortformService;
        this.aiFeatureService = aiFeatureService;
        this.mediaProcessingService = mediaProcessingService;
        this.mediaTranscriptionService = mediaTranscriptionService;
        this.customCourseService = customCourseService;
        this.adminAssignmentService = adminAssignmentService;
    }

    // Backward-compatible constructor for tests instantiating service directly.
    public FeatureStoreService(FeatureJdbcStore store, int shortformMaxRetry) {
        this(
                store,
                null,
                null,
                shortformMaxRetry,
                "",
                "",
                "",
                "http://127.0.0.1:8787",
                null,
                null,
                null,
                new AiFeatureService(new FeatureStoreRepository(store), null, "dev"),
                null,
                null,
                null,
                null
        );
    }

    public Map<String, Object> aiInsights(String userId) {
        return aiFeatureService == null ? Map.of() : aiFeatureService.aiInsights(userId);
    }

    public Map<String, Object> aiLogs(String userId) {
        return aiFeatureService == null ? Map.of("user_id", userId, "items", List.of(), "count", 0) : aiFeatureService.aiLogs(userId);
    }

    public Map<String, Object> aiRecommendations(String userId) {
        return aiFeatureService == null ? Map.of("user_id", userId, "items", List.of(), "count", 0) : aiFeatureService.aiRecommendations(userId);
    }

    public Map<String, Object> aiSettings(String userId) {
        return aiFeatureService == null ? Map.of() : aiFeatureService.aiSettings(userId);
    }

    public Map<String, Object> updateAiSettings(String userId, Map<String, Object> patch) {
        return aiFeatureService == null ? Map.of() : aiFeatureService.updateAiSettings(userId, patch);
    }

    public Map<String, Object> aiProviders(String userId) {
        return aiFeatureService == null ? Map.of("providers", List.of("demo", "ollama", "gemini"), "current", "demo") : aiFeatureService.aiProviders(userId);
    }

    public Map<String, Object> sttProviders() {
        return mediaProcessingService == null ? Map.of("generated_at", Instant.now().toString(), "providers", List.of(), "plans", List.of()) : mediaProcessingService.sttProviders();
    }

    public Map<String, Object> processorHealth() {
        return mediaProcessingService == null ? Map.of("ok", false, "jobs", Map.of("total", 0, "processing", 0, "completed", 0, "failed", 0), "recent_jobs", List.of(), "updated_at", Instant.now().toString()) : mediaProcessingService.processorHealth();
    }

    public boolean canConsumeAi(String userId) {
        if (aiFeatureService == null) return true;
        return aiFeatureService.canConsumeAi(userId);
    }

    public void recordAiUsage(String userId, String feature, boolean success, String inputText) {
        if (aiFeatureService != null) aiFeatureService.recordAiUsage(userId, feature, success, inputText);
    }

    public Map<String, Object> ragOverview(String query, String lectureId, String courseId, Integer limit) {
        return ragOverview(query, lectureId, courseId, limit, null, false);
    }

    public Map<String, Object> ragOverview(
            String query,
            String lectureId,
            String courseId,
            Integer limit,
            Double minScore,
            boolean includeDebug
    ) {
        if (ragService == null) {
            return Map.of();
        }
        return ragService.ragOverview(query, lectureId, courseId, limit, minScore, includeDebug);
    }

    public Map<String, Object> ragIndexOverview(String lectureId, String courseId) {
        if (ragService == null) {
            return Map.of();
        }
        return ragService.ragIndexOverview(lectureId, courseId);
    }

    public Map<String, Object> rebuildRagIndex(String lectureId, String courseId) {
        if (ragService == null) {
            return Map.of();
        }
        return ragService.rebuildRagIndex(lectureId, courseId);
    }

    public Map<String, Object> clearRagIndex(String lectureId, String courseId) {
        if (ragService == null) {
            return Map.of();
        }
        return ragService.clearRagIndex(lectureId, courseId);
    }

    public Map<String, Object> evaluateRagBatch(List<Map<String, Object>> cases, Integer topK) {
        if (ragService == null) {
            return Map.of();
        }
        return ragService.evaluateBatch(cases, topK);
    }

    public Map<String, Object> mediaUpload(String lectureId, String fileName) {
        String key = "asset/" + lectureId + "/" + UUID.randomUUID();
        Map<String, Object> payload = Map.of("lecture_id", lectureId, "asset_key", key, "video_url", "/api/v1/media/assets/" + key, "file_name", fileName);
        store.upsertKv(MEDIA_ASSET_SCOPE, key, payload);
        return payload;
    }

    public Map<String, Object> createExtraction(String lectureId) {
        return createExtraction(lectureId, null);
    }

    public Map<String, Object> createExtraction(String lectureId, String audioUrl) {
        String id = UUID.randomUUID().toString();
        String now = Instant.now().toString();
        Map<String, Object> item = new HashMap<>();
        item.put("id", id);
        item.put("lecture_id", lectureId);
        item.put("status", "PROCESSING");
        item.put("audio_url", audioUrl);
        item.put("processing_stage", "queued");
        item.put("processing_step", "job_requested");
        item.put("processing_error_code", null);
        item.put("processing_error", null);
        item.put("stt_status", "PENDING");
        item.put("transcript_id", null);
        item.put("last_event_version", 0L);
        item.put("created_at", now);
        item.put("updated_at", now);

        store.insertEvent(EXTRACTION_SCOPE, lectureId, id, item);
        store.upsertKv(EXTRACTION_SCOPE, id, item);
        Map<String, Object> pipeline = new HashMap<>();
        pipeline.put("lecture_id", lectureId);
        pipeline.put("transcript_status", "PENDING");
        pipeline.put("summary_status", "PENDING");
        pipeline.put("audio_status", "PROCESSING");
        pipeline.put("processing_stage", "queued");
        pipeline.put("processing_step", "job_requested");
        pipeline.put("processing_error_code", null);
        pipeline.put("processing_error", null);
        pipeline.put("transcript_id", null);
        pipeline.put("note_id", null);
        pipeline.put("extraction_id", id);
        pipeline.put("updated_at", now);
        store.upsertKv(PIPELINE_SCOPE, lectureId, pipeline);

        return item;
    }

    public Map<String, Object> dispatchExtractionJob(String extractionId, String sourceVideoUrl) {
        if (mediaProcessingService == null) return null;
        return mediaProcessingService.dispatchExtractionJob(extractionId, sourceVideoUrl);
    }

    public Map<String, Object> transcript(String lectureId) {
        return store.getKv(TRANSCRIPT_SCOPE, lectureId);
    }

    public Map<String, Object> transcribe(String lectureId, String language, Integer durationMsInput, String sttProvider, String sttModel) {
        return transcribe(lectureId, language, durationMsInput, sttProvider, sttModel, null);
    }

    public Map<String, Object> transcribe(String lectureId, String language, Integer durationMsInput, String sttProvider, String sttModel, String audioUrl) {
        return transcribe(lectureId, language, durationMsInput, sttProvider, sttModel, audioUrl, null);
    }

    public Map<String, Object> transcribe(String lectureId, String language, Integer durationMsInput, String sttProvider, String sttModel, String audioUrl, String extractionId) {
        if (mediaTranscriptionService == null) return Map.of();
        Map<String, Object> extraction = resolveExtractionForTranscription(lectureId, audioUrl, extractionId);
        return runTranscription(extraction, lectureId, language, durationMsInput, sttProvider, sttModel, audioUrl);
    }

    private Map<String, Object> resolveExtractionForTranscription(String lectureId, String audioUrl, String extractionId) {
        if (extractionId == null || extractionId.isBlank()) {
            return createExtraction(lectureId, audioUrl);
        }
        Map<String, Object> extraction = store.getKv(EXTRACTION_SCOPE, extractionId);
        return extraction != null ? extraction : createExtraction(lectureId, audioUrl);
    }

    private Map<String, Object> runTranscription(
            Map<String, Object> extraction,
            String lectureId,
            String language,
            Integer durationMsInput,
            String sttProvider,
            String sttModel,
            String audioUrl
    ) {
        return mediaTranscriptionService.transcribe(
                extraction,
                lectureId,
                language,
                durationMsInput,
                sttProvider,
                sttModel,
                audioUrl
        );
    }

    public List<Map<String, Object>> extractions(String lectureId) {
        List<Map<String, Object>> rows = store.listEventsByOwner(EXTRACTION_SCOPE, lectureId);
        List<Map<String, Object>> merged = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            merged.add(hydrateExtractionRow(row));
        }
        return merged;
    }

    private Map<String, Object> hydrateExtractionRow(Map<String, Object> row) {
        String extractionId = String.valueOf(row.getOrDefault("id", "")).trim();
        Map<String, Object> latest = extractionId.isBlank() ? null : store.getKv(EXTRACTION_SCOPE, extractionId);
        Map<String, Object> hydrated = latest == null ? new HashMap<>(row) : new HashMap<>(latest);
        hydrated.putIfAbsent("processing_stage", "queued");
        hydrated.putIfAbsent("processing_step", "job_requested");
        hydrated.putIfAbsent("processing_error_code", null);
        hydrated.putIfAbsent("processing_error", null);
        hydrated.putIfAbsent("stt_status", "PENDING");
        return hydrated;
    }

    public Map<String, Object> completeExtractionCallback(String extractionId, String status, String errorMessage, long eventVersion) {
        return completeExtractionCallback(extractionId, status, errorMessage, eventVersion, null);
    }

    public Map<String, Object> completeExtractionCallback(String extractionId, String status, String errorMessage, long eventVersion, String audioUrl) {
        return completeExtractionCallback(extractionId, status, errorMessage, eventVersion, audioUrl, null, null, null, null, null, null);
    }

    public Map<String, Object> completeExtractionCallback(
            String extractionId,
            String status,
            String errorMessage,
            long eventVersion,
            String audioUrl,
            String processingJobId,
            String processingStage,
            String processingStep,
            String audioFormat,
            Integer sampleRate,
            Integer channels
    ) {
        if (mediaTranscriptionService == null) return null;
        return mediaTranscriptionService.completeExtractionCallback(
                extractionId,
                status,
                errorMessage,
                eventVersion,
                audioUrl,
                processingJobId,
                processingStage,
                processingStep,
                audioFormat,
                sampleRate,
                channels
        );
    }

    public Map<String, Object> pipeline(String lectureId) {
        Map<String, Object> row = store.getKv(PIPELINE_SCOPE, lectureId);
        if (row == null) {
            return buildEmptyPipeline(lectureId);
        }
        return hydratePipelineRow(row);
    }

    private Map<String, Object> buildEmptyPipeline(String lectureId) {
        Map<String, Object> empty = new HashMap<>();
        empty.put("lecture_id", lectureId);
        empty.put("status", "EMPTY");
        empty.put("audio_status", "PENDING");
        empty.put("transcript_status", "PENDING");
        empty.put("summary_status", "PENDING");
        empty.put("processing_stage", PipelineStage.IDLE.value());
        empty.put("processing_step", "not_started");
        empty.put("processing_error_code", null);
        empty.put("processing_error", null);
        empty.put("transcript_id", null);
        empty.put("note_id", null);
        empty.put("extraction_id", null);
        empty.put("updated_at", Instant.now().toString());
        return empty;
    }

    private Map<String, Object> hydratePipelineRow(Map<String, Object> row) {
        Map<String, Object> hydrated = new HashMap<>(row);
        hydrated.putIfAbsent("audio_status", "PENDING");
        hydrated.putIfAbsent("transcript_status", "PENDING");
        hydrated.putIfAbsent("summary_status", "PENDING");
        hydrated.putIfAbsent("processing_stage", PipelineStage.IDLE.value());
        hydrated.putIfAbsent("processing_step", "not_started");
        hydrated.putIfAbsent("processing_error_code", null);
        hydrated.putIfAbsent("processing_error", null);
        hydrated.putIfAbsent("transcript_id", null);
        hydrated.putIfAbsent("note_id", null);
        hydrated.putIfAbsent("extraction_id", null);
        hydrated.putIfAbsent("updated_at", Instant.now().toString());
        return hydrated;
    }

    public Map<String, Object> summarizeLecture(String lectureId, String style, String language) {
        Map<String, Object> note = new HashMap<>();
        note.put("id", UUID.randomUUID().toString());
        note.put("lecture_id", lectureId);
        note.put("title", "자동 요약 노트");
        note.put("content", "Spring 백엔드에서 생성한 요약입니다.");
        note.put("key_concepts", List.of("핵심 개념", "핵심 정리"));
        note.put("keywords", List.of("spring", "summary"));
        note.put("timestamps", List.of(Map.of("start_ms", 0, "end_ms", 30000, "label", "인트로")));
        note.put("style", style == null || style.isBlank() ? "brief" : style);
        note.put("language", language == null || language.isBlank() ? "ko" : language);
        note.put("created_at", Instant.now().toString());
        store.insertEvent(MEDIA_NOTE_SCOPE, lectureId, String.valueOf(note.get("id")), note);
        return note;
    }

    public List<Map<String, Object>> notes(String lectureId) {
        return store.listEventsByOwner(MEDIA_NOTE_SCOPE, lectureId);
    }

    public Map<String, Object> mediaAsset(String assetKey) {
        return store.getKv(MEDIA_ASSET_SCOPE, assetKey);
    }

    public Map<String, Object> createShortformExtraction(String userId, Map<String, Object> payload) {
        return shortformService == null ? Map.of() : shortformService.createShortformExtraction(userId, payload);
    }

    public Map<String, Object> getShortformExtraction(String id) {
        return shortformService == null ? null : shortformService.getShortformExtraction(id);
    }

    public Map<String, Object> selectShortformCandidates(String extractionId, List<String> candidateIds) {
        return shortformService == null ? null : shortformService.selectShortformCandidates(extractionId, candidateIds);
    }

    public Map<String, Object> composeShortform(String userId, Map<String, Object> payload) {
        return shortformService == null ? Map.of() : shortformService.composeShortform(userId, payload);
    }

    public Map<String, Object> shortformVideo(String id) {
        return shortformService == null ? null : shortformService.shortformVideo(id);
    }

    public List<Map<String, Object>> shortformVideos(String userId) {
        return shortformService == null ? List.of() : shortformService.shortformVideos(userId);
    }

    public Map<String, Object> shareShortform(String userId, Map<String, Object> payload) {
        return shortformService == null ? null : shortformService.shareShortform(userId, payload);
    }

    public Map<String, Object> saveShortform(String userId, Map<String, Object> payload) {
        return shortformService == null ? null : shortformService.saveShortform(userId, payload);
    }

    public Map<String, Object> toggleShortformLike(String userId, String videoId) {
        return shortformService == null ? null : shortformService.toggleShortformLike(userId, videoId);
    }

    public Map<String, Object> retryShortformExport(String userId, String shortformId) {
        return shortformService == null ? null : shortformService.retryShortformExport(userId, shortformId);
    }

    public Map<String, Object> applyShortformExportCallback(String shortformId, String status, long eventVersion, String videoUrl, String errorMessage) {
        return shortformService == null ? null : shortformService.applyShortformExportCallback(shortformId, status, eventVersion, videoUrl, errorMessage);
    }

    public List<Map<String, Object>> shortformLibrary(String userId) {
        return shortformService == null ? List.of() : shortformService.shortformLibrary(userId);
    }

    public List<Map<String, Object>> shortformCommunity(String courseId) {
        return shortformService == null ? List.of() : shortformService.shortformCommunity(courseId);
    }

    public Map<String, Object> customCompose(String userId, Map<String, Object> payload) {
        return customCourseService == null ? Map.of() : customCourseService.customCompose(userId, payload);
    }

    public List<Map<String, Object>> myCustomCourses(String userId) {
        return customCourseService == null ? List.of() : customCourseService.myCustomCourses(userId);
    }

    public Map<String, Object> customCourse(String id) {
        return customCourseService == null ? null : customCourseService.customCourse(id);
    }

    public List<Map<String, Object>> communityCustomCourses(String courseId) {
        return customCourseService == null ? List.of() : customCourseService.communityCustomCourses(courseId);
    }

    public Map<String, Object> getAdminAssignment(String courseId) {
        return adminAssignmentService == null ? Map.of("course_id", courseId, "student_ids", List.of(), "updated_at", Instant.now().toString()) : adminAssignmentService.getAdminAssignment(courseId);
    }

    public Map<String, Object> saveAdminAssignment(String actorUserId, String courseId, List<String> studentIds) {
        return adminAssignmentService == null ? Map.of() : adminAssignmentService.saveAdminAssignment(actorUserId, courseId, studentIds);
    }

}
