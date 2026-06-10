package com.myway.backendspring.feature.shortform;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.myway.backendspring.feature.repository.FeatureStoreRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class ShortformComposeSupport {
    private static final String LECTURE_VIDEO_ASSET_SCOPE = "lecture_video_asset";

    private final FeatureStoreRepository repository;
    private final String mediaProcessorUrl;
    private final String mediaProcessorToken;
    private final String mediaPublicBaseUrl;
    private final String shortformCallbackToken;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ShortformComposeSupport(
            FeatureStoreRepository repository,
            @Value("${myway.media.processor.url:}") String mediaProcessorUrl,
            @Value("${myway.media.processor.token:}") String mediaProcessorToken,
            @Value("${myway.media.public-base-url:http://127.0.0.1:8787}") String mediaPublicBaseUrl,
            @Value("${myway.shortform.callback.token:dev-shortform-callback-token}") String shortformCallbackToken
    ) {
        this.repository = repository;
        this.mediaProcessorUrl = mediaProcessorUrl == null ? "" : mediaProcessorUrl.trim();
        this.mediaProcessorToken = mediaProcessorToken == null ? "" : mediaProcessorToken.trim();
        this.mediaPublicBaseUrl = mediaPublicBaseUrl == null ? "http://127.0.0.1:8787" : mediaPublicBaseUrl.trim();
        this.shortformCallbackToken = shortformCallbackToken == null ? "dev-shortform-callback-token" : shortformCallbackToken.trim();
    }

    public List<Map<String, Object>> normalizeComposeClips(Object rawClips, String fallbackCourseId) {
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

    public Map<String, Object> buildShortformExportPayload(
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
    public void dispatchShortformExportJob(Map<String, Object> video) {
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
                builder.header("x-myway-media-processor-token", mediaProcessorToken);
                builder.header("x-media-processor-token", mediaProcessorToken);
                builder.header("x-processor-token", mediaProcessorToken);
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

    private long asLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        if (value == null) {
            return -1L;
        }
        try {
            return Long.parseLong(String.valueOf(value).trim());
        } catch (NumberFormatException ignored) {
            return -1L;
        }
    }
}
