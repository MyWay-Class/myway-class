package com.myway.backendspring.feature.shortform;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.myway.backendspring.domain.ActivityEventService;
import com.myway.backendspring.feature.repository.FeatureStoreRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ShortformService {
    private static final String SHORTFORM_EXTRACTION_SCOPE = "shortform_extraction";
    private static final String SHORTFORM_VIDEO_SCOPE = "shortform_video";
    private static final String SHORTFORM_SAVE_SCOPE = "shortform_save";
    private static final String SHORTFORM_SHARE_SCOPE = "shortform_share";
    private static final String SHORTFORM_LIKE_SCOPE = "shortform_like";
    private static final String LECTURE_VIDEO_ASSET_SCOPE = "lecture_video_asset";

    private final FeatureStoreRepository repository;
    private final ActivityEventService activityEventService;
    private final int shortformMaxRetry;
    private final String mediaProcessorUrl;
    private final String mediaProcessorToken;
    private final String mediaPublicBaseUrl;
    private final String shortformCallbackToken;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ShortformService(
            FeatureStoreRepository repository,
            ActivityEventService activityEventService,
            @Value("${myway.shortform.retry.max-attempts:3}") int shortformMaxRetry,
            @Value("${myway.media.processor.url:}") String mediaProcessorUrl,
            @Value("${myway.media.processor.token:}") String mediaProcessorToken,
            @Value("${myway.media.public-base-url:http://127.0.0.1:8787}") String mediaPublicBaseUrl,
            @Value("${myway.shortform.callback.token:dev-shortform-callback-token}") String shortformCallbackToken
    ) {
        this.repository = repository;
        this.activityEventService = activityEventService;
        this.shortformMaxRetry = Math.max(1, shortformMaxRetry);
        this.mediaProcessorUrl = mediaProcessorUrl == null ? "" : mediaProcessorUrl.trim();
        this.mediaProcessorToken = mediaProcessorToken == null ? "" : mediaProcessorToken.trim();
        this.mediaPublicBaseUrl = mediaPublicBaseUrl == null ? "http://127.0.0.1:8787" : mediaPublicBaseUrl.trim();
        this.shortformCallbackToken = shortformCallbackToken == null ? "dev-shortform-callback-token" : shortformCallbackToken.trim();
    }

    public List<Map<String, Object>> shortformLibrary(String userId) {
        return repository.listEventsByOwner(SHORTFORM_VIDEO_SCOPE + "_library", userId);
    }

    public List<Map<String, Object>> shortformCommunity(String courseId) {
        return repository.listEventsByScope(SHORTFORM_VIDEO_SCOPE + "_community");
    }

    public Map<String, Object> createShortformExtraction(String userId, Map<String, Object> payload) {
        String id = UUID.randomUUID().toString();
        Map<String, Object> data = new HashMap<>();
        data.put("id", id);
        data.put("user_id", userId);
        data.put("course_id", payload.getOrDefault("course_id", "crs_java_01"));
        data.put("mode", payload.getOrDefault("mode", "cross"));
        data.put("candidates", List.of(Map.of("id", "cand-1", "selected", true), Map.of("id", "cand-2", "selected", false)));
        repository.upsertKv(SHORTFORM_EXTRACTION_SCOPE, id, data);
        return data;
    }

    public Map<String, Object> selectShortformCandidates(String extractionId, List<String> candidateIds) {
        Map<String, Object> extraction = repository.getKv(SHORTFORM_EXTRACTION_SCOPE, extractionId);
        if (extraction == null) {
            return null;
        }
        Object rawCandidates = extraction.get("candidates");
        if (rawCandidates instanceof List<?> list) {
            List<Map<String, Object>> updated = new ArrayList<>();
            for (Object item : list) {
                if (item instanceof Map<?, ?> map) {
                    Map<String, Object> candidate = new HashMap<>();
                    for (Map.Entry<?, ?> entry : map.entrySet()) {
                        candidate.put(String.valueOf(entry.getKey()), entry.getValue());
                    }
                    String candidateId = String.valueOf(candidate.getOrDefault("id", ""));
                    candidate.put("selected", candidateIds.contains(candidateId));
                    updated.add(candidate);
                }
            }
            extraction.put("candidates", updated);
        }
        repository.upsertKv(SHORTFORM_EXTRACTION_SCOPE, extractionId, extraction);
        return extraction;
    }

    public Map<String, Object> getShortformExtraction(String id) {
        return repository.getKv(SHORTFORM_EXTRACTION_SCOPE, id);
    }

    public Map<String, Object> composeShortform(String userId, Map<String, Object> payload) {
        String id = UUID.randomUUID().toString();
        String courseId = String.valueOf(payload.getOrDefault("course_id", "")).trim();
        List<Map<String, Object>> normalizedClips = normalizeComposeClips(payload.get("clips"), courseId);
        Map<String, Object> exportPayload = buildShortformExportPayload(id, payload, courseId, normalizedClips);
        Map<String, Object> video = new HashMap<>();
        video.put("id", id);
        video.put("user_id", userId);
        video.put("title", payload.getOrDefault("title", "untitled"));
        video.put("description", payload.getOrDefault("description", ""));
        video.put("course_id", courseId);
        video.put("clips", normalizedClips);
        video.put("video_url", null);
        video.put("export_status", "PROCESSING");
        video.put("retry_count", 0);
        video.put("last_event_version", 0L);
        video.put("export_result_url", null);
        video.put("export_job_id", "job_" + id);
        video.put("export_job_payload", exportPayload);
        video.put("export_dispatch_todo", false);
        video.put("error_message", null);
        video.put("updated_at", Instant.now().toString());
        dispatchShortformExportJob(video);
        repository.upsertKv(SHORTFORM_VIDEO_SCOPE, id, video);
        repository.insertEvent(SHORTFORM_VIDEO_SCOPE + "_library", userId, id, video);
        repository.insertEvent(SHORTFORM_VIDEO_SCOPE + "_community", "all", id, video);
        if (activityEventService != null) {
            activityEventService.append(userId, "shortform_created", "shortform", id,
                    Map.of("course_id", String.valueOf(video.getOrDefault("course_id", ""))));
        }
        return video;
    }

    public Map<String, Object> shortformVideo(String id) {
        return repository.getKv(SHORTFORM_VIDEO_SCOPE, id);
    }

    public List<Map<String, Object>> shortformVideos(String userId) {
        return repository.listKvByScope(SHORTFORM_VIDEO_SCOPE).stream()
                .filter(video -> userId.equals(String.valueOf(video.getOrDefault("user_id", ""))))
                .toList();
    }

    public Map<String, Object> shareShortform(String userId, Map<String, Object> payload) {
        String videoId = String.valueOf(payload.getOrDefault("video_id", "")).trim();
        String courseId = String.valueOf(payload.getOrDefault("course_id", "")).trim();
        if (videoId.isEmpty() || courseId.isEmpty()) {
            return null;
        }
        Map<String, Object> video = shortformVideo(videoId);
        if (video == null) {
            return null;
        }
        Map<String, Object> row = new HashMap<>();
        row.put("id", UUID.randomUUID().toString());
        row.put("video_id", videoId);
        row.put("course_id", courseId);
        row.put("user_id", userId);
        row.put("visibility", payload.getOrDefault("visibility", "course"));
        row.put("message", payload.get("message"));
        row.put("created_at", Instant.now().toString());
        repository.insertEvent(SHORTFORM_SHARE_SCOPE, userId, String.valueOf(row.get("id")), row);
        if (activityEventService != null) {
            activityEventService.append(userId, "shortform_shared", "shortform", videoId, Map.of("course_id", courseId));
        }
        return row;
    }

    public Map<String, Object> saveShortform(String userId, Map<String, Object> payload) {
        String videoId = String.valueOf(payload.getOrDefault("video_id", "")).trim();
        if (videoId.isEmpty() || shortformVideo(videoId) == null) {
            return null;
        }
        String key = userId + ":" + videoId;
        Map<String, Object> row = new HashMap<>();
        row.put("id", key);
        row.put("user_id", userId);
        row.put("video_id", videoId);
        row.put("note", payload.get("note"));
        row.put("folder", payload.get("folder"));
        row.put("saved", true);
        row.put("updated_at", Instant.now().toString());
        repository.upsertKv(SHORTFORM_SAVE_SCOPE, key, row);
        if (activityEventService != null) {
            activityEventService.append(userId, "shortform_saved", "shortform", videoId,
                    Map.of("folder", String.valueOf(payload.getOrDefault("folder", ""))));
        }
        return row;
    }

    public Map<String, Object> toggleShortformLike(String userId, String videoId) {
        if (videoId == null || videoId.isBlank() || shortformVideo(videoId) == null) {
            return null;
        }
        String key = userId + ":" + videoId;
        Map<String, Object> current = repository.getKv(SHORTFORM_LIKE_SCOPE, key);
        boolean next = current == null || !Boolean.TRUE.equals(current.get("liked"));
        Map<String, Object> row = new HashMap<>();
        row.put("id", key);
        row.put("user_id", userId);
        row.put("video_id", videoId);
        row.put("liked", next);
        row.put("updated_at", Instant.now().toString());
        repository.upsertKv(SHORTFORM_LIKE_SCOPE, key, row);
        if (activityEventService != null) {
            activityEventService.append(userId, next ? "shortform_liked" : "shortform_unliked", "shortform", videoId, Map.of());
        }
        return row;
    }

    public Map<String, Object> retryShortformExport(String userId, String shortformId) {
        Map<String, Object> video = repository.getKv(SHORTFORM_VIDEO_SCOPE, shortformId);
        if (video == null) return null;
        if (!userId.equals(String.valueOf(video.getOrDefault("user_id", "")))) {
            return Map.of("error", "FORBIDDEN");
        }
        int retryCount = asInt(video.get("retry_count"));
        if (retryCount >= shortformMaxRetry) {
            video.put("export_status", "FAILED_PERMANENT");
            video.put("updated_at", Instant.now().toString());
            repository.upsertKv(SHORTFORM_VIDEO_SCOPE, shortformId, video);
            return video;
        }
        video.put("retry_count", retryCount + 1);
        video.put("export_status", "PROCESSING");
        video.put("error_message", null);
        video.put("updated_at", Instant.now().toString());
        dispatchShortformExportJob(video);
        repository.upsertKv(SHORTFORM_VIDEO_SCOPE, shortformId, video);
        return video;
    }

    public Map<String, Object> applyShortformExportCallback(String shortformId, String status, long eventVersion, String videoUrl, String errorMessage) {
        Map<String, Object> video = repository.getKv(SHORTFORM_VIDEO_SCOPE, shortformId);
        if (video == null) return null;

        long currentVersion = asLong(video.get("last_event_version"));
        if (eventVersion <= currentVersion) {
            video.put("callback_ignored", true);
            return video;
        }

        video.put("last_event_version", eventVersion);
        video.put("updated_at", Instant.now().toString());
        if ("FAILED".equalsIgnoreCase(status)) {
            int retryCount = asInt(video.get("retry_count"));
            video.put("export_status", retryCount >= shortformMaxRetry ? "FAILED_PERMANENT" : "FAILED");
            video.put("error_message", errorMessage != null ? errorMessage : "export callback failure");
        } else {
            video.put("export_status", "COMPLETED");
            if (videoUrl != null && !videoUrl.isBlank()) {
                video.put("video_url", videoUrl);
                video.put("export_result_url", videoUrl);
            }
            video.put("error_message", null);
        }
        repository.upsertKv(SHORTFORM_VIDEO_SCOPE, shortformId, video);
        return video;
    }

    private int asInt(Object value) {
        if (value == null) return 0;
        if (value instanceof Number n) return n.intValue();
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (Exception ignored) {
            return 0;
        }
    }

    private long asLong(Object value) {
        if (value == null) return 0L;
        if (value instanceof Number number) return number.longValue();
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (Exception ignored) {
            return 0L;
        }
    }

    private List<Map<String, Object>> normalizeComposeClips(Object rawClips, String fallbackCourseId) {
        if (!(rawClips instanceof List<?> list) || list.isEmpty()) {
            return List.of();
        }
        List<Map<String, Object>> normalized = new ArrayList<>();
        for (Object item : list) {
            if (!(item instanceof Map<?, ?> clipMap)) {
                continue;
            }
            Object lectureIdValue = clipMap.containsKey("lecture_id") ? clipMap.get("lecture_id") : "";
            String lectureId = String.valueOf(lectureIdValue).trim();
            long startMs = asLong(clipMap.get("start_ms"));
            long endMs = asLong(clipMap.get("end_ms"));
            if (lectureId.isBlank() || startMs < 0 || endMs <= startMs) {
                continue;
            }
            Map<String, Object> clip = new HashMap<>();
            clip.put("lecture_id", lectureId);
            clip.put("start_ms", startMs);
            clip.put("end_ms", endMs);
            clip.put("course_id", fallbackCourseId);
            normalized.add(clip);
        }
        normalized.sort(Comparator.comparing((Map<String, Object> c) -> String.valueOf(c.get("lecture_id")))
                .thenComparingLong(c -> asLong(c.get("start_ms"))));
        return normalized;
    }

    private Map<String, Object> buildShortformExportPayload(
            String shortformId,
            Map<String, Object> payload,
            String courseId,
            List<Map<String, Object>> normalizedClips
    ) {
        List<Map<String, Object>> exportClips = new ArrayList<>();
        for (int index = 0; index < normalizedClips.size(); index += 1) {
            Map<String, Object> clip = normalizedClips.get(index);
            String lectureId = String.valueOf(clip.getOrDefault("lecture_id", "")).trim();
            long startMs = asLong(clip.get("start_ms"));
            long endMs = asLong(clip.get("end_ms"));
            exportClips.add(Map.of(
                    "lecture_id", lectureId,
                    "lecture_title", lectureId,
                    "course_id", courseId,
                    "start_time_ms", startMs,
                    "end_time_ms", endMs,
                    "label", "clip-" + (index + 1),
                    "description", "",
                    "order_index", index,
                    "source_video_url", resolveSourceVideoUrl(lectureId, courseId)
            ));
        }

        return Map.of(
                "shortform_id", shortformId,
                "course_id", courseId,
                "title", String.valueOf(payload.getOrDefault("title", "untitled")),
                "description", String.valueOf(payload.getOrDefault("description", "")),
                "clips", exportClips,
                "callback", Map.of(
                        "url", mediaPublicBaseUrl + "/api/v1/shortform/export/callback",
                        "secret", shortformCallbackToken
                )
        );
    }

    @SuppressWarnings("unchecked")
    private void dispatchShortformExportJob(Map<String, Object> video) {
        if (mediaProcessorUrl.isBlank()) {
            video.put("export_dispatch_todo", true);
            return;
        }
        Object rawPayload = video.get("export_job_payload");
        if (!(rawPayload instanceof Map<?, ?> payload)) {
            video.put("export_status", "FAILED");
            video.put("error_message", "export job payload missing");
            return;
        }
        try {
            String body = objectMapper.writeValueAsString(payload);
            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(mediaProcessorUrl + "/jobs/shortform-export"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body));
            if (!mediaProcessorToken.isBlank()) {
                builder.header("Authorization", "Bearer " + mediaProcessorToken);
            }
            HttpResponse<String> response = HttpClient.newHttpClient().send(builder.build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                Map<String, Object> parsed = objectMapper.readValue(response.body(), Map.class);
                Object jobId = parsed.get("job_id");
                Object status = parsed.get("status");
                if (jobId != null && !String.valueOf(jobId).isBlank()) {
                    video.put("export_job_id", String.valueOf(jobId));
                }
                video.put("export_status", status == null ? "PROCESSING" : String.valueOf(status));
                video.put("error_message", null);
                return;
            }
            video.put("export_status", "FAILED");
            video.put("error_message", "shortform export dispatch failed (" + response.statusCode() + ")");
        } catch (Exception exception) {
            video.put("export_status", "FAILED");
            video.put("error_message", exception.getMessage());
        }
    }

    private String resolveSourceVideoUrl(String lectureId, String fallbackCourseId) {
        Map<String, Object> mapping = repository.getKv(LECTURE_VIDEO_ASSET_SCOPE, lectureId);
        if (mapping != null) {
            String videoUrl = String.valueOf(mapping.getOrDefault("video_url", "")).trim();
            if (!videoUrl.isBlank()) {
                if (videoUrl.startsWith("http://") || videoUrl.startsWith("https://")) {
                    return videoUrl;
                }
                return mediaPublicBaseUrl + (videoUrl.startsWith("/") ? videoUrl : "/" + videoUrl);
            }
            String assetKey = String.valueOf(mapping.getOrDefault("asset_key", "")).trim();
            if (!assetKey.isBlank()) {
                return mediaPublicBaseUrl + "/api/v1/media/assets/" + assetKey;
            }
        }
        return mediaPublicBaseUrl + "/api/v1/media/assets/asset/" + fallbackCourseId + "/" + lectureId + ".mp4";
    }
}
