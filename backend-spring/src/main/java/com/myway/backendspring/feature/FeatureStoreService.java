package com.myway.backendspring.feature;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class FeatureStoreService {
    private final Map<String, Object> aiSettings = new ConcurrentHashMap<>();
    private final Map<String, Map<String, Object>> transcriptsByLecture = new ConcurrentHashMap<>();
    private final Map<String, List<Map<String, Object>>> extractionsByLecture = new ConcurrentHashMap<>();
    private final Map<String, Map<String, Object>> pipelineByLecture = new ConcurrentHashMap<>();

    private final Map<String, Map<String, Object>> shortformExtractions = new ConcurrentHashMap<>();
    private final Map<String, Map<String, Object>> shortformVideos = new ConcurrentHashMap<>();
    private final Map<String, List<Map<String, Object>>> shortformLibraryByUser = new ConcurrentHashMap<>();
    private final List<Map<String, Object>> shortformCommunity = Collections.synchronizedList(new ArrayList<>());

    private final Map<String, Map<String, Object>> customCourses = new ConcurrentHashMap<>();
    private final Map<String, List<String>> customCourseIdsByUser = new ConcurrentHashMap<>();

    public FeatureStoreService() {
        aiSettings.put("daily_limit", 100);
        aiSettings.put("provider", "demo");
        aiSettings.put("model", "demo-v1");
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
        return aiSettings;
    }

    public Map<String, Object> updateAiSettings(Map<String, Object> patch) {
        if (patch != null) aiSettings.putAll(patch);
        return aiSettings;
    }

    public Map<String, Object> aiProviders() {
        return Map.of("providers", List.of("demo", "ollama", "gemini"), "current", aiSettings.getOrDefault("provider", "demo"));
    }

    public Map<String, Object> mediaUpload(String lectureId, String fileName) {
        String key = "asset/" + lectureId + "/" + UUID.randomUUID();
        return Map.of("lecture_id", lectureId, "asset_key", key, "video_url", "/api/v1/media/assets/" + key, "file_name", fileName);
    }

    public Map<String, Object> createExtraction(String lectureId) {
        Map<String, Object> item = new HashMap<>();
        item.put("id", UUID.randomUUID().toString());
        item.put("lecture_id", lectureId);
        item.put("status", "COMPLETED");
        item.put("created_at", Instant.now().toString());
        extractionsByLecture.computeIfAbsent(lectureId, k -> Collections.synchronizedList(new ArrayList<>())).add(item);

        transcriptsByLecture.put(lectureId, Map.of(
                "lecture_id", lectureId,
                "segments", List.of(Map.of("start_ms", 0, "end_ms", 10000, "text", "자동 생성된 샘플 트랜스크립트")),
                "updated_at", Instant.now().toString()
        ));
        pipelineByLecture.put(lectureId, Map.of("lecture_id", lectureId, "status", "READY", "updated_at", Instant.now().toString()));

        return item;
    }

    public Map<String, Object> transcript(String lectureId) {
        return transcriptsByLecture.getOrDefault(lectureId, null);
    }

    public List<Map<String, Object>> extractions(String lectureId) {
        return extractionsByLecture.getOrDefault(lectureId, List.of());
    }

    public Map<String, Object> pipeline(String lectureId) {
        return pipelineByLecture.getOrDefault(lectureId, Map.of("lecture_id", lectureId, "status", "EMPTY"));
    }

    public Map<String, Object> createShortformExtraction(String userId, Map<String, Object> payload) {
        String id = UUID.randomUUID().toString();
        Map<String, Object> data = new HashMap<>();
        data.put("id", id);
        data.put("user_id", userId);
        data.put("course_id", payload.getOrDefault("course_id", "crs_java_01"));
        data.put("mode", payload.getOrDefault("mode", "cross"));
        data.put("candidates", List.of(Map.of("id", "cand-1", "selected", true), Map.of("id", "cand-2", "selected", false)));
        shortformExtractions.put(id, data);
        return data;
    }

    public Map<String, Object> getShortformExtraction(String id) {
        return shortformExtractions.get(id);
    }

    public Map<String, Object> composeShortform(String userId, Map<String, Object> payload) {
        String id = UUID.randomUUID().toString();
        Map<String, Object> video = new HashMap<>();
        video.put("id", id);
        video.put("user_id", userId);
        video.put("title", payload.getOrDefault("title", "untitled"));
        video.put("description", payload.getOrDefault("description", ""));
        video.put("export_status", "COMPLETED");
        video.put("video_url", "https://example.com/shortform/" + id + ".mp4");
        shortformVideos.put(id, video);
        shortformLibraryByUser.computeIfAbsent(userId, k -> Collections.synchronizedList(new ArrayList<>())).add(video);
        shortformCommunity.add(video);
        return video;
    }

    public Map<String, Object> shortformVideo(String id) {
        return shortformVideos.get(id);
    }

    public List<Map<String, Object>> shortformLibrary(String userId) {
        return shortformLibraryByUser.getOrDefault(userId, List.of());
    }

    public List<Map<String, Object>> shortformCommunity(String courseId) {
        return shortformCommunity;
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
        customCourses.put(id, cc);
        customCourseIdsByUser.computeIfAbsent(userId, k -> Collections.synchronizedList(new ArrayList<>())).add(id);
        return cc;
    }

    public List<Map<String, Object>> myCustomCourses(String userId) {
        List<String> ids = customCourseIdsByUser.getOrDefault(userId, List.of());
        List<Map<String, Object>> out = new ArrayList<>();
        for (String id : ids) {
            Map<String, Object> row = customCourses.get(id);
            if (row != null) out.add(row);
        }
        return out;
    }

    public Map<String, Object> customCourse(String id) {
        return customCourses.get(id);
    }

    public List<Map<String, Object>> communityCustomCourses(String courseId) {
        return new ArrayList<>(customCourses.values());
    }
}
