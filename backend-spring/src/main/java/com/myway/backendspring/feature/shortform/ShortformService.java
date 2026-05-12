package com.myway.backendspring.feature.shortform;

import com.myway.backendspring.feature.FeatureStoreService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class ShortformService {
    private final FeatureStoreService featureStoreService;

    public ShortformService(FeatureStoreService featureStoreService) {
        this.featureStoreService = featureStoreService;
    }

    public List<Map<String, Object>> shortformLibrary(String userId) { return featureStoreService.shortformLibrary(userId); }
    public List<Map<String, Object>> shortformCommunity(String courseId) { return featureStoreService.shortformCommunity(courseId); }
    public Map<String, Object> createShortformExtraction(String userId, Map<String, Object> payload) { return featureStoreService.createShortformExtraction(userId, payload); }
    public Map<String, Object> selectShortformCandidates(String extractionId, List<String> candidateIds) { return featureStoreService.selectShortformCandidates(extractionId, candidateIds); }
    public Map<String, Object> getShortformExtraction(String id) { return featureStoreService.getShortformExtraction(id); }
    public Map<String, Object> composeShortform(String userId, Map<String, Object> payload) { return featureStoreService.composeShortform(userId, payload); }
    public Map<String, Object> shortformVideo(String id) { return featureStoreService.shortformVideo(id); }
    public List<Map<String, Object>> shortformVideos(String userId) { return featureStoreService.shortformVideos(userId); }
    public Map<String, Object> shareShortform(String userId, Map<String, Object> payload) { return featureStoreService.shareShortform(userId, payload); }
    public Map<String, Object> saveShortform(String userId, Map<String, Object> payload) { return featureStoreService.saveShortform(userId, payload); }
    public Map<String, Object> toggleShortformLike(String userId, String videoId) { return featureStoreService.toggleShortformLike(userId, videoId); }
    public Map<String, Object> retryShortformExport(String userId, String shortformId) { return featureStoreService.retryShortformExport(userId, shortformId); }
    public Map<String, Object> applyShortformExportCallback(String shortformId, String status, long eventVersion, String videoUrl, String errorMessage) {
        return featureStoreService.applyShortformExportCallback(shortformId, status, eventVersion, videoUrl, errorMessage);
    }
}
