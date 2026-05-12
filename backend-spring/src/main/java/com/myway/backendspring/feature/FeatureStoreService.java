package com.myway.backendspring.feature;

import com.myway.backendspring.domain.DemoLearningService;
import com.myway.backendspring.domain.LectureItem;
import com.myway.backendspring.domain.ActivityEventService;
import com.myway.backendspring.feature.admin.AdminAssignmentService;
import com.myway.backendspring.feature.ai.AiFeatureService;
import com.myway.backendspring.feature.course.CustomCourseService;
import com.myway.backendspring.feature.media.MediaProcessingService;
import com.myway.backendspring.feature.media.MediaTranscriptionService;
import com.myway.backendspring.feature.quota.AiUsageQuotaService;
import com.myway.backendspring.feature.repository.FeatureStoreRepository;
import com.myway.backendspring.feature.rag.RagService;
import com.myway.backendspring.feature.shortform.ShortformService;
import com.myway.backendspring.persistence.FeatureJdbcStore;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.format.DateTimeParseException;
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
    private static final String AI_USAGE_SCOPE = "ai_usage_daily";
    private static final String RAG_INDEX_SCOPE = "rag_chunk_index";
    private static final int RAG_CHUNK_MAX_WORDS = 90;
    private static final int RAG_CHUNK_OVERLAP_WORDS = 20;
    private final FeatureJdbcStore store;
    private final DemoLearningService learningService;
    private final int shortformMaxRetry;
    private final ActivityEventService activityEventService;
    private final String mediaProcessorUrl;
    private final String mediaProcessorToken;
    private final String mediaCallbackSecret;
    private final String mediaPublicBaseUrl;
    private final RagService ragService;
    private final AiUsageQuotaService aiUsageQuotaService;
    private final ShortformService shortformService;
    private final AiFeatureService aiFeatureService;
    private final MediaProcessingService mediaProcessingService;
    private final MediaTranscriptionService mediaTranscriptionService;
    private final CustomCourseService customCourseService;
    private final AdminAssignmentService adminAssignmentService;
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
            RagService ragService,
            AiUsageQuotaService aiUsageQuotaService,
            ShortformService shortformService,
            AiFeatureService aiFeatureService,
            MediaProcessingService mediaProcessingService,
            MediaTranscriptionService mediaTranscriptionService,
            CustomCourseService customCourseService,
            AdminAssignmentService adminAssignmentService
    ) {
        this.store = store;
        this.learningService = learningService;
        this.activityEventService = activityEventService;
        this.shortformMaxRetry = Math.max(1, shortformMaxRetry);
        this.mediaProcessorUrl = mediaProcessorUrl == null ? "" : mediaProcessorUrl.trim();
        this.mediaProcessorToken = mediaProcessorToken == null ? "" : mediaProcessorToken.trim();
        this.mediaCallbackSecret = mediaCallbackSecret == null ? "" : mediaCallbackSecret.trim();
        this.mediaPublicBaseUrl = mediaPublicBaseUrl == null ? "http://127.0.0.1:8787" : mediaPublicBaseUrl.trim();
        this.ragService = ragService;
        this.aiUsageQuotaService = aiUsageQuotaService;
        this.shortformService = shortformService;
        this.aiFeatureService = aiFeatureService;
        this.mediaProcessingService = mediaProcessingService;
        this.mediaTranscriptionService = mediaTranscriptionService;
        this.customCourseService = customCourseService;
        this.adminAssignmentService = adminAssignmentService;
    }

    // Backward-compatible constructor for tests instantiating service directly.
    public FeatureStoreService(FeatureJdbcStore store, int shortformMaxRetry) {
        this(
                store,
                new DemoLearningService(),
                null,
                shortformMaxRetry,
                "",
                "",
                "",
                "http://127.0.0.1:8787",
                null,
                null,
                null,
                new AiFeatureService(new FeatureStoreRepository(store), null, "dev"),
                null,
                null,
                null,
                null
        );
    }

    public Map<String, Object> aiInsights(String userId) {
        return aiFeatureService == null ? Map.of() : aiFeatureService.aiInsights(userId);
    }

    public Map<String, Object> aiLogs(String userId) {
        return aiFeatureService == null ? Map.of("user_id", userId, "items", List.of(), "count", 0) : aiFeatureService.aiLogs(userId);
    }

    public Map<String, Object> aiRecommendations(String userId) {
        return aiFeatureService == null ? Map.of("user_id", userId, "items", List.of(), "count", 0) : aiFeatureService.aiRecommendations(userId);
    }

    public Map<String, Object> aiSettings(String userId) {
        return aiFeatureService == null ? Map.of() : aiFeatureService.aiSettings(userId);
    }

    public Map<String, Object> updateAiSettings(String userId, Map<String, Object> patch) {
        return aiFeatureService == null ? Map.of() : aiFeatureService.updateAiSettings(userId, patch);
    }

    public Map<String, Object> aiProviders(String userId) {
        return aiFeatureService == null ? Map.of("providers", List.of("demo", "ollama", "gemini"), "current", "demo") : aiFeatureService.aiProviders(userId);
    }

    public Map<String, Object> sttProviders() {
        return mediaProcessingService == null ? Map.of("generated_at", Instant.now().toString(), "providers", List.of(), "plans", List.of()) : mediaProcessingService.sttProviders();
    }

    public Map<String, Object> processorHealth() {
        return mediaProcessingService == null ? Map.of("ok", false, "jobs", Map.of("total", 0, "processing", 0, "completed", 0, "failed", 0), "recent_jobs", List.of(), "updated_at", Instant.now().toString()) : mediaProcessingService.processorHealth();
    }

    public boolean canConsumeAi(String userId) {
        if (aiFeatureService == null) return true;
        return aiFeatureService.canConsumeAi(userId);
    }

    public void recordAiUsage(String userId, String feature, boolean success, String inputText) {
        if (aiFeatureService != null) aiFeatureService.recordAiUsage(userId, feature, success, inputText);
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
        if (mediaProcessingService == null) return null;
        return mediaProcessingService.dispatchExtractionJob(extractionId, sourceVideoUrl);
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
        if (mediaTranscriptionService == null) return Map.of();
        Map<String, Object> extraction = extractionId == null || extractionId.isBlank()
                ? createExtraction(lectureId, audioUrl)
                : store.getKv(EXTRACTION_SCOPE, extractionId);
        if (extraction == null) {
            extraction = createExtraction(lectureId, audioUrl);
        }
        return mediaTranscriptionService.transcribe(extraction, lectureId, language, durationMsInput, sttProvider, sttModel, audioUrl);
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
        if (mediaTranscriptionService == null) return null;
        return mediaTranscriptionService.completeExtractionCallback(
                extractionId,
                status,
                errorMessage,
                eventVersion,
                audioUrl,
                processingJobId,
                processingStage,
                processingStep,
                audioFormat,
                sampleRate,
                channels
        );
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
        return customCourseService == null ? Map.of() : customCourseService.customCompose(userId, payload);
    }

    public List<Map<String, Object>> myCustomCourses(String userId) {
        return customCourseService == null ? List.of() : customCourseService.myCustomCourses(userId);
    }

    public Map<String, Object> customCourse(String id) {
        return customCourseService == null ? null : customCourseService.customCourse(id);
    }

    public List<Map<String, Object>> communityCustomCourses(String courseId) {
        return customCourseService == null ? List.of() : customCourseService.communityCustomCourses(courseId);
    }

    public Map<String, Object> getAdminAssignment(String courseId) {
        return adminAssignmentService == null ? Map.of("course_id", courseId, "student_ids", List.of(), "updated_at", Instant.now().toString()) : adminAssignmentService.getAdminAssignment(courseId);
    }

    public Map<String, Object> saveAdminAssignment(String actorUserId, String courseId, List<String> studentIds) {
        return adminAssignmentService == null ? Map.of() : adminAssignmentService.saveAdminAssignment(actorUserId, courseId, studentIds);
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
