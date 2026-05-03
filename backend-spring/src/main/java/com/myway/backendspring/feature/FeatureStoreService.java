package com.myway.backendspring.feature;

import com.myway.backendspring.persistence.FeatureJdbcStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class FeatureStoreService {
    private static final String AI_SETTINGS_SCOPE = "ai_settings";
    private static final String AI_SETTINGS_ID = "global";
    private static final String TRANSCRIPT_SCOPE = "media_transcript";
    private static final String EXTRACTION_SCOPE = "media_extraction";
    private static final String PIPELINE_SCOPE = "media_pipeline";
    private static final String MEDIA_NOTE_SCOPE = "media_note";
    private static final String MEDIA_ASSET_SCOPE = "media_asset";
    private static final String SHORTFORM_EXTRACTION_SCOPE = "shortform_extraction";
    private static final String SHORTFORM_VIDEO_SCOPE = "shortform_video";
    private static final String SHORTFORM_SAVE_SCOPE = "shortform_save";
    private static final String SHORTFORM_SHARE_SCOPE = "shortform_share";
    private static final String SHORTFORM_LIKE_SCOPE = "shortform_like";
    private static final String CUSTOM_COURSE_SCOPE = "custom_course";
    private final FeatureJdbcStore store;
    private final int shortformMaxRetry;

    public FeatureStoreService(
            FeatureJdbcStore store,
            @Value("${myway.shortform.retry.max-attempts:3}") int shortformMaxRetry
    ) {
        this.store = store;
        this.shortformMaxRetry = Math.max(1, shortformMaxRetry);
        ensureDefaults();
    }

    private void ensureDefaults() {
        Map<String, Object> settings = store.getKv(AI_SETTINGS_SCOPE, AI_SETTINGS_ID);
        if (settings == null) {
            store.upsertKv(AI_SETTINGS_SCOPE, AI_SETTINGS_ID, new HashMap<>(Map.of(
                    "daily_limit", 100,
                    "provider", "demo",
                    "model", "demo-v1"
            )));
            return;
        }

        boolean changed = false;
        if (!settings.containsKey("daily_limit")) {
            settings.put("daily_limit", 100);
            changed = true;
        }
        if (!settings.containsKey("provider")) {
            settings.put("provider", "demo");
            changed = true;
        }
        if (!settings.containsKey("model")) {
            settings.put("model", "demo-v1");
            changed = true;
        }
        if (changed) {
            store.upsertKv(AI_SETTINGS_SCOPE, AI_SETTINGS_ID, settings);
        }
    }

    public Map<String, Object> aiInsights() {
        return Map.of("total_requests", 0, "success_rate", 1.0, "last_updated", Instant.now().toString());
    }

    public Map<String, Object> aiLogs() {
        return Map.of("items", List.of(), "count", 0);
    }

    public Map<String, Object> aiRecommendations() {
        return Map.of("items", List.of(), "count", 0);
    }

    public Map<String, Object> aiSettings() {
        Map<String, Object> settings = store.getKv(AI_SETTINGS_SCOPE, AI_SETTINGS_ID);
        return settings != null ? settings : Map.of();
    }

    public Map<String, Object> updateAiSettings(Map<String, Object> patch) {
        Map<String, Object> settings = new HashMap<>(aiSettings());
        if (patch != null) {
            settings.putAll(patch);
        }
        store.upsertKv(AI_SETTINGS_SCOPE, AI_SETTINGS_ID, settings);
        return settings;
    }

    public Map<String, Object> aiProviders() {
        return Map.of("providers", List.of("demo", "ollama", "gemini"), "current", aiSettings().getOrDefault("provider", "demo"));
    }

    public Map<String, Object> mediaUpload(String lectureId, String fileName) {
        String key = "asset/" + lectureId + "/" + UUID.randomUUID();
        Map<String, Object> payload = Map.of("lecture_id", lectureId, "asset_key", key, "video_url", "/api/v1/media/assets/" + key, "file_name", fileName);
        store.upsertKv(MEDIA_ASSET_SCOPE, key, payload);
        return payload;
    }

    public Map<String, Object> createExtraction(String lectureId) {
        String id = UUID.randomUUID().toString();
        Map<String, Object> item = new HashMap<>();
        item.put("id", id);
        item.put("lecture_id", lectureId);
        item.put("status", "COMPLETED");
        item.put("created_at", Instant.now().toString());

        store.insertEvent(EXTRACTION_SCOPE, lectureId, id, item);

        Map<String, Object> transcript = Map.of(
                "lecture_id", lectureId,
                "segments", List.of(Map.of("start_ms", 0, "end_ms", 10000, "text", "자동 생성된 샘플 트랜스크립트")),
                "updated_at", Instant.now().toString()
        );
        store.upsertKv(TRANSCRIPT_SCOPE, lectureId, transcript);
        store.upsertKv(PIPELINE_SCOPE, lectureId, Map.of("lecture_id", lectureId, "status", "READY", "updated_at", Instant.now().toString()));

        return item;
    }

    public Map<String, Object> transcript(String lectureId) {
        return store.getKv(TRANSCRIPT_SCOPE, lectureId);
    }

    public Map<String, Object> transcribe(String lectureId, String language) {
        Map<String, Object> extraction = createExtraction(lectureId);
        Map<String, Object> transcript = transcript(lectureId);
        int segmentCount = 0;
        if (transcript != null && transcript.get("segments") instanceof List<?> segments) {
            segmentCount = segments.size();
        }

        return Map.of(
                "transcript_id", extraction.getOrDefault("id", UUID.randomUUID().toString()),
                "lecture_id", lectureId,
                "segment_count", segmentCount,
                "duration_ms", 120000,
                "word_count", 80,
                "stt_provider", "demo-stt",
                "stt_model", "demo-stt-v1",
                "pipeline", pipeline(lectureId),
                "language", language == null || language.isBlank() ? "ko" : language
        );
    }

    public List<Map<String, Object>> extractions(String lectureId) {
        return store.listEventsByOwner(EXTRACTION_SCOPE, lectureId);
    }

    public Map<String, Object> completeExtractionCallback(String extractionId, String status, String errorMessage) {
        Map<String, Object> extraction = null;
        for (Map<String, Object> row : store.listEventsByScope(EXTRACTION_SCOPE)) {
            if (extractionId.equals(String.valueOf(row.getOrDefault("id", "")))) {
                extraction = new HashMap<>(row);
                break;
            }
        }
        if (extraction == null) {
            return null;
        }

        extraction.put("status", status == null || status.isBlank() ? "COMPLETED" : status.toUpperCase());
        extraction.put("error_message", errorMessage);
        extraction.put("updated_at", Instant.now().toString());
        store.upsertKv(EXTRACTION_SCOPE, extractionId, extraction);
        return extraction;
    }

    public Map<String, Object> pipeline(String lectureId) {
        Map<String, Object> row = store.getKv(PIPELINE_SCOPE, lectureId);
        return row != null ? row : Map.of("lecture_id", lectureId, "status", "EMPTY");
    }

    public Map<String, Object> summarizeLecture(String lectureId, String style, String language) {
        Map<String, Object> note = new HashMap<>();
        note.put("id", UUID.randomUUID().toString());
        note.put("lecture_id", lectureId);
        note.put("title", "자동 요약 노트");
        note.put("content", "Spring 백엔드에서 생성한 요약입니다.");
        note.put("key_concepts", List.of("핵심 개념", "핵심 정리"));
        note.put("keywords", List.of("spring", "summary"));
        note.put("timestamps", List.of(Map.of("start_ms", 0, "end_ms", 30000, "label", "인트로")));
        note.put("style", style == null || style.isBlank() ? "brief" : style);
        note.put("language", language == null || language.isBlank() ? "ko" : language);
        note.put("created_at", Instant.now().toString());
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
        String id = UUID.randomUUID().toString();
        Map<String, Object> data = new HashMap<>();
        data.put("id", id);
        data.put("user_id", userId);
        data.put("course_id", payload.getOrDefault("course_id", "crs_java_01"));
        data.put("mode", payload.getOrDefault("mode", "cross"));
        data.put("candidates", List.of(Map.of("id", "cand-1", "selected", true), Map.of("id", "cand-2", "selected", false)));

        store.upsertKv(SHORTFORM_EXTRACTION_SCOPE, id, data);
        return data;
    }

    public Map<String, Object> getShortformExtraction(String id) {
        return store.getKv(SHORTFORM_EXTRACTION_SCOPE, id);
    }

    public Map<String, Object> selectShortformCandidates(String extractionId, List<String> candidateIds) {
        Map<String, Object> extraction = store.getKv(SHORTFORM_EXTRACTION_SCOPE, extractionId);
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

        store.upsertKv(SHORTFORM_EXTRACTION_SCOPE, extractionId, extraction);
        return extraction;
    }

    public Map<String, Object> composeShortform(String userId, Map<String, Object> payload) {
        String id = UUID.randomUUID().toString();
        Map<String, Object> video = new HashMap<>();
        video.put("id", id);
        video.put("user_id", userId);
        video.put("title", payload.getOrDefault("title", "untitled"));
        video.put("description", payload.getOrDefault("description", ""));
        video.put("video_url", "https://example.com/shortform/" + id + ".mp4");
        video.put("export_status", "COMPLETED");
        video.put("retry_count", 0);
        video.put("last_event_version", 0L);
        video.put("export_result_url", video.get("video_url"));
        video.put("error_message", null);
        video.put("updated_at", Instant.now().toString());

        store.upsertKv(SHORTFORM_VIDEO_SCOPE, id, video);
        store.insertEvent(SHORTFORM_VIDEO_SCOPE + "_library", userId, id, video);
        store.insertEvent(SHORTFORM_VIDEO_SCOPE + "_community", "all", id, video);
        return video;
    }

    public Map<String, Object> shortformVideo(String id) {
        return store.getKv(SHORTFORM_VIDEO_SCOPE, id);
    }

    public List<Map<String, Object>> shortformVideos(String userId) {
        return store.listKvByScope(SHORTFORM_VIDEO_SCOPE).stream()
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
        store.insertEvent(SHORTFORM_SHARE_SCOPE, userId, String.valueOf(row.get("id")), row);
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
        store.upsertKv(SHORTFORM_SAVE_SCOPE, key, row);
        return row;
    }

    public Map<String, Object> toggleShortformLike(String userId, String videoId) {
        if (videoId == null || videoId.isBlank() || shortformVideo(videoId) == null) {
            return null;
        }
        String key = userId + ":" + videoId;
        Map<String, Object> current = store.getKv(SHORTFORM_LIKE_SCOPE, key);
        boolean next = current == null || !Boolean.TRUE.equals(current.get("liked"));
        Map<String, Object> row = new HashMap<>();
        row.put("id", key);
        row.put("user_id", userId);
        row.put("video_id", videoId);
        row.put("liked", next);
        row.put("updated_at", Instant.now().toString());
        store.upsertKv(SHORTFORM_LIKE_SCOPE, key, row);
        return row;
    }

    public Map<String, Object> retryShortformExport(String userId, String shortformId) {
        Map<String, Object> video = store.getKv(SHORTFORM_VIDEO_SCOPE, shortformId);
        if (video == null) {
            return null;
        }
        if (!userId.equals(String.valueOf(video.getOrDefault("user_id", "")))) {
            return Map.of("error", "FORBIDDEN");
        }

        int retryCount = asInt(video.get("retry_count"));
        if (retryCount >= shortformMaxRetry) {
            video.put("export_status", "FAILED_PERMANENT");
            video.put("updated_at", Instant.now().toString());
            store.upsertKv(SHORTFORM_VIDEO_SCOPE, shortformId, video);
            return video;
        }

        video.put("retry_count", retryCount + 1);
        video.put("export_status", "PROCESSING");
        video.put("error_message", null);
        video.put("updated_at", Instant.now().toString());
        store.upsertKv(SHORTFORM_VIDEO_SCOPE, shortformId, video);
        return video;
    }

    public Map<String, Object> applyShortformExportCallback(String shortformId, String status, long eventVersion, String videoUrl, String errorMessage) {
        Map<String, Object> video = store.getKv(SHORTFORM_VIDEO_SCOPE, shortformId);
        if (video == null) {
            return null;
        }

        long currentVersion = asLong(video.get("last_event_version"));
        if (eventVersion <= currentVersion) {
            video.put("callback_ignored", true);
            return video;
        }

        video.put("last_event_version", eventVersion);
        video.put("updated_at", Instant.now().toString());

        if ("FAILED".equalsIgnoreCase(status)) {
            int retryCount = asInt(video.get("retry_count"));
            if (retryCount >= shortformMaxRetry) {
                video.put("export_status", "FAILED_PERMANENT");
            } else {
                video.put("export_status", "FAILED");
            }
            video.put("error_message", errorMessage != null ? errorMessage : "export callback failure");
        } else {
            video.put("export_status", "COMPLETED");
            if (videoUrl != null && !videoUrl.isBlank()) {
                video.put("video_url", videoUrl);
                video.put("export_result_url", videoUrl);
            }
            video.put("error_message", null);
        }

        store.upsertKv(SHORTFORM_VIDEO_SCOPE, shortformId, video);
        return video;
    }

    public List<Map<String, Object>> shortformLibrary(String userId) {
        return store.listEventsByOwner(SHORTFORM_VIDEO_SCOPE + "_library", userId);
    }

    public List<Map<String, Object>> shortformCommunity(String courseId) {
        return store.listEventsByScope(SHORTFORM_VIDEO_SCOPE + "_community");
    }

    public Map<String, Object> customCompose(String userId, Map<String, Object> payload) {
        String id = UUID.randomUUID().toString();
        Map<String, Object> cc = new HashMap<>();
        cc.put("id", id);
        cc.put("owner_id", userId);
        cc.put("course_id", payload.getOrDefault("course_id", "crs_java_01"));
        cc.put("title", payload.getOrDefault("title", "커스텀 강의"));
        cc.put("description", payload.getOrDefault("description", ""));
        cc.put("clips", payload.getOrDefault("clips", List.of()));
        cc.put("shares", new ArrayList<>());

        store.upsertKv(CUSTOM_COURSE_SCOPE, id, cc);
        store.insertEvent(CUSTOM_COURSE_SCOPE + "_my", userId, id, cc);
        store.insertEvent(CUSTOM_COURSE_SCOPE + "_community", "all", id, cc);
        return cc;
    }

    public List<Map<String, Object>> myCustomCourses(String userId) {
        return store.listEventsByOwner(CUSTOM_COURSE_SCOPE + "_my", userId);
    }

    public Map<String, Object> customCourse(String id) {
        return store.getKv(CUSTOM_COURSE_SCOPE, id);
    }

    public List<Map<String, Object>> communityCustomCourses(String courseId) {
        return store.listEventsByScope(CUSTOM_COURSE_SCOPE + "_community");
    }

    private int asInt(Object value) {
        if (value == null) {
            return 0;
        }
        if (value instanceof Number n) {
            return n.intValue();
        }
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (Exception ignored) {
            return 0;
        }
    }

    private long asLong(Object value) {
        if (value == null) {
            return 0L;
        }
        if (value instanceof Number n) {
            return n.longValue();
        }
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (Exception ignored) {
            return 0L;
        }
    }
}
