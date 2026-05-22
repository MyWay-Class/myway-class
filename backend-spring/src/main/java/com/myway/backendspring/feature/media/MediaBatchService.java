package com.myway.backendspring.feature.media;

import com.myway.backendspring.domain.DemoLearningService;
import com.myway.backendspring.domain.CourseDetail;
import com.myway.backendspring.domain.LectureItem;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
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
            List<Map<String, Object>> failedLectures = new ArrayList<>();
            String failedAt = Instant.now().toString();

            for (String lectureId : targets) {
                LectureItem lecture = learningService.getLecture(lectureId);
                Map<String, Object> mapping = mediaPipelineService.lectureVideoAssetMapping(lectureId);
                if (mapping == null) {
                    pending++;
                    failedLectures.add(failedLectureItem(lecture, "MAPPING_MISSING", failedAt));
                    continue;
                }
                String assetKey = String.valueOf(mapping.getOrDefault("asset_key", "")).trim();
                if (assetKey.isBlank()) {
                    pending++;
                    failedLectures.add(failedLectureItem(lecture, "ASSET_KEY_MISSING", failedAt));
                    continue;
                }

                Map<String, Object> extraction = mediaPipelineService.createExtraction(lectureId, "/api/v1/media/assets/" + assetKey);
                String extractionId = String.valueOf(extraction.getOrDefault("id", ""));
                Map<String, Object> dispatched = mediaPipelineService.dispatchExtractionJob(extractionId, "/api/v1/media/assets/" + assetKey);

                String status = String.valueOf(dispatched == null ? "" : dispatched.getOrDefault("status", "")).toUpperCase();
                if ("FAILED".equals(status)) {
                    failure++;
                    failedLectures.add(failedLectureItem(lecture, "DISPATCH_FAILED", failedAt));
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

        Map<String, Object> previousStatus = mediaPipelineService.batchStatus();
        if (previousStatus != null) {
            List<String> fromPrevious = extractFailedLectureIds(previousStatus.get("failed_lectures"));
            if (!fromPrevious.isEmpty()) {
                return fromPrevious;
            }
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

    private Map<String, Object> failedLectureItem(LectureItem lecture, String reason, String failedAt) {
        Map<String, Object> item = new HashMap<>();
        String lectureId = lecture == null ? "" : lecture.id();
        String courseTitle = null;
        if (lecture != null && lecture.course_id() != null && !lecture.course_id().isBlank()) {
            CourseDetail course = learningService.getCourseDetail(lecture.course_id(), "");
            if (course != null && course.title() != null && !course.title().isBlank()) {
                courseTitle = course.title();
            } else {
                courseTitle = lecture.course_id();
            }
        }
        item.put("lecture_id", lectureId);
        item.put("lecture_title", lecture == null ? lectureId : lecture.title());
        item.put("course_title", courseTitle);
        item.put("failed_reason", reason);
        item.put("failed_at", failedAt);
        return item;
    }

    @SuppressWarnings("unchecked")
    private List<String> extractFailedLectureIds(Object rawFailedLectures) {
        if (!(rawFailedLectures instanceof List<?> list)) {
            return List.of();
        }

        List<String> ids = new ArrayList<>();
        for (Object row : list) {
            if (row instanceof String s && !s.isBlank()) {
                ids.add(s.trim());
                continue;
            }
            if (row instanceof Map<?, ?> map) {
                Object lectureIdRaw = map.containsKey("lecture_id") ? map.get("lecture_id") : "";
                String lectureId = String.valueOf(lectureIdRaw).trim();
                if (!lectureId.isBlank()) {
                    ids.add(lectureId);
                }
            }
        }
        return ids;
    }
}
