package com.myway.backendspring.feature.media;

import com.myway.backendspring.domain.ActivityEventService;
import com.myway.backendspring.domain.DemoLearningService;
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
    private final FeatureStoreRepository repository;
    private final DemoLearningService learningService;
    private final ActivityEventService activityEventService;
    private final RagService ragService;
    private final TranscriptSegmenter segmenter;
    private final MediaTranscriptionMetrics metrics;
    private final MediaExtractionCallbackSupport callbackSupport;
    private final MediaTranscriptionCallbackFacade callbackFacade;
    private final MediaTranscriptionDraftSupport draftSupport;
    private final MediaTranscriptionPersistenceSupport persistenceSupport;

    public MediaTranscriptionService(
            FeatureStoreRepository repository,
            DemoLearningService learningService,
            ActivityEventService activityEventService,
            RagService ragService,
            TranscriptSegmenter segmenter,
            MediaTranscriptionMetrics metrics,
            MediaExtractionCallbackSupport callbackSupport,
            MediaTranscriptionCallbackFacade callbackFacade,
            MediaTranscriptionDraftSupport draftSupport,
            MediaTranscriptionPersistenceSupport persistenceSupport
    ) {
        this.repository = repository;
        this.learningService = learningService;
        this.activityEventService = activityEventService;
        this.ragService = ragService;
        this.segmenter = segmenter;
        this.metrics = metrics;
        this.callbackSupport = callbackSupport;
        this.callbackFacade = callbackFacade;
        this.draftSupport = draftSupport;
        this.persistenceSupport = persistenceSupport;
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
        Map<String, Object> extractionInProgress = persistenceSupport.markExtractionInProgress(repository, EXTRACTION_SCOPE, extraction, now);
        TranscriptionDraft draft = buildDraft(extractionInProgress, lectureId, language, durationMsInput, sttProvider, sttModel, audioUrl);
        persistTranscript(lectureId, draft);
        Map<String, Object> pipelinePayload = persistenceSupport.persistPipeline(repository, PIPELINE_SCOPE, lectureId, extractionInProgress.get("id"), draft.transcriptId(), now);
        persistenceSupport.persistCompletedExtraction(
                repository, EXTRACTION_SCOPE, extractionInProgress, String.valueOf(extractionInProgress.getOrDefault("id", "")), draft.transcriptId(), draft.durationMs(), draft.language(),
                draft.provider(), draft.model(), draft.audioUrl(), draft.quality(), now
        );
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
        return callbackFacade.completeExtractionCallback(
                repository,
                persistenceSupport,
                callbackSupport,
                activityEventService,
                EXTRACTION_SCOPE,
                PIPELINE_SCOPE,
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
                channels,
                syncMode,
                overwritePolicy,
                approvalState,
                notificationChannel
        );
    }

    private TranscriptionDraft buildDraft(Map<String, Object> extraction, String lectureId, String language, Integer durationMsInput, String sttProvider, String sttModel, String audioUrl) {
        SttRequest request = buildSttRequest(lectureId, language, durationMsInput, sttProvider, sttModel, audioUrl);
        String text = draftSupport.buildLectureNarrative(learningService, lectureId);
        List<Map<String, Object>> segments = buildSegmentGenerationPayload(text, request.durationMs()).toSegments(segmenter);
        Map<String, Object> instructorGuess = draftSupport.inferInstructorGuess(learningService, lectureId);
        List<Map<String, Object>> speakerSegments = draftSupport.buildSpeakerSegments(segments, instructorGuess);
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
        response.put("speaker_review", draftSupport.getSpeakerReview(repository, draft.lectureId()));
        return response;
    }

    private SttRequest buildSttRequest(String lectureId, String language, Integer durationMsInput, String sttProvider, String sttModel, String audioUrl) {
        int durationMs = draftSupport.resolveDurationMs(learningService, lectureId, durationMsInput);
        String normalizedLanguage = draftSupport.normalizeOrDefault(language, "ko");
        String provider = draftSupport.normalizeOrDefault(sttProvider, STT_DEFAULT_PROVIDER);
        String model = draftSupport.normalizeOrDefault(sttModel, STT_DEFAULT_MODEL);
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
                draftSupport.getSpeakerReview(repository, lectureId)
        );
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

}
