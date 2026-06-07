package com.myway.backendspring.feature.media;

import com.myway.backendspring.domain.ActivityEventService;
import com.myway.backendspring.feature.repository.FeatureStoreRepository;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;

@Component
public class MediaTranscriptionCallbackFacade {
    public Map<String, Object> completeExtractionCallback(
            FeatureStoreRepository repository,
            MediaTranscriptionPersistenceSupport persistenceSupport,
            MediaExtractionCallbackSupport callbackSupport,
            ActivityEventService activityEventService,
            String extractionScope,
            String pipelineScope,
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
        MediaTranscriptionPersistenceSupport.ExtractionSnapshot extraction = persistenceSupport.findExtraction(repository, extractionScope, extractionId);
        if (extraction == null) return null;
        if (callbackSupport.isStaleCallback(extraction.toMap(), eventVersion)) {
            return persistenceSupport.normalizeExtractionForResponse(callbackSupport.staleCallbackResponse(extraction.toMap()));
        }

        String now = Instant.now().toString();
        MediaStatus callbackStatus = MediaStatus.fromNullable(status, MediaStatus.COMPLETED);
        String resolvedError = callbackSupport.resolveErrorMessage(callbackStatus, errorMessage);
        Map<String, Object> mutable = extraction.toMap();
        callbackSupport.applyCallbackMetadata(
                mutable,
                eventVersion,
                callbackStatus,
                resolvedError,
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
                notificationChannel,
                now
        );
        repository.upsertKv(extractionScope, extractionId, mutable);
        MediaTranscriptionPersistenceSupport.ExtractionSnapshot applied = MediaTranscriptionPersistenceSupport.ExtractionSnapshot.from(mutable);

        String lectureId = applied.lectureId();
        if (!lectureId.isBlank()) {
            repository.upsertKv(
                    pipelineScope,
                    lectureId,
                    callbackSupport.buildPipelineFromCallback(lectureId, applied.transcriptId(), applied.id(), callbackStatus, resolvedError, now)
            );
        }
        appendActivity(activityEventService, mutable, extractionId, lectureId, callbackStatus);
        return persistenceSupport.normalizeExtractionForResponse(mutable);
    }

    private void appendActivity(
            ActivityEventService activityEventService,
            Map<String, Object> extraction,
            String extractionId,
            String lectureId,
            MediaStatus status
    ) {
        if (activityEventService == null) return;
        String userId = String.valueOf(extraction.getOrDefault("user_id", "")).trim();
        if (userId.isBlank()) return;
        activityEventService.append(
                userId,
                "media_extraction_" + status.name().toLowerCase(),
                "extraction",
                extractionId,
                Map.of("lecture_id", lectureId, "status", status.name())
        );
    }
}
