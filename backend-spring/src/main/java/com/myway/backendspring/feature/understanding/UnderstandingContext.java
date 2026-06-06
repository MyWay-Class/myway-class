package com.myway.backendspring.feature.understanding;

import java.util.Map;

public record UnderstandingContext(
        String userId,
        String lectureId,
        String courseId,
        String sourceType,
        String rawText,
        String normalizedText,
        Map<String, Object> metadata
) {
    public UnderstandingContext {
        userId = userId == null ? "" : userId.trim();
        lectureId = lectureId == null ? "" : lectureId.trim();
        courseId = courseId == null ? "" : courseId.trim();
        sourceType = sourceType == null ? "" : sourceType.trim();
        rawText = rawText == null ? "" : rawText;
        normalizedText = normalizedText == null ? "" : normalizedText;
        metadata = metadata == null ? Map.of() : Map.copyOf(metadata);
    }
}
