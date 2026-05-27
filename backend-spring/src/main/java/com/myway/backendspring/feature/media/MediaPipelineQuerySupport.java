package com.myway.backendspring.feature.media;

import com.myway.backendspring.feature.repository.FeatureStoreRepository;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class MediaPipelineQuerySupport {
    Map<String, Object> pipeline(FeatureStoreRepository repository, String pipelineScope, String lectureId) {
        Map<String, Object> row = repository.getKv(pipelineScope, lectureId);
        Map<String, Object> hydrated = row == null ? new HashMap<>() : new HashMap<>(row);
        hydrated.putIfAbsent("lecture_id", lectureId);
        hydrated.putIfAbsent("status", row == null ? "EMPTY" : "IN_PROGRESS");
        hydrated.putIfAbsent("audio_status", MediaStatus.PENDING.name());
        hydrated.putIfAbsent("transcript_status", MediaStatus.PENDING.name());
        hydrated.putIfAbsent("summary_status", MediaStatus.PENDING.name());
        hydrated.putIfAbsent("processing_stage", PipelineStage.IDLE.value());
        hydrated.putIfAbsent("processing_step", "not_started");
        hydrated.putIfAbsent("processing_error_code", null);
        hydrated.putIfAbsent("processing_error", null);
        hydrated.putIfAbsent("transcript_id", null);
        hydrated.putIfAbsent("note_id", null);
        hydrated.putIfAbsent("extraction_id", null);
        hydrated.putIfAbsent("updated_at", Instant.now().toString());
        return hydrated;
    }

    Map<String, Object> transcript(FeatureStoreRepository repository, String transcriptScope, String lectureId, Map<String, Object> speakerReview) {
        Map<String, Object> transcript = repository.getKv(transcriptScope, lectureId);
        if (transcript == null) {
            return null;
        }
        Map<String, Object> merged = new HashMap<>(transcript);
        merged.putIfAbsent("speaker_review", speakerReview);
        return merged;
    }

    Map<String, Object> speakerReview(FeatureStoreRepository repository, String speakerReviewScope, String lectureId) {
        if (lectureId == null || lectureId.isBlank()) {
            return Map.of("status", "PENDING");
        }
        Map<String, Object> review = repository.getKv(speakerReviewScope, lectureId.trim());
        return review == null ? Map.of("status", "PENDING") : review;
    }

    Map<String, String> lectureVideoAssetMap(FeatureStoreRepository repository, String lectureVideoAssetScope) {
        return repository.listKvByScope(lectureVideoAssetScope).stream()
                .map(row -> Map.entry(
                        String.valueOf(row.getOrDefault("lecture_id", "")),
                        String.valueOf(row.getOrDefault("asset_key", ""))
                ))
                .filter(entry -> !entry.getKey().isBlank() && !entry.getValue().isBlank())
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (left, right) -> right));
    }
}
