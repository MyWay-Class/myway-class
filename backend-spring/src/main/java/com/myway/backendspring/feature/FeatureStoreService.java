package com.myway.backendspring.feature;

import com.myway.backendspring.feature.ai.AiFeatureService;
import com.myway.backendspring.feature.repository.FeatureStoreRepository;
import com.myway.backendspring.persistence.FeatureJdbcStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class FeatureStoreService {
    private final FeatureStoreAiFacade aiFacade;
    private final FeatureStoreMediaFacade mediaFacade;

    @Autowired
    public FeatureStoreService(
            FeatureStoreAiFacade aiFacade,
            FeatureStoreMediaFacade mediaFacade
    ) {
        this.aiFacade = aiFacade;
        this.mediaFacade = mediaFacade;
    }

    public FeatureStoreService(FeatureJdbcStore store, int shortformMaxRetry) {
        this(
                new FeatureStoreAiFacade(new FeatureStoreAiSupport(), new AiFeatureService(new FeatureStoreRepository(store), null, null, null, "dev")),
                new FeatureStoreMediaFacade(
                        store,
                        null,
                        null,
                        new FeatureStorePipelineSupport(),
                        new FeatureStorePayloadSupport(),
                        new FeatureStoreTranscribeSupport(),
                        new FeatureStoreRagSupport(),
                        new FeatureStoreMediaOpsSupport(),
                        new FeatureStoreReadSupport(),
                        new FeatureStoreExtractionReadSupport(),
                        new FeatureStoreExtractionCallbackSupport(),
                        new FeatureStoreNoteSupport(),
                        new FeatureStoreAssetSupport()
                )
        );
    }

    public Map<String, Object> aiInsights(String userId) {
        return aiFacade.aiInsights(userId);
    }

    public Map<String, Object> aiLogs(String userId) {
        return aiFacade.aiLogs(userId);
    }

    public Map<String, Object> aiRecommendations(String userId) {
        return aiFacade.aiRecommendations(userId);
    }

    public Map<String, Object> aiSettings(String userId) {
        return aiFacade.aiSettings(userId);
    }

    public Map<String, Object> updateAiSettings(String userId, Map<String, Object> patch) {
        return aiFacade.updateAiSettings(userId, patch);
    }

    public Map<String, Object> aiProviders(String userId) {
        return aiFacade.aiProviders(userId);
    }

    public boolean canConsumeAi(String userId) {
        return aiFacade.canConsumeAi(userId);
    }

    public void recordAiUsage(String userId, String feature, boolean success, String inputText) {
        aiFacade.recordAiUsage(userId, feature, success, inputText);
    }

    public Map<String, Object> sttProviders() {
        return mediaFacade.sttProviders();
    }

    public Map<String, Object> processorHealth() {
        return mediaFacade.processorHealth();
    }

    public Map<String, Object> mediaUpload(String lectureId, String fileName) {
        return mediaFacade.mediaUpload(lectureId, fileName);
    }

    public Map<String, Object> createExtraction(String lectureId) {
        return createExtraction(lectureId, null);
    }

    public Map<String, Object> createExtraction(String lectureId, String audioUrl) {
        return mediaFacade.createExtraction(lectureId, audioUrl);
    }

    public Map<String, Object> dispatchExtractionJob(String extractionId, String audioUrl) {
        return mediaFacade.dispatchExtractionJob(extractionId, audioUrl);
    }

    public Map<String, Object> transcript(String lectureId) {
        return mediaFacade.transcript(lectureId);
    }

    public Map<String, Object> transcribe(String lectureId, String language, Integer durationMsInput, String sttProvider, String sttModel) {
        return transcribe(lectureId, language, durationMsInput, sttProvider, sttModel, null);
    }

    public Map<String, Object> transcribe(String lectureId, String language, Integer durationMsInput, String sttProvider, String sttModel, String audioUrl) {
        return transcribe(lectureId, language, durationMsInput, sttProvider, sttModel, audioUrl, null);
    }

    public Map<String, Object> transcribe(String lectureId, String language, Integer durationMsInput, String sttProvider, String sttModel, String audioUrl, String extractionId) {
        return mediaFacade.transcribe(lectureId, language, durationMsInput, sttProvider, sttModel, audioUrl, extractionId);
    }

    public List<Map<String, Object>> extractions(String lectureId) {
        return mediaFacade.extractions(lectureId);
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
        return mediaFacade.completeExtractionCallback(
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
        return mediaFacade.pipeline(lectureId);
    }

    public Map<String, Object> summarizeLecture(String lectureId, String style, String language) {
        return mediaFacade.summarizeLecture(lectureId, style, language);
    }

    public List<Map<String, Object>> notes(String lectureId) {
        return mediaFacade.notes(lectureId);
    }

    public Map<String, Object> mediaAsset(String assetKey) {
        return mediaFacade.mediaAsset(assetKey);
    }
}
