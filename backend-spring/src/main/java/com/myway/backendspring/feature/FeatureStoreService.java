package com.myway.backendspring.feature;

import com.myway.backendspring.feature.admin.AdminAssignmentService;
import com.myway.backendspring.feature.ai.AiFeatureService;
import com.myway.backendspring.feature.course.CustomCourseService;
import com.myway.backendspring.feature.media.MediaProcessingService;
import com.myway.backendspring.feature.media.MediaTranscriptionService;
import com.myway.backendspring.feature.repository.FeatureStoreRepository;
import com.myway.backendspring.feature.rag.RagService;
import com.myway.backendspring.feature.shortform.ShortformService;
import com.myway.backendspring.persistence.FeatureJdbcStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
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
    private final FeatureJdbcStore store;
    private final RagService ragService;
    private final ShortformService shortformService;
    private final AiFeatureService aiFeatureService;
    private final MediaProcessingService mediaProcessingService;
    private final MediaTranscriptionService mediaTranscriptionService;
    private final CustomCourseService customCourseService;
    private final AdminAssignmentService adminAssignmentService;
    private final FeatureStorePipelineSupport pipelineSupport;
    private final FeatureStorePayloadSupport payloadSupport;
    private final FeatureStoreTranscribeSupport transcribeSupport;
    private final FeatureStoreRagSupport ragSupport;
    private final FeatureStoreAiSupport aiSupport;

    @Autowired
    public FeatureStoreService(
            FeatureJdbcStore store,
            RagService ragService,
            ShortformService shortformService,
            AiFeatureService aiFeatureService,
            MediaProcessingService mediaProcessingService,
            MediaTranscriptionService mediaTranscriptionService,
            CustomCourseService customCourseService,
            AdminAssignmentService adminAssignmentService,
            FeatureStorePipelineSupport pipelineSupport,
            FeatureStorePayloadSupport payloadSupport,
            FeatureStoreTranscribeSupport transcribeSupport,
            FeatureStoreRagSupport ragSupport,
            FeatureStoreAiSupport aiSupport
    ) {
        this.store = store;
        this.ragService = ragService;
        this.shortformService = shortformService;
        this.aiFeatureService = aiFeatureService;
        this.mediaProcessingService = mediaProcessingService;
        this.mediaTranscriptionService = mediaTranscriptionService;
        this.customCourseService = customCourseService;
        this.adminAssignmentService = adminAssignmentService;
        this.pipelineSupport = pipelineSupport;
        this.payloadSupport = payloadSupport;
        this.transcribeSupport = transcribeSupport;
        this.ragSupport = ragSupport;
        this.aiSupport = aiSupport;
    }

    // Backward-compatible constructor for tests instantiating service directly.
    public FeatureStoreService(FeatureJdbcStore store, int shortformMaxRetry) {
        this(
                store,
                null,
                null,
                new AiFeatureService(new FeatureStoreRepository(store), null, null, null, "dev"),
                null,
                null,
                null,
                null,
                new FeatureStorePipelineSupport(),
                new FeatureStorePayloadSupport(),
                new FeatureStoreTranscribeSupport(),
                new FeatureStoreRagSupport(),
                new FeatureStoreAiSupport()
        );
    }

    public Map<String, Object> aiInsights(String userId) {
        return aiSupport.aiInsights(aiFeatureService, userId);
    }

    public Map<String, Object> aiLogs(String userId) {
        return aiSupport.aiLogs(aiFeatureService, userId);
    }

    public Map<String, Object> aiRecommendations(String userId) {
        return aiSupport.aiRecommendations(aiFeatureService, userId);
    }

    public Map<String, Object> aiSettings(String userId) {
        return aiSupport.aiSettings(aiFeatureService, userId);
    }

    public Map<String, Object> updateAiSettings(String userId, Map<String, Object> patch) {
        return aiSupport.updateAiSettings(aiFeatureService, userId, patch);
    }

    public Map<String, Object> aiProviders(String userId) {
        return aiSupport.aiProviders(aiFeatureService, userId);
    }

    public Map<String, Object> sttProviders() {
        return mediaProcessingService == null ? Map.of("generated_at", Instant.now().toString(), "providers", List.of(), "plans", List.of()) : mediaProcessingService.sttProviders();
    }

    public Map<String, Object> processorHealth() {
        return mediaProcessingService == null ? Map.of("ok", false, "jobs", Map.of("total", 0, "processing", 0, "completed", 0, "failed", 0), "recent_jobs", List.of(), "updated_at", Instant.now().toString()) : mediaProcessingService.processorHealth();
    }

    public boolean canConsumeAi(String userId) {
        return aiSupport.canConsumeAi(aiFeatureService, userId);
    }

    public void recordAiUsage(String userId, String feature, boolean success, String inputText) {
        aiSupport.recordAiUsage(aiFeatureService, userId, feature, success, inputText);
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
        return ragSupport.ragOverview(ragService, query, lectureId, courseId, limit, minScore, includeDebug);
    }

    public Map<String, Object> ragIndexOverview(String lectureId, String courseId) {
        return ragSupport.ragIndexOverview(ragService, lectureId, courseId);
    }

    public Map<String, Object> rebuildRagIndex(String lectureId, String courseId) {
        return ragSupport.rebuildRagIndex(ragService, lectureId, courseId);
    }

    public Map<String, Object> clearRagIndex(String lectureId, String courseId) {
        return ragSupport.clearRagIndex(ragService, lectureId, courseId);
    }

    public Map<String, Object> evaluateRagBatch(List<Map<String, Object>> cases, Integer topK) {
        return ragSupport.evaluateRagBatch(ragService, cases, topK);
    }

    public Map<String, Object> mediaUpload(String lectureId, String fileName) {
        String key = "asset/" + lectureId + "/" + UUID.randomUUID();
        Map<String, Object> payload = payloadSupport.mediaUploadPayload(
                lectureId, key, "/api/v1/media/assets/" + key, fileName
        );
        store.upsertKv(MEDIA_ASSET_SCOPE, key, payload);
        return payload;
    }

    public Map<String, Object> createExtraction(String lectureId) {
        return createExtraction(lectureId, null);
    }

    public Map<String, Object> createExtraction(String lectureId, String audioUrl) {
        String id = UUID.randomUUID().toString();
        String now = Instant.now().toString();
        Map<String, Object> item = payloadSupport.extractionSeed(id, lectureId, audioUrl, now);

        store.insertEvent(EXTRACTION_SCOPE, lectureId, id, item);
        store.upsertKv(EXTRACTION_SCOPE, id, item);
        Map<String, Object> pipeline = payloadSupport.pipelineSeed(lectureId, id, now);
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
        Map<String, Object> extraction = transcribeSupport.resolveExtractionForTranscription(
                store,
                lectureId,
                audioUrl,
                extractionId,
                this::createExtraction
        );
        return transcribeSupport.runTranscription(
                mediaTranscriptionService,
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
        return pipelineSupport.hydrateExtractionRow(row, latest);
    }

    public Map<String, Object> completeExtractionCallback(String extractionId, String status, String errorMessage, long eventVersion) {
        return completeExtractionCallback(extractionId, status, errorMessage, eventVersion, null);
    }

    public Map<String, Object> completeExtractionCallback(String extractionId, String status, String errorMessage, long eventVersion, String audioUrl) {
        return completeExtractionCallback(
                extractionId, status, errorMessage, eventVersion, audioUrl,
                null, null, null, null, null, null, null, null, null, null
        );
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
            Integer channels,
            String syncMode,
            String overwritePolicy,
            String approvalState,
            String notificationChannel
    ) {
        if (mediaTranscriptionService == null) return null;
        return transcribeSupport.completeExtractionCallback(
                mediaTranscriptionService,
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
                channels,
                syncMode,
                overwritePolicy,
                approvalState,
                notificationChannel
        );
    }

    public Map<String, Object> pipeline(String lectureId) {
        Map<String, Object> row = store.getKv(PIPELINE_SCOPE, lectureId);
        if (row == null) {
            return pipelineSupport.buildEmptyPipeline(lectureId);
        }
        return pipelineSupport.hydratePipelineRow(row);
    }

    public Map<String, Object> summarizeLecture(String lectureId, String style, String language) {
        Map<String, Object> note = payloadSupport.lectureSummaryNotePayload(
                UUID.randomUUID().toString(),
                lectureId,
                payloadSupport.normalizeOrDefault(style, "brief"),
                payloadSupport.normalizeOrDefault(language, "ko"),
                Instant.now().toString()
        );
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
