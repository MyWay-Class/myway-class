package com.myway.backendspring.feature.understanding;

import java.util.List;
import java.util.Map;

public record UnderstandingResult(
        String inputType,
        String intent,
        double confidence,
        String route,
        String lectureId,
        String courseId,
        List<Map<String, Object>> entities,
        Map<String, Object> debug
) {
    public UnderstandingResult {
        inputType = inputType == null ? "unknown" : inputType.trim();
        intent = intent == null ? "unknown" : intent.trim();
        route = route == null ? "chat" : route.trim();
        lectureId = lectureId == null ? "" : lectureId.trim();
        courseId = courseId == null ? "" : courseId.trim();
        entities = entities == null ? List.of() : List.copyOf(entities);
        debug = debug == null ? Map.of() : Map.copyOf(debug);
    }
}
