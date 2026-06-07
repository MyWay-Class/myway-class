package com.myway.backendspring.feature;

import com.myway.backendspring.feature.media.MediaStatus;
import com.myway.backendspring.feature.media.PipelineStage;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Component
public class FeatureStorePipelineSupport {
    public Map<String, Object> buildEmptyPipeline(String lectureId) {
        Map<String, Object> empty = new HashMap<>();
        empty.put("lecture_id", lectureId);
        empty.put("status", "EMPTY");
        return applyPipelineDefaults(empty, false);
    }

    public Map<String, Object> hydratePipelineRow(Map<String, Object> row) {
        return applyPipelineDefaults(new HashMap<>(row), true);
    }

    public Map<String, Object> hydrateExtractionRow(Map<String, Object> source, Map<String, Object> latest) {
        Map<String, Object> hydrated = latest == null ? new HashMap<>(source) : new HashMap<>(latest);
        ExtractionDefaultProfile.defaults().applyIfMissing(hydrated);
        return hydrated;
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
}
