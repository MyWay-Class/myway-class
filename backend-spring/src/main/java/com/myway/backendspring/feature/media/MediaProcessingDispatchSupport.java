package com.myway.backendspring.feature.media;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class MediaProcessingDispatchSupport {
    HttpResponse<String> dispatchRequest(
            ObjectMapper objectMapper,
            String mediaProcessorUrl,
            String mediaProcessorToken,
            String mediaCallbackSecret,
            String mediaPublicBaseUrl,
            String extractionId,
            String sourceVideoUrl,
            Map<String, Object> extraction
    ) throws Exception {
        URI callbackUri = URI.create(mediaPublicBaseUrl + "/api/v1/media/extract-audio/callback");
        String normalizedSourceVideoUrl = normalizeSourceVideoUrl(mediaPublicBaseUrl, sourceVideoUrl);
        Map<String, Object> body = new HashMap<>();
        body.put("extraction_id", extractionId);
        body.put("lecture_id", String.valueOf(extraction.getOrDefault("lecture_id", "")));
        body.put("source_video_url", normalizedSourceVideoUrl);
        body.put("callback", Map.of("url", callbackUri.toString(), "secret", mediaCallbackSecret.isBlank() ? null : mediaCallbackSecret));
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(mediaProcessorUrl + "/jobs/audio-extraction"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)));
        if (!mediaProcessorToken.isBlank()) {
            builder.header("Authorization", "Bearer " + mediaProcessorToken);
        }
        return HttpClient.newHttpClient().send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }

    String normalizeSourceVideoUrl(String mediaPublicBaseUrl, String sourceVideoUrl) {
        String trimmed = sourceVideoUrl == null ? "" : sourceVideoUrl.trim();
        if (trimmed.isBlank()) {
            return mediaPublicBaseUrl + "/api/v1/media/assets/unknown";
        }
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            return trimmed;
        }
        if (trimmed.startsWith("/")) {
            return mediaPublicBaseUrl + trimmed;
        }
        return mediaPublicBaseUrl + "/" + trimmed;
    }

    DispatchResponse parseDispatchResponse(ObjectMapper objectMapper, String responseBody) throws Exception {
        Map<String, Object> payload = objectMapper.readValue(
                responseBody,
                objectMapper.getTypeFactory().constructMapType(Map.class, String.class, Object.class)
        );
        String jobId = payload.get("job_id") == null ? null : String.valueOf(payload.get("job_id"));
        String status = payload.get("status") == null ? null : String.valueOf(payload.get("status"));
        return new DispatchResponse(jobId, status);
    }

    RemoteHealth parseRemoteHealth(ObjectMapper objectMapper, String responseBody) throws Exception {
        Map<String, Object> payload = objectMapper.readValue(
                responseBody,
                objectMapper.getTypeFactory().constructMapType(Map.class, String.class, Object.class)
        );
        boolean ok = Boolean.TRUE.equals(payload.getOrDefault("ok", false));
        Map<String, Object> ffmpeg = payload.get("ffmpeg") instanceof Map<?, ?> map
                ? map.entrySet().stream()
                .filter(entry -> entry.getKey() != null)
                .collect(Collectors.toMap(
                        entry -> String.valueOf(entry.getKey()),
                        Map.Entry::getValue,
                        (left, right) -> right,
                        HashMap::new
                ))
                : Map.of("available", false, "path", "unknown");
        return new RemoteHealth(ok, ffmpeg);
    }

    Map<String, Object> fetchRemoteProcessorHealth(String mediaProcessorUrl, String mediaProcessorToken, ObjectMapper objectMapper) {
        if (mediaProcessorUrl.isBlank()) return null;
        try {
            HttpRequest.Builder builder = HttpRequest.newBuilder().uri(URI.create(mediaProcessorUrl + "/health")).GET();
            if (!mediaProcessorToken.isBlank()) {
                builder.header("Authorization", "Bearer " + mediaProcessorToken);
            }
            HttpResponse<String> response = HttpClient.newHttpClient().send(builder.build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) return null;
            return parseRemoteHealth(objectMapper, response.body()).toMap();
        } catch (Exception ignored) {
            return null;
        }
    }

    record DispatchResponse(String jobId, String status) {}

    record RemoteHealth(boolean ok, Map<String, Object> ffmpeg) {
        Map<String, Object> toMap() {
            Map<String, Object> map = new HashMap<>();
            map.put("ok", ok);
            map.put("ffmpeg", ffmpeg);
            return map;
        }
    }
}
