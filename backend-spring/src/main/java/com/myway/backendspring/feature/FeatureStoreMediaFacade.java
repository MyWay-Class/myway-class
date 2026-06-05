package com.myway.backendspring.feature;

import com.myway.backendspring.feature.media.MediaProcessingService;
import com.myway.backendspring.feature.media.MediaTranscriptionService;
import com.myway.backendspring.persistence.FeatureJdbcStore;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class FeatureStoreMediaFacade {
    private static final String TRANSCRIPT_SCOPE = "media_transcript";
    private static final String EXTRACTION_SCOPE = "media_extraction";
    private static final String PIPELINE_SCOPE = "media_pipeline";
    private static final String MEDIA_NOTE_SCOPE = "media_note";
    private static final String MEDIA_ASSET_SCOPE = "media_asset";

    private final FeatureJdbcStore store;
    private final MediaProcessingService mediaProcessingService;
    private final MediaTranscriptionService mediaTranscriptionService;
    private final FeatureStorePipelineSupport pipelineSupport;
    private final FeatureStorePayloadSupport payloadSupport;
    private final FeatureStoreTranscribeSupport transcribeSupport;
    private final FeatureStoreRagSupport ragSupport;
    private final FeatureStoreMediaOpsSupport mediaOpsSupport;
    private final FeatureStoreReadSupport readSupport;
    private final FeatureStoreExtractionReadSupport extractionReadSupport;
    private final FeatureStoreExtractionCallbackSupport extractionCallbackSupport;
    private final FeatureStoreNoteSupport noteSupport;
    private final FeatureStoreAssetSupport assetSupport;

    public FeatureStoreMediaFacade(
            FeatureJdbcStore store,
            MediaProcessingService mediaProcessingService,
            MediaTranscriptionService mediaTranscriptionService,
            FeatureStorePipelineSupport pipelineSupport,
            FeatureStorePayloadSupport payloadSupport,
            FeatureStoreTranscribeSupport transcribeSupport,
            FeatureStoreRagSupport ragSupport,
            FeatureStoreMediaOpsSupport mediaOpsSupport,
            FeatureStoreReadSupport readSupport,
            FeatureStoreExtractionReadSupport extractionReadSupport,
            FeatureStoreExtractionCallbackSupport extractionCallbackSupport,
            FeatureStoreNoteSupport noteSupport,
            FeatureStoreAssetSupport assetSupport
    ) {
        this.store = store;
        this.mediaProcessingService = mediaProcessingService;
        this.mediaTranscriptionService = mediaTranscriptionService;
        this.pipelineSupport = pipelineSupport;
        this.payloadSupport = payloadSupport;
        this.transcribeSupport = transcribeSupport;
        this.ragSupport = ragSupport;
        this.mediaOpsSupport = mediaOpsSupport;
        this.readSupport = readSupport;
        this.extractionReadSupport = extractionReadSupport;
        this.extractionCallbackSupport = extractionCallbackSupport;
        this.noteSupport = noteSupport;
        this.assetSupport = assetSupport;
    }

    public Map<String, Object> mediaUpload(String lectureId, String fileName) {
        return assetSupport.mediaUpload(store, MEDIA_ASSET_SCOPE, payloadSupport, lectureId, fileName);
    }

    public Map<String, Object> createExtraction(String lectureId, String audioUrl) {
        return assetSupport.createExtraction(store, EXTRACTION_SCOPE, PIPELINE_SCOPE, payloadSupport, lectureId, audioUrl);
    }

    public Map<String, Object> dispatchExtractionJob(String extractionId, String audioUrl) {
        return mediaOpsSupport.dispatchExtractionJob(mediaProcessingService, extractionId, audioUrl);
    }

    public Map<String, Object> transcript(String lectureId) {
        return readSupport.transcript(store, TRANSCRIPT_SCOPE, lectureId);
    }

    public Map<String, Object> transcribe(String lectureId, String language, Integer durationMsInput, String sttProvider, String sttModel, String audioUrl) {
        return transcribe(lectureId, language, durationMsInput, sttProvider, sttModel, audioUrl, null);
    }

    public Map<String, Object> transcribe(String lectureId, String language, Integer durationMsInput, String sttProvider, String sttModel, String audioUrl, String extractionId) {
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

    public Map<String, Object> sttProviders() {
        return mediaOpsSupport.sttProviders(mediaProcessingService);
    }

    public Map<String, Object> processorHealth() {
        return mediaOpsSupport.processorHealth(mediaProcessingService);
    }
}
