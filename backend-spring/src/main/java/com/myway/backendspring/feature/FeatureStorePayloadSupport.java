package com.myway.backendspring.feature;

import com.myway.backendspring.feature.media.MediaStatus;
import com.myway.backendspring.feature.media.PipelineStage;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class FeatureStorePayloadSupport {
    public Map<String, Object> mediaUploadPayload(String lectureId, String assetKey, String videoUrl, String fileName) {
        return Map.of(
                "lecture_id", lectureId,
                "asset_key", assetKey,
                "video_url", videoUrl,
                "file_name", fileName
        );
    }

    public Map<String, Object> extractionSeed(String id, String lectureId, String audioUrl, String now) {
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

    public Map<String, Object> pipelineSeed(String lectureId, String extractionId, String now) {
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

    public Map<String, Object> lectureSummaryNotePayload(
            String id,
            String lectureId,
            String style,
            String language,
            String createdAt
    ) {
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

    public String normalizeOrDefault(String value, String defaultValue) {
        if (value == null) return defaultValue;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? defaultValue : trimmed;
    }
}
