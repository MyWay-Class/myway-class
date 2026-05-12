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
        List<ProviderInfo> providers = List.of(
                new ProviderInfo("demo", "Demo STT", "현재 텍스트 기반 트랜스크립트를 안전하게 유지하는 기본 경로입니다.", "available", List.of("transcribe", "segment", "pipeline")),
                new ProviderInfo("cloudflare", "Cloudflare AI", "배포 환경에서 실제 Workers AI 전사를 수행하는 STT 계층입니다.", "available", List.of("transcribe", "segment", "pipeline")),
                new ProviderInfo("gemini", "Gemini", "무료 API 쿼터 기반으로 전사 보조와 정리 작업에 활용할 수 있습니다.", "planned", List.of("transcribe", "segment", "pipeline"))
        );
        List<String> chain = List.of(STT_DEFAULT_PROVIDER, "gemini", "demo");
        List<Map<String, Object>> steps = chain.stream().map(provider -> {
            String reason = provider.equals(chain.get(0)) ? "이 기능의 기본 경로" : (provider.equals(chain.get(chain.size() - 1)) ? "최후의 안전망" : "기본 경로가 실패할 때의 대체 경로");
            String status = ("cloudflare".equals(provider) || "demo".equals(provider)) ? "available" : "planned";
            return Map.<String, Object>of("provider", provider, "status", status, "reason", reason);
        }).toList();

        return Map.of(
                "generated_at", Instant.now().toString(),
                "providers", providers.stream().map(ProviderInfo::toMap).toList(),
                "plans", List.of(
                        Map.of("feature", "transcribe", "current_provider", STT_DEFAULT_PROVIDER, "recommended_chain", chain, "steps", steps),
                        Map.of("feature", "segment", "current_provider", STT_DEFAULT_PROVIDER, "recommended_chain", chain, "steps", steps),
                        Map.of("feature", "pipeline", "current_provider", STT_DEFAULT_PROVIDER, "recommended_chain", chain, "steps", steps)
                )
        );
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> processorHealth() {
        Map<String, Object> remoteHealth = fetchRemoteProcessorHealth();
        List<Map<String, Object>> rows = repository.listKvByScope(EXTRACTION_SCOPE);
        long processing = countByStatus(rows, MediaStatus.PROCESSING);
        long failed = countByStatus(rows, MediaStatus.FAILED);
        long completed = countByStatus(rows, MediaStatus.COMPLETED);

        List<Map<String, Object>> recentJobs = rows.stream()
                .sorted(Comparator.comparing((Map<String, Object> item) -> String.valueOf(item.getOrDefault("updated_at", item.getOrDefault("created_at", "")))).reversed())
                .limit(5)
                .map(JobView::from)
                .map(JobView::toMap)
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
                "jobs", Map.of("total", rows.size(), "processing", processing, "completed", completed, "failed", failed),
                "work_dir", "backend-spring/data",
                "public_base_url", mediaPublicBaseUrl + "/api/v1/media",
                "recent_jobs", recentJobs,
                "updated_at", Instant.now().toString()
        );
    }

    public Map<String, Object> dispatchExtractionJob(String extractionId, String sourceVideoUrl) {
        Map<String, Object> extraction = repository.getKv(EXTRACTION_SCOPE, extractionId);
        if (extraction == null) return null;
        Map<String, Object> mutable = new HashMap<>(extraction);
        if (mediaProcessorUrl.isBlank()) {
            return saveFailedDispatch(mutable, extractionId, "processor_not_configured", "PROCESSOR_NOT_CONFIGURED", "MYWAY_MEDIA_PROCESSOR_URL이 설정되지 않았습니다.");
        }

        try {
            HttpResponse<String> response = dispatchRequest(extractionId, sourceVideoUrl, mutable);
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                applyDispatchSuccess(mutable, response.body());
            } else {
                saveFailedDispatch(mutable, extractionId, "dispatch_failed", "PROCESSOR_DISPATCH_FAILED", "processor dispatch 실패 (" + response.statusCode() + ")");
            }
        } catch (Exception exception) {
            saveFailedDispatch(mutable, extractionId, "dispatch_exception", "PROCESSOR_DISPATCH_EXCEPTION", exception.getMessage());
        }
        mutable.put("updated_at", Instant.now().toString());
        repository.upsertKv(EXTRACTION_SCOPE, extractionId, mutable);
        return mutable;
    }

    private HttpResponse<String> dispatchRequest(String extractionId, String sourceVideoUrl, Map<String, Object> extraction) throws Exception {
        URI callbackUri = URI.create(mediaPublicBaseUrl + "/api/v1/media/extract-audio/callback");
        Map<String, Object> body = new HashMap<>();
        body.put("extraction_id", extractionId);
        body.put("lecture_id", String.valueOf(extraction.getOrDefault("lecture_id", "")));
        body.put("source_video_url", sourceVideoUrl);
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

    private void applyDispatchSuccess(Map<String, Object> extraction, String responseBody) throws Exception {
        DispatchResponse payload = parseDispatchResponse(responseBody);
        MediaStatus status = MediaStatus.fromNullable(payload.status(), MediaStatus.PROCESSING);
        extraction.put("processing_job_id", payload.jobId());
        extraction.put("processing_step", "dispatched");
        extraction.put("processing_stage", PipelineStage.QUEUED.value());
        extraction.put("status", status.name());
        extraction.put("stt_status", MediaStatus.PENDING.name());
        extraction.put("processing_error_code", null);
        extraction.put("processing_error", null);
    }

    private Map<String, Object> saveFailedDispatch(Map<String, Object> extraction, String extractionId, String step, String errorCode, String errorMessage) {
        extraction.put("status", MediaStatus.FAILED.name());
        extraction.put("processing_stage", PipelineStage.FAILED.value());
        extraction.put("processing_step", step);
        extraction.put("processing_error_code", errorCode);
        extraction.put("processing_error", errorMessage);
        extraction.put("stt_status", MediaStatus.FAILED.name());
        extraction.put("updated_at", Instant.now().toString());
        repository.upsertKv(EXTRACTION_SCOPE, extractionId, extraction);
        return extraction;
    }

    private Map<String, Object> fetchRemoteProcessorHealth() {
        if (mediaProcessorUrl.isBlank()) return null;
        try {
            HttpRequest.Builder builder = HttpRequest.newBuilder().uri(URI.create(mediaProcessorUrl + "/health")).GET();
            if (!mediaProcessorToken.isBlank()) {
                builder.header("Authorization", "Bearer " + mediaProcessorToken);
            }
            HttpResponse<String> response = HttpClient.newHttpClient().send(builder.build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) return null;
            return parseRemoteHealth(response.body()).toMap();
        } catch (Exception ignored) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private DispatchResponse parseDispatchResponse(String responseBody) throws Exception {
        Map<String, Object> payload = objectMapper.readValue(responseBody, Map.class);
        String jobId = payload.get("job_id") == null ? null : String.valueOf(payload.get("job_id"));
        String status = payload.get("status") == null ? null : String.valueOf(payload.get("status"));
        return new DispatchResponse(jobId, status);
    }

    @SuppressWarnings("unchecked")
    private RemoteHealth parseRemoteHealth(String responseBody) throws Exception {
        Map<String, Object> payload = objectMapper.readValue(responseBody, Map.class);
        boolean ok = Boolean.TRUE.equals(payload.getOrDefault("ok", false));
        Map<String, Object> ffmpeg = payload.get("ffmpeg") instanceof Map<?, ?> map ? (Map<String, Object>) map : Map.of("available", false, "path", "unknown");
        return new RemoteHealth(ok, ffmpeg);
    }

    private long countByStatus(List<Map<String, Object>> rows, MediaStatus expected) {
        return rows.stream()
                .map(item -> MediaStatus.fromNullable(String.valueOf(item.getOrDefault("status", MediaStatus.PROCESSING.name())), MediaStatus.PROCESSING))
                .filter(status -> status == expected)
                .count();
    }

    private record ProviderInfo(String name, String label, String description, String status, List<String> capabilities) {
        Map<String, Object> toMap() {
            return Map.of("name", name, "label", label, "description", description, "status", status, "capabilities", capabilities);
        }
    }

    private record DispatchResponse(String jobId, String status) {}

    private record RemoteHealth(boolean ok, Map<String, Object> ffmpeg) {
        Map<String, Object> toMap() {
            Map<String, Object> map = new HashMap<>();
            map.put("ok", ok);
            map.put("ffmpeg", ffmpeg);
            return map;
        }
    }

    private record JobView(
            String id,
            String lectureId,
            String status,
            String createdAt,
            String updatedAt,
            Object audioUrl,
            Object errorMessage,
            Object stage,
            Object step
    ) {
        static JobView from(Map<String, Object> row) {
            ExtractionRowSnapshot snapshot = ExtractionRowSnapshot.from(row);
            return new JobView(
                    snapshot.id(),
                    snapshot.lectureId(),
                    snapshot.status(),
                    snapshot.createdAt(),
                    snapshot.updatedAt(),
                    snapshot.audioUrl(),
                    snapshot.errorMessage(),
                    snapshot.processingStage(),
                    snapshot.processingStep()
            );
        }

        Map<String, Object> toMap() {
            Map<String, Object> map = new HashMap<>();
            map.put("id", id);
            map.put("lecture_id", lectureId);
            map.put("status", status);
            map.put("created_at", createdAt);
            map.put("updated_at", updatedAt);
            map.put("audio_url", audioUrl);
            map.put("error_message", errorMessage);
            map.put("stage", stage);
            map.put("step", step);
            map.put("callback_status", null);
            return map;
        }
    }

    private record ExtractionRowSnapshot(
            String id,
            String lectureId,
            String status,
            String createdAt,
            String updatedAt,
            Object audioUrl,
            Object errorMessage,
            Object processingStage,
            Object processingStep
    ) {
        static ExtractionRowSnapshot from(Map<String, Object> row) {
            String createdAt = String.valueOf(row.getOrDefault("created_at", Instant.now().toString()));
            return new ExtractionRowSnapshot(
                    String.valueOf(row.getOrDefault("id", "")),
                    String.valueOf(row.getOrDefault("lecture_id", "")),
                    String.valueOf(row.getOrDefault("status", MediaStatus.PROCESSING.name())),
                    createdAt,
                    String.valueOf(row.getOrDefault("updated_at", createdAt)),
                    row.get("audio_url"),
                    row.get("error_message"),
                    row.getOrDefault("processing_stage", PipelineStage.QUEUED.value()),
                    row.getOrDefault("processing_step", "")
            );
        }
    }
}
