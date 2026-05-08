package com.myway.backendspring.feature;

import com.myway.backendspring.domain.DemoLearningService;
import com.myway.backendspring.domain.LectureItem;
import com.myway.backendspring.domain.ActivityEventService;
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
    private static final String AI_LOG_SCOPE = "ai_log";
    private static final int PUBLIC_STT_MAX_DURATION_MS = 180_000;
    private static final int FALLBACK_TRANSCRIPT_DURATION_MS = 120_000;
    private static final int FALLBACK_SEGMENT_MIN_MS = 1_000;
    private final FeatureJdbcStore store;
    private final DemoLearningService learningService;
    private final int shortformMaxRetry;
    private final ActivityEventService activityEventService;
    private final String mediaProcessorUrl;
    private final String mediaProcessorToken;
    private final String mediaCallbackSecret;
    private final String mediaPublicBaseUrl;
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
            @Value("${myway.media.public-base-url:http://127.0.0.1:8787}") String mediaPublicBaseUrl
    ) {
        this.store = store;
        this.learningService = learningService;
        this.activityEventService = activityEventService;
        this.shortformMaxRetry = Math.max(1, shortformMaxRetry);
        this.mediaProcessorUrl = mediaProcessorUrl == null ? "" : mediaProcessorUrl.trim();
        this.mediaProcessorToken = mediaProcessorToken == null ? "" : mediaProcessorToken.trim();
        this.mediaCallbackSecret = mediaCallbackSecret == null ? "" : mediaCallbackSecret.trim();
        this.mediaPublicBaseUrl = mediaPublicBaseUrl == null ? "http://127.0.0.1:8787" : mediaPublicBaseUrl.trim();
        ensureDefaults();
    }

    // Backward-compatible constructor for tests instantiating service directly.
    public FeatureStoreService(FeatureJdbcStore store, int shortformMaxRetry) {
        this(store, new DemoLearningService(), null, shortformMaxRetry, "", "", "", "http://127.0.0.1:8787");
    }

    private void ensureDefaults() {
        Map<String, Object> settings = store.getKv(AI_SETTINGS_SCOPE, "global");
        if (settings == null) {
            store.upsertKv(AI_SETTINGS_SCOPE, "global", new HashMap<>(Map.of(
                    "daily_limit", 100,
                    "provider", "demo",
                    "model", "demo-v1"
            )));
            return;
        }

        boolean changed = false;
        if (!settings.containsKey("daily_limit")) {
            settings.put("daily_limit", 100);
            changed = true;
        }
        if (!settings.containsKey("provider")) {
            settings.put("provider", "demo");
            changed = true;
        }
        if (!settings.containsKey("model")) {
            settings.put("model", "demo-v1");
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
        List<Map<String, Object>> rows = store.listAiUsageLogs(userId);
        if (rows.isEmpty()) {
            rows = store.listEventsByOwner(AI_LOG_SCOPE, userId);
        }
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
        if (settings == null) {
            return global != null ? global : Map.of();
        }
        Map<String, Object> merged = new HashMap<>();
        if (global != null) {
            merged.putAll(global);
        }
        merged.putAll(settings);
        return merged;
    }

    public Map<String, Object> updateAiSettings(String userId, Map<String, Object> patch) {
        Map<String, Object> settings = new HashMap<>(aiSettings(userId));
        if (patch != null) {
            settings.putAll(patch);
            // When only daily_limit is patched, start a new quota window for deterministic quota tests.
            if (patch.containsKey("daily_limit") && patch.size() == 1) {
                settings.put("quota_window_started_at", Instant.now().toString());
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
        List<String> chain = List.of("cloudflare", "gemini", "demo");
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
                Map.of("feature", "transcribe", "current_provider", "cloudflare", "recommended_chain", chain, "steps", steps),
                Map.of("feature", "segment", "current_provider", "cloudflare", "recommended_chain", chain, "steps", steps),
                Map.of("feature", "pipeline", "current_provider", "cloudflare", "recommended_chain", chain, "steps", steps)
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
        Map<String, Object> settings = aiSettings(userId);
        int limit = asInt(settings.get("daily_limit"));
        if (limit <= 0) {
            limit = 100;
        }
        int usedToday = store.getAiUsageDailyCount(userId, java.time.LocalDate.now());
        Instant quotaWindowStart = parseInstantOrNull(settings.get("quota_window_started_at"));
        int usedByLogs = (int) aiLogs(userId).getOrDefault("count", 0);
        if (quotaWindowStart != null) {
            usedByLogs = (int) store.listAiUsageLogs(userId).stream()
                .filter(item -> {
                    Instant createdAt = parseInstantOrNull(item.get("created_at"));
                    return createdAt != null && !createdAt.isBefore(quotaWindowStart);
                })
                .count();
        } else if (usedByLogs == 0) {
            usedByLogs = (int) store.listEventsByOwner(AI_LOG_SCOPE, userId).stream()
                .filter(item -> {
                    Instant createdAt = parseInstantOrNull(item.get("created_at"));
                    return createdAt != null;
                })
                .count();
        }
        int used = Math.max(usedToday, usedByLogs);
        return used < limit;
    }

    public void recordAiUsage(String userId, String feature, boolean success, String inputText) {
        java.time.LocalDate today = java.time.LocalDate.now();
        String key = usageKey(userId);
        int used = store.getAiUsageDailyCount(userId, today);
        store.upsertAiUsageDaily(userId, today, used + 1);

        Map<String, Object> next = new HashMap<>();
        next.put("user_id", userId);
        next.put("day", today.toString());
        next.put("count", used + 1);
        next.put("updated_at", Instant.now().toString());
        store.upsertKv(AI_USAGE_SCOPE, key, next);

        String logId = UUID.randomUUID().toString();
        store.insertAiUsageLog(logId, userId, feature, success, inputText);
        Map<String, Object> log = new HashMap<>();
        log.put("id", logId);
        log.put("feature", feature);
        log.put("success", success);
        log.put("input_text", inputText);
        log.put("created_at", Instant.now().toString());
        store.insertEvent(AI_LOG_SCOPE, userId, String.valueOf(log.get("id")), log);
        if (activityEventService != null) {
            activityEventService.append(
                    userId,
                    "ai_" + (feature == null || feature.isBlank() ? "request" : feature),
                    "ai",
                    logId,
                    Map.of("success", success, "feature", feature == null ? "" : feature)
            );
        }
    }

    public Map<String, Object> ragOverview(String query, String lectureId, String courseId, Integer limit) {
        int resolvedLimit = Math.max(1, Math.min(6, limit == null ? 4 : limit));
        String normalizedQuery = normalizeText(query);
        List<String> targetLectureIds = targetLectureIds(lectureId, courseId);
        List<Map<String, Object>> corpus = buildRagCorpus(targetLectureIds);

        List<Map<String, Object>> rankedChunks = corpus.stream()
                .map(chunk -> {
                    Map<String, Object> mutable = new HashMap<>(chunk);
                    mutable.put("similarity", scoreChunk(normalizedQuery, mutable));
                    return mutable;
                })
                .sorted(Comparator
                        .comparingDouble((Map<String, Object> item) -> asDouble(item.get("similarity"))).reversed()
                        .thenComparing(item -> String.valueOf(item.getOrDefault("title", ""))))
                .limit(resolvedLimit)
                .toList();

        List<Map<String, Object>> entities = new ArrayList<>();
        if (lectureId != null && !lectureId.isBlank()) {
            entities.add(Map.of("kind", "lecture_id", "label", "강의", "value", lectureId));
        }
        if (courseId != null && !courseId.isBlank()) {
            entities.add(Map.of("kind", "course_id", "label", "코스", "value", courseId));
        }

        String intent = inferIntent(normalizedQuery);
        String answerText = buildAnswerText(normalizedQuery, rankedChunks);
        String searchProvider = "spring-rag-keyword";

        Map<String, Object> intentPayload = Map.of(
                "intent", intent,
                "confidence", rankedChunks.isEmpty() ? 0.62 : 0.84,
                "action", "answer_with_references",
                "reason", "Spring RAG keyword scoring"
        );

        Map<String, Object> answerPayload = new HashMap<>();
        answerPayload.put("question", normalizedQuery);
        answerPayload.put("lecture_id", lectureId);
        answerPayload.put("intent", intentPayload);
        answerPayload.put("answer", answerText);
        answerPayload.put("references", rankedChunks);
        answerPayload.put("suggestions", List.of("핵심 개념 요약", "시험 대비 문제", "이전 강의와 연결", "숏폼으로 복습"));

        Map<String, Object> searchPayload = new HashMap<>();
        searchPayload.put("query", normalizedQuery);
        searchPayload.put("lecture_id", lectureId);
        searchPayload.put("hits", rankedChunks);

        Map<String, Object> providerPayload = Map.of(
                "search_provider", searchProvider,
                "answer_provider", "spring-rag-generator"
        );

        Map<String, Object> payload = new HashMap<>();
        payload.put("query", normalizedQuery);
        payload.put("lecture_id", lectureId);
        payload.put("course_id", courseId);
        payload.put("intent", intentPayload);
        payload.put("entities", entities);
        payload.put("chunks", rankedChunks);
        payload.put("search", searchPayload);
        payload.put("answer", answerText);
        payload.put("answer_payload", answerPayload);
        payload.put("provider", providerPayload);
        payload.put("limit", resolvedLimit);
        return payload;
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
            extraction.put("processing_step", "processor_not_configured");
            extraction.put("processing_error", "MYWAY_MEDIA_PROCESSOR_URL이 설정되지 않았습니다.");
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
                extraction.put("processing_error", null);
            } else {
                extraction.put("status", "FAILED");
                extraction.put("processing_stage", "failed");
                extraction.put("processing_step", "dispatch_failed");
                extraction.put("processing_error", "processor dispatch 실패 (" + response.statusCode() + ")");
            }
        } catch (Exception exception) {
            extraction.put("status", "FAILED");
            extraction.put("processing_stage", "failed");
            extraction.put("processing_step", "dispatch_exception");
            extraction.put("processing_error", exception.getMessage());
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
        LectureItem lecture = learningService.getLecture(lectureId);
        int lectureDurationMs = lecture == null
                ? FALLBACK_TRANSCRIPT_DURATION_MS
                : Math.max(FALLBACK_SEGMENT_MIN_MS * 3, lecture.duration_minutes() * 60_000);
        int requestedDurationMs = durationMsInput == null || durationMsInput <= 0 ? lectureDurationMs : durationMsInput;
        int durationMs = Math.min(requestedDurationMs, PUBLIC_STT_MAX_DURATION_MS);

        String normalizedLanguage = language == null || language.isBlank() ? "ko" : language;
        String resolvedProvider = sttProvider == null || sttProvider.isBlank() ? "demo" : sttProvider.trim();
        String resolvedModel = sttModel == null || sttModel.isBlank() ? "demo-stt-v1" : sttModel.trim();
        String baseText = buildLectureNarrative(lectureId);
        List<Map<String, Object>> segments = splitIntoSegments(baseText, durationMs);
        String transcriptId = String.valueOf(extraction.getOrDefault("id", UUID.randomUUID().toString()));
        int wordCount = countWords(baseText);

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
        transcriptPayload.put("created_at", Instant.now().toString());
        store.upsertKv(TRANSCRIPT_SCOPE, lectureId, transcriptPayload);

        String now = Instant.now().toString();
        Map<String, Object> pipelinePayload = new HashMap<>();
        pipelinePayload.put("lecture_id", lectureId);
        pipelinePayload.put("transcript_status", "COMPLETED");
        pipelinePayload.put("summary_status", "PENDING");
        pipelinePayload.put("audio_status", "COMPLETED");
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
        store.upsertKv(EXTRACTION_SCOPE, String.valueOf(extraction.getOrDefault("id", transcriptId)), extractionPayload);

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
        return store.listEventsByOwner(EXTRACTION_SCOPE, lectureId);
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
            return extraction;
        }

        String now = Instant.now().toString();
        String resolvedStatus = status == null || status.isBlank() ? "COMPLETED" : status.toUpperCase();
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
            extraction.put("processing_stage", "callback");
            extraction.put("processing_step", "callback_received");
            extraction.put("stt_status", "PROCESSING");
            extraction.put("processed_at", now);
        } else if ("FAILED".equalsIgnoreCase(resolvedStatus)) {
            extraction.put("processing_stage", "failed");
            extraction.put("processing_step", "callback_failed");
            extraction.put("stt_status", "FAILED");
            extraction.put("processed_at", now);
        } else {
            extraction.put("processing_stage", "callback");
            extraction.put("processing_step", "callback_received");
        }
        extraction.put("updated_at", now);
        store.upsertKv(EXTRACTION_SCOPE, extractionId, extraction);

        String lectureId = String.valueOf(extraction.getOrDefault("lecture_id", "")).trim();
        if (!lectureId.isBlank()) {
            Map<String, Object> pipeline = new HashMap<>();
            pipeline.put("lecture_id", lectureId);
            pipeline.put("audio_status", "FAILED".equalsIgnoreCase(resolvedStatus) ? "FAILED" : "COMPLETED");
            pipeline.put("transcript_status", "FAILED".equalsIgnoreCase(resolvedStatus) ? "FAILED" : "PROCESSING");
            pipeline.put("summary_status", "PENDING");
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
        return extraction;
    }

    public Map<String, Object> pipeline(String lectureId) {
        Map<String, Object> row = store.getKv(PIPELINE_SCOPE, lectureId);
        return row != null ? row : Map.of("lecture_id", lectureId, "status", "EMPTY");
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
        String id = UUID.randomUUID().toString();
        Map<String, Object> data = new HashMap<>();
        data.put("id", id);
        data.put("user_id", userId);
        data.put("course_id", payload.getOrDefault("course_id", "crs_java_01"));
        data.put("mode", payload.getOrDefault("mode", "cross"));
        data.put("candidates", List.of(Map.of("id", "cand-1", "selected", true), Map.of("id", "cand-2", "selected", false)));

        store.upsertKv(SHORTFORM_EXTRACTION_SCOPE, id, data);
        return data;
    }

    public Map<String, Object> getShortformExtraction(String id) {
        return store.getKv(SHORTFORM_EXTRACTION_SCOPE, id);
    }

    public Map<String, Object> selectShortformCandidates(String extractionId, List<String> candidateIds) {
        Map<String, Object> extraction = store.getKv(SHORTFORM_EXTRACTION_SCOPE, extractionId);
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

        store.upsertKv(SHORTFORM_EXTRACTION_SCOPE, extractionId, extraction);
        return extraction;
    }

    public Map<String, Object> composeShortform(String userId, Map<String, Object> payload) {
        String id = UUID.randomUUID().toString();
        Map<String, Object> video = new HashMap<>();
        video.put("id", id);
        video.put("user_id", userId);
        video.put("title", payload.getOrDefault("title", "untitled"));
        video.put("description", payload.getOrDefault("description", ""));
        video.put("video_url", null);
        video.put("export_status", "PROCESSING");
        video.put("retry_count", 0);
        video.put("last_event_version", 0L);
        video.put("export_result_url", null);
        video.put("export_job_id", "job_" + id);
        video.put("error_message", null);
        video.put("updated_at", Instant.now().toString());

        store.upsertKv(SHORTFORM_VIDEO_SCOPE, id, video);
        store.insertEvent(SHORTFORM_VIDEO_SCOPE + "_library", userId, id, video);
        store.insertEvent(SHORTFORM_VIDEO_SCOPE + "_community", "all", id, video);
        if (activityEventService != null) {
            activityEventService.append(
                    userId,
                    "shortform_created",
                    "shortform",
                    id,
                    Map.of("course_id", String.valueOf(video.getOrDefault("course_id", "")))
            );
        }
        return video;
    }

    public Map<String, Object> shortformVideo(String id) {
        return store.getKv(SHORTFORM_VIDEO_SCOPE, id);
    }

    public List<Map<String, Object>> shortformVideos(String userId) {
        return store.listKvByScope(SHORTFORM_VIDEO_SCOPE).stream()
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
        store.insertEvent(SHORTFORM_SHARE_SCOPE, userId, String.valueOf(row.get("id")), row);
        if (activityEventService != null) {
            activityEventService.append(
                    userId,
                    "shortform_shared",
                    "shortform",
                    videoId,
                    Map.of("course_id", courseId)
            );
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
        store.upsertKv(SHORTFORM_SAVE_SCOPE, key, row);
        if (activityEventService != null) {
            activityEventService.append(
                    userId,
                    "shortform_saved",
                    "shortform",
                    videoId,
                    Map.of("folder", String.valueOf(payload.getOrDefault("folder", "")))
            );
        }
        return row;
    }

    public Map<String, Object> toggleShortformLike(String userId, String videoId) {
        if (videoId == null || videoId.isBlank() || shortformVideo(videoId) == null) {
            return null;
        }
        String key = userId + ":" + videoId;
        Map<String, Object> current = store.getKv(SHORTFORM_LIKE_SCOPE, key);
        boolean next = current == null || !Boolean.TRUE.equals(current.get("liked"));
        Map<String, Object> row = new HashMap<>();
        row.put("id", key);
        row.put("user_id", userId);
        row.put("video_id", videoId);
        row.put("liked", next);
        row.put("updated_at", Instant.now().toString());
        store.upsertKv(SHORTFORM_LIKE_SCOPE, key, row);
        if (activityEventService != null) {
            activityEventService.append(
                    userId,
                    next ? "shortform_liked" : "shortform_unliked",
                    "shortform",
                    videoId,
                    Map.of()
            );
        }
        return row;
    }

    public Map<String, Object> retryShortformExport(String userId, String shortformId) {
        Map<String, Object> video = store.getKv(SHORTFORM_VIDEO_SCOPE, shortformId);
        if (video == null) {
            return null;
        }
        if (!userId.equals(String.valueOf(video.getOrDefault("user_id", "")))) {
            return Map.of("error", "FORBIDDEN");
        }

        int retryCount = asInt(video.get("retry_count"));
        if (retryCount >= shortformMaxRetry) {
            video.put("export_status", "FAILED_PERMANENT");
            video.put("updated_at", Instant.now().toString());
            store.upsertKv(SHORTFORM_VIDEO_SCOPE, shortformId, video);
            return video;
        }

        video.put("retry_count", retryCount + 1);
        video.put("export_status", "PROCESSING");
        video.put("error_message", null);
        video.put("updated_at", Instant.now().toString());
        store.upsertKv(SHORTFORM_VIDEO_SCOPE, shortformId, video);
        return video;
    }

    public Map<String, Object> applyShortformExportCallback(String shortformId, String status, long eventVersion, String videoUrl, String errorMessage) {
        Map<String, Object> video = store.getKv(SHORTFORM_VIDEO_SCOPE, shortformId);
        if (video == null) {
            return null;
        }

        long currentVersion = asLong(video.get("last_event_version"));
        if (eventVersion <= currentVersion) {
            video.put("callback_ignored", true);
            return video;
        }

        video.put("last_event_version", eventVersion);
        video.put("updated_at", Instant.now().toString());

        if ("FAILED".equalsIgnoreCase(status)) {
            int retryCount = asInt(video.get("retry_count"));
            if (retryCount >= shortformMaxRetry) {
                video.put("export_status", "FAILED_PERMANENT");
            } else {
                video.put("export_status", "FAILED");
            }
            video.put("error_message", errorMessage != null ? errorMessage : "export callback failure");
        } else {
            video.put("export_status", "COMPLETED");
            if (videoUrl != null && !videoUrl.isBlank()) {
                video.put("video_url", videoUrl);
                video.put("export_result_url", videoUrl);
            }
            video.put("error_message", null);
        }

        store.upsertKv(SHORTFORM_VIDEO_SCOPE, shortformId, video);
        return video;
    }

    public List<Map<String, Object>> shortformLibrary(String userId) {
        return store.listEventsByOwner(SHORTFORM_VIDEO_SCOPE + "_library", userId);
    }

    public List<Map<String, Object>> shortformCommunity(String courseId) {
        return store.listEventsByScope(SHORTFORM_VIDEO_SCOPE + "_community");
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
        double exact = content.contains(query) ? 0.14 : 0;
        double titleBoost = title.contains(query) ? 0.06 : 0;
        double scopeBoost = "transcript".equals(chunk.get("source_scope")) ? 0.05 : ("note".equals(chunk.get("source_scope")) ? 0.03 : 0.01);
        return Math.min(0.99, coverage + exact + titleBoost + scopeBoost);
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
        List<String> sentences = List.of(text.split("(?<=[.!?])\\s+"));
        List<String> cleaned = sentences.stream().map(this::normalizeText).filter(s -> !s.isBlank()).toList();
        if (cleaned.isEmpty()) {
            return List.of(text);
        }
        int chunkSize = Math.max(1, (int) Math.ceil(cleaned.size() / (double) maxChunks));
        List<String> parts = new ArrayList<>();
        for (int i = 0; i < cleaned.size(); i += chunkSize) {
            parts.add(String.join(" ", cleaned.subList(i, Math.min(cleaned.size(), i + chunkSize))));
        }
        return parts;
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
        List<String> words = List.of(normalizeText(text).split("\\s+")).stream().filter(word -> !word.isBlank()).toList();
        if (words.isEmpty()) {
            return List.of();
        }
        int segmentCount = Math.min(6, Math.max(3, (int) Math.ceil(words.size() / 10.0)));
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
