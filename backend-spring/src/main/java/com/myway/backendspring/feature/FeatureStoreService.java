package com.myway.backendspring.feature;

import com.myway.backendspring.persistence.FeatureJdbcStore;
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
    private static final String SHORTFORM_EXTRACTION_SCOPE = "shortform_extraction";
    private static final String SHORTFORM_VIDEO_SCOPE = "shortform_video";
    private static final String CUSTOM_COURSE_SCOPE = "custom_course";
    private static final int SHORTFORM_MAX_RETRY = 3;

    private final FeatureJdbcStore store;

    public FeatureStoreService(FeatureJdbcStore store) {
        this.store = store;
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
        return Map.of("lecture_id", lectureId, "asset_key", key, "video_url", "/api/v1/media/assets/" + key, "file_name", fileName);
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

    public List<Map<String, Object>> extractions(String lectureId) {
        return store.listEventsByOwner(EXTRACTION_SCOPE, lectureId);
    }

    public Map<String, Object> pipeline(String lectureId) {
        Map<String, Object> row = store.getKv(PIPELINE_SCOPE, lectureId);
        return row != null ? row : Map.of("lecture_id", lectureId, "status", "EMPTY");
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

    public Map<String, Object> retryShortformExport(String userId, String shortformId) {
        Map<String, Object> video = store.getKv(SHORTFORM_VIDEO_SCOPE, shortformId);
        if (video == null) {
            return null;
        }
        if (!userId.equals(String.valueOf(video.getOrDefault("user_id", "")))) {
            return Map.of("error", "FORBIDDEN");
        }

        int retryCount = asInt(video.get("retry_count"));
        if (retryCount >= SHORTFORM_MAX_RETRY) {
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
            if (retryCount >= SHORTFORM_MAX_RETRY) {
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
