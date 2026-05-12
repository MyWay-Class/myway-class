package com.myway.backendspring.feature.media;

import com.myway.backendspring.feature.FeatureStoreService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class MediaPipelineService {
    private final FeatureStoreService featureStoreService;

    public MediaPipelineService(FeatureStoreService featureStoreService) {
        this.featureStoreService = featureStoreService;
    }

    public Map<String, Object> mediaUpload(String lectureId, String fileName) {
        return featureStoreService.mediaUpload(lectureId, fileName);
    }

    public Map<String, Object> createExtraction(String lectureId, String audioUrl) {
        return featureStoreService.createExtraction(lectureId, audioUrl);
    }

    public Map<String, Object> dispatchExtractionJob(String extractionId, String audioUrl) {
        return featureStoreService.dispatchExtractionJob(extractionId, audioUrl);
    }

    public Map<String, Object> transcribe(String lectureId, String language, Integer durationMs, String sttProvider, String sttModel, String audioUrl) {
        return featureStoreService.transcribe(lectureId, language, durationMs, sttProvider, sttModel, audioUrl);
    }

    public Map<String, Object> transcribe(String lectureId, String language, Integer durationMs, String sttProvider, String sttModel, String audioUrl, String extractionId) {
        return featureStoreService.transcribe(lectureId, language, durationMs, sttProvider, sttModel, audioUrl, extractionId);
    }

    public Map<String, Object> summarizeLecture(String lectureId, String style, String language) {
        return featureStoreService.summarizeLecture(lectureId, style, language);
    }

    public Map<String, Object> pipeline(String lectureId) {
        return featureStoreService.pipeline(lectureId);
    }

    public List<Map<String, Object>> extractions(String lectureId) {
        return featureStoreService.extractions(lectureId);
    }

    public Map<String, Object> transcript(String lectureId) {
        return featureStoreService.transcript(lectureId);
    }

    public List<Map<String, Object>> notes(String lectureId) {
        return featureStoreService.notes(lectureId);
    }

    public Map<String, Object> sttProviders() {
        return featureStoreService.sttProviders();
    }

    public Map<String, Object> processorHealth() {
        return featureStoreService.processorHealth();
    }

    public Map<String, Object> mediaAsset(String assetKey) {
        return featureStoreService.mediaAsset(assetKey);
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
        return featureStoreService.completeExtractionCallback(
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
}
