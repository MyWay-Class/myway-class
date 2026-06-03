package com.myway.backendspring.feature.understanding;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class DefaultInputUnderstandingService implements InputUnderstandingService {
    private final EntityExtractionService entityExtractionService;
    private final IntentClassificationService intentClassificationService;
    private final UnderstandingPersistenceService persistenceService;

    public DefaultInputUnderstandingService(
            EntityExtractionService entityExtractionService,
            IntentClassificationService intentClassificationService,
            UnderstandingPersistenceService persistenceService
    ) {
        this.entityExtractionService = entityExtractionService;
        this.intentClassificationService = intentClassificationService;
        this.persistenceService = persistenceService;
    }

    @Override
    public UnderstandingResult understand(UnderstandingContext context) {
        String normalized = normalize(context.normalizedText(), context.rawText());
        UnderstandingContext normalizedContext = new UnderstandingContext(
                context.userId(),
                context.lectureId(),
                context.courseId(),
                context.sourceType(),
                context.rawText(),
                normalized,
                context.metadata()
        );
        List<Map<String, Object>> entities = extract(normalizedContext);
        UnderstandingResult classified = intentClassificationService.classify(normalizedContext, entities);
        Map<String, Object> saved = persistenceService.save(normalizedContext, classified);
        Map<String, Object> debug = new HashMap<>(classified.debug());
        debug.put("understanding_id", saved.get("id"));
        debug.put("entity_count", entities.size());
        return new UnderstandingResult(
                classified.inputType(),
                classified.intent(),
                classified.confidence(),
                classified.route(),
                classified.lectureId(),
                classified.courseId(),
                classified.entities(),
                debug
        );
    }

    @Override
    public UnderstandingResult understandTranscript(String lectureId, String transcriptText, Map<String, Object> metadata) {
        UnderstandingContext context = new UnderstandingContext(
                "",
                lectureId,
                metadata == null ? "" : String.valueOf(metadata.getOrDefault("course_id", "")).trim(),
                "transcript",
                transcriptText,
                normalize(transcriptText, transcriptText),
                metadata
        );
        return understand(context);
    }

    @Override
    public UnderstandingResult understandMessage(String userId, String message, String lectureId, String courseId) {
        UnderstandingContext context = new UnderstandingContext(
                userId,
                lectureId,
                courseId,
                "chat",
                message,
                normalize(message, message),
                Map.of("source", "chat")
        );
        return understand(context);
    }

    private List<Map<String, Object>> extract(UnderstandingContext context) {
        if ("transcript".equalsIgnoreCase(context.sourceType())) {
            return entityExtractionService.extractFromTranscript(context);
        }
        if ("chat".equalsIgnoreCase(context.sourceType())) {
            return entityExtractionService.extractFromChatMessage(context);
        }
        return entityExtractionService.extractFromText(context);
    }

    private String normalize(String normalized, String fallback) {
        String value = normalized == null || normalized.isBlank() ? fallback : normalized;
        return value == null ? "" : value.replaceAll("\\s+", " ").trim();
    }
}
