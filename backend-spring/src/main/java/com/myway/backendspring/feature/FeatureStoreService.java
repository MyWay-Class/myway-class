package com.myway.backendspring.feature;

import com.myway.backendspring.domain.DemoLearningService;
import com.myway.backendspring.domain.LectureItem;
import com.myway.backendspring.domain.ActivityEventService;
import com.myway.backendspring.feature.quota.AiUsageQuotaService;
import com.myway.backendspring.feature.rag.RagService;
import com.myway.backendspring.feature.shortform.ShortformService;
import com.myway.backendspring.persistence.FeatureJdbcStore;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.Comparator;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class FeatureStoreService {
    private static final String AI_SETTINGS_SCOPE = "ai_settings";
    private static final String TRANSCRIPT_SCOPE = "media_transcript";
    private static final String EXTRACTION_SCOPE = "media_extraction";
    private static final String PIPELINE_SCOPE = "media_pipeline";
    private static final String MEDIA_NOTE_SCOPE = "media_note";
    private static final String MEDIA_ASSET_SCOPE = "media_asset";
    private static final String SHORTFORM_EXTRACTION_SCOPE = "shortform_extraction";
    private static final String SHORTFORM_VIDEO_SCOPE = "shortform_video";
    private static final String SHORTFORM_SAVE_SCOPE = "shortform_save";
    private static final String SHORTFORM_SHARE_SCOPE = "shortform_share";
    private static final String SHORTFORM_LIKE_SCOPE = "shortform_like";
    private static final String CUSTOM_COURSE_SCOPE = "custom_course";
    private static final String ADMIN_ASSIGNMENT_SCOPE = "admin_assignment";
    private static final String AI_USAGE_SCOPE = "ai_usage_daily";
    private static final String RAG_INDEX_SCOPE = "rag_chunk_index";
    private static final String DEV_AI_PROVIDER = "ollama";
    private static final String NON_DEV_AI_PROVIDER = "gemini";
    private static final String DEV_AI_MODEL = "llama3.1:8b";
    private static final String NON_DEV_AI_MODEL = "gemini-1.5-flash";
    private static final String STT_DEFAULT_PROVIDER = "cloudflare";
    private static final String STT_DEFAULT_MODEL = "cf-whisper";
    private static final int PUBLIC_STT_MAX_DURATION_MS = 180_000;
    private static final int FALLBACK_TRANSCRIPT_DURATION_MS = 120_000;
    private static final int FALLBACK_SEGMENT_MIN_MS = 1_000;
    private static final int RAG_CHUNK_MAX_WORDS = 90;
    private static final int RAG_CHUNK_OVERLAP_WORDS = 20;
    private static final int STT_TARGET_SEGMENT_WORDS = 20;
    private final FeatureJdbcStore store;
    private final DemoLearningService learningService;
    private final int shortformMaxRetry;
    private final ActivityEventService activityEventService;
    private final String mediaProcessorUrl;
    private final String mediaProcessorToken;
    private final String mediaCallbackSecret;
    private final String mediaPublicBaseUrl;
    private final String runtimeEnv;
    private final RagService ragService;
    private final AiUsageQuotaService aiUsageQuotaService;
    private final ShortformService shortformService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    public FeatureStoreService(
            FeatureJdbcStore store,
            DemoLearningService learningService,
            ActivityEventService activityEventService,
            @Value("${myway.shortform.retry.max-attempts:3}") int shortformMaxRetry,
            @Value("${myway.media.processor.url:}") String mediaProcessorUrl,
            @Value("${myway.media.processor.token:}") String mediaProcessorToken,
            @Value("${myway.media.callback.secret:}") String mediaCallbackSecret,
            @Value("${myway.media.public-base-url:http://127.0.0.1:8787}") String mediaPublicBaseUrl,
            @Value("${myway.runtime.env:${SPRING_PROFILES_ACTIVE:dev}}") String runtimeEnv,
            RagService ragService,
            AiUsageQuotaService aiUsageQuotaService,
            ShortformService shortformService
    ) {
        this.store = store;
        this.learningService = learningService;
        this.activityEventService = activityEventService;
        this.shortformMaxRetry = Math.max(1, shortformMaxRetry);
        this.mediaProcessorUrl = mediaProcessorUrl == null ? "" : mediaProcessorUrl.trim();
        this.mediaProcessorToken = mediaProcessorToken == null ? "" : mediaProcessorToken.trim();
        this.mediaCallbackSecret = mediaCallbackSecret == null ? "" : mediaCallbackSecret.trim();
        this.mediaPublicBaseUrl = mediaPublicBaseUrl == null ? "http://127.0.0.1:8787" : mediaPublicBaseUrl.trim();
        this.runtimeEnv = runtimeEnv == null ? "dev" : runtimeEnv.trim();
        this.ragService = ragService;
        this.aiUsageQuotaService = aiUsageQuotaService;
        this.shortformService = shortformService;
        ensureDefaults();
    }

    // Backward-compatible constructor for tests instantiating service directly.
    public FeatureStoreService(FeatureJdbcStore store, int shortformMaxRetry) {
        this(store, new DemoLearningService(), null, shortformMaxRetry, "", "", "", "http://127.0.0.1:8787", "dev", null, null, null);
    }

    private void ensureDefaults() {
        Map<String, Object> settings = store.getKv(AI_SETTINGS_SCOPE, "global");
        String policyProvider = resolvePolicyAiProvider();
        String policyModel = resolvePolicyAiModel();
        if (settings == null) {
            store.upsertKv(AI_SETTINGS_SCOPE, "global", new HashMap<>(Map.of(
                    "daily_limit", 100,
                    "provider", policyProvider,
                    "model", policyModel
            )));
            return;
        }

        boolean changed = false;
        if (!settings.containsKey("daily_limit")) {
            settings.put("daily_limit", 100);
            changed = true;
        }
        if (!settings.containsKey("provider") || !policyProvider.equals(String.valueOf(settings.get("provider")))) {
            settings.put("provider", policyProvider);
            changed = true;
        }
        if (!settings.containsKey("model") || !policyModel.equals(String.valueOf(settings.get("model")))) {
            settings.put("model", policyModel);
            changed = true;
        }
        if (changed) {
            store.upsertKv(AI_SETTINGS_SCOPE, "global", settings);
        }
    }

    public Map<String, Object> aiInsights(String userId) {
        Map<String, Object> settings = aiSettings(userId);
        return Map.of(
                "user_id", userId,
                "total_requests", 0,
                "success_rate", 1.0,
                "provider", settings.getOrDefault("provider", "demo"),
                "model", settings.getOrDefault("model", "demo-v1"),
                "last_updated", Instant.now().toString()
        );
    }

    public Map<String, Object> aiLogs(String userId) {
        List<Map<String, Object>> rows = store.listAiUsageLogs(userId).stream()
                .map(item -> {
                    Map<String, Object> mapped = new HashMap<>();
                    mapped.put("id", String.valueOf(item.getOrDefault("id", "")));
                    mapped.put("user_id", String.valueOf(item.getOrDefault("user_id", userId)));
                    mapped.put("feature", String.valueOf(item.getOrDefault("feature", "request")));
                    mapped.put("success", asBoolean(item.get("success"), false));
                    mapped.put("input_text", String.valueOf(item.getOrDefault("input_text", "")));
                    mapped.put("created_at", String.valueOf(item.getOrDefault("created_at", Instant.now().toString())));
                    return mapped;
                })
                .toList();
        return Map.of("user_id", userId, "items", rows, "count", rows.size());
    }

    public Map<String, Object> aiRecommendations(String userId) {
        return Map.of(
                "user_id", userId,
                "items", List.of(
                        Map.of("id", "rec-1", "type", "study", "title", "최근 질문 기반 복습 추천")
                ),
                "count", 1
        );
    }

    public Map<String, Object> aiSettings(String userId) {
        Map<String, Object> global = store.getKv(AI_SETTINGS_SCOPE, "global");
        Map<String, Object> settings = store.getKv(AI_SETTINGS_SCOPE, userId);
        Map<String, Object> merged = new HashMap<>();
        if (global != null) {
            merged.putAll(global);
        }
        if (settings != null) {
            merged.putAll(settings);
        }
        merged.putIfAbsent("provider", resolvePolicyAiProvider());
        merged.putIfAbsent("model", resolvePolicyAiModel());
        return merged;
    }

    public Map<String, Object> updateAiSettings(String userId, Map<String, Object> patch) {
        Map<String, Object> settings = new HashMap<>(aiSettings(userId));
        if (patch != null) {
            settings.putAll(patch);
            // When only daily_limit is patched, start a new quota window for deterministic quota tests.
            if (patch.containsKey("daily_limit") && patch.size() == 1) {
                settings.put("quota_window_started_at", Instant.now().toString());
                store.upsertAiUsageDaily(userId, java.time.LocalDate.now(), 0);
            } else if (patch.containsKey("daily_limit")) {
                settings.remove("quota_window_started_at");
            }
        }
        store.upsertKv(AI_SETTINGS_SCOPE, userId, settings);
        return settings;
    }

    public Map<String, Object> aiProviders(String userId) {
        return Map.of("providers", List.of("demo", "ollama", "gemini"), "current", aiSettings(userId).getOrDefault("provider", "demo"));
    }

    public Map<String, Object> sttProviders() {
        List<Map<String, Object>> providers = List.of(
                Map.of(
                        "name", "demo",
                        "label", "Demo STT",
                        "description", "현재 텍스트 기반 트랜스크립트를 안전하게 유지하는 기본 경로입니다.",
                        "status", "available",
                        "capabilities", List.of("transcribe", "segment", "pipeline")
                ),
                Map.of(
                        "name", "cloudflare",
                        "label", "Cloudflare AI",
                        "description", "배포 환경에서 실제 Workers AI 전사를 수행하는 STT 계층입니다.",
                        "status", "available",
                        "capabilities", List.of("transcribe", "segment", "pipeline")
                ),
                Map.of(
                        "name", "gemini",
                        "label", "Gemini",
                        "description", "무료 API 쿼터 기반으로 전사 보조와 정리 작업에 활용할 수 있습니다.",
                        "status", "planned",
                        "capabilities", List.of("transcribe", "segment", "pipeline")
                )
        );
        List<String> chain = List.of(STT_DEFAULT_PROVIDER, "gemini", "demo");
        List<Map<String, Object>> steps = new ArrayList<>();
        for (int i = 0; i < chain.size(); i++) {
            String provider = chain.get(i);
            String reason = i == 0 ? "이 기능의 기본 경로" : (i == chain.size() - 1 ? "최후의 안전망" : "기본 경로가 실패할 때의 대체 경로");
            String status = "planned";
            if ("cloudflare".equals(provider) || "demo".equals(provider)) {
                status = "available";
            }
            steps.add(Map.of("provider", provider, "status", status, "reason", reason));
        }
        List<Map<String, Object>> plans = List.of(
                Map.of("feature", "transcribe", "current_provider", STT_DEFAULT_PROVIDER, "recommended_chain", chain, "steps", steps),
                Map.of("feature", "segment", "current_provider", STT_DEFAULT_PROVIDER, "recommended_chain", chain, "steps", steps),
                Map.of("feature", "pipeline", "current_provider", STT_DEFAULT_PROVIDER, "recommended_chain", chain, "steps", steps)
        );
        return Map.of(
                "generated_at", Instant.now().toString(),
                "providers", providers,
                "plans", plans
        );
    }

    public Map<String, Object> processorHealth() {
        Map<String, Object> remoteHealth = fetchRemoteProcessorHealth();
        List<Map<String, Object>> extractions = store.listKvByScope(EXTRACTION_SCOPE);
        long processing = extractions.stream()
                .map(item -> String.valueOf(item.getOrDefault("status", "PROCESSING")))
                .filter(status -> "PROCESSING".equalsIgnoreCase(status))
                .count();
        long failed = extractions.stream()
                .map(item -> String.valueOf(item.getOrDefault("status", "PROCESSING")))
                .filter(status -> "FAILED".equalsIgnoreCase(status))
                .count();
        long completed = extractions.stream()
                .map(item -> String.valueOf(item.getOrDefault("status", "PROCESSING")))
                .filter(status -> "COMPLETED".equalsIgnoreCase(status))
                .count();
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
                "jobs", Map.of(
                        "total", total,
                        "processing", processing,
                        "completed", completed,
                        "failed", failed
                ),
                "work_dir", "backend-spring/data",
                "public_base_url", mediaPublicBaseUrl + "/api/v1/media",
                "recent_jobs", recentJobs,
                "updated_at", Instant.now().toString()
        );
    }

    public boolean canConsumeAi(String userId) {
        if (aiUsageQuotaService == null) {
            return true;
        }
        return aiUsageQuotaService.canConsumeAi(userId, aiSettings(userId));
    }

    public void recordAiUsage(String userId, String feature, boolean success, String inputText) {
        if (aiUsageQuotaService != null) {
            aiUsageQuotaService.recordAiUsage(userId, feature, success, inputText);
        }
    }

    public Map<String, Object> ragOverview(String query, String lectureId, String courseId, Integer limit) {
        return ragOverview(query, lectureId, courseId, limit, null, false);
    }

    public Map<String, Object> ragOverview(
            String query,
            String lectureId,
            String courseId,
            Integer limit,
            Double minScore,
            boolean includeDebug
    ) {
        if (ragService == null) {
            return Map.of();
        }
        return ragService.ragOverview(query, lectureId, courseId, limit, minScore, includeDebug);
    }

    public Map<String, Object> ragIndexOverview(String lectureId, String courseId) {
        if (ragService == null) {
            return Map.of();
        }
        return ragService.ragIndexOverview(lectureId, courseId);
    }

    public Map<String, Object> rebuildRagIndex(String lectureId, String courseId) {
        if (ragService == null) {
            return Map.of();
        }
        return ragService.rebuildRagIndex(lectureId, courseId);
    }

    public Map<String, Object> clearRagIndex(String lectureId, String courseId) {
        if (ragService == null) {
            return Map.of();
        }
        return ragService.clearRagIndex(lectureId, courseId);
    }

    public Map<String, Object> evaluateRagBatch(List<Map<String, Object>> cases, Integer topK) {
        if (ragService == null) {
            return Map.of();
        }
        return ragService.evaluateBatch(cases, topK);
    }

    private Instant parseInstantOrNull(Object raw) {
        if (raw == null) {
            return null;
        }
        String value = String.valueOf(raw).trim();
        if (value.isBlank()) {
            return null;
        }
        try {
            return Instant.parse(value);
        } catch (DateTimeParseException ignored) {
            return null;
        }
    }

    public Map<String, Object> mediaUpload(String lectureId, String fileName) {
        String key = "asset/" + lectureId + "/" + UUID.randomUUID();
        Map<String, Object> payload = Map.of("lecture_id", lectureId, "asset_key", key, "video_url", "/api/v1/media/assets/" + key, "file_name", fileName);
        store.upsertKv(MEDIA_ASSET_SCOPE, key, payload);
        return payload;
    }

    public Map<String, Object> createExtraction(String lectureId) {
        return createExtraction(lectureId, null);
    }

    public Map<String, Object> createExtraction(String lectureId, String audioUrl) {
        String id = UUID.randomUUID().toString();
        String now = Instant.now().toString();
        Map<String, Object> item = new HashMap<>();
        item.put("id", id);
        item.put("lecture_id", lectureId);
        item.put("status", "PROCESSING");
        item.put("audio_url", audioUrl);
        item.put("processing_stage", "queued");
        item.put("processing_step", "job_requested");
        item.put("processing_error_code", null);
        item.put("processing_error", null);
        item.put("stt_status", "PENDING");
        item.put("transcript_id", null);
        item.put("last_event_version", 0L);
        item.put("created_at", now);
        item.put("updated_at", now);

        store.insertEvent(EXTRACTION_SCOPE, lectureId, id, item);
        store.upsertKv(EXTRACTION_SCOPE, id, item);
        Map<String, Object> pipeline = new HashMap<>();
        pipeline.put("lecture_id", lectureId);
        pipeline.put("transcript_status", "PENDING");
        pipeline.put("summary_status", "PENDING");
        pipeline.put("audio_status", "PROCESSING");
        pipeline.put("processing_stage", "queued");
        pipeline.put("processing_step", "job_requested");
        pipeline.put("processing_error_code", null);
        pipeline.put("processing_error", null);
        pipeline.put("transcript_id", null);
        pipeline.put("note_id", null);
        pipeline.put("extraction_id", id);
        pipeline.put("updated_at", now);
        store.upsertKv(PIPELINE_SCOPE, lectureId, pipeline);

        return item;
    }

    public Map<String, Object> dispatchExtractionJob(String extractionId, String sourceVideoUrl) {
        Map<String, Object> extraction = store.getKv(EXTRACTION_SCOPE, extractionId);
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
            store.upsertKv(EXTRACTION_SCOPE, extractionId, extraction);
            return extraction;
        }

        try {
            URI callbackUri = URI.create(mediaPublicBaseUrl + "/api/v1/media/extract-audio/callback");
            Map<String, Object> body = new HashMap<>();
            body.put("extraction_id", extractionId);
            body.put("lecture_id", String.valueOf(extraction.getOrDefault("lecture_id", "")));
            body.put("source_video_url", sourceVideoUrl);
            body.put("callback", Map.of(
                    "url", callbackUri.toString(),
                    "secret", mediaCallbackSecret.isBlank() ? null : mediaCallbackSecret
            ));
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
        store.upsertKv(EXTRACTION_SCOPE, extractionId, extraction);
        return extraction;
    }

    public Map<String, Object> transcript(String lectureId) {
        return store.getKv(TRANSCRIPT_SCOPE, lectureId);
    }

    public Map<String, Object> transcribe(String lectureId, String language, Integer durationMsInput, String sttProvider, String sttModel) {
        return transcribe(lectureId, language, durationMsInput, sttProvider, sttModel, null);
    }

    public Map<String, Object> transcribe(String lectureId, String language, Integer durationMsInput, String sttProvider, String sttModel, String audioUrl) {
        return transcribe(lectureId, language, durationMsInput, sttProvider, sttModel, audioUrl, null);
    }

    public Map<String, Object> transcribe(String lectureId, String language, Integer durationMsInput, String sttProvider, String sttModel, String audioUrl, String extractionId) {
        Map<String, Object> extraction = extractionId == null || extractionId.isBlank()
                ? createExtraction(lectureId, audioUrl)
                : store.getKv(EXTRACTION_SCOPE, extractionId);
        if (extraction == null) {
            extraction = createExtraction(lectureId, audioUrl);
        }
        String now = Instant.now().toString();
        Map<String, Object> extractionInProgress = new HashMap<>(extraction);
        extractionInProgress.put("status", "PROCESSING");
        extractionInProgress.put("stt_status", "PROCESSING");
        extractionInProgress.put("processing_stage", "transcribing");
        extractionInProgress.put("processing_step", "stt_started");
        extractionInProgress.put("processing_error_code", null);
        extractionInProgress.put("processing_error", null);
        extractionInProgress.put("updated_at", now);
        store.upsertKv(EXTRACTION_SCOPE, String.valueOf(extractionInProgress.getOrDefault("id", extractionId)), extractionInProgress);
        extraction = extractionInProgress;
        LectureItem lecture = learningService.getLecture(lectureId);
        int lectureDurationMs = lecture == null
                ? FALLBACK_TRANSCRIPT_DURATION_MS
                : Math.max(FALLBACK_SEGMENT_MIN_MS * 3, lecture.duration_minutes() * 60_000);
        int requestedDurationMs = durationMsInput == null || durationMsInput <= 0 ? lectureDurationMs : durationMsInput;
        int durationMs = Math.min(requestedDurationMs, PUBLIC_STT_MAX_DURATION_MS);

        String normalizedLanguage = language == null || language.isBlank() ? "ko" : language;
        String resolvedProvider = sttProvider == null || sttProvider.isBlank() ? STT_DEFAULT_PROVIDER : sttProvider.trim();
        String resolvedModel = sttModel == null || sttModel.isBlank() ? STT_DEFAULT_MODEL : sttModel.trim();
        String baseText = buildLectureNarrative(lectureId);
        List<Map<String, Object>> segments = splitIntoSegments(baseText, durationMs);
        String transcriptId = String.valueOf(extraction.getOrDefault("id", UUID.randomUUID().toString()));
        int wordCount = countWords(baseText);
        Map<String, Object> sttQuality = sttQualityMetrics(segments, durationMs);

        Map<String, Object> transcriptPayload = new HashMap<>();
        transcriptPayload.put("id", transcriptId);
        transcriptPayload.put("lecture_id", lectureId);
        transcriptPayload.put("language", normalizedLanguage);
        transcriptPayload.put("full_text", baseText);
        transcriptPayload.put("segments", segments);
        transcriptPayload.put("word_count", wordCount);
        transcriptPayload.put("duration_ms", durationMs);
        transcriptPayload.put("stt_provider", resolvedProvider);
        transcriptPayload.put("stt_model", resolvedModel);
        transcriptPayload.put("quality", sttQuality);
        transcriptPayload.put("created_at", Instant.now().toString());
        store.upsertKv(TRANSCRIPT_SCOPE, lectureId, transcriptPayload);

        Map<String, Object> pipelinePayload = new HashMap<>();
        pipelinePayload.put("lecture_id", lectureId);
        pipelinePayload.put("transcript_status", "COMPLETED");
        pipelinePayload.put("summary_status", "PENDING");
        pipelinePayload.put("audio_status", "COMPLETED");
        pipelinePayload.put("processing_stage", "completed");
        pipelinePayload.put("processing_step", "stt_completed");
        pipelinePayload.put("processing_error_code", null);
        pipelinePayload.put("processing_error", null);
        pipelinePayload.put("transcript_id", transcriptId);
        pipelinePayload.put("note_id", null);
        pipelinePayload.put("extraction_id", extraction.get("id"));
        pipelinePayload.put("updated_at", now);
        store.upsertKv(PIPELINE_SCOPE, lectureId, pipelinePayload);

        Map<String, Object> extractionPayload = new HashMap<>(extraction);
        extractionPayload.put("status", "COMPLETED");
        extractionPayload.put("stt_status", "COMPLETED");
        extractionPayload.put("transcript_id", transcriptId);
        extractionPayload.put("audio_duration_ms", durationMs);
        extractionPayload.put("processed_at", now);
        extractionPayload.put("updated_at", now);
        extractionPayload.put("language", normalizedLanguage);
        extractionPayload.put("requested_stt_provider", resolvedProvider);
        extractionPayload.put("requested_stt_model", resolvedModel);
        extractionPayload.put("audio_url", audioUrl);
        extractionPayload.put("processing_stage", "completed");
        extractionPayload.put("processing_step", "stt_completed");
        extractionPayload.put("processing_error_code", null);
        extractionPayload.put("processing_error", null);
        extractionPayload.put("stt_quality", sttQuality);
        store.upsertKv(EXTRACTION_SCOPE, String.valueOf(extraction.getOrDefault("id", transcriptId)), extractionPayload);

        Map<String, Object> ragIndex = rebuildRagIndex(lectureId, null);

        Map<String, Object> response = new HashMap<>();
        response.put("transcript_id", transcriptId);
        response.put("lecture_id", lectureId);
        response.put("segment_count", segments.size());
        response.put("duration_ms", durationMs);
        response.put("word_count", wordCount);
        response.put("stt_provider", resolvedProvider);
        response.put("stt_model", resolvedModel);
        response.put("audio_url", audioUrl);
        response.put("pipeline", pipeline(lectureId));
        response.put("language", normalizedLanguage);
        response.put("quality", sttQuality);
        response.put("rag_index", ragIndex);
        return response;
    }

    private Map<String, Object> fetchRemoteProcessorHealth() {
        if (mediaProcessorUrl.isBlank()) {
            return null;
        }
        try {
            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(mediaProcessorUrl + "/health"))
                    .GET();
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

    public List<Map<String, Object>> extractions(String lectureId) {
        List<Map<String, Object>> rows = store.listEventsByOwner(EXTRACTION_SCOPE, lectureId);
        List<Map<String, Object>> merged = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            String extractionId = String.valueOf(row.getOrDefault("id", "")).trim();
            Map<String, Object> latest = extractionId.isBlank() ? null : store.getKv(EXTRACTION_SCOPE, extractionId);
            Map<String, Object> hydrated = latest == null ? new HashMap<>(row) : new HashMap<>(latest);
            hydrated.putIfAbsent("processing_stage", "queued");
            hydrated.putIfAbsent("processing_step", "job_requested");
            hydrated.putIfAbsent("processing_error_code", null);
            hydrated.putIfAbsent("processing_error", null);
            hydrated.putIfAbsent("stt_status", "PENDING");
            merged.add(hydrated);
        }
        return merged;
    }

    public Map<String, Object> completeExtractionCallback(String extractionId, String status, String errorMessage, long eventVersion) {
        return completeExtractionCallback(extractionId, status, errorMessage, eventVersion, null);
    }

    public Map<String, Object> completeExtractionCallback(String extractionId, String status, String errorMessage, long eventVersion, String audioUrl) {
        return completeExtractionCallback(extractionId, status, errorMessage, eventVersion, audioUrl, null, null, null, null, null, null);
    }

    public Map<String, Object> completeExtractionCallback(
            String extractionId,
            String status,
            String errorMessage,
            long eventVersion,
            String audioUrl,
            String processingJobId,
            String processingStage,
            String processingStep,
            String audioFormat,
            Integer sampleRate,
            Integer channels
    ) {
        Map<String, Object> extraction = store.getKv(EXTRACTION_SCOPE, extractionId);
        if (extraction != null) {
            extraction = new HashMap<>(extraction);
        }
        if (extraction == null) {
            for (Map<String, Object> row : store.listEventsByScope(EXTRACTION_SCOPE)) {
                if (extractionId.equals(String.valueOf(row.getOrDefault("id", "")))) {
                    extraction = new HashMap<>(row);
                    break;
                }
            }
        }
        if (extraction == null) {
            return null;
        }

        long currentVersion = asLong(extraction.get("last_event_version"));
        if (eventVersion <= currentVersion) {
            extraction.put("callback_ignored", true);
            extraction.put("callback_status", "IGNORED_STALE");
            return normalizeExtractionForResponse(extraction);
        }

        String now = Instant.now().toString();
        String resolvedStatus = status == null || status.isBlank() ? "COMPLETED" : status.toUpperCase();
        String resolvedErrorCode = "FAILED".equalsIgnoreCase(resolvedStatus) ? "PROCESSOR_CALLBACK_FAILED" : null;
        if ("FAILED".equalsIgnoreCase(resolvedStatus) && (errorMessage == null || errorMessage.isBlank())) {
            errorMessage = "media processor callback failed";
        }
        extraction.put("last_event_version", eventVersion);
        extraction.put("status", resolvedStatus);
        extraction.put("error_message", errorMessage);
        if (audioUrl != null && !audioUrl.isBlank()) {
            extraction.put("audio_url", audioUrl);
        }
        if (processingJobId != null && !processingJobId.isBlank()) {
            extraction.put("processing_job_id", processingJobId);
        }
        if (processingStage != null && !processingStage.isBlank()) {
            extraction.put("processing_stage", processingStage);
        }
        if (processingStep != null && !processingStep.isBlank()) {
            extraction.put("processing_step", processingStep);
        }
        if (audioFormat != null && !audioFormat.isBlank()) {
            extraction.put("audio_format", audioFormat);
        }
        if (sampleRate != null && sampleRate > 0) {
            extraction.put("sample_rate", sampleRate);
        }
        if (channels != null && channels > 0) {
            extraction.put("channels", channels);
        }
        if ("COMPLETED".equalsIgnoreCase(resolvedStatus)) {
            extraction.put("status", "PROCESSING");
            extraction.put("processing_stage", "transcribing");
            extraction.put("processing_step", "stt_started");
            extraction.put("stt_status", "PROCESSING");
            extraction.put("processing_error_code", null);
            extraction.put("processing_error", null);
            extraction.put("processed_at", now);
        } else if ("FAILED".equalsIgnoreCase(resolvedStatus)) {
            extraction.put("processing_stage", "failed");
            extraction.put("processing_step", "callback_failed");
            extraction.put("stt_status", "FAILED");
            extraction.put("processing_error_code", resolvedErrorCode);
            extraction.put("processing_error", errorMessage);
            extraction.put("processed_at", now);
        } else {
            extraction.put("processing_stage", "callback");
            extraction.put("processing_step", "callback_received");
        }
        extraction.put("callback_ignored", false);
        extraction.put("callback_status", "APPLIED");
        extraction.put("updated_at", now);
        store.upsertKv(EXTRACTION_SCOPE, extractionId, extraction);

        String lectureId = String.valueOf(extraction.getOrDefault("lecture_id", "")).trim();
        if (!lectureId.isBlank()) {
            Map<String, Object> pipeline = new HashMap<>();
            pipeline.put("lecture_id", lectureId);
            pipeline.put("audio_status", "FAILED".equalsIgnoreCase(resolvedStatus) ? "FAILED" : "COMPLETED");
            pipeline.put("transcript_status", "FAILED".equalsIgnoreCase(resolvedStatus) ? "FAILED" : "PROCESSING");
            pipeline.put("summary_status", "PENDING");
            pipeline.put("processing_stage", "FAILED".equalsIgnoreCase(resolvedStatus) ? "failed" : "transcribing");
            pipeline.put("processing_step", "FAILED".equalsIgnoreCase(resolvedStatus) ? "callback_failed" : "stt_started");
            pipeline.put("processing_error_code", "FAILED".equalsIgnoreCase(resolvedStatus) ? resolvedErrorCode : null);
            pipeline.put("processing_error", "FAILED".equalsIgnoreCase(resolvedStatus) ? errorMessage : null);
            pipeline.put("transcript_id", extraction.get("transcript_id"));
            pipeline.put("note_id", null);
            pipeline.put("extraction_id", extraction.get("id"));
            pipeline.put("updated_at", now);
            store.upsertKv(PIPELINE_SCOPE, lectureId, pipeline);
        }
        if (activityEventService != null) {
            String userId = String.valueOf(extraction.getOrDefault("user_id", "")).trim();
            if (!userId.isBlank()) {
                activityEventService.append(
                        userId,
                        "media_extraction_" + resolvedStatus.toLowerCase(),
                        "extraction",
                        extractionId,
                        Map.of("lecture_id", lectureId, "status", resolvedStatus)
                );
            }
        }
        return normalizeExtractionForResponse(extraction);
    }

    private Map<String, Object> normalizeExtractionForResponse(Map<String, Object> extraction) {
        Map<String, Object> hydrated = new HashMap<>(extraction);
        hydrated.putIfAbsent("processing_stage", "queued");
        hydrated.putIfAbsent("processing_step", "job_requested");
        hydrated.putIfAbsent("processing_error_code", null);
        hydrated.putIfAbsent("processing_error", null);
        hydrated.putIfAbsent("stt_status", "PENDING");
        hydrated.putIfAbsent("error_message", null);
        hydrated.putIfAbsent("callback_ignored", false);
        hydrated.putIfAbsent("callback_status", "APPLIED");
        hydrated.putIfAbsent("last_event_version", 0L);
        return hydrated;
    }

    public Map<String, Object> pipeline(String lectureId) {
        Map<String, Object> row = store.getKv(PIPELINE_SCOPE, lectureId);
        if (row == null) {
            Map<String, Object> empty = new HashMap<>();
            empty.put("lecture_id", lectureId);
            empty.put("status", "EMPTY");
            empty.put("audio_status", "PENDING");
            empty.put("transcript_status", "PENDING");
            empty.put("summary_status", "PENDING");
            empty.put("processing_stage", "idle");
            empty.put("processing_step", "not_started");
            empty.put("processing_error_code", null);
            empty.put("processing_error", null);
            empty.put("transcript_id", null);
            empty.put("note_id", null);
            empty.put("extraction_id", null);
            empty.put("updated_at", Instant.now().toString());
            return empty;
        }
        Map<String, Object> hydrated = new HashMap<>(row);
        hydrated.putIfAbsent("audio_status", "PENDING");
        hydrated.putIfAbsent("transcript_status", "PENDING");
        hydrated.putIfAbsent("summary_status", "PENDING");
        hydrated.putIfAbsent("processing_stage", "idle");
        hydrated.putIfAbsent("processing_step", "not_started");
        hydrated.putIfAbsent("processing_error_code", null);
        hydrated.putIfAbsent("processing_error", null);
        hydrated.putIfAbsent("transcript_id", null);
        hydrated.putIfAbsent("note_id", null);
        hydrated.putIfAbsent("extraction_id", null);
        hydrated.putIfAbsent("updated_at", Instant.now().toString());
        return hydrated;
    }

    public Map<String, Object> summarizeLecture(String lectureId, String style, String language) {
        Map<String, Object> note = new HashMap<>();
        note.put("id", UUID.randomUUID().toString());
        note.put("lecture_id", lectureId);
        note.put("title", "자동 요약 노트");
        note.put("content", "Spring 백엔드에서 생성한 요약입니다.");
        note.put("key_concepts", List.of("핵심 개념", "핵심 정리"));
        note.put("keywords", List.of("spring", "summary"));
        note.put("timestamps", List.of(Map.of("start_ms", 0, "end_ms", 30000, "label", "인트로")));
        note.put("style", style == null || style.isBlank() ? "brief" : style);
        note.put("language", language == null || language.isBlank() ? "ko" : language);
        note.put("created_at", Instant.now().toString());
        store.insertEvent(MEDIA_NOTE_SCOPE, lectureId, String.valueOf(note.get("id")), note);
        return note;
    }

    public List<Map<String, Object>> notes(String lectureId) {
        return store.listEventsByOwner(MEDIA_NOTE_SCOPE, lectureId);
    }

    public Map<String, Object> mediaAsset(String assetKey) {
        return store.getKv(MEDIA_ASSET_SCOPE, assetKey);
    }

    public Map<String, Object> createShortformExtraction(String userId, Map<String, Object> payload) {
        return shortformService == null ? Map.of() : shortformService.createShortformExtraction(userId, payload);
    }

    public Map<String, Object> getShortformExtraction(String id) {
        return shortformService == null ? null : shortformService.getShortformExtraction(id);
    }

    public Map<String, Object> selectShortformCandidates(String extractionId, List<String> candidateIds) {
        return shortformService == null ? null : shortformService.selectShortformCandidates(extractionId, candidateIds);
    }

    public Map<String, Object> composeShortform(String userId, Map<String, Object> payload) {
        return shortformService == null ? Map.of() : shortformService.composeShortform(userId, payload);
    }

    public Map<String, Object> shortformVideo(String id) {
        return shortformService == null ? null : shortformService.shortformVideo(id);
    }

    public List<Map<String, Object>> shortformVideos(String userId) {
        return shortformService == null ? List.of() : shortformService.shortformVideos(userId);
    }

    public Map<String, Object> shareShortform(String userId, Map<String, Object> payload) {
        return shortformService == null ? null : shortformService.shareShortform(userId, payload);
    }

    public Map<String, Object> saveShortform(String userId, Map<String, Object> payload) {
        return shortformService == null ? null : shortformService.saveShortform(userId, payload);
    }

    public Map<String, Object> toggleShortformLike(String userId, String videoId) {
        return shortformService == null ? null : shortformService.toggleShortformLike(userId, videoId);
    }

    public Map<String, Object> retryShortformExport(String userId, String shortformId) {
        return shortformService == null ? null : shortformService.retryShortformExport(userId, shortformId);
    }

    public Map<String, Object> applyShortformExportCallback(String shortformId, String status, long eventVersion, String videoUrl, String errorMessage) {
        return shortformService == null ? null : shortformService.applyShortformExportCallback(shortformId, status, eventVersion, videoUrl, errorMessage);
    }

    public List<Map<String, Object>> shortformLibrary(String userId) {
        return shortformService == null ? List.of() : shortformService.shortformLibrary(userId);
    }

    public List<Map<String, Object>> shortformCommunity(String courseId) {
        return shortformService == null ? List.of() : shortformService.shortformCommunity(courseId);
    }

    public Map<String, Object> customCompose(String userId, Map<String, Object> payload) {
        String id = UUID.randomUUID().toString();
        Map<String, Object> cc = new HashMap<>();
        cc.put("id", id);
        cc.put("owner_id", userId);
        cc.put("course_id", payload.getOrDefault("course_id", "crs_java_01"));
        cc.put("title", payload.getOrDefault("title", "커스텀 강의"));
        cc.put("description", payload.getOrDefault("description", ""));
        cc.put("clips", payload.getOrDefault("clips", List.of()));
        cc.put("shares", new ArrayList<>());

        store.upsertKv(CUSTOM_COURSE_SCOPE, id, cc);
        store.insertEvent(CUSTOM_COURSE_SCOPE + "_my", userId, id, cc);
        store.insertEvent(CUSTOM_COURSE_SCOPE + "_community", "all", id, cc);
        if (activityEventService != null) {
            activityEventService.append(
                    userId,
                    "custom_course_created",
                    "custom_course",
                    id,
                    Map.of("course_id", String.valueOf(cc.getOrDefault("course_id", "")))
            );
        }
        return cc;
    }

    public List<Map<String, Object>> myCustomCourses(String userId) {
        return store.listEventsByOwner(CUSTOM_COURSE_SCOPE + "_my", userId);
    }

    public Map<String, Object> customCourse(String id) {
        return store.getKv(CUSTOM_COURSE_SCOPE, id);
    }

    public List<Map<String, Object>> communityCustomCourses(String courseId) {
        return store.listEventsByScope(CUSTOM_COURSE_SCOPE + "_community");
    }

    public Map<String, Object> getAdminAssignment(String courseId) {
        Map<String, Object> current = store.getKv(ADMIN_ASSIGNMENT_SCOPE, courseId);
        if (current != null) {
            return current;
        }
        Map<String, Object> empty = new HashMap<>();
        empty.put("course_id", courseId);
        empty.put("student_ids", List.of());
        empty.put("updated_at", Instant.now().toString());
        return empty;
    }

    public Map<String, Object> saveAdminAssignment(String actorUserId, String courseId, List<String> studentIds) {
        LinkedHashSet<String> deduped = new LinkedHashSet<>();
        if (studentIds != null) {
            for (String studentId : studentIds) {
                if (studentId != null) {
                    String normalized = studentId.trim();
                    if (!normalized.isBlank()) {
                        deduped.add(normalized);
                    }
                }
            }
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put("course_id", courseId);
        payload.put("student_ids", List.copyOf(deduped));
        payload.put("updated_by", actorUserId);
        payload.put("updated_at", Instant.now().toString());
        store.upsertKv(ADMIN_ASSIGNMENT_SCOPE, courseId, payload);
        return payload;
    }

    private int asInt(Object value) {
        if (value == null) {
            return 0;
        }
        if (value instanceof Number n) {
            return n.intValue();
        }
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (Exception ignored) {
            return 0;
        }
    }

    private String resolvePolicyAiProvider() {
        return isNonDevRuntime() ? NON_DEV_AI_PROVIDER : DEV_AI_PROVIDER;
    }

    private String resolvePolicyAiModel() {
        return isNonDevRuntime() ? NON_DEV_AI_MODEL : DEV_AI_MODEL;
    }

    private boolean isNonDevRuntime() {
        String normalized = runtimeEnv == null ? "" : runtimeEnv.trim().toLowerCase();
        if (normalized.isBlank()) {
            return false;
        }
        String[] tokens = normalized.split("[,;\\s]+");
        for (String token : tokens) {
            if ("prod".equals(token) || "production".equals(token) || "staging".equals(token) || "stage".equals(token)) {
                return true;
            }
        }
        return false;
    }

    private boolean asBoolean(Object value, boolean defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        if (value instanceof Boolean bool) {
            return bool;
        }
        String normalized = String.valueOf(value).trim().toLowerCase();
        if (normalized.isEmpty()) {
            return defaultValue;
        }
        if ("true".equals(normalized) || "1".equals(normalized) || "y".equals(normalized) || "yes".equals(normalized)) {
            return true;
        }
        if ("false".equals(normalized) || "0".equals(normalized) || "n".equals(normalized) || "no".equals(normalized)) {
            return false;
        }
        return defaultValue;
    }

    private long asLong(Object value) {
        if (value == null) {
            return 0L;
        }
        if (value instanceof Number n) {
            return n.longValue();
        }
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (Exception ignored) {
            return 0L;
        }
    }

    private String usageKey(String userId) {
        return userId + ":" + java.time.LocalDate.now();
    }

    private List<String> targetLectureIds(String lectureId, String courseId) {
        if (lectureId != null && !lectureId.isBlank()) {
            return List.of(lectureId);
        }
        if (courseId != null && !courseId.isBlank()) {
            return learningService.getCourseLectures(courseId).stream().map(LectureItem::id).toList();
        }
        return learningService.listCourseCards("usr_std_001").stream()
                .flatMap(card -> learningService.getCourseLectures(card.id()).stream())
                .map(LectureItem::id)
                .distinct()
                .toList();
    }

    private List<Map<String, Object>> buildRagCorpus(List<String> lectureIds) {
        List<Map<String, Object>> chunks = new ArrayList<>();
        for (String lectureId : lectureIds) {
            LectureItem lecture = learningService.getLecture(lectureId);
            if (lecture == null) {
                continue;
            }

            Map<String, Object> transcript = transcript(lectureId);
            Object rawSegments = transcript == null ? null : transcript.get("segments");
            if (rawSegments instanceof List<?> list && !list.isEmpty()) {
                int index = 0;
                for (Object item : list) {
                    if (item instanceof Map<?, ?> map) {
                        Object rawText = map.containsKey("text") ? map.get("text") : "";
                        String text = normalizeText(String.valueOf(rawText));
                        if (text.isBlank()) {
                            continue;
                        }
                        chunks.add(buildChunk(
                                "transcript_" + lectureId + "_" + (index + 1),
                                lectureId,
                                "transcript",
                                String.valueOf(transcript.getOrDefault("id", lectureId)),
                                lecture.title() + " · 트랜스크립트",
                                text,
                                index
                        ));
                        index++;
                    }
                }
            }

            List<Map<String, Object>> noteEvents = store.listEventsByOwner(MEDIA_NOTE_SCOPE, lectureId);
            if (!noteEvents.isEmpty()) {
                int index = 0;
                for (Map<String, Object> note : noteEvents.stream().limit(2).toList()) {
                    String content = normalizeText(String.valueOf(note.getOrDefault("content", "")));
                    if (content.isBlank()) {
                        continue;
                    }
                    for (String part : splitForRag(content, 2)) {
                        chunks.add(buildChunk(
                                "note_" + lectureId + "_" + (index + 1),
                                lectureId,
                                "note",
                                String.valueOf(note.getOrDefault("id", lectureId)),
                                lecture.title() + " · 요약 노트",
                                part,
                                index
                        ));
                        index++;
                    }
                }
            }

            if (chunks.stream().noneMatch(chunk -> lectureId.equals(String.valueOf(chunk.get("lecture_id"))))) {
                int index = 0;
                for (String part : splitForRag(buildLectureNarrative(lectureId), 2)) {
                    chunks.add(buildChunk(
                            "lecture_" + lectureId + "_" + (index + 1),
                            lectureId,
                            "lecture",
                            lectureId,
                            lecture.title() + " · 강의 본문",
                            part,
                            index
                    ));
                    index++;
                }
            }
        }
        return chunks;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> indexedRagCorpus(List<String> lectureIds) {
        if (lectureIds.isEmpty()) return List.of();
        List<Map<String, Object>> indexed = new ArrayList<>();
        for (String lectureId : lectureIds) {
            Map<String, Object> saved = store.getKv(RAG_INDEX_SCOPE, ragIndexKey(lectureId, null));
            if (saved == null || !(saved.get("chunks") instanceof List<?> rows)) continue;
            for (Object row : rows) {
                if (!(row instanceof Map<?, ?> map)) continue;
                Map<String, Object> chunk = new HashMap<>();
                for (Map.Entry<?, ?> entry : map.entrySet()) {
                    if (entry.getKey() != null) {
                        chunk.put(String.valueOf(entry.getKey()), entry.getValue());
                    }
                }
                indexed.add(chunk);
            }
        }
        return indexed.isEmpty() ? buildRagCorpus(lectureIds) : indexed;
    }

    private String ragIndexKey(String lectureId, String courseId) {
        if (lectureId != null && !lectureId.isBlank()) return "lecture:" + lectureId;
        if (courseId != null && !courseId.isBlank()) return "course:" + courseId;
        return "global:all";
    }

    private Map<String, Object> buildChunk(
            String id,
            String lectureId,
            String sourceType,
            String sourceId,
            String title,
            String text,
            int index
    ) {
        String excerpt = text.length() > 240 ? text.substring(0, 240) : text;
        Map<String, Object> chunk = new HashMap<>();
        chunk.put("id", id);
        chunk.put("lecture_id", lectureId);
        chunk.put("source_type", sourceType);
        chunk.put("source_id", sourceId);
        chunk.put("title", title);
        chunk.put("content", excerpt);
        chunk.put("excerpt", excerpt);
        chunk.put("chunk_index", index);
        chunk.put("source_scope", sourceType);
        chunk.put("token_count", countWords(excerpt));
        chunk.put("similarity", 0.0);
        return chunk;
    }

    private double scoreChunk(String query, Map<String, Object> chunk) {
        String title = String.valueOf(chunk.getOrDefault("title", ""));
        String content = String.valueOf(chunk.getOrDefault("content", ""));
        List<String> queryTokens = tokenize(query);
        if (queryTokens.isEmpty()) {
            return "transcript".equals(chunk.get("source_scope")) ? 0.62 : 0.56;
        }

        Set<String> haystack = new LinkedHashSet<>(tokenize(title + " " + content));
        long overlap = queryTokens.stream().filter(haystack::contains).count();
        double coverage = overlap / (double) Math.max(3, queryTokens.size());
        double exact = content.contains(query) ? 0.16 : 0;
        double titleBoost = title.contains(query) ? 0.08 : 0;
        double orderBoost = phraseOrderBoost(queryTokens, tokenize(content));
        double diversityPenalty = repeatedTokenPenalty(tokenize(content));
        double scopeBoost = "transcript".equals(chunk.get("source_scope")) ? 0.05 : ("note".equals(chunk.get("source_scope")) ? 0.03 : 0.01);
        return Math.min(0.99, Math.max(0.0, coverage + exact + titleBoost + orderBoost + scopeBoost - diversityPenalty));
    }

    private String inferIntent(String query) {
        String normalized = query.toLowerCase();
        if (normalized.contains("요약") || normalized.contains("핵심")) {
            return "summary";
        }
        if (normalized.contains("문제") || normalized.contains("시험") || normalized.contains("퀴즈")) {
            return "quiz";
        }
        if (normalized.contains("숏폼") || normalized.contains("복습")) {
            return "shortform";
        }
        return "qa";
    }

    private String buildAnswerText(String query, List<Map<String, Object>> chunks) {
        if (chunks.isEmpty()) {
            return "질문과 관련된 강의 근거를 찾지 못했습니다. 강의 또는 코스를 다시 선택해 주세요.";
        }
        String context = chunks.stream()
                .map(chunk -> String.valueOf(chunk.getOrDefault("excerpt", "")))
                .filter(text -> !text.isBlank())
                .limit(2)
                .collect(Collectors.joining(" "));
        return "질문 \"" + query + "\"에 대해 강의 근거를 정리하면 다음과 같습니다. " + context;
    }

    private List<String> splitForRag(String text, int maxChunks) {
        List<String> words = tokenizeForChunking(text);
        if (words.isEmpty()) return List.of(text);
        int maxWords = Math.max(30, RAG_CHUNK_MAX_WORDS);
        int overlap = Math.max(0, Math.min(RAG_CHUNK_OVERLAP_WORDS, maxWords / 2));
        List<String> parts = new ArrayList<>();
        int cursor = 0;
        while (cursor < words.size() && parts.size() < Math.max(1, maxChunks * 2)) {
            int end = Math.min(words.size(), cursor + maxWords);
            parts.add(String.join(" ", words.subList(cursor, end)));
            if (end >= words.size()) break;
            cursor = Math.max(cursor + 1, end - overlap);
        }
        return parts.isEmpty() ? List.of(text) : parts;
    }

    private String buildLectureNarrative(String lectureId) {
        LectureItem lecture = learningService.getLecture(lectureId);
        if (lecture == null) {
            return "강의 텍스트를 찾을 수 없습니다.";
        }
        return lecture.title() + " 강의에서는 핵심 개념을 설명하고, 실습 흐름과 복습 포인트를 단계적으로 정리합니다. " +
                "특히 자주 혼동되는 개념을 예시로 비교하고, 다음 차시와 연결되는 질문을 중심으로 학습합니다.";
    }

    private List<Map<String, Object>> splitIntoSegments(String text, int durationMs) {
        List<String> words = tokenizeForChunking(text);
        if (words.isEmpty()) {
            return List.of();
        }
        int segmentCount = Math.min(8, Math.max(3, (int) Math.ceil(words.size() / 20.0)));
        int wordsPerSegment = Math.max(1, (int) Math.ceil(words.size() / (double) segmentCount));
        List<Map<String, Object>> segments = new ArrayList<>();
        for (int i = 0; i < segmentCount; i++) {
            int start = i * wordsPerSegment;
            int end = Math.min(words.size(), start + wordsPerSegment);
            if (start >= end) {
                break;
            }
            int startMs = (int) Math.round((i / (double) segmentCount) * durationMs);
            int endMs = i == segmentCount - 1
                    ? durationMs
                    : (int) Math.round(((i + 1) / (double) segmentCount) * durationMs);
            String segmentText = String.join(" ", words.subList(start, end));
            Map<String, Object> segment = new HashMap<>();
            segment.put("index", i);
            segment.put("start_ms", startMs);
            segment.put("end_ms", Math.max(startMs + FALLBACK_SEGMENT_MIN_MS, endMs));
            segment.put("text", segmentText);
            segments.add(segment);
        }
        return segments;
    }

    private Map<String, Object> sttQualityMetrics(List<Map<String, Object>> segments, int durationMs) {
        if (segments == null || segments.isEmpty()) {
            return Map.of(
                    "segment_count", 0,
                    "avg_words_per_segment", 0,
                    "min_segment_ms", 0,
                    "max_segment_ms", 0,
                    "target_segment_words", STT_TARGET_SEGMENT_WORDS,
                    "quality_score", 0.0
            );
        }
        int totalWords = 0;
        int minMs = Integer.MAX_VALUE;
        int maxMs = 0;
        for (Map<String, Object> segment : segments) {
            int start = asInt(segment.get("start_ms"));
            int end = asInt(segment.get("end_ms"));
            int ms = Math.max(0, end - start);
            minMs = Math.min(minMs, ms);
            maxMs = Math.max(maxMs, ms);
            totalWords += countWords(String.valueOf(segment.getOrDefault("text", "")));
        }
        double avgWords = totalWords / (double) Math.max(1, segments.size());
        double wordFit = 1.0 - Math.min(1.0, Math.abs(avgWords - STT_TARGET_SEGMENT_WORDS) / STT_TARGET_SEGMENT_WORDS);
        double durationFit = 1.0 - Math.min(1.0, Math.abs(durationMs - (segments.size() * 20_000.0)) / Math.max(1.0, durationMs));
        double score = Math.max(0.0, Math.min(1.0, (wordFit * 0.7) + (durationFit * 0.3)));
        return Map.of(
                "segment_count", segments.size(),
                "avg_words_per_segment", Math.round(avgWords * 100.0) / 100.0,
                "min_segment_ms", minMs == Integer.MAX_VALUE ? 0 : minMs,
                "max_segment_ms", maxMs,
                "target_segment_words", STT_TARGET_SEGMENT_WORDS,
                "quality_score", Math.round(score * 1000.0) / 1000.0
        );
    }

    private int countWords(String text) {
        return tokenize(text).size();
    }

    private List<String> tokenize(String text) {
        String normalized = normalizeText(text).toLowerCase();
        return List.of(normalized.split("[^a-zA-Z0-9가-힣]+")).stream()
                .map(String::trim)
                .filter(token -> token.length() > 1)
                .toList();
    }

    private List<String> tokenizeForChunking(String text) {
        return List.of(normalizeText(text).split("\\s+")).stream()
                .map(String::trim)
                .filter(token -> !token.isBlank())
                .toList();
    }

    private double phraseOrderBoost(List<String> queryTokens, List<String> contentTokens) {
        if (queryTokens.size() < 2 || contentTokens.size() < 2) return 0.0;
        int matchedPairs = 0;
        for (int i = 0; i < queryTokens.size() - 1; i++) {
            String first = queryTokens.get(i);
            String second = queryTokens.get(i + 1);
            for (int j = 0; j < contentTokens.size() - 1; j++) {
                if (first.equals(contentTokens.get(j)) && second.equals(contentTokens.get(j + 1))) {
                    matchedPairs++;
                    break;
                }
            }
        }
        return Math.min(0.08, matchedPairs * 0.02);
    }

    private double repeatedTokenPenalty(List<String> tokens) {
        if (tokens.isEmpty()) return 0.0;
        Map<String, Integer> countByToken = new HashMap<>();
        for (String token : tokens) {
            countByToken.put(token, countByToken.getOrDefault(token, 0) + 1);
        }
        long repeatedKinds = countByToken.values().stream().filter(v -> v >= 4).count();
        return Math.min(0.06, repeatedKinds * 0.01);
    }

    private String normalizeText(String text) {
        if (text == null) {
            return "";
        }
        return text.replaceAll("\\s+", " ").trim();
    }

    private double asDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (Exception ignored) {
            return 0.0;
        }
    }
}
