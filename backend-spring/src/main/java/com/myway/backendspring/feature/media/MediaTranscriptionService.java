package com.myway.backendspring.feature.media;

import com.myway.backendspring.domain.ActivityEventService;
import com.myway.backendspring.domain.DemoLearningService;
import com.myway.backendspring.domain.LectureItem;
import com.myway.backendspring.feature.rag.RagService;
import com.myway.backendspring.feature.repository.FeatureStoreRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class MediaTranscriptionService {
    private static final String TRANSCRIPT_SCOPE = "media_transcript";
    private static final String EXTRACTION_SCOPE = "media_extraction";
    private static final String PIPELINE_SCOPE = "media_pipeline";
    private static final String STT_DEFAULT_PROVIDER = "demo";
    private static final String STT_DEFAULT_MODEL = "cf-whisper";
    private static final int PUBLIC_STT_MAX_DURATION_MS = 180_000;
    private static final int FALLBACK_TRANSCRIPT_DURATION_MS = 120_000;
    private static final String SPEAKER_REVIEW_SCOPE = "media_speaker_review";

    private final FeatureStoreRepository repository;
    private final DemoLearningService learningService;
    private final ActivityEventService activityEventService;
    private final RagService ragService;
    private final TranscriptSegmenter segmenter;
    private final MediaTranscriptionMetrics metrics;

    public MediaTranscriptionService(
            FeatureStoreRepository repository,
            DemoLearningService learningService,
            ActivityEventService activityEventService,
            RagService ragService,
            TranscriptSegmenter segmenter,
            MediaTranscriptionMetrics metrics
    ) {
        this.repository = repository;
        this.learningService = learningService;
        this.activityEventService = activityEventService;
        this.ragService = ragService;
        this.segmenter = segmenter;
        this.metrics = metrics;
    }

    public Map<String, Object> transcribe(
            Map<String, Object> extraction,
            String lectureId,
            String language,
            Integer durationMsInput,
            String sttProvider,
            String sttModel,
            String audioUrl
    ) {
        String now = Instant.now().toString();
        Map<String, Object> extractionInProgress = markExtractionInProgress(extraction, now);
        TranscriptionDraft draft = buildDraft(extractionInProgress, lectureId, language, durationMsInput, sttProvider, sttModel, audioUrl);
        persistTranscript(lectureId, draft);
        Map<String, Object> pipelinePayload = persistPipeline(lectureId, extractionInProgress, draft, now);
        persistCompletedExtraction(extractionInProgress, draft, now);
        Map<String, Object> ragIndex = ragService == null ? Map.of() : ragService.rebuildRagIndex(lectureId, null);
        return assembleTranscribeResponse(draft, audioUrl, pipelinePayload, ragIndex);
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
            Integer channels,
            String syncMode,
            String overwritePolicy,
            String approvalState,
            String notificationChannel
    ) {
        ExtractionSnapshot extraction = findExtraction(extractionId);
        if (extraction == null) return null;
        if (isStaleCallback(extraction.toMap(), eventVersion)) return staleCallbackResponse(extraction.toMap());

        String now = Instant.now().toString();
        MediaStatus callbackStatus = MediaStatus.fromNullable(status, MediaStatus.COMPLETED);
        String resolvedError = resolveErrorMessage(callbackStatus, errorMessage);
        Map<String, Object> mutable = extraction.toMap();
        applyCallbackMetadata(
                mutable,
                eventVersion,
                callbackStatus,
                resolvedError,
                audioUrl,
                processingJobId,
                processingStage,
                processingStep,
                audioFormat,
                sampleRate,
                channels,
                syncMode,
                overwritePolicy,
                approvalState,
                notificationChannel,
                now
        );
        repository.upsertKv(EXTRACTION_SCOPE, extractionId, mutable);
        ExtractionSnapshot applied = ExtractionSnapshot.from(mutable);

        String lectureId = applied.lectureId();
        if (!lectureId.isBlank()) {
            repository.upsertKv(PIPELINE_SCOPE, lectureId, buildPipelineFromCallback(applied, callbackStatus, resolvedError, now));
        }
        appendActivity(mutable, extractionId, lectureId, callbackStatus);
        return normalizeExtractionForResponse(mutable);
    }

    private Map<String, Object> markExtractionInProgress(Map<String, Object> extraction, String now) {
        Map<String, Object> payload = new HashMap<>(extraction);
        applyExtractionStatusUpdate(payload, new ExtractionStatusUpdate(
                MediaStatus.PROCESSING.name(),
                MediaStatus.PROCESSING.name(),
                PipelineStage.TRANSCRIBING.value(),
                "stt_started",
                null,
                null,
                now
        ));
        String extractionId = String.valueOf(payload.getOrDefault("id", ""));
        repository.upsertKv(EXTRACTION_SCOPE, extractionId, payload);
        return payload;
    }

    private TranscriptionDraft buildDraft(Map<String, Object> extraction, String lectureId, String language, Integer durationMsInput, String sttProvider, String sttModel, String audioUrl) {
        SttRequest request = buildSttRequest(lectureId, language, durationMsInput, sttProvider, sttModel, audioUrl);
        String text = buildLectureNarrative(lectureId);
        List<Map<String, Object>> segments = buildSegmentGenerationPayload(text, request.durationMs()).toSegments(segmenter);
        Map<String, Object> instructorGuess = inferInstructorGuess(lectureId);
        List<Map<String, Object>> speakerSegments = buildSpeakerSegments(segments, instructorGuess);
        String transcriptId = String.valueOf(extraction.getOrDefault("id", UUID.randomUUID().toString()));
        int wordCount = metrics.countWords(text);
        Map<String, Object> quality = metrics.sttQualityMetrics(segments, request.durationMs());
        return new TranscriptionDraft(
                transcriptId,
                lectureId,
                request.language(),
                request.provider(),
                request.model(),
                text,
                segments,
                speakerSegments,
                request.durationMs(),
                wordCount,
                quality,
                request.audioUrl(),
                instructorGuess
        );
    }

    private void persistTranscript(String lectureId, TranscriptionDraft draft) {
        TranscriptPayload payload = createTranscriptPayload(lectureId, draft);
        repository.upsertKv(TRANSCRIPT_SCOPE, lectureId, payload.toMap());
    }

    private Map<String, Object> persistPipeline(String lectureId, Map<String, Object> extraction, TranscriptionDraft draft, String now) {
        PipelinePayload payload = PipelinePayload.completed(lectureId, draft.transcriptId(), extraction.get("id"), now);
        repository.upsertKv(PIPELINE_SCOPE, lectureId, payload.toMap());
        return payload.toMap();
    }

    private void persistCompletedExtraction(Map<String, Object> extractionInProgress, TranscriptionDraft draft, String now) {
        Map<String, Object> extractionPayload = new HashMap<>(extractionInProgress);
        applyExtractionStatusUpdate(extractionPayload, new ExtractionStatusUpdate(
                MediaStatus.COMPLETED.name(),
                MediaStatus.COMPLETED.name(),
                PipelineStage.COMPLETED.value(),
                "stt_completed",
                null,
                null,
                now
        ));
        extractionPayload.put("transcript_id", draft.transcriptId());
        extractionPayload.put("audio_duration_ms", draft.durationMs());
        extractionPayload.put("processed_at", now);
        extractionPayload.put("language", draft.language());
        extractionPayload.put("requested_stt_provider", draft.provider());
        extractionPayload.put("requested_stt_model", draft.model());
        extractionPayload.put("audio_url", draft.audioUrl());
        extractionPayload.put("stt_quality", draft.quality());
        repository.upsertKv(EXTRACTION_SCOPE, draft.transcriptId(), extractionPayload);
    }

    private Map<String, Object> assembleTranscribeResponse(TranscriptionDraft draft, String audioUrl, Map<String, Object> pipelinePayload, Map<String, Object> ragIndex) {
        Map<String, Object> response = new HashMap<>();
        response.put("transcript_id", draft.transcriptId());
        response.put("lecture_id", draft.lectureId());
        response.put("segment_count", draft.segments().size());
        response.put("duration_ms", draft.durationMs());
        response.put("word_count", draft.wordCount());
        response.put("stt_provider", draft.provider());
        response.put("stt_model", draft.model());
        response.put("audio_url", audioUrl);
        response.put("pipeline", pipelinePayload);
        response.put("language", draft.language());
        response.put("quality", draft.quality());
        response.put("rag_index", ragIndex);
        response.put("speaker_segments", draft.speakerSegments());
        response.put("instructor_guess", draft.instructorGuess());
        response.put("speaker_review", getSpeakerReview(draft.lectureId()));
        return response;
    }

    private SttRequest buildSttRequest(String lectureId, String language, Integer durationMsInput, String sttProvider, String sttModel, String audioUrl) {
        int durationMs = resolveDurationMs(lectureId, durationMsInput);
        String normalizedLanguage = normalizeOrDefault(language, "ko");
        String provider = normalizeOrDefault(sttProvider, STT_DEFAULT_PROVIDER);
        String model = normalizeOrDefault(sttModel, STT_DEFAULT_MODEL);
        return new SttRequest(normalizedLanguage, provider, model, durationMs, audioUrl);
    }

    private SegmentGenerationPayload buildSegmentGenerationPayload(String text, int durationMs) {
        return new SegmentGenerationPayload(text, durationMs);
    }

    private TranscriptPayload createTranscriptPayload(String lectureId, TranscriptionDraft draft) {
        return new TranscriptPayload(
                draft.transcriptId(),
                lectureId,
                draft.language(),
                draft.fullText(),
                draft.segments(),
                draft.speakerSegments(),
                draft.wordCount(),
                draft.durationMs(),
                draft.provider(),
                draft.model(),
                draft.quality(),
                Instant.now().toString(),
                draft.instructorGuess(),
                getSpeakerReview(lectureId)
        );
    }

    private Map<String, Object> inferInstructorGuess(String lectureId) {
        LectureItem lecture = learningService.getLecture(lectureId);
        if (lecture == null) {
            return Map.of(
                    "speaker_label", "SPEAKER_01",
                    "instructor_name", "Unknown Instructor",
                    "confidence", 0.35,
                    "source", "fallback"
            );
        }
        String instructorName = "Instructor";
        String source = "heuristic";
        try {
            var detail = learningService.getCourseDetail(lecture.course_id(), "usr_admin_001");
            String instructorId = detail == null ? "" : String.valueOf(detail.instructor_id());
            if ("usr_ins_001".equals(instructorId)) {
                instructorName = "Instructor Lee";
            } else if (!instructorId.isBlank()) {
                instructorName = instructorId;
                source = "course_instructor_id";
            }
        } catch (Exception ignored) {
            source = "fallback";
        }

        return Map.of(
                "speaker_label", "SPEAKER_01",
                "instructor_name", instructorName,
                "confidence", 0.72,
                "source", source
        );
    }

    private List<Map<String, Object>> buildSpeakerSegments(List<Map<String, Object>> segments, Map<String, Object> instructorGuess) {
        if (segments == null || segments.isEmpty()) {
            return List.of();
        }
        String instructorSpeaker = String.valueOf(instructorGuess.getOrDefault("speaker_label", "SPEAKER_01"));
        List<Map<String, Object>> speakerSegments = new java.util.ArrayList<>();
        for (int i = 0; i < segments.size(); i++) {
            Map<String, Object> segment = segments.get(i);
            Map<String, Object> speaker = new HashMap<>(segment);
            String speakerLabel = (i % 3 == 2) ? "SPEAKER_02" : instructorSpeaker;
            speaker.put("speaker_label", speakerLabel);
            speaker.put("speaker_role", instructorSpeaker.equals(speakerLabel) ? "instructor" : "participant");
            speakerSegments.add(speaker);
        }
        return speakerSegments;
    }

    private Map<String, Object> getSpeakerReview(String lectureId) {
        if (lectureId == null || lectureId.isBlank()) {
            return Map.of("status", "PENDING");
        }
        Map<String, Object> found = repository.getKv(SPEAKER_REVIEW_SCOPE, lectureId);
        if (found == null) {
            return Map.of("status", "PENDING");
        }
        return found;
    }

    private void applyExtractionStatusUpdate(Map<String, Object> extraction, ExtractionStatusUpdate update) {
        extraction.put("status", update.status());
        extraction.put("stt_status", update.sttStatus());
        extraction.put("processing_stage", update.processingStage());
        extraction.put("processing_step", update.processingStep());
        extraction.put("processing_error_code", update.processingErrorCode());
        extraction.put("processing_error", update.processingError());
        extraction.put("updated_at", update.updatedAt());
    }

    private int resolveDurationMs(String lectureId, Integer durationMsInput) {
        LectureItem lecture = learningService.getLecture(lectureId);
        int lectureDurationMs = lecture == null ? FALLBACK_TRANSCRIPT_DURATION_MS : Math.max(3_000, lecture.duration_minutes() * 60_000);
        int requested = durationMsInput == null || durationMsInput <= 0 ? lectureDurationMs : durationMsInput;
        return Math.min(requested, PUBLIC_STT_MAX_DURATION_MS);
    }

    private boolean isStaleCallback(Map<String, Object> extraction, long eventVersion) {
        return eventVersion <= asLong(extraction.get("last_event_version"));
    }

    private Map<String, Object> staleCallbackResponse(Map<String, Object> extraction) {
        extraction.put("callback_ignored", true);
        extraction.put("callback_status", "IGNORED_STALE");
        return normalizeExtractionForResponse(extraction);
    }

    private String resolveErrorMessage(MediaStatus status, String errorMessage) {
        if (status == MediaStatus.FAILED && (errorMessage == null || errorMessage.isBlank())) {
            return "media processor callback failed";
        }
        return errorMessage;
    }

    private void applyCallbackMetadata(
            Map<String, Object> extraction,
            long eventVersion,
            MediaStatus callbackStatus,
            String errorMessage,
            String audioUrl,
            String processingJobId,
            String processingStage,
            String processingStep,
            String audioFormat,
            Integer sampleRate,
            Integer channels,
            String syncMode,
            String overwritePolicy,
            String approvalState,
            String notificationChannel,
            String now
    ) {
        extraction.put("last_event_version", eventVersion);
        extraction.put("status", callbackStatus.name());
        extraction.put("error_message", errorMessage);
        putIfText(extraction, "audio_url", audioUrl);
        putIfText(extraction, "processing_job_id", processingJobId);
        putIfText(extraction, "processing_stage", processingStage);
        putIfText(extraction, "processing_step", processingStep);
        putIfText(extraction, "audio_format", audioFormat);
        if (sampleRate != null && sampleRate > 0) extraction.put("sample_rate", sampleRate);
        if (channels != null && channels > 0) extraction.put("channels", channels);
        extraction.put("stt_sync_mode", normalizeOrDefault(syncMode, "AUTO").toLowerCase());
        extraction.put("stt_overwrite_policy", normalizeOrDefault(overwritePolicy, "OVERWRITE").toLowerCase());
        extraction.put("stt_approval_state", normalizeOrDefault(approvalState, "PENDING").toLowerCase());
        extraction.put("stt_sync_notification_channel", normalizeOrDefault(notificationChannel, "dashboard"));
        extraction.put("stt_sync_notified_at", now);
        extraction.put("stt_sync_metrics", Map.of(
                "callback_events", 1,
                "notifications", 1
        ));

        if (callbackStatus == MediaStatus.COMPLETED) {
            extraction.put("status", MediaStatus.PROCESSING.name());
            extraction.put("processing_stage", PipelineStage.TRANSCRIBING.value());
            extraction.put("processing_step", "stt_started");
            extraction.put("stt_status", MediaStatus.PROCESSING.name());
            extraction.put("processing_error_code", null);
            extraction.put("processing_error", null);
        } else if (callbackStatus == MediaStatus.FAILED) {
            extraction.put("processing_stage", PipelineStage.FAILED.value());
            extraction.put("processing_step", "callback_failed");
            extraction.put("stt_status", MediaStatus.FAILED.name());
            extraction.put("processing_error_code", "PROCESSOR_CALLBACK_FAILED");
            extraction.put("processing_error", errorMessage);
        } else {
            extraction.put("processing_stage", PipelineStage.CALLBACK.value());
            extraction.put("processing_step", "callback_received");
        }
        extraction.put("processed_at", now);
        extraction.put("callback_ignored", false);
        extraction.put("callback_status", "APPLIED");
        extraction.put("updated_at", now);
    }

    private Map<String, Object> buildPipelineFromCallback(ExtractionSnapshot extraction, MediaStatus callbackStatus, String errorMessage, String now) {
        boolean failed = callbackStatus == MediaStatus.FAILED;
        PipelineSnapshot snapshot = new PipelineSnapshot(
                extraction.lectureId(),
                failed ? MediaStatus.FAILED.name() : MediaStatus.COMPLETED.name(),
                failed ? MediaStatus.FAILED.name() : MediaStatus.PROCESSING.name(),
                MediaStatus.PENDING.name(),
                failed ? PipelineStage.FAILED.value() : PipelineStage.TRANSCRIBING.value(),
                failed ? "callback_failed" : "stt_started",
                failed ? "PROCESSOR_CALLBACK_FAILED" : null,
                failed ? errorMessage : null,
                extraction.transcriptId(),
                null,
                extraction.id(),
                now
        );
        return snapshot.toMap();
    }

    private ExtractionSnapshot findExtraction(String extractionId) {
        Map<String, Object> extraction = repository.getKv(EXTRACTION_SCOPE, extractionId);
        if (extraction != null) return ExtractionSnapshot.from(extraction);
        for (Map<String, Object> row : repository.listEventsByScope(EXTRACTION_SCOPE)) {
            if (extractionId.equals(String.valueOf(row.getOrDefault("id", "")))) return ExtractionSnapshot.from(row);
        }
        return null;
    }

    private void appendActivity(Map<String, Object> extraction, String extractionId, String lectureId, MediaStatus status) {
        if (activityEventService == null) return;
        String userId = String.valueOf(extraction.getOrDefault("user_id", "")).trim();
        if (userId.isBlank()) return;
        activityEventService.append(userId, "media_extraction_" + status.name().toLowerCase(), "extraction", extractionId, Map.of("lecture_id", lectureId, "status", status.name()));
    }

    private Map<String, Object> normalizeExtractionForResponse(Map<String, Object> extraction) {
        Map<String, Object> hydrated = new HashMap<>(extraction);
        hydrated.putIfAbsent("processing_stage", PipelineStage.QUEUED.value());
        hydrated.putIfAbsent("processing_step", "job_requested");
        hydrated.putIfAbsent("processing_error_code", null);
        hydrated.putIfAbsent("processing_error", null);
        hydrated.putIfAbsent("stt_status", MediaStatus.PENDING.name());
        hydrated.putIfAbsent("error_message", null);
        hydrated.putIfAbsent("callback_ignored", false);
        hydrated.putIfAbsent("callback_status", "APPLIED");
        hydrated.putIfAbsent("last_event_version", 0L);
        return hydrated;
    }

    private String buildLectureNarrative(String lectureId) {
        LectureItem lecture = learningService.getLecture(lectureId);
        if (lecture == null) return "강의 텍스트를 찾을 수 없습니다.";
        return lecture.title() + " 강의에서는 핵심 개념을 설명하고, 실습 흐름과 복습 포인트를 단계적으로 정리합니다. " +
                "특히 자주 혼동되는 개념을 예시로 비교하고, 다음 차시와 연결되는 질문을 중심으로 학습합니다.";
    }

    private void putIfText(Map<String, Object> target, String key, String value) {
        if (value != null && !value.isBlank()) target.put(key, value);
    }

    private String normalizeOrDefault(String value, String defaultValue) {
        if (value == null) return defaultValue;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? defaultValue : trimmed;
    }

    private long asLong(Object value) {
        if (value == null) return 0L;
        if (value instanceof Number n) return n.longValue();
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (Exception ignored) {
            return 0L;
        }
    }

    private record TranscriptionDraft(
            String transcriptId,
            String lectureId,
            String language,
            String provider,
            String model,
            String fullText,
            List<Map<String, Object>> segments,
            List<Map<String, Object>> speakerSegments,
            int durationMs,
            int wordCount,
            Map<String, Object> quality,
            String audioUrl,
            Map<String, Object> instructorGuess
    ) {
    }

    private record SttRequest(
            String language,
            String provider,
            String model,
            int durationMs,
            String audioUrl
    ) {
    }

    private record SegmentGenerationPayload(String text, int durationMs) {
        List<Map<String, Object>> toSegments(TranscriptSegmenter segmenter) {
            return segmenter.split(text, durationMs);
        }
    }

    private record ExtractionStatusUpdate(
            String status,
            String sttStatus,
            String processingStage,
            String processingStep,
            Object processingErrorCode,
            Object processingError,
            String updatedAt
    ) {
    }

    private record TranscriptPayload(
            String id,
            String lectureId,
            String language,
            String fullText,
            List<Map<String, Object>> segments,
            List<Map<String, Object>> speakerSegments,
            int wordCount,
            int durationMs,
            String provider,
            String model,
            Map<String, Object> quality,
            String createdAt,
            Map<String, Object> instructorGuess,
            Map<String, Object> speakerReview
    ) {
        Map<String, Object> toMap() {
            Map<String, Object> map = new HashMap<>();
            map.put("id", id);
            map.put("lecture_id", lectureId);
            map.put("language", language);
            map.put("full_text", fullText);
            map.put("segments", segments);
            map.put("speaker_segments", speakerSegments);
            map.put("word_count", wordCount);
            map.put("duration_ms", durationMs);
            map.put("stt_provider", provider);
            map.put("stt_model", model);
            map.put("quality", quality);
            map.put("instructor_guess", instructorGuess);
            map.put("speaker_review", speakerReview);
            map.put("created_at", createdAt);
            return map;
        }
    }

    private record PipelinePayload(
            String lectureId,
            String transcriptStatus,
            String summaryStatus,
            String audioStatus,
            String processingStage,
            String processingStep,
            Object processingErrorCode,
            Object processingError,
            String transcriptId,
            Object noteId,
            Object extractionId,
            String updatedAt
    ) {
        static PipelinePayload completed(String lectureId, String transcriptId, Object extractionId, String now) {
            return new PipelinePayload(
                    lectureId,
                    MediaStatus.COMPLETED.name(),
                    MediaStatus.PENDING.name(),
                    MediaStatus.COMPLETED.name(),
                    PipelineStage.COMPLETED.value(),
                    "stt_completed",
                    null,
                    null,
                    transcriptId,
                    null,
                    extractionId,
                    now
            );
        }

        Map<String, Object> toMap() {
            Map<String, Object> map = new HashMap<>();
            map.put("lecture_id", lectureId);
            map.put("transcript_status", transcriptStatus);
            map.put("summary_status", summaryStatus);
            map.put("audio_status", audioStatus);
            map.put("processing_stage", processingStage);
            map.put("processing_step", processingStep);
            map.put("processing_error_code", processingErrorCode);
            map.put("processing_error", processingError);
            map.put("transcript_id", transcriptId);
            map.put("note_id", noteId);
            map.put("extraction_id", extractionId);
            map.put("updated_at", updatedAt);
            return map;
        }
    }

    private record ExtractionSnapshot(String id, String lectureId, String transcriptId, Map<String, Object> raw) {
        static ExtractionSnapshot from(Map<String, Object> row) {
            Map<String, Object> copy = new HashMap<>(row);
            return new ExtractionSnapshot(
                    String.valueOf(copy.getOrDefault("id", "")).trim(),
                    String.valueOf(copy.getOrDefault("lecture_id", "")).trim(),
                    copy.get("transcript_id") == null ? null : String.valueOf(copy.get("transcript_id")).trim(),
                    copy
            );
        }

        Map<String, Object> toMap() {
            return new HashMap<>(raw);
        }
    }

    private record PipelineSnapshot(
            String lectureId,
            String audioStatus,
            String transcriptStatus,
            String summaryStatus,
            String processingStage,
            String processingStep,
            Object processingErrorCode,
            Object processingError,
            String transcriptId,
            Object noteId,
            String extractionId,
            String updatedAt
    ) {
        Map<String, Object> toMap() {
            Map<String, Object> map = new HashMap<>();
            map.put("lecture_id", lectureId);
            map.put("audio_status", audioStatus);
            map.put("transcript_status", transcriptStatus);
            map.put("summary_status", summaryStatus);
            map.put("processing_stage", processingStage);
            map.put("processing_step", processingStep);
            map.put("processing_error_code", processingErrorCode);
            map.put("processing_error", processingError);
            map.put("transcript_id", transcriptId);
            map.put("note_id", noteId);
            map.put("extraction_id", extractionId);
            map.put("updated_at", updatedAt);
            return map;
        }
    }
}
