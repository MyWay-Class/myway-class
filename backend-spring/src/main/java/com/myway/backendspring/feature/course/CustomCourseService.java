package com.myway.backendspring.feature.course;

import com.myway.backendspring.domain.ActivityEventService;
import com.myway.backendspring.feature.repository.FeatureStoreRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class CustomCourseService {
    private static final String CUSTOM_COURSE_SCOPE = "custom_course";

    private final FeatureStoreRepository repository;
    private final ActivityEventService activityEventService;

    public CustomCourseService(FeatureStoreRepository repository, ActivityEventService activityEventService) {
        this.repository = repository;
        this.activityEventService = activityEventService;
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

        repository.upsertKv(CUSTOM_COURSE_SCOPE, id, cc);
        repository.insertEvent(CUSTOM_COURSE_SCOPE + "_my", userId, id, cc);
        repository.insertEvent(CUSTOM_COURSE_SCOPE + "_community", "all", id, cc);
        if (activityEventService != null) {
            activityEventService.append(
                    userId,
                    "custom_course_created",
                    "custom_course",
                    id,
                    Map.of("course_id", String.valueOf(cc.getOrDefault("course_id", "")))
            );
        }
        return cc;
    }

    public List<Map<String, Object>> myCustomCourses(String userId) {
        return repository.listEventsByOwner(CUSTOM_COURSE_SCOPE + "_my", userId);
    }

    public Map<String, Object> customCourse(String id) {
        return repository.getKv(CUSTOM_COURSE_SCOPE, id);
    }

    public List<Map<String, Object>> communityCustomCourses(String courseId) {
        return repository.listEventsByScope(CUSTOM_COURSE_SCOPE + "_community");
    }
}
