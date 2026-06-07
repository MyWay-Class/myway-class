package com.myway.backendspring.api.support;

import com.myway.backendspring.common.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

@Component
public class MediaAssetPlaybackSupport {
    private final String remoteAssetBaseUrl;
    private final String remoteAssetToken;

    public MediaAssetPlaybackSupport(
            @Value("${myway.media.asset-proxy.base-url:}") String remoteAssetBaseUrl,
            @Value("${myway.media.asset-proxy.token:}") String remoteAssetToken
    ) {
        this.remoteAssetBaseUrl = normalizeRemoteAssetBaseUrl(remoteAssetBaseUrl);
        this.remoteAssetToken = remoteAssetToken == null ? "" : remoteAssetToken.trim();
    }

    public ResponseEntity<?> proxyRemoteAsset(String assetKey) {
        if (remoteAssetBaseUrl.isBlank()) return null;
        try {
            String[] candidates = buildRemoteCandidates(assetKey);
            for (String candidate : candidates) {
                String encoded = java.net.URLEncoder.encode(candidate, StandardCharsets.UTF_8);
                String target = remoteAssetBaseUrl.endsWith("/")
                        ? remoteAssetBaseUrl + encoded
                        : remoteAssetBaseUrl + "/" + encoded;
                HttpRequest.Builder builder = HttpRequest.newBuilder().uri(URI.create(target)).GET();
                if (!remoteAssetToken.isBlank()) {
                    builder.header("Authorization", "Bearer " + remoteAssetToken);
                }
                HttpResponse<byte[]> response = HttpClient.newHttpClient().send(builder.build(), HttpResponse.BodyHandlers.ofByteArray());
                if (response.statusCode() < 200 || response.statusCode() >= 300) {
                    continue;
                }
                ResponseEntity.BodyBuilder bodyBuilder = ResponseEntity.status(response.statusCode());
                String contentType = response.headers().firstValue("content-type").orElse(null);
                String contentDisposition = response.headers().firstValue("content-disposition").orElse(null);
                if (contentType != null && !contentType.isBlank()) bodyBuilder.header("Content-Type", contentType);
                if (contentDisposition != null && !contentDisposition.isBlank()) bodyBuilder.header("Content-Disposition", contentDisposition);
                return bodyBuilder.body(response.body());
            }
        } catch (Exception ignored) {
            return null;
        }
        return null;
    }

    public String resolveQueryToken(String queryToken, HttpServletRequest request) {
        String fromParam = trimOptional(queryToken);
        if (!fromParam.isBlank()) return fromParam;
        String fromRequestParam = trimOptional(request.getParameter("token"));
        if (!fromRequestParam.isBlank()) return fromRequestParam;
        String query = request.getQueryString();
        if (query == null || query.isBlank()) return "";
        for (String pair : query.split("&")) {
            if (!pair.startsWith("token=")) continue;
            String raw = pair.substring("token=".length());
            if (raw.isBlank()) return "";
            try {
                return java.net.URLDecoder.decode(raw, StandardCharsets.UTF_8);
            } catch (IllegalArgumentException ignored) {
                return raw;
            }
        }
        return "";
    }

    public boolean isPlaybackRequest(HttpServletRequest request, String queryToken) {
        String range = trimOptional(request.getHeader("Range"));
        String accept = trimOptional(request.getHeader("Accept")).toLowerCase();
        return !range.isBlank() || accept.contains("video/") || !trimOptional(queryToken).isBlank();
    }

    public ResponseEntity<Void> playbackFailure(HttpStatus status, String code, String message) {
        return ResponseEntity.status(status)
                .header("X-Error-Code", code)
                .header("X-Error-Message", message)
                .build();
    }

    public ResponseEntity<Resource> fallbackLocalPlaybackAsset(String assetKey) {
        Path[] candidates = new Path[] {Path.of("temp-sample-10s.mp4"), Path.of("..", "temp-sample-10s.mp4")};
        for (Path candidate : candidates) {
            try {
                if (!Files.exists(candidate) || !Files.isRegularFile(candidate)) continue;
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType("video/mp4"))
                        .header("Accept-Ranges", "bytes")
                        .header("X-Playback-Fallback", "local-sample")
                        .header("X-Playback-Asset-Key", assetKey)
                        .body(new FileSystemResource(candidate.toFile()));
            } catch (Exception ignored) {
                return null;
            }
        }
        return null;
    }

    public ResponseEntity<ApiResponse<Object>> assetNotFound() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("ASSET_NOT_FOUND", "미디어 파일을 찾을 수 없습니다."));
    }

    private String[] buildRemoteCandidates(String assetKey) {
        String trimmed = trimOptional(assetKey);
        if (trimmed.isBlank()) return new String[0];
        String[] segments = trimmed.split("/");
        String last = segments[segments.length - 1];
        if (last.endsWith(".mp4")) return new String[] {trimmed, last};
        return new String[] {trimmed, last, last + ".mp4"};
    }

    private String normalizeRemoteAssetBaseUrl(String configuredBaseUrl) {
        String trimmed = configuredBaseUrl == null ? "" : configuredBaseUrl.trim();
        if (trimmed.isBlank()) return "";
        String lowered = trimmed.toLowerCase();
        if (lowered.contains("/api/v1/media/assets")) return "http://127.0.0.1:8788/assets";
        return trimmed;
    }

    private String trimOptional(String value) {
        return value == null ? "" : value.trim();
    }
}
