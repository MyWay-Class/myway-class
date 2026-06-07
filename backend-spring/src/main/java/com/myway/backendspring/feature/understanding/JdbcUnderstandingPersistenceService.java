package com.myway.backendspring.feature.understanding;

import com.myway.backendspring.feature.repository.FeatureStoreRepository;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
public class JdbcUnderstandingPersistenceService implements UnderstandingPersistenceService {
    private static final String UNDERSTANDING_SCOPE = "ai_understanding";

    private final FeatureStoreRepository repository;

    public JdbcUnderstandingPersistenceService(FeatureStoreRepository repository) {
        this.repository = repository;
    }

    @Override
    public Map<String, Object> save(UnderstandingContext context, UnderstandingResult result) {
        String id = UUID.randomUUID().toString();
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", id);
        payload.put("user_id", context.userId());
        payload.put("lecture_id", result.lectureId());
        payload.put("course_id", result.courseId());
        payload.put("input_type", result.inputType());
        payload.put("normalized_text", context.normalizedText());
        payload.put("entities", result.entities());
        payload.put("intent", result.intent());
        payload.put("confidence", result.confidence());
        payload.put("route", result.route());
        payload.put("debug", result.debug());
        payload.put("created_at", Instant.now().toString());
        repository.upsertKv(UNDERSTANDING_SCOPE, id, payload);
        return payload;
    }

    @Override
    public Map<String, Object> loadById(String id) {
        if (id == null || id.isBlank()) {
            return Map.of();
        }
        Map<String, Object> found = repository.getKv(UNDERSTANDING_SCOPE, id.trim());
        return found == null ? Map.of() : found;
    }
}
