package com.myway.backendspring.feature.media;

import com.fasterxml.jackson.databind.ObjectMapper;
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

@Service
public class MediaProcessingService {
    private static final String EXTRACTION_SCOPE = "media_extraction";
    private static final String STT_DEFAULT_PROVIDER = "cloudflare";

    private final FeatureStoreRepository repository;
    private final String mediaProcessorUrl;
    private final String mediaProcessorToken;
    private final String mediaCallbackSecret;
    private final String mediaPublicBaseUrl;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public MediaProcessingService(
            FeatureStoreRepository repository,
            @Value("${myway.media.processor.url:}") String mediaProcessorUrl,
            @Value("${myway.media.processor.token:}") String mediaProcessorToken,
            @Value("${myway.media.callback.secret:}") String mediaCallbackSecret,
            @Value("${myway.media.public-base-url:http://127.0.0.1:8787}") String mediaPublicBaseUrl
    ) {
        this.repository = repository;
        this.mediaProcessorUrl = mediaProcessorUrl == null ? "" : mediaProcessorUrl.trim();
        this.mediaProcessorToken = mediaProcessorToken == null ? "" : mediaProcessorToken.trim();
        this.mediaCallbackSecret = mediaCallbackSecret == null ? "" : mediaCallbackSecret.trim();
        this.mediaPublicBaseUrl = mediaPublicBaseUrl == null ? "http://127.0.0.1:8787" : mediaPublicBaseUrl.trim();
    }

    public Map<String, Object> sttProviders() {
        List<Map<String, Object>> providers = List.of(
                Map.of("name", "demo", "label", "Demo STT", "description", "현재 텍스트 기반 트랜스크립트를 안전하게 유지하는 기본 경로입니다.", "status", "available", "capabilities", List.of("transcribe", "segment", "pipeline")),
                Map.of("name", "cloudflare", "label", "Cloudflare AI", "description", "배포 환경에서 실제 Workers AI 전사를 수행하는 STT 계층입니다.", "status", "available", "capabilities", List.of("transcribe", "segment", "pipeline")),
                Map.of("name", "gemini", "label", "Gemini", "description", "무료 API 쿼터 기반으로 전사 보조와 정리 작업에 활용할 수 있습니다.", "status", "planned", "capabilities", List.of("transcribe", "segment", "pipeline"))
        );
        List<String> chain = List.of(STT_DEFAULT_PROVIDER, "gemini", "demo");
        List<Map<String, Object>> steps = new ArrayList<>();
        for (int i = 0; i < chain.size(); i++) {
            String provider = chain.get(i);
            String reason = i == 0 ? "이 기능의 기본 경로" : (i == chain.size() - 1 ? "최후의 안전망" : "기본 경로가 실패할 때의 대체 경로");
            String status = ("cloudflare".equals(provider) || "demo".equals(provider)) ? "available" : "planned";
            steps.add(Map.of("provider", provider, "status", status, "reason", reason));
        }
        List<Map<String, Object>> plans = List.of(
                Map.of("feature", "transcribe", "current_provider", STT_DEFAULT_PROVIDER, "recommended_chain", chain, "steps", steps),
                Map.of("feature", "segment", "current_provider", STT_DEFAULT_PROVIDER, "recommended_chain", chain, "steps", steps),
                Map.of("feature", "pipeline", "current_provider", STT_DEFAULT_PROVIDER, "recommended_chain", chain, "steps", steps)
        );
        return Map.of("generated_at", Instant.now().toString(), "providers", providers, "plans", plans);
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> processorHealth() {
        Map<String, Object> remoteHealth = fetchRemoteProcessorHealth();
        List<Map<String, Object>> extractions = repository.listKvByScope(EXTRACTION_SCOPE);
        long processing = countByStatus(extractions, "PROCESSING");
        long failed = countByStatus(extractions, "FAILED");
        long completed = countByStatus(extractions, "COMPLETED");
        long total = extractions.size();
        List<Map<String, Object>> recentJobs = extractions.stream()
                .sorted(Comparator.comparing((Map<String, Object> item) -> String.valueOf(item.getOrDefault("updated_at", item.getOrDefault("created_at", "")))).reversed())
                .limit(5)
                .map(item -> {
                    Map<String, Object> mapped = new HashMap<>();
                    mapped.put("id", String.valueOf(item.getOrDefault("id", "")));
                    mapped.put("lecture_id", String.valueOf(item.getOrDefault("lecture_id", "")));
                    mapped.put("status", String.valueOf(item.getOrDefault("status", "PROCESSING")));
                    mapped.put("created_at", String.valueOf(item.getOrDefault("created_at", Instant.now().toString())));
                    mapped.put("updated_at", String.valueOf(item.getOrDefault("updated_at", item.getOrDefault("created_at", Instant.now().toString()))));
                    mapped.put("audio_url", item.get("audio_url"));
                    mapped.put("error_message", item.get("error_message"));
                    mapped.put("stage", item.getOrDefault("processing_stage", "queued"));
                    mapped.put("step", item.getOrDefault("processing_step", ""));
                    mapped.put("callback_status", null);
                    return mapped;
                })
                .toList();

        Map<String, Object> ffmpeg = remoteHealth == null
                ? Map.of("available", false, "version", "unavailable", "path", "unknown")
                : (Map<String, Object>) remoteHealth.getOrDefault("ffmpeg", Map.of("available", false, "path", "unknown"));
        boolean remoteOk = remoteHealth != null && Boolean.TRUE.equals(remoteHealth.getOrDefault("ok", true));
        return Map.of(
                "ok", remoteOk,
                "ffmpeg", ffmpeg,
                "token_configured", !mediaProcessorToken.isBlank(),
                "callback_secret_configured", !mediaCallbackSecret.isBlank(),
                "jobs", Map.of("total", total, "processing", processing, "completed", completed, "failed", failed),
                "work_dir", "backend-spring/data",
                "public_base_url", mediaPublicBaseUrl + "/api/v1/media",
                "recent_jobs", recentJobs,
                "updated_at", Instant.now().toString()
        );
    }

    public Map<String, Object> dispatchExtractionJob(String extractionId, String sourceVideoUrl) {
        Map<String, Object> extraction = repository.getKv(EXTRACTION_SCOPE, extractionId);
        if (extraction == null) {
            return null;
        }
        extraction = new HashMap<>(extraction);
        if (mediaProcessorUrl.isBlank()) {
            extraction.put("status", "FAILED");
            extraction.put("processing_stage", "failed");
            extraction.put("processing_step", "processor_not_configured");
            extraction.put("processing_error_code", "PROCESSOR_NOT_CONFIGURED");
            extraction.put("processing_error", "MYWAY_MEDIA_PROCESSOR_URL이 설정되지 않았습니다.");
            extraction.put("stt_status", "FAILED");
            extraction.put("updated_at", Instant.now().toString());
            repository.upsertKv(EXTRACTION_SCOPE, extractionId, extraction);
            return extraction;
        }
        try {
            URI callbackUri = URI.create(mediaPublicBaseUrl + "/api/v1/media/extract-audio/callback");
            Map<String, Object> body = new HashMap<>();
            body.put("extraction_id", extractionId);
            body.put("lecture_id", String.valueOf(extraction.getOrDefault("lecture_id", "")));
            body.put("source_video_url", sourceVideoUrl);
            body.put("callback", Map.of("url", callbackUri.toString(), "secret", mediaCallbackSecret.isBlank() ? null : mediaCallbackSecret));
            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(mediaProcessorUrl + "/jobs/audio-extraction"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)));
            if (!mediaProcessorToken.isBlank()) {
                requestBuilder.header("Authorization", "Bearer " + mediaProcessorToken);
            }
            HttpResponse<String> response = HttpClient.newHttpClient().send(requestBuilder.build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                Map<?, ?> payload = objectMapper.readValue(response.body(), Map.class);
                Object jobId = payload.get("job_id");
                Object status = payload.get("status");
                extraction.put("processing_job_id", jobId == null ? null : String.valueOf(jobId));
                extraction.put("processing_step", "dispatched");
                extraction.put("processing_stage", "queued");
                extraction.put("status", status == null ? "PROCESSING" : String.valueOf(status).toUpperCase());
                extraction.put("stt_status", "PENDING");
                extraction.put("processing_error_code", null);
                extraction.put("processing_error", null);
            } else {
                extraction.put("status", "FAILED");
                extraction.put("processing_stage", "failed");
                extraction.put("processing_step", "dispatch_failed");
                extraction.put("processing_error_code", "PROCESSOR_DISPATCH_FAILED");
                extraction.put("processing_error", "processor dispatch 실패 (" + response.statusCode() + ")");
                extraction.put("stt_status", "FAILED");
            }
        } catch (Exception exception) {
            extraction.put("status", "FAILED");
            extraction.put("processing_stage", "failed");
            extraction.put("processing_step", "dispatch_exception");
            extraction.put("processing_error_code", "PROCESSOR_DISPATCH_EXCEPTION");
            extraction.put("processing_error", exception.getMessage());
            extraction.put("stt_status", "FAILED");
        }
        extraction.put("updated_at", Instant.now().toString());
        repository.upsertKv(EXTRACTION_SCOPE, extractionId, extraction);
        return extraction;
    }

    private Map<String, Object> fetchRemoteProcessorHealth() {
        if (mediaProcessorUrl.isBlank()) return null;
        try {
            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder().uri(URI.create(mediaProcessorUrl + "/health")).GET();
            if (!mediaProcessorToken.isBlank()) {
                requestBuilder.header("Authorization", "Bearer " + mediaProcessorToken);
            }
            HttpResponse<String> response = HttpClient.newHttpClient().send(requestBuilder.build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return null;
            }
            return objectMapper.readValue(response.body(), Map.class);
        } catch (Exception ignored) {
            return null;
        }
    }

    private long countByStatus(List<Map<String, Object>> rows, String expectedStatus) {
        return rows.stream()
                .map(item -> String.valueOf(item.getOrDefault("status", "PROCESSING")))
                .filter(status -> expectedStatus.equalsIgnoreCase(status))
                .count();
    }
}
