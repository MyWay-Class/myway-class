package com.myway.backendspring.feature.media;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.myway.backendspring.feature.repository.FeatureStoreRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.http.HttpResponse;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class MediaProcessingService {
    private static final String EXTRACTION_SCOPE = "media_extraction";
    private static final String STT_DEFAULT_PROVIDER = "demo";

    private final FeatureStoreRepository repository;
    private final String mediaProcessorUrl;
    private final String mediaProcessorToken;
    private final String mediaCallbackSecret;
    private final String mediaPublicBaseUrl;
    private final int dispatchTimeoutMs;
    private final int dispatchMaxAttempts;
    private final long dispatchBackoffMs;
    private final long longInputThresholdMs;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final MediaProcessingDispatchSupport dispatchSupport;

    public MediaProcessingService(
            FeatureStoreRepository repository,
            @Value("${myway.media.processor.url:}") String mediaProcessorUrl,
            @Value("${myway.media.processor.token:}") String mediaProcessorToken,
            @Value("${myway.media.callback.secret:}") String mediaCallbackSecret,
            @Value("${myway.media.public-base-url:http://127.0.0.1:8787}") String mediaPublicBaseUrl,
            @Value("${myway.media.dispatch.timeout-ms:10000}") int dispatchTimeoutMs,
            @Value("${myway.media.dispatch.max-attempts:3}") int dispatchMaxAttempts,
            @Value("${myway.media.dispatch.backoff-ms:250}") long dispatchBackoffMs,
            @Value("${myway.media.stt.long-input-threshold-ms:1200000}") long longInputThresholdMs,
            MediaProcessingDispatchSupport dispatchSupport
    ) {
        this.repository = repository;
        this.mediaProcessorUrl = mediaProcessorUrl == null ? "" : mediaProcessorUrl.trim();
        this.mediaProcessorToken = mediaProcessorToken == null ? "" : mediaProcessorToken.trim();
        this.mediaCallbackSecret = mediaCallbackSecret == null ? "" : mediaCallbackSecret.trim();
        this.mediaPublicBaseUrl = mediaPublicBaseUrl == null ? "http://127.0.0.1:8787" : mediaPublicBaseUrl.trim();
        this.dispatchTimeoutMs = Math.max(1000, dispatchTimeoutMs);
        this.dispatchMaxAttempts = Math.max(1, dispatchMaxAttempts);
        this.dispatchBackoffMs = Math.max(0L, dispatchBackoffMs);
        this.longInputThresholdMs = Math.max(0L, longInputThresholdMs);
        this.dispatchSupport = dispatchSupport;
    }

    public Map<String, Object> sttProviders() {
        List<ProviderInfo> providers = List.of(
                new ProviderInfo("demo", "Demo STT", "현재 텍스트 기반 트랜스크립트를 안전하게 유지하는 기본 경로입니다.", "available", List.of("transcribe", "segment", "pipeline")),
                new ProviderInfo("cloudflare", "Cloudflare AI", "배포 환경에서 실제 Workers AI 전사를 수행하는 STT 계층입니다.", "available", List.of("transcribe", "segment", "pipeline")),
                new ProviderInfo("gemini", "Gemini", "무료 API 쿼터 기반으로 전사 보조와 정리 작업에 활용할 수 있습니다.", "planned", List.of("transcribe", "segment", "pipeline"))
        );
        List<String> chain = List.of(STT_DEFAULT_PROVIDER, "cloudflare", "gemini");
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

    public Map<String, Object> processorHealth() {
        Map<String, Object> remoteHealth = dispatchSupport.fetchRemoteProcessorHealth(mediaProcessorUrl, mediaProcessorToken, objectMapper);
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

        Map<String, Object> ffmpeg = resolveFfmpegHealth(remoteHealth);
        boolean remoteOk = remoteHealth != null && Boolean.TRUE.equals(remoteHealth.getOrDefault("ok", true));
        Map<String, Object> dispatchPolicy = new HashMap<>();
        dispatchPolicy.put("timeout_ms", dispatchTimeoutMs);
        dispatchPolicy.put("max_attempts", dispatchMaxAttempts);
        dispatchPolicy.put("backoff_ms", dispatchBackoffMs);
        dispatchPolicy.put("retryable_statuses", List.of(429, 500, 502, 503, 504));

        Map<String, Object> longInputPolicy = new HashMap<>();
        longInputPolicy.put("threshold_ms", longInputThresholdMs);
        longInputPolicy.put("threshold_minutes", longInputThresholdMs / 60000L);
        longInputPolicy.put("strategy", "manual_split_or_batch_queue");

        Map<String, Object> jobTiming = processingTimingSummary(rows);

        Map<String, Object> jobs = new HashMap<>();
        jobs.put("total", rows.size());
        jobs.put("processing", processing);
        jobs.put("completed", completed);
        jobs.put("failed", failed);

        Map<String, Object> health = new HashMap<>();
        health.put("ok", remoteOk);
        health.put("ffmpeg", ffmpeg);
        health.put("token_configured", !mediaProcessorToken.isBlank());
        health.put("callback_secret_configured", !mediaCallbackSecret.isBlank());
        health.put("dispatch_policy", dispatchPolicy);
        health.put("long_input_policy", longInputPolicy);
        health.put("timing", jobTiming);
        health.put("jobs", jobs);
        health.put("work_dir", "backend-spring/data");
        health.put("public_base_url", mediaPublicBaseUrl + "/api/v1/media");
        health.put("recent_jobs", recentJobs);
        health.put("updated_at", Instant.now().toString());
        return health;
    }

    public Map<String, Object> dispatchExtractionJob(String extractionId, String sourceVideoUrl) {
        Map<String, Object> extraction = repository.getKv(EXTRACTION_SCOPE, extractionId);
        if (extraction == null) return null;
        Map<String, Object> mutable = new HashMap<>(extraction);
        if (mediaProcessorUrl.isBlank()) {
            return saveFailedDispatch(mutable, extractionId, "processor_not_configured", "PROCESSOR_NOT_CONFIGURED", "MYWAY_MEDIA_PROCESSOR_URL이 설정되지 않았습니다.");
        }

        try {
            MediaProcessingDispatchSupport.DispatchResult dispatchResult = dispatchSupport.dispatchRequest(
                    objectMapper,
                    mediaProcessorUrl,
                    mediaProcessorToken,
                    mediaCallbackSecret,
                    mediaPublicBaseUrl,
                    extractionId,
                    sourceVideoUrl,
                    mutable
            );
            mutable.put("dispatch_attempts", dispatchResult.attempts());
            HttpResponse<String> response = dispatchResult.response();
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

    private void applyDispatchSuccess(Map<String, Object> extraction, String responseBody) throws Exception {
        MediaProcessingDispatchSupport.DispatchResponse payload = dispatchSupport.parseDispatchResponse(objectMapper, responseBody);
        MediaStatus status = MediaStatus.fromNullable(payload.status(), MediaStatus.PROCESSING);
        extraction.put("processing_job_id", payload.jobId());
        extraction.put("processing_step", "dispatched");
        extraction.put("processing_stage", PipelineStage.QUEUED.value());
        extraction.put("status", status.name());
        extraction.put("stt_status", MediaStatus.PENDING.name());
        extraction.put("processing_error_code", null);
        extraction.put("processing_error", null);
        extraction.put("dispatch_retry_count", Math.max(0, ((Number) extraction.getOrDefault("dispatch_attempts", 1)).intValue() - 1));
    }

    private Map<String, Object> saveFailedDispatch(Map<String, Object> extraction, String extractionId, String step, String errorCode, String errorMessage) {
        extraction.put("status", MediaStatus.FAILED.name());
        extraction.put("processing_stage", PipelineStage.FAILED.value());
        extraction.put("processing_step", step);
        extraction.put("processing_error_code", errorCode);
        extraction.put("processing_error", errorMessage);
        extraction.put("stt_status", MediaStatus.FAILED.name());
        extraction.putIfAbsent("dispatch_attempts", 1);
        extraction.put("dispatch_retry_count", Math.max(0, ((Number) extraction.getOrDefault("dispatch_attempts", 1)).intValue() - 1));
        extraction.put("updated_at", Instant.now().toString());
        repository.upsertKv(EXTRACTION_SCOPE, extractionId, extraction);
        return extraction;
    }

    private long countByStatus(List<Map<String, Object>> rows, MediaStatus expected) {
        return rows.stream()
                .map(item -> MediaStatus.fromNullable(String.valueOf(item.getOrDefault("status", MediaStatus.PROCESSING.name())), MediaStatus.PROCESSING))
                .filter(status -> status == expected)
                .count();
    }

    private Map<String, Object> resolveFfmpegHealth(Map<String, Object> remoteHealth) {
        if (remoteHealth == null) {
            return Map.of("available", false, "version", "unavailable", "path", "unknown");
        }
        Object ffmpeg = remoteHealth.get("ffmpeg");
        if (ffmpeg instanceof Map<?, ?> map) {
            Map<String, Object> typed = new HashMap<>();
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                String key = String.valueOf(entry.getKey());
                typed.put(key, entry.getValue());
            }
            return typed;
        }
        return Map.of("available", false, "path", "unknown");
    }

    private Map<String, Object> processingTimingSummary(List<Map<String, Object>> rows) {
        long nowEpochMs = Instant.now().toEpochMilli();
        long completedCount = 0L;
        long completedAgeSumMs = 0L;
        long failedCount = 0L;
        long failedAgeSumMs = 0L;
        long dispatchAttemptsSum = 0L;
        long dispatchRetrySum = 0L;
        long dispatchRetryingJobs = 0L;
        long processingOlderThanThreshold = 0L;

        for (Map<String, Object> row : rows) {
            long createdAtMs = parseInstantMillis(row.get("created_at"), nowEpochMs);
            long updatedAtMs = parseInstantMillis(row.get("updated_at"), createdAtMs);
            String status = String.valueOf(row.getOrDefault("status", "")).toUpperCase();
            long ageMs = Math.max(0L, nowEpochMs - createdAtMs);
            int dispatchAttempts = Math.max(1, ((Number) row.getOrDefault("dispatch_attempts", 1)).intValue());
            int dispatchRetryCount = Math.max(0, dispatchAttempts - 1);
            dispatchAttemptsSum += dispatchAttempts;
            dispatchRetrySum += dispatchRetryCount;
            if (dispatchRetryCount > 0) {
                dispatchRetryingJobs++;
            }
            if ("COMPLETED".equals(status)) {
                completedCount++;
                completedAgeSumMs += Math.max(0L, updatedAtMs - createdAtMs);
            } else if ("FAILED".equals(status)) {
                failedCount++;
                failedAgeSumMs += Math.max(0L, updatedAtMs - createdAtMs);
            } else if ("PROCESSING".equals(status) && ageMs >= longInputThresholdMs && longInputThresholdMs > 0L) {
                processingOlderThanThreshold++;
            }
        }

        Map<String, Object> timing = new HashMap<>();
        timing.put("completed_average_age_ms", completedCount == 0L ? 0L : completedAgeSumMs / completedCount);
        timing.put("failed_average_age_ms", failedCount == 0L ? 0L : failedAgeSumMs / failedCount);
        timing.put("average_dispatch_attempts", rows.isEmpty() ? 0L : dispatchAttemptsSum / rows.size());
        timing.put("total_dispatch_retry_count", dispatchRetrySum);
        timing.put("dispatch_retrying_jobs", dispatchRetryingJobs);
        timing.put("stale_processing_count", processingOlderThanThreshold);
        timing.put("long_input_threshold_ms", longInputThresholdMs);
        return timing;
    }

    private long parseInstantMillis(Object value, long fallbackMillis) {
        if (value == null) {
            return fallbackMillis;
        }
        String text = String.valueOf(value).trim();
        if (text.isBlank()) {
            return fallbackMillis;
        }
        try {
            return Instant.parse(text).toEpochMilli();
        } catch (DateTimeParseException ignored) {
            try {
                return OffsetDateTime.parse(text).toInstant().toEpochMilli();
            } catch (DateTimeParseException ignoredAgain) {
                return fallbackMillis;
            }
        }
    }

    private record ProviderInfo(String name, String label, String description, String status, List<String> capabilities) {
        Map<String, Object> toMap() {
            return Map.of("name", name, "label", label, "description", description, "status", status, "capabilities", capabilities);
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
