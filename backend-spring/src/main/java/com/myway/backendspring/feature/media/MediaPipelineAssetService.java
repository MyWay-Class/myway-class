package com.myway.backendspring.feature.media;

import com.myway.backendspring.feature.repository.FeatureStoreRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class MediaPipelineAssetService {
    private static final String MEDIA_ASSET_SCOPE = "media_asset";
    private static final String LECTURE_VIDEO_ASSET_SCOPE = "lecture_video_asset";
    private static final String MEDIA_BATCH_STATUS_SCOPE = "media_batch_status";

    private final FeatureStoreRepository repository;
    private final MediaPipelineQuerySupport querySupport;

    public MediaPipelineAssetService(FeatureStoreRepository repository, MediaPipelineQuerySupport querySupport) {
        this.repository = repository;
        this.querySupport = querySupport;
    }

    public Map<String, Object> mediaUpload(String lectureId, String fileName) {
        String key = "asset/" + lectureId + "/" + UUID.randomUUID();
        Map<String, Object> payload = Map.of(
                "lecture_id", lectureId,
                "asset_key", key,
                "video_url", "/api/v1/media/assets/" + key,
                "file_name", fileName
        );
        repository.upsertKv(MEDIA_ASSET_SCOPE, key, payload);
        upsertLectureVideoAssetMapping(lectureId, key);
        return payload;
    }

    public Map<String, Object> mediaAsset(String assetKey) {
        return repository.getKv(MEDIA_ASSET_SCOPE, assetKey);
    }

    public Map<String, Object> bindLectureVideoAsset(String lectureId, String assetKey, String videoUrl) {
        String normalizedLectureId = lectureId == null ? "" : lectureId.trim();
        String normalizedAssetKey = assetKey == null ? "" : assetKey.trim();
        if (normalizedLectureId.isBlank() || normalizedAssetKey.isBlank()) return null;
        String resolvedVideoUrl = (videoUrl == null || videoUrl.trim().isBlank())
                ? "/api/v1/media/assets/" + normalizedAssetKey
                : videoUrl.trim();
        Map<String, Object> payload = new HashMap<>();
        payload.put("lecture_id", normalizedLectureId);
        payload.put("asset_key", normalizedAssetKey);
        payload.put("video_url", resolvedVideoUrl);
        payload.put("updated_at", Instant.now().toString());
        repository.upsertKv(LECTURE_VIDEO_ASSET_SCOPE, normalizedLectureId, payload);
        return payload;
    }

    public Map<String, Object> lectureVideoAsset(String lectureId) {
        if (lectureId == null || lectureId.isBlank()) return null;
        return repository.getKv(LECTURE_VIDEO_ASSET_SCOPE, lectureId.trim());
    }

    public void upsertMediaAsset(String assetKey, String lectureId) {
        repository.upsertKv(MEDIA_ASSET_SCOPE, assetKey, Map.of(
                "lecture_id", lectureId,
                "asset_key", assetKey,
                "video_url", "/api/v1/media/assets/" + assetKey,
                "file_name", "auto-mapped.mp4",
                "updated_at", Instant.now().toString()
        ));
    }

    public void upsertLectureVideoAssetMapping(String lectureId, String assetKey) {
        bindLectureVideoAsset(lectureId, assetKey, null);
    }

    public Map<String, Object> lectureVideoAssetMapping(String lectureId) {
        return repository.getKv(LECTURE_VIDEO_ASSET_SCOPE, lectureId);
    }

    public Map<String, String> lectureVideoAssetMap() {
        return querySupport.lectureVideoAssetMap(repository, LECTURE_VIDEO_ASSET_SCOPE);
    }

    public void upsertBatchStatus(Map<String, Object> payload) {
        repository.upsertKv(MEDIA_BATCH_STATUS_SCOPE, "pipeline", payload);
    }

    public Map<String, Object> batchStatus() {
        return repository.getKv(MEDIA_BATCH_STATUS_SCOPE, "pipeline");
    }
}
