package com.myway.backendspring.feature.understanding;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class DefaultIntentRouterService implements IntentRouterService {
    @Override
    public String routeForIntent(String intent, UnderstandingContext context, List<Map<String, Object>> entities) {
        String normalized = intent == null ? "unknown" : intent.trim().toLowerCase();
        if ("summary".equals(normalized) || "quiz".equals(normalized)) {
            return normalized;
        }
        if ("recommendation".equals(normalized)) {
            return "recommendation";
        }
        if ("search".equals(normalized) || "answer".equals(normalized) || "lecture_followup".equals(normalized)) {
            return "rag";
        }
        if (!context.lectureId().isBlank() && "transcript".equals(context.sourceType())) {
            return "rag";
        }
        return "chat";
    }
}
