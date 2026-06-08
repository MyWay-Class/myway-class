package com.myway.backendspring.feature.media;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class MediaProcessingDispatchSupport {
    private final int dispatchTimeoutMs;
    private final int dispatchMaxAttempts;
    private final long dispatchBackoffMs;

    public MediaProcessingDispatchSupport(
            @Value("${myway.media.dispatch.timeout-ms:10000}") int dispatchTimeoutMs,
            @Value("${myway.media.dispatch.max-attempts:3}") int dispatchMaxAttempts,
            @Value("${myway.media.dispatch.backoff-ms:250}") long dispatchBackoffMs
    ) {
        this.dispatchTimeoutMs = Math.max(1000, dispatchTimeoutMs);
        this.dispatchMaxAttempts = Math.max(1, dispatchMaxAttempts);
        this.dispatchBackoffMs = Math.max(0L, dispatchBackoffMs);
    }

    DispatchResult dispatchRequest(
            ObjectMapper objectMapper,
            String mediaProcessorUrl,
            String mediaProcessorToken,
            String mediaCallbackSecret,
            String mediaPublicBaseUrl,
            String extractionId,
            String sourceVideoUrl,
            Map<String, Object> extraction
    ) throws Exception {
        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(dispatchTimeoutMs))
                .build();
        HttpResponse<String> lastResponse = null;
        Exception lastException = null;
        int attempts = 0;

        for (int attempt = 1; attempt <= dispatchMaxAttempts; attempt++) {
            attempts = attempt;
            try {
                HttpRequest request = buildDispatchRequest(
                        objectMapper,
                        mediaProcessorUrl,
                        mediaProcessorToken,
                        mediaCallbackSecret,
                        mediaPublicBaseUrl,
                        extractionId,
                        sourceVideoUrl,
                        extraction
                );
                lastResponse = client.send(request, HttpResponse.BodyHandlers.ofString());
                if (lastResponse.statusCode() >= 200 && lastResponse.statusCode() < 300) {
                    return new DispatchResult(lastResponse, attempts);
                }
                if (!isRetryableStatus(lastResponse.statusCode()) || attempt == dispatchMaxAttempts) {
                    return new DispatchResult(lastResponse, attempts);
                }
            } catch (HttpTimeoutException timeoutException) {
                lastException = timeoutException;
                if (attempt == dispatchMaxAttempts) {
                    throw timeoutException;
                }
            } catch (IOException ioException) {
                lastException = ioException;
                if (attempt == dispatchMaxAttempts) {
                    throw ioException;
                }
            } catch (InterruptedException interruptedException) {
                Thread.currentThread().interrupt();
                throw interruptedException;
            }

            sleepBackoff(attempt);
        }
        if (lastResponse != null) {
            return new DispatchResult(lastResponse, attempts);
        }
        if (lastException != null) {
            throw lastException;
        }
        throw new IllegalStateException("dispatch 요청 결과를 얻지 못했습니다.");
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

    private HttpRequest buildDispatchRequest(
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
                .timeout(Duration.ofMillis(dispatchTimeoutMs))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)));
        if (!mediaProcessorToken.isBlank()) {
            builder.header("Authorization", "Bearer " + mediaProcessorToken);
            builder.header("x-myway-media-processor-token", mediaProcessorToken);
            builder.header("x-media-processor-token", mediaProcessorToken);
            builder.header("x-processor-token", mediaProcessorToken);
        }
        return builder.build();
    }

    private boolean isRetryableStatus(int statusCode) {
        return statusCode == 429 || statusCode == 500 || statusCode == 502 || statusCode == 503 || statusCode == 504;
    }

    private void sleepBackoff(int attempt) throws InterruptedException {
        if (dispatchBackoffMs <= 0L) {
            return;
        }
        long delay = dispatchBackoffMs * Math.max(1, attempt);
        Thread.sleep(delay);
    }

    record DispatchResult(HttpResponse<String> response, int attempts) {}

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
                builder.header("x-myway-media-processor-token", mediaProcessorToken);
                builder.header("x-media-processor-token", mediaProcessorToken);
                builder.header("x-processor-token", mediaProcessorToken);
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
