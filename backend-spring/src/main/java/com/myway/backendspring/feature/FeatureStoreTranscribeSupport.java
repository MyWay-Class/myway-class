package com.myway.backendspring.feature;

import com.myway.backendspring.feature.media.MediaTranscriptionService;
import com.myway.backendspring.persistence.FeatureJdbcStore;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class FeatureStoreTranscribeSupport {
    private static final String EXTRACTION_SCOPE = "media_extraction";

    public Map<String, Object> resolveExtractionForTranscription(
            FeatureJdbcStore store,
            String lectureId,
            String audioUrl,
            String extractionId,
            ExtractionFactory extractionFactory
    ) {
        if (extractionId == null || extractionId.isBlank()) {
            return extractionFactory.create(lectureId, audioUrl);
        }
        Map<String, Object> extraction = store.getKv(EXTRACTION_SCOPE, extractionId);
        return extraction != null ? extraction : extractionFactory.create(lectureId, audioUrl);
    }

    public Map<String, Object> runTranscription(
            MediaTranscriptionService mediaTranscriptionService,
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

    public Map<String, Object> completeExtractionCallback(
            MediaTranscriptionService mediaTranscriptionService,
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
                channels,
                syncMode,
                overwritePolicy,
                approvalState,
                notificationChannel
        );
    }

    @FunctionalInterface
    public interface ExtractionFactory {
        Map<String, Object> create(String lectureId, String audioUrl);
    }
}
