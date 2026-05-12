package com.myway.backendspring.feature.media;

import com.myway.backendspring.domain.ActivityEventService;
import com.myway.backendspring.domain.DemoLearningService;
import com.myway.backendspring.domain.LectureItem;
import com.myway.backendspring.feature.rag.RagService;
import com.myway.backendspring.feature.repository.FeatureStoreRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class MediaTranscriptionService {
    private static final String TRANSCRIPT_SCOPE = "media_transcript";
    private static final String EXTRACTION_SCOPE = "media_extraction";
    private static final String PIPELINE_SCOPE = "media_pipeline";
    private static final String STT_DEFAULT_PROVIDER = "cloudflare";
    private static final String STT_DEFAULT_MODEL = "cf-whisper";
    private static final int PUBLIC_STT_MAX_DURATION_MS = 180_000;
    private static final int FALLBACK_TRANSCRIPT_DURATION_MS = 120_000;
    private static final int FALLBACK_SEGMENT_MIN_MS = 1_000;
    private static final int STT_TARGET_SEGMENT_WORDS = 20;

    private final FeatureStoreRepository repository;
    private final DemoLearningService learningService;
    private final ActivityEventService activityEventService;
    private final RagService ragService;

    public MediaTranscriptionService(
            FeatureStoreRepository repository,
            DemoLearningService learningService,
            ActivityEventService activityEventService,
            @Value("${myway.runtime.env:${SPRING_PROFILES_ACTIVE:dev}}") String runtimeEnv,
            RagService ragService
    ) {
        this.repository = repository;
        this.learningService = learningService;
        this.activityEventService = activityEventService;
        this.ragService = ragService;
    }

    public Map<String, Object> transcribe(Map<String, Object> extraction, String lectureId, String language, Integer durationMsInput, String sttProvider, String sttModel, String audioUrl) {
        String now = Instant.now().toString();
        Map<String, Object> extractionInProgress = new HashMap<>(extraction);
        extractionInProgress.put("status", "PROCESSING");
        extractionInProgress.put("stt_status", "PROCESSING");
        extractionInProgress.put("processing_stage", "transcribing");
        extractionInProgress.put("processing_step", "stt_started");
        extractionInProgress.put("processing_error_code", null);
        extractionInProgress.put("processing_error", null);
        extractionInProgress.put("updated_at", now);
        String extractionId = String.valueOf(extractionInProgress.getOrDefault("id", ""));
        repository.upsertKv(EXTRACTION_SCOPE, extractionId, extractionInProgress);

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
        String transcriptId = extractionId.isBlank() ? UUID.randomUUID().toString() : extractionId;
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
        repository.upsertKv(TRANSCRIPT_SCOPE, lectureId, transcriptPayload);

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
        pipelinePayload.put("extraction_id", extractionInProgress.get("id"));
        pipelinePayload.put("updated_at", now);
        repository.upsertKv(PIPELINE_SCOPE, lectureId, pipelinePayload);

        Map<String, Object> extractionPayload = new HashMap<>(extractionInProgress);
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
        repository.upsertKv(EXTRACTION_SCOPE, transcriptId, extractionPayload);

        Map<String, Object> ragIndex = ragService == null ? Map.of() : ragService.rebuildRagIndex(lectureId, null);
        Map<String, Object> response = new HashMap<>();
        response.put("transcript_id", transcriptId);
        response.put("lecture_id", lectureId);
        response.put("segment_count", segments.size());
        response.put("duration_ms", durationMs);
        response.put("word_count", wordCount);
        response.put("stt_provider", resolvedProvider);
        response.put("stt_model", resolvedModel);
        response.put("audio_url", audioUrl);
        response.put("pipeline", pipelinePayload);
        response.put("language", normalizedLanguage);
        response.put("quality", sttQuality);
        response.put("rag_index", ragIndex);
        return response;
    }

    public Map<String, Object> completeExtractionCallback(String extractionId, String status, String errorMessage, long eventVersion, String audioUrl, String processingJobId, String processingStage, String processingStep, String audioFormat, Integer sampleRate, Integer channels) {
        Map<String, Object> extraction = findExtraction(extractionId);
        if (extraction == null) return null;

        long currentVersion = asLong(extraction.get("last_event_version"));
        if (eventVersion <= currentVersion) {
            extraction.put("callback_ignored", true);
            extraction.put("callback_status", "IGNORED_STALE");
            return normalizeExtractionForResponse(extraction);
        }

        String now = Instant.now().toString();
        String resolvedStatus = status == null || status.isBlank() ? "COMPLETED" : status.toUpperCase();
        String resolvedErrorCode = "FAILED".equalsIgnoreCase(resolvedStatus) ? "PROCESSOR_CALLBACK_FAILED" : null;
        if ("FAILED".equalsIgnoreCase(resolvedStatus) && (errorMessage == null || errorMessage.isBlank())) errorMessage = "media processor callback failed";
        applyCallbackMetadata(extraction, eventVersion, resolvedStatus, errorMessage, audioUrl, processingJobId, processingStage, processingStep, audioFormat, sampleRate, channels, now, resolvedErrorCode);
        repository.upsertKv(EXTRACTION_SCOPE, extractionId, extraction);

        String lectureId = String.valueOf(extraction.getOrDefault("lecture_id", "")).trim();
        if (!lectureId.isBlank()) {
            repository.upsertKv(PIPELINE_SCOPE, lectureId, buildPipelineFromCallback(extraction, lectureId, resolvedStatus, resolvedErrorCode, errorMessage, now));
        }
        appendActivity(extraction, extractionId, lectureId, resolvedStatus);
        return normalizeExtractionForResponse(extraction);
    }

    private void applyCallbackMetadata(Map<String, Object> extraction, long eventVersion, String resolvedStatus, String errorMessage, String audioUrl, String processingJobId, String processingStage, String processingStep, String audioFormat, Integer sampleRate, Integer channels, String now, String resolvedErrorCode) {
        extraction.put("last_event_version", eventVersion);
        extraction.put("status", resolvedStatus);
        extraction.put("error_message", errorMessage);
        putIfText(extraction, "audio_url", audioUrl);
        putIfText(extraction, "processing_job_id", processingJobId);
        putIfText(extraction, "processing_stage", processingStage);
        putIfText(extraction, "processing_step", processingStep);
        putIfText(extraction, "audio_format", audioFormat);
        if (sampleRate != null && sampleRate > 0) extraction.put("sample_rate", sampleRate);
        if (channels != null && channels > 0) extraction.put("channels", channels);
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
    }

    private Map<String, Object> buildPipelineFromCallback(Map<String, Object> extraction, String lectureId, String resolvedStatus, String resolvedErrorCode, String errorMessage, String now) {
        Map<String, Object> pipeline = new HashMap<>();
        boolean failed = "FAILED".equalsIgnoreCase(resolvedStatus);
        pipeline.put("lecture_id", lectureId);
        pipeline.put("audio_status", failed ? "FAILED" : "COMPLETED");
        pipeline.put("transcript_status", failed ? "FAILED" : "PROCESSING");
        pipeline.put("summary_status", "PENDING");
        pipeline.put("processing_stage", failed ? "failed" : "transcribing");
        pipeline.put("processing_step", failed ? "callback_failed" : "stt_started");
        pipeline.put("processing_error_code", failed ? resolvedErrorCode : null);
        pipeline.put("processing_error", failed ? errorMessage : null);
        pipeline.put("transcript_id", extraction.get("transcript_id"));
        pipeline.put("note_id", null);
        pipeline.put("extraction_id", extraction.get("id"));
        pipeline.put("updated_at", now);
        return pipeline;
    }

    private Map<String, Object> findExtraction(String extractionId) {
        Map<String, Object> extraction = repository.getKv(EXTRACTION_SCOPE, extractionId);
        if (extraction != null) return new HashMap<>(extraction);
        for (Map<String, Object> row : repository.listEventsByScope(EXTRACTION_SCOPE)) {
            if (extractionId.equals(String.valueOf(row.getOrDefault("id", "")))) return new HashMap<>(row);
        }
        return null;
    }

    private void appendActivity(Map<String, Object> extraction, String extractionId, String lectureId, String resolvedStatus) {
        if (activityEventService == null) return;
        String userId = String.valueOf(extraction.getOrDefault("user_id", "")).trim();
        if (userId.isBlank()) return;
        activityEventService.append(userId, "media_extraction_" + resolvedStatus.toLowerCase(), "extraction", extractionId, Map.of("lecture_id", lectureId, "status", resolvedStatus));
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

    private void putIfText(Map<String, Object> target, String key, String value) {
        if (value != null && !value.isBlank()) target.put(key, value);
    }

    private String buildLectureNarrative(String lectureId) {
        LectureItem lecture = learningService.getLecture(lectureId);
        if (lecture == null) return "강의 텍스트를 찾을 수 없습니다.";
        return lecture.title() + " 강의에서는 핵심 개념을 설명하고, 실습 흐름과 복습 포인트를 단계적으로 정리합니다. " +
                "특히 자주 혼동되는 개념을 예시로 비교하고, 다음 차시와 연결되는 질문을 중심으로 학습합니다.";
    }

    private List<Map<String, Object>> splitIntoSegments(String text, int durationMs) {
        List<String> words = tokenizeForChunking(text);
        if (words.isEmpty()) return List.of();
        int segmentCount = Math.min(8, Math.max(3, (int) Math.ceil(words.size() / 20.0)));
        int wordsPerSegment = Math.max(1, (int) Math.ceil(words.size() / (double) segmentCount));
        List<Map<String, Object>> segments = new ArrayList<>();
        for (int i = 0; i < segmentCount; i++) {
            int start = i * wordsPerSegment;
            int end = Math.min(words.size(), start + wordsPerSegment);
            if (start >= end) break;
            int startMs = (int) Math.round((i / (double) segmentCount) * durationMs);
            int endMs = i == segmentCount - 1 ? durationMs : (int) Math.round(((i + 1) / (double) segmentCount) * durationMs);
            Map<String, Object> segment = new HashMap<>();
            segment.put("index", i);
            segment.put("start_ms", startMs);
            segment.put("end_ms", Math.max(startMs + FALLBACK_SEGMENT_MIN_MS, endMs));
            segment.put("text", String.join(" ", words.subList(start, end)));
            segments.add(segment);
        }
        return segments;
    }

    private Map<String, Object> sttQualityMetrics(List<Map<String, Object>> segments, int durationMs) {
        if (segments == null || segments.isEmpty()) return Map.of("segment_count", 0, "avg_words_per_segment", 0, "min_segment_ms", 0, "max_segment_ms", 0, "target_segment_words", STT_TARGET_SEGMENT_WORDS, "quality_score", 0.0);
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
        return Map.of("segment_count", segments.size(), "avg_words_per_segment", Math.round(avgWords * 100.0) / 100.0, "min_segment_ms", minMs == Integer.MAX_VALUE ? 0 : minMs, "max_segment_ms", maxMs, "target_segment_words", STT_TARGET_SEGMENT_WORDS, "quality_score", Math.round(score * 1000.0) / 1000.0);
    }

    private int countWords(String text) {
        return tokenize(text).size();
    }

    private List<String> tokenize(String text) {
        String normalized = normalizeText(text).toLowerCase();
        return List.of(normalized.split("[^a-zA-Z0-9가-힣]+")).stream().map(String::trim).filter(token -> token.length() > 1).toList();
    }

    private List<String> tokenizeForChunking(String text) {
        return List.of(normalizeText(text).split("\\s+")).stream().map(String::trim).filter(token -> !token.isBlank()).toList();
    }

    private String normalizeText(String text) {
        if (text == null) return "";
        return text.replaceAll("\\s+", " ").trim();
    }

    private int asInt(Object value) {
        if (value == null) return 0;
        if (value instanceof Number n) return n.intValue();
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (Exception ignored) {
            return 0;
        }
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
}
