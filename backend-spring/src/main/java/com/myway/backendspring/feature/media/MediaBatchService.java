package com.myway.backendspring.feature.media;

import com.myway.backendspring.domain.DemoLearningService;
import com.myway.backendspring.domain.LectureItem;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class MediaBatchService {
    private final MediaPipelineService mediaPipelineService;
    private final DemoLearningService learningService;
    private final AtomicBoolean running = new AtomicBoolean(false);

    public MediaBatchService(MediaPipelineService mediaPipelineService, DemoLearningService learningService) {
        this.mediaPipelineService = mediaPipelineService;
        this.learningService = learningService;
    }

    public Map<String, Object> getBatchStatus() {
        Map<String, Object> found = mediaPipelineService.batchStatus();
        if (found != null) {
            return found;
        }
        return Map.of(
                "last_run_at", null,
                "mode", "none",
                "running", false,
                "success_count", 0,
                "failure_count", 0,
                "pending_count", 0,
                "failed_lectures", List.of()
        );
    }

    public synchronized Map<String, Object> runBatch(String mode, boolean auto) {
        if (!running.compareAndSet(false, true)) {
            return Map.of("running", true, "message", "이미 배치가 실행 중입니다.");
        }

        String normalizedMode = "failed-only".equalsIgnoreCase(mode) ? "failed-only" : "all";
        try {
            List<String> targets = resolveTargetLectures(normalizedMode);
            int success = 0;
            int failure = 0;
            int pending = 0;
            List<String> failedLectures = new ArrayList<>();

            for (String lectureId : targets) {
                Map<String, Object> mapping = mediaPipelineService.lectureVideoAssetMapping(lectureId);
                if (mapping == null) {
                    pending++;
                    failedLectures.add(lectureId);
                    continue;
                }
                String assetKey = String.valueOf(mapping.getOrDefault("asset_key", "")).trim();
                if (assetKey.isBlank()) {
                    pending++;
                    failedLectures.add(lectureId);
                    continue;
                }

                Map<String, Object> extraction = mediaPipelineService.createExtraction(lectureId, "/api/v1/media/assets/" + assetKey);
                String extractionId = String.valueOf(extraction.getOrDefault("id", ""));
                Map<String, Object> dispatched = mediaPipelineService.dispatchExtractionJob(extractionId, "/api/v1/media/assets/" + assetKey);

                String status = String.valueOf(dispatched == null ? "" : dispatched.getOrDefault("status", "")).toUpperCase();
                if ("FAILED".equals(status)) {
                    failure++;
                    failedLectures.add(lectureId);
                } else if ("PROCESSING".equals(status) || "PENDING".equals(status) || status.isBlank()) {
                    pending++;
                } else {
                    success++;
                }
            }

            Map<String, Object> status = new LinkedHashMap<>();
            status.put("last_run_at", Instant.now().toString());
            status.put("mode", normalizedMode);
            status.put("running", false);
            status.put("auto", auto);
            status.put("target_count", targets.size());
            status.put("success_count", success);
            status.put("failure_count", failure);
            status.put("pending_count", pending);
            status.put("failed_lectures", failedLectures);
            mediaPipelineService.upsertBatchStatus(status);
            return status;
        } finally {
            running.set(false);
        }
    }

    public Map<String, Object> auditLectureVideoAssetMappings() {
        Map<String, String> mappings = mediaPipelineService.lectureVideoAssetMap();
        List<String> missing = learningService.listAllLectures().stream()
                .map(LectureItem::id)
                .filter(lectureId -> !mappings.containsKey(lectureId))
                .toList();

        return Map.of(
                "total_lectures", learningService.listAllLectures().size(),
                "mapped_count", learningService.listAllLectures().size() - missing.size(),
                "missing_count", missing.size(),
                "missing_lectures", missing
        );
    }

    public Map<String, Object> bulkMapMissingLectureVideoAssets() {
        Map<String, Object> audit = auditLectureVideoAssetMappings();
        @SuppressWarnings("unchecked")
        List<String> missing = (List<String>) audit.getOrDefault("missing_lectures", List.of());
        List<Map<String, Object>> mapped = new ArrayList<>();
        for (String lectureId : missing) {
            String key = "asset/" + lectureId + "/auto-mapped";
            mediaPipelineService.upsertMediaAsset(key, lectureId);
            mediaPipelineService.upsertLectureVideoAssetMapping(lectureId, key);
            mapped.add(Map.of("lecture_id", lectureId, "asset_key", key));
        }
        return Map.of(
                "mapped_count", mapped.size(),
                "mapped", mapped,
                "audit", auditLectureVideoAssetMappings()
        );
    }

    private List<String> resolveTargetLectures(String mode) {
        if (!"failed-only".equals(mode)) {
            return learningService.listAllLectures().stream().map(LectureItem::id).toList();
        }

        List<String> failed = new ArrayList<>();
        for (LectureItem lecture : learningService.listAllLectures()) {
            Map<String, Object> pipeline = mediaPipelineService.pipeline(lecture.id());
            String stage = String.valueOf(pipeline.getOrDefault("processing_stage", ""));
            String audioStatus = String.valueOf(pipeline.getOrDefault("audio_status", ""));
            String transcriptStatus = String.valueOf(pipeline.getOrDefault("transcript_status", ""));
            if ("failed".equalsIgnoreCase(stage)
                    || "FAILED".equalsIgnoreCase(audioStatus)
                    || "FAILED".equalsIgnoreCase(transcriptStatus)) {
                failed.add(lecture.id());
            }
        }
        return failed;
    }
}
