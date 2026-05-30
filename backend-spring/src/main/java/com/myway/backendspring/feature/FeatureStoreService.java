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

import java.util.List;
import java.util.Map;

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
    private final FeatureStoreMediaOpsSupport mediaOpsSupport;
    private final FeatureStoreDomainOpsSupport domainOpsSupport;
    private final FeatureStoreDomainFacade domainFacade;
    private final FeatureStoreAssetSupport assetSupport;
    private final FeatureStoreReadSupport readSupport;
    private final FeatureStoreExtractionReadSupport extractionReadSupport;
    private final FeatureStoreExtractionCallbackSupport extractionCallbackSupport;
    private final FeatureStoreNoteSupport noteSupport;

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
            FeatureStoreAiSupport aiSupport,
            FeatureStoreMediaOpsSupport mediaOpsSupport,
            FeatureStoreDomainOpsSupport domainOpsSupport,
            FeatureStoreDomainFacade domainFacade,
            FeatureStoreAssetSupport assetSupport,
            FeatureStoreReadSupport readSupport,
            FeatureStoreExtractionReadSupport extractionReadSupport,
            FeatureStoreExtractionCallbackSupport extractionCallbackSupport,
            FeatureStoreNoteSupport noteSupport
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
        this.mediaOpsSupport = mediaOpsSupport;
        this.domainOpsSupport = domainOpsSupport;
        this.domainFacade = domainFacade;
        this.assetSupport = assetSupport;
        this.readSupport = readSupport;
        this.extractionReadSupport = extractionReadSupport;
        this.extractionCallbackSupport = extractionCallbackSupport;
        this.noteSupport = noteSupport;
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
                new FeatureStoreAiSupport(),
                new FeatureStoreMediaOpsSupport(),
                new FeatureStoreDomainOpsSupport(),
                new FeatureStoreDomainFacade(new FeatureStoreDomainOpsSupport(), null, null, null),
                new FeatureStoreAssetSupport(),
                new FeatureStoreReadSupport(),
                new FeatureStoreExtractionReadSupport(),
                new FeatureStoreExtractionCallbackSupport(),
                new FeatureStoreNoteSupport()
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
        return mediaOpsSupport.sttProviders(mediaProcessingService);
    }

    public Map<String, Object> processorHealth() {
        return mediaOpsSupport.processorHealth(mediaProcessingService);
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
        return assetSupport.mediaUpload(store, MEDIA_ASSET_SCOPE, payloadSupport, lectureId, fileName);
    }

    public Map<String, Object> createExtraction(String lectureId) {
        return createExtraction(lectureId, null);
    }

    public Map<String, Object> createExtraction(String lectureId, String audioUrl) {
        return assetSupport.createExtraction(
                store,
                EXTRACTION_SCOPE,
                PIPELINE_SCOPE,
                payloadSupport,
                lectureId,
                audioUrl
        );
    }

    public Map<String, Object> dispatchExtractionJob(String extractionId, String sourceVideoUrl) {
        return mediaOpsSupport.dispatchExtractionJob(mediaProcessingService, extractionId, sourceVideoUrl);
    }

    public Map<String, Object> transcript(String lectureId) {
        return readSupport.transcript(store, TRANSCRIPT_SCOPE, lectureId);
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
        return extractionReadSupport.extractions(store, EXTRACTION_SCOPE, lectureId, pipelineSupport);
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
        return extractionCallbackSupport.complete(
                transcribeSupport,
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
        return readSupport.pipeline(store, PIPELINE_SCOPE, lectureId, pipelineSupport);
    }

    public Map<String, Object> summarizeLecture(String lectureId, String style, String language) {
        return noteSupport.summarizeLecture(store, MEDIA_NOTE_SCOPE, payloadSupport, lectureId, style, language);
    }

    public List<Map<String, Object>> notes(String lectureId) {
        return noteSupport.notes(store, MEDIA_NOTE_SCOPE, lectureId);
    }

    public Map<String, Object> mediaAsset(String assetKey) {
        return store.getKv(MEDIA_ASSET_SCOPE, assetKey);
    }

    public Map<String, Object> createShortformExtraction(String userId, Map<String, Object> payload) {
        return domainFacade.createShortformExtraction(userId, payload);
    }

    public Map<String, Object> getShortformExtraction(String id) {
        return domainFacade.getShortformExtraction(id);
    }

    public Map<String, Object> selectShortformCandidates(String extractionId, List<String> candidateIds) {
        return domainFacade.selectShortformCandidates(extractionId, candidateIds);
    }

    public Map<String, Object> composeShortform(String userId, Map<String, Object> payload) {
        return domainFacade.composeShortform(userId, payload);
    }

    public Map<String, Object> shortformVideo(String id) {
        return domainFacade.shortformVideo(id);
    }

    public List<Map<String, Object>> shortformVideos(String userId) {
        return domainFacade.shortformVideos(userId);
    }

    public Map<String, Object> shareShortform(String userId, Map<String, Object> payload) {
        return domainFacade.shareShortform(userId, payload);
    }

    public Map<String, Object> saveShortform(String userId, Map<String, Object> payload) {
        return domainFacade.saveShortform(userId, payload);
    }

    public Map<String, Object> toggleShortformLike(String userId, String videoId) {
        return domainFacade.toggleShortformLike(userId, videoId);
    }

    public Map<String, Object> retryShortformExport(String userId, String shortformId) {
        return domainFacade.retryShortformExport(userId, shortformId);
    }

    public Map<String, Object> applyShortformExportCallback(String shortformId, String status, long eventVersion, String videoUrl, String errorMessage) {
        return domainFacade.applyShortformExportCallback(shortformId, status, eventVersion, videoUrl, errorMessage);
    }

    public List<Map<String, Object>> shortformLibrary(String userId) {
        return domainFacade.shortformLibrary(userId);
    }

    public List<Map<String, Object>> shortformCommunity(String courseId) {
        return domainFacade.shortformCommunity(courseId);
    }

    public Map<String, Object> customCompose(String userId, Map<String, Object> payload) {
        return domainFacade.customCompose(userId, payload);
    }

    public List<Map<String, Object>> myCustomCourses(String userId) {
        return domainFacade.myCustomCourses(userId);
    }

    public Map<String, Object> customCourse(String id) {
        return domainFacade.customCourse(id);
    }

    public List<Map<String, Object>> communityCustomCourses(String courseId) {
        return domainFacade.communityCustomCourses(courseId);
    }

    public Map<String, Object> getAdminAssignment(String courseId) {
        return domainFacade.getAdminAssignment(courseId);
    }

    public Map<String, Object> saveAdminAssignment(String actorUserId, String courseId, List<String> studentIds) {
        return domainFacade.saveAdminAssignment(actorUserId, courseId, studentIds);
    }

}
