package com.myway.backendspring.feature;

import com.myway.backendspring.feature.admin.AdminAssignmentService;
import com.myway.backendspring.feature.ai.AiFeatureService;
import com.myway.backendspring.feature.course.CustomCourseService;
import com.myway.backendspring.feature.media.MediaProcessingService;
import com.myway.backendspring.feature.media.MediaStatus;
import com.myway.backendspring.feature.media.PipelineStage;
import com.myway.backendspring.feature.media.MediaTranscriptionService;
import com.myway.backendspring.feature.repository.FeatureStoreRepository;
import com.myway.backendspring.feature.rag.RagService;
import com.myway.backendspring.feature.shortform.ShortformService;
import com.myway.backendspring.persistence.FeatureJdbcStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class FeatureStoreService {
    private static final String TRANSCRIPT_SCOPE = "media_transcript";
    private static final String EXTRACTION_SCOPE = "media_extraction";
    private static final String PIPELINE_SCOPE = "media_pipeline";
    private static final String MEDIA_NOTE_SCOPE = "media_note";
    private static final String MEDIA_ASSET_SCOPE = "media_asset";
    private final FeatureJdbcStore store;
    private final RagService ragService;
    private final ShortformService shortformService;
    private final AiFeatureService aiFeatureService;
    private final MediaProcessingService mediaProcessingService;
    private final MediaTranscriptionService mediaTranscriptionService;
    private final CustomCourseService customCourseService;
    private final AdminAssignmentService adminAssignmentService;

    @Autowired
    public FeatureStoreService(
            FeatureJdbcStore store,
            RagService ragService,
            ShortformService shortformService,
            AiFeatureService aiFeatureService,
            MediaProcessingService mediaProcessingService,
            MediaTranscriptionService mediaTranscriptionService,
            CustomCourseService customCourseService,
            AdminAssignmentService adminAssignmentService
    ) {
        this.store = store;
        this.ragService = ragService;
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
                null,
                null,
                new AiFeatureService(new FeatureStoreRepository(store), null, null, null, "dev"),
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

    public Map<String, Object> mediaUpload(String lectureId, String fileName) {
        String key = "asset/" + lectureId + "/" + UUID.randomUUID();
        Map<String, Object> payload = new MediaUploadPayload(
                lectureId,
                key,
                "/api/v1/media/assets/" + key,
                fileName
        ).toMap();
        store.upsertKv(MEDIA_ASSET_SCOPE, key, payload);
        return payload;
    }

    public Map<String, Object> createExtraction(String lectureId) {
        return createExtraction(lectureId, null);
    }

    public Map<String, Object> createExtraction(String lectureId, String audioUrl) {
        String id = UUID.randomUUID().toString();
        String now = Instant.now().toString();
        Map<String, Object> item = new ExtractionSeed(id, lectureId, audioUrl, now).toMap();

        store.insertEvent(EXTRACTION_SCOPE, lectureId, id, item);
        store.upsertKv(EXTRACTION_SCOPE, id, item);
        Map<String, Object> pipeline = new PipelineSeed(lectureId, id, now).toMap();
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
        TranscribeRequestContext request = new TranscribeRequestContext(
                lectureId,
                language,
                durationMsInput,
                sttProvider,
                sttModel,
                audioUrl,
                extractionId
        );
        Map<String, Object> extraction = resolveExtractionForTranscription(request);
        return runTranscription(extraction, request);
    }

    private Map<String, Object> resolveExtractionForTranscription(TranscribeRequestContext request) {
        String extractionId = request.extractionId();
        if (extractionId == null || extractionId.isBlank()) {
            return createExtraction(request.lectureId(), request.audioUrl());
        }
        Map<String, Object> extraction = store.getKv(EXTRACTION_SCOPE, extractionId);
        return extraction != null ? extraction : createExtraction(request.lectureId(), request.audioUrl());
    }

    private Map<String, Object> runTranscription(Map<String, Object> extraction, TranscribeRequestContext request) {
        return mediaTranscriptionService.transcribe(
                extraction,
                request.lectureId(),
                request.language(),
                request.durationMsInput(),
                request.sttProvider(),
                request.sttModel(),
                request.audioUrl()
        );
    }

    public List<Map<String, Object>> extractions(String lectureId) {
        List<Map<String, Object>> rows = store.listEventsByOwner(EXTRACTION_SCOPE, lectureId);
        List<Map<String, Object>> merged = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            merged.add(hydrateExtractionRow(row));
        }
        return merged;
    }

    private Map<String, Object> hydrateExtractionRow(Map<String, Object> row) {
        String extractionId = String.valueOf(row.getOrDefault("id", "")).trim();
        Map<String, Object> latest = extractionId.isBlank() ? null : store.getKv(EXTRACTION_SCOPE, extractionId);
        Map<String, Object> hydrated = latest == null ? new HashMap<>(row) : new HashMap<>(latest);
        ExtractionDefaultProfile.defaults().applyIfMissing(hydrated);
        return hydrated;
    }

    public Map<String, Object> completeExtractionCallback(String extractionId, String status, String errorMessage, long eventVersion) {
        return completeExtractionCallback(extractionId, status, errorMessage, eventVersion, null);
    }

    public Map<String, Object> completeExtractionCallback(String extractionId, String status, String errorMessage, long eventVersion, String audioUrl) {
        return completeExtractionCallback(new ExtractionCallbackCommand(
                extractionId,
                status,
                errorMessage,
                eventVersion,
                audioUrl,
                null,
                null,
                null,
                null,
                null,
                null
        ));
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
        return completeExtractionCallback(new ExtractionCallbackCommand(
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
        ));
    }

    private Map<String, Object> completeExtractionCallback(ExtractionCallbackCommand command) {
        if (mediaTranscriptionService == null) return null;
        return mediaTranscriptionService.completeExtractionCallback(
                command.extractionId(),
                command.status(),
                command.errorMessage(),
                command.eventVersion(),
                command.audioUrl(),
                command.processingJobId(),
                command.processingStage(),
                command.processingStep(),
                command.audioFormat(),
                command.sampleRate(),
                command.channels()
        );
    }

    public Map<String, Object> pipeline(String lectureId) {
        Map<String, Object> row = store.getKv(PIPELINE_SCOPE, lectureId);
        if (row == null) {
            return buildEmptyPipeline(lectureId);
        }
        return hydratePipelineRow(row);
    }

    private Map<String, Object> buildEmptyPipeline(String lectureId) {
        Map<String, Object> empty = new HashMap<>();
        empty.put("lecture_id", lectureId);
        empty.put("status", "EMPTY");
        return applyPipelineDefaults(empty, false);
    }

    private Map<String, Object> hydratePipelineRow(Map<String, Object> row) {
        return applyPipelineDefaults(new HashMap<>(row), true);
    }

    private Map<String, Object> applyPipelineDefaults(Map<String, Object> target, boolean keepExistingValues) {
        PipelineDefaultProfile defaults = PipelineDefaultProfile.withCurrentTimestamp();
        if (keepExistingValues) {
            defaults.applyIfMissing(target);
        } else {
            defaults.applyTo(target);
        }
        return target;
    }

    public Map<String, Object> summarizeLecture(String lectureId, String style, String language) {
        Map<String, Object> note = new LectureSummaryNotePayload(
                UUID.randomUUID().toString(),
                lectureId,
                normalizeOrDefault(style, "brief"),
                normalizeOrDefault(language, "ko"),
                Instant.now().toString()
        ).toMap();
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

    private record ExtractionSeed(String id, String lectureId, String audioUrl, String now) {
        Map<String, Object> toMap() {
            Map<String, Object> map = new HashMap<>();
            map.put("id", id);
            map.put("lecture_id", lectureId);
            map.put("status", MediaStatus.PROCESSING.name());
            map.put("audio_url", audioUrl);
            map.put("processing_stage", PipelineStage.QUEUED.value());
            map.put("processing_step", "job_requested");
            map.put("processing_error_code", null);
            map.put("processing_error", null);
            map.put("stt_status", MediaStatus.PENDING.name());
            map.put("transcript_id", null);
            map.put("last_event_version", 0L);
            map.put("created_at", now);
            map.put("updated_at", now);
            return map;
        }
    }

    private record PipelineSeed(String lectureId, String extractionId, String now) {
        Map<String, Object> toMap() {
            Map<String, Object> map = new HashMap<>();
            map.put("lecture_id", lectureId);
            map.put("transcript_status", MediaStatus.PENDING.name());
            map.put("summary_status", MediaStatus.PENDING.name());
            map.put("audio_status", MediaStatus.PROCESSING.name());
            map.put("processing_stage", PipelineStage.QUEUED.value());
            map.put("processing_step", "job_requested");
            map.put("processing_error_code", null);
            map.put("processing_error", null);
            map.put("transcript_id", null);
            map.put("note_id", null);
            map.put("extraction_id", extractionId);
            map.put("updated_at", now);
            return map;
        }
    }

    private record PipelineDefaultProfile(
            String audioStatus,
            String transcriptStatus,
            String summaryStatus,
            String processingStage,
            String processingStep,
            Object processingErrorCode,
            Object processingError,
            Object transcriptId,
            Object noteId,
            Object extractionId,
            String updatedAt
    ) {
        static PipelineDefaultProfile withCurrentTimestamp() {
            return new PipelineDefaultProfile(
                    MediaStatus.PENDING.name(),
                    MediaStatus.PENDING.name(),
                    MediaStatus.PENDING.name(),
                    PipelineStage.IDLE.value(),
                    "not_started",
                    null,
                    null,
                    null,
                    null,
                    null,
                    Instant.now().toString()
            );
        }

        void applyTo(Map<String, Object> target) {
            target.put("audio_status", audioStatus);
            target.put("transcript_status", transcriptStatus);
            target.put("summary_status", summaryStatus);
            target.put("processing_stage", processingStage);
            target.put("processing_step", processingStep);
            target.put("processing_error_code", processingErrorCode);
            target.put("processing_error", processingError);
            target.put("transcript_id", transcriptId);
            target.put("note_id", noteId);
            target.put("extraction_id", extractionId);
            target.put("updated_at", updatedAt);
        }

        void applyIfMissing(Map<String, Object> target) {
            target.putIfAbsent("audio_status", audioStatus);
            target.putIfAbsent("transcript_status", transcriptStatus);
            target.putIfAbsent("summary_status", summaryStatus);
            target.putIfAbsent("processing_stage", processingStage);
            target.putIfAbsent("processing_step", processingStep);
            target.putIfAbsent("processing_error_code", processingErrorCode);
            target.putIfAbsent("processing_error", processingError);
            target.putIfAbsent("transcript_id", transcriptId);
            target.putIfAbsent("note_id", noteId);
            target.putIfAbsent("extraction_id", extractionId);
            target.putIfAbsent("updated_at", updatedAt);
        }
    }

    private record ExtractionDefaultProfile(
            String processingStage,
            String processingStep,
            Object processingErrorCode,
            Object processingError,
            String sttStatus
    ) {
        static ExtractionDefaultProfile defaults() {
            return new ExtractionDefaultProfile(
                    "queued",
                    "job_requested",
                    null,
                    null,
                    "PENDING"
            );
        }

        void applyIfMissing(Map<String, Object> target) {
            target.putIfAbsent("processing_stage", processingStage);
            target.putIfAbsent("processing_step", processingStep);
            target.putIfAbsent("processing_error_code", processingErrorCode);
            target.putIfAbsent("processing_error", processingError);
            target.putIfAbsent("stt_status", sttStatus);
        }
    }

    private static String normalizeOrDefault(String value, String defaultValue) {
        if (value == null) return defaultValue;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? defaultValue : trimmed;
    }

    private record TranscribeRequestContext(
            String lectureId,
            String language,
            Integer durationMsInput,
            String sttProvider,
            String sttModel,
            String audioUrl,
            String extractionId
    ) {
    }

    private record ExtractionCallbackCommand(
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
    }

    private record LectureSummaryNotePayload(
            String id,
            String lectureId,
            String style,
            String language,
            String createdAt
    ) {
        Map<String, Object> toMap() {
            Map<String, Object> note = new HashMap<>();
            note.put("id", id);
            note.put("lecture_id", lectureId);
            note.put("title", "자동 요약 노트");
            note.put("content", "Spring 백엔드에서 생성한 요약입니다.");
            note.put("key_concepts", List.of("핵심 개념", "핵심 정리"));
            note.put("keywords", List.of("spring", "summary"));
            note.put("timestamps", List.of(Map.of("start_ms", 0, "end_ms", 30000, "label", "인트로")));
            note.put("style", style);
            note.put("language", language);
            note.put("created_at", createdAt);
            return note;
        }
    }

    private record MediaUploadPayload(
            String lectureId,
            String assetKey,
            String videoUrl,
            String fileName
    ) {
        Map<String, Object> toMap() {
            return Map.of(
                    "lecture_id", lectureId,
                    "asset_key", assetKey,
                    "video_url", videoUrl,
                    "file_name", fileName
            );
        }
    }

}
