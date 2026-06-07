package com.myway.backendspring.feature.shortform;

import com.myway.backendspring.domain.ActivityEventService;
import com.myway.backendspring.domain.DemoLearningService;
import com.myway.backendspring.domain.LectureItem;
import com.myway.backendspring.feature.repository.FeatureStoreRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Service
public class ShortformService {
    private static final String SHORTFORM_EXTRACTION_SCOPE = "shortform_extraction";
    private static final String SHORTFORM_VIDEO_SCOPE = "shortform_video";
    private static final String SHORTFORM_SAVE_SCOPE = "shortform_save";
    private static final String SHORTFORM_SHARE_SCOPE = "shortform_share";
    private static final String SHORTFORM_LIKE_SCOPE = "shortform_like";
    private final FeatureStoreRepository repository;
    private final ActivityEventService activityEventService;
    private final DemoLearningService learningService;
    private final int shortformMaxRetry;
    private final long staleProcessingThresholdMs;
    private final ShortformRetrySupport retrySupport;
    private final ShortformComposeSupport composeSupport;
    private final ShortformStatusSupport statusSupport;

    public ShortformService(
            FeatureStoreRepository repository,
            ActivityEventService activityEventService,
            DemoLearningService learningService,
            @Value("${myway.shortform.retry.max-attempts:3}") int shortformMaxRetry,
            @Value("${myway.shortform.monitoring.stale-processing-ms:1800000}") long staleProcessingThresholdMs,
            ShortformRetrySupport retrySupport,
            ShortformComposeSupport composeSupport,
            ShortformStatusSupport statusSupport
    ) {
        this.repository = repository;
        this.activityEventService = activityEventService;
        this.learningService = learningService;
        this.shortformMaxRetry = Math.max(1, shortformMaxRetry);
        this.staleProcessingThresholdMs = Math.max(60000L, staleProcessingThresholdMs);
        this.retrySupport = retrySupport;
        this.composeSupport = composeSupport;
        this.statusSupport = statusSupport;
    }

    public List<Map<String, Object>> shortformLibrary(String userId) {
        return repository.listEventsByOwner(SHORTFORM_VIDEO_SCOPE + "_library", userId);
    }

    public List<Map<String, Object>> shortformCommunity(String courseId) {
        return repository.listEventsByScope(SHORTFORM_VIDEO_SCOPE + "_community");
    }

    public Map<String, Object> createShortformExtraction(String userId, Map<String, Object> payload) {
        String id = UUID.randomUUID().toString();
        String courseId = String.valueOf(payload.getOrDefault("course_id", "crs_java_01")).trim();
        String mode = String.valueOf(payload.getOrDefault("mode", "cross")).trim();
        List<Map<String, Object>> candidates = buildCandidates(id, courseId, payload.get("transcript_segments_by_lecture"));
        Map<String, Object> data = new HashMap<>();
        data.put("id", id);
        data.put("user_id", userId);
        data.put("course_id", courseId);
        data.put("mode", mode);
        data.put("candidates", candidates);
        repository.upsertKv(SHORTFORM_EXTRACTION_SCOPE, id, data);
        return data;
    }

    public List<Map<String, Object>> resolveCandidateClips(String extractionId, List<String> candidateIds) {
        Map<String, Object> extraction = repository.getKv(SHORTFORM_EXTRACTION_SCOPE, extractionId);
        if (extraction == null) {
            return List.of();
        }
        Object rawCandidates = extraction.get("candidates");
        if (!(rawCandidates instanceof List<?> list) || list.isEmpty()) {
            return List.of();
        }

        Set<String> selectedIds = candidateIds == null || candidateIds.isEmpty()
                ? null
                : new LinkedHashSet<>(candidateIds.stream().map(value -> value == null ? "" : value.trim()).filter(value -> !value.isBlank()).toList());
        List<Map<String, Object>> clips = new ArrayList<>();
        for (Object item : list) {
            if (!(item instanceof Map<?, ?> candidateMap)) {
                continue;
            }
            Map<String, Object> candidate = new HashMap<>();
            for (Map.Entry<?, ?> entry : candidateMap.entrySet()) {
                candidate.put(String.valueOf(entry.getKey()), entry.getValue());
            }
            String candidateId = String.valueOf(candidate.getOrDefault("id", "")).trim();
            if (candidateId.isBlank()) {
                continue;
            }
            boolean include = selectedIds == null
                    ? Boolean.TRUE.equals(candidate.get("is_selected")) || Boolean.TRUE.equals(candidate.get("selected"))
                    : selectedIds.contains(candidateId);
            if (!include) {
                continue;
            }
            long startMs = asLong(candidate.get("start_time_ms"), asLong(candidate.get("start_ms"), -1L));
            long endMs = asLong(candidate.get("end_time_ms"), asLong(candidate.get("end_ms"), -1L));
            String lectureId = String.valueOf(candidate.getOrDefault("lecture_id", "")).trim();
            if (lectureId.isBlank() || startMs < 0 || endMs <= startMs) {
                continue;
            }
            clips.add(Map.of(
                    "lecture_id", lectureId,
                    "start_ms", startMs,
                    "end_ms", endMs
            ));
        }
        return clips;
    }

    public Map<String, Object> selectShortformCandidates(String extractionId, List<String> candidateIds) {
        Map<String, Object> extraction = repository.getKv(SHORTFORM_EXTRACTION_SCOPE, extractionId);
        if (extraction == null) {
            return null;
        }
        Object rawCandidates = extraction.get("candidates");
        if (rawCandidates instanceof List<?> list) {
            List<Map<String, Object>> updated = new ArrayList<>();
            for (Object item : list) {
                if (item instanceof Map<?, ?> map) {
                    Map<String, Object> candidate = new HashMap<>();
                    for (Map.Entry<?, ?> entry : map.entrySet()) {
                        candidate.put(String.valueOf(entry.getKey()), entry.getValue());
                    }
                    String candidateId = String.valueOf(candidate.getOrDefault("id", ""));
                    candidate.put("selected", candidateIds.contains(candidateId));
                    updated.add(candidate);
                }
            }
            extraction.put("candidates", updated);
        }
        repository.upsertKv(SHORTFORM_EXTRACTION_SCOPE, extractionId, extraction);
        return extraction;
    }

    public Map<String, Object> getShortformExtraction(String id) {
        return repository.getKv(SHORTFORM_EXTRACTION_SCOPE, id);
    }

    public Map<String, Object> composeShortform(String userId, Map<String, Object> payload) {
        String id = UUID.randomUUID().toString();
        String courseId = String.valueOf(payload.getOrDefault("course_id", "")).trim();
        List<Map<String, Object>> normalizedClips = composeSupport.normalizeComposeClips(payload.get("clips"), courseId);
        Map<String, Object> exportPayload = composeSupport.buildShortformExportPayload(id, payload, courseId, normalizedClips);
        Map<String, Object> video = new HashMap<>();
        video.put("id", id);
        video.put("user_id", userId);
        video.put("title", payload.getOrDefault("title", "untitled"));
        video.put("description", payload.getOrDefault("description", ""));
        video.put("course_id", courseId);
        video.put("clips", normalizedClips);
        video.put("video_url", null);
        video.put("export_status", "PROCESSING");
        video.put("retry_count", 0);
        video.put("last_event_version", 0L);
        video.put("export_result_url", null);
        video.put("export_job_id", "job_" + id);
        video.put("export_job_payload", exportPayload);
        video.put("export_dispatch_todo", false);
        video.put("error_message", null);
        video.put("updated_at", Instant.now().toString());
        composeSupport.dispatchShortformExportJob(video);
        repository.upsertKv(SHORTFORM_VIDEO_SCOPE, id, video);
        repository.insertEvent(SHORTFORM_VIDEO_SCOPE + "_library", userId, id, video);
        repository.insertEvent(SHORTFORM_VIDEO_SCOPE + "_community", "all", id, video);
        if (activityEventService != null) {
            activityEventService.append(userId, "shortform_created", "shortform", id,
                    Map.of("course_id", String.valueOf(video.getOrDefault("course_id", ""))));
        }
        return video;
    }

    public Map<String, Object> shortformVideo(String id) {
        return repository.getKv(SHORTFORM_VIDEO_SCOPE, id);
    }

    public List<Map<String, Object>> shortformVideos(String userId) {
        return repository.listKvByScope(SHORTFORM_VIDEO_SCOPE).stream()
                .filter(video -> userId.equals(String.valueOf(video.getOrDefault("user_id", ""))))
                .toList();
    }

    public Map<String, Object> shareShortform(String userId, Map<String, Object> payload) {
        String videoId = String.valueOf(payload.getOrDefault("video_id", "")).trim();
        String courseId = String.valueOf(payload.getOrDefault("course_id", "")).trim();
        if (videoId.isEmpty() || courseId.isEmpty()) {
            return null;
        }
        Map<String, Object> video = shortformVideo(videoId);
        if (video == null) {
            return null;
        }
        Map<String, Object> row = new HashMap<>();
        row.put("id", UUID.randomUUID().toString());
        row.put("video_id", videoId);
        row.put("course_id", courseId);
        row.put("user_id", userId);
        row.put("visibility", payload.getOrDefault("visibility", "course"));
        row.put("message", payload.get("message"));
        row.put("created_at", Instant.now().toString());
        repository.insertEvent(SHORTFORM_SHARE_SCOPE, userId, String.valueOf(row.get("id")), row);
        if (activityEventService != null) {
            activityEventService.append(userId, "shortform_shared", "shortform", videoId, Map.of("course_id", courseId));
        }
        return row;
    }

    public Map<String, Object> saveShortform(String userId, Map<String, Object> payload) {
        String videoId = String.valueOf(payload.getOrDefault("video_id", "")).trim();
        if (videoId.isEmpty() || shortformVideo(videoId) == null) {
            return null;
        }
        String key = userId + ":" + videoId;
        Map<String, Object> row = new HashMap<>();
        row.put("id", key);
        row.put("user_id", userId);
        row.put("video_id", videoId);
        row.put("note", payload.get("note"));
        row.put("folder", payload.get("folder"));
        row.put("saved", true);
        row.put("updated_at", Instant.now().toString());
        repository.upsertKv(SHORTFORM_SAVE_SCOPE, key, row);
        if (activityEventService != null) {
            activityEventService.append(userId, "shortform_saved", "shortform", videoId,
                    Map.of("folder", String.valueOf(payload.getOrDefault("folder", ""))));
        }
        return row;
    }

    public Map<String, Object> toggleShortformLike(String userId, String videoId) {
        if (videoId == null || videoId.isBlank() || shortformVideo(videoId) == null) {
            return null;
        }
        String key = userId + ":" + videoId;
        Map<String, Object> current = repository.getKv(SHORTFORM_LIKE_SCOPE, key);
        boolean next = current == null || !Boolean.TRUE.equals(current.get("liked"));
        Map<String, Object> row = new HashMap<>();
        row.put("id", key);
        row.put("user_id", userId);
        row.put("video_id", videoId);
        row.put("liked", next);
        row.put("updated_at", Instant.now().toString());
        repository.upsertKv(SHORTFORM_LIKE_SCOPE, key, row);
        if (activityEventService != null) {
            activityEventService.append(userId, next ? "shortform_liked" : "shortform_unliked", "shortform", videoId, Map.of());
        }
        return row;
    }

    public Map<String, Object> retryShortformExport(String userId, String shortformId) {
        Map<String, Object> video = repository.getKv(SHORTFORM_VIDEO_SCOPE, shortformId);
        if (video == null) return null;
        if (!userId.equals(String.valueOf(video.getOrDefault("user_id", "")))) {
            return Map.of("error", "FORBIDDEN");
        }
        retryShortformExportInternal(video);
        repository.upsertKv(SHORTFORM_VIDEO_SCOPE, shortformId, video);
        return video;
    }

    public Map<String, Object> shortformExportStatus() {
        List<Map<String, Object>> videos = repository.listKvByScope(SHORTFORM_VIDEO_SCOPE);
        return statusSupport.shortformExportStatus(videos, staleProcessingThresholdMs, retrySupport);
    }

    public Map<String, Object> retryFailedShortformExports(boolean includePermanent, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        List<Map<String, Object>> videos = repository.listKvByScope(SHORTFORM_VIDEO_SCOPE);
        List<Map<String, Object>> targets = videos.stream()
                .filter(video -> {
                    String status = String.valueOf(video.getOrDefault("export_status", "")).toUpperCase();
                    return "FAILED".equals(status) || (includePermanent && "FAILED_PERMANENT".equals(status));
                })
                .sorted((left, right) -> String.valueOf(right.getOrDefault("updated_at", ""))
                        .compareTo(String.valueOf(left.getOrDefault("updated_at", ""))))
                .limit(safeLimit)
                .toList();

        int retried = 0;
        List<String> retriedIds = new ArrayList<>();
        for (Map<String, Object> video : targets) {
            Map<String, Object> updated = retryShortformExportInternal(video);
            repository.upsertKv(SHORTFORM_VIDEO_SCOPE, String.valueOf(updated.getOrDefault("id", "")), updated);
            if ("PROCESSING".equals(String.valueOf(updated.getOrDefault("export_status", "")))) {
                retried += 1;
                retriedIds.add(String.valueOf(updated.getOrDefault("id", "")));
            }
        }
        return Map.of(
                "retried_count", retried,
                "target_count", targets.size(),
                "retried_ids", retriedIds,
                "status", shortformExportStatus()
        );
    }

    public Map<String, Object> applyShortformExportCallback(String shortformId, String status, long eventVersion, String videoUrl, String errorMessage) {
        Map<String, Object> video = repository.getKv(SHORTFORM_VIDEO_SCOPE, shortformId);
        if (video == null) return null;
        retrySupport.applyExportCallback(video, status, eventVersion, videoUrl, errorMessage, shortformMaxRetry);
        repository.upsertKv(SHORTFORM_VIDEO_SCOPE, shortformId, video);
        return video;
    }

    private Map<String, Object> retryShortformExportInternal(Map<String, Object> video) {
        retrySupport.retryExport(video, shortformMaxRetry);
        if (!"PROCESSING".equals(String.valueOf(video.getOrDefault("export_status", "")))) {
            return video;
        }
        composeSupport.dispatchShortformExportJob(video);
        return video;
    }

    private List<Map<String, Object>> buildCandidates(String extractionId, String courseId, Object rawTranscriptSegmentsByLecture) {
        if (!(rawTranscriptSegmentsByLecture instanceof Map<?, ?> transcriptMap) || transcriptMap.isEmpty()) {
            return fallbackCandidates(extractionId, courseId);
        }

        List<Map<String, Object>> candidates = new ArrayList<>();
        int candidateIndex = 0;
        for (Map.Entry<?, ?> lectureEntry : transcriptMap.entrySet()) {
            String lectureId = String.valueOf(lectureEntry.getKey()).trim();
            if (lectureId.isBlank()) {
                continue;
            }
            LectureItem lecture = learningService.getLecture(lectureId);
            String lectureTitle = lecture != null && lecture.title() != null && !lecture.title().isBlank()
                    ? lecture.title()
                    : lectureId;
            String lectureCourseId = lecture != null && lecture.course_id() != null && !lecture.course_id().isBlank()
                    ? lecture.course_id()
                    : courseId;
            Object rawSegments = lectureEntry.getValue();
            if (!(rawSegments instanceof List<?> segments) || segments.isEmpty()) {
                continue;
            }
            for (Object rawSegment : segments) {
                if (!(rawSegment instanceof Map<?, ?> segmentMap)) {
                    continue;
                }
                long startMs = asLong(segmentMap.get("start_ms"), -1L);
                long endMs = asLong(segmentMap.get("end_ms"), -1L);
                Object rawText = segmentMap.containsKey("text") ? segmentMap.get("text") : "";
                String text = String.valueOf(rawText).trim();
                if (startMs < 0 || endMs <= startMs) {
                    continue;
                }
                candidateIndex += 1;
                candidates.add(buildCandidate(
                        extractionId,
                        lectureCourseId,
                        lectureId,
                        lectureTitle,
                        candidateIndex,
                        startMs,
                        endMs,
                        text,
                        candidateIndex == 1
                ));
            }
        }

        if (candidates.isEmpty()) {
            return fallbackCandidates(extractionId, courseId);
        }
        return candidates;
    }

    private List<Map<String, Object>> fallbackCandidates(String extractionId, String courseId) {
        List<LectureItem> lectures = learningService.getCourseLectures(courseId);
        if (lectures.isEmpty()) {
            return List.of();
        }
        List<Map<String, Object>> candidates = new ArrayList<>();
        int candidateIndex = 0;
        for (LectureItem lecture : lectures) {
            candidateIndex += 1;
            long startMs = 0L;
            long endMs = Math.max(60000L, (long) lecture.duration_minutes() * 1000L);
            candidates.add(buildCandidate(
                    extractionId,
                    courseId,
                    lecture.id(),
                    lecture.title(),
                    candidateIndex,
                    startMs,
                    endMs,
                    lecture.title(),
                    candidateIndex == 1
            ));
        }
        return candidates;
    }

    private Map<String, Object> buildCandidate(
            String extractionId,
            String courseId,
            String lectureId,
            String lectureTitle,
            int candidateIndex,
            long startMs,
            long endMs,
            String text,
            boolean selected
    ) {
        String normalizedText = text == null ? "" : text.trim();
        String description = normalizedText.isBlank()
                ? "핵심 구간"
                : (normalizedText.length() <= 80 ? normalizedText : normalizedText.substring(0, 77) + "...");
        Map<String, Object> candidate = new HashMap<>();
        candidate.put("id", "cand-" + candidateIndex);
        candidate.put("extraction_id", extractionId);
        candidate.put("lecture_id", lectureId);
        candidate.put("lecture_title", lectureTitle);
        candidate.put("course_id", courseId);
        candidate.put("start_time_ms", startMs);
        candidate.put("end_time_ms", endMs);
        candidate.put("label", lectureTitle + " 핵심 구간 " + candidateIndex);
        candidate.put("description", description);
        candidate.put("importance", Math.max(10, 100 - (candidateIndex - 1) * 10));
        candidate.put("order_index", candidateIndex - 1);
        candidate.put("is_selected", selected);
        candidate.put("selected", selected);
        return candidate;
    }

    private long asLong(Object value, long fallback) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        if (value == null) {
            return fallback;
        }
        try {
            return Long.parseLong(String.valueOf(value).trim());
        } catch (NumberFormatException ignored) {
            return fallback;
        }
    }
}
