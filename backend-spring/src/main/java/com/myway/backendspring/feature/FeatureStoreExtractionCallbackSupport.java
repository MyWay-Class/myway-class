package com.myway.backendspring.feature;

import com.myway.backendspring.feature.media.MediaTranscriptionService;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class FeatureStoreExtractionCallbackSupport {

    public Map<String, Object> complete(
            FeatureStoreTranscribeSupport transcribeSupport,
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
}
