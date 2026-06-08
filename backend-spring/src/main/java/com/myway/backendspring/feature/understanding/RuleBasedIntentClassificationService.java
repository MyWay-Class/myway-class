package com.myway.backendspring.feature.understanding;

import com.myway.backendspring.feature.FeatureStoreAiFacade;
import com.myway.backendspring.feature.ai.AiRuntimeService;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

@Component
public class RuleBasedIntentClassificationService implements IntentClassificationService {
    private final AiRuntimeService aiRuntimeService;
    private final FeatureStoreAiFacade featureStore;
    private final UnderstandingPromptService promptService;
    private final IntentRouterService routerService;

    public RuleBasedIntentClassificationService(
            AiRuntimeService aiRuntimeService,
            FeatureStoreAiFacade featureStore,
            UnderstandingPromptService promptService,
            IntentRouterService routerService
    ) {
        this.aiRuntimeService = aiRuntimeService;
        this.featureStore = featureStore;
        this.promptService = promptService;
        this.routerService = routerService;
    }

    @Override
    public UnderstandingResult classify(UnderstandingContext context, List<Map<String, Object>> entities) {
        return classifyWithContext(context, entities, Map.of());
    }

    @Override
    public UnderstandingResult classifyWithContext(UnderstandingContext context, List<Map<String, Object>> entities, Map<String, Object> hints) {
        String text = context.normalizedText().toLowerCase(Locale.ROOT);
        IntentScore score = inferByRule(text, context.sourceType(), entities);
        Map<String, Object> debug = new java.util.HashMap<>();
        debug.put("strategy", "rule-based");
        debug.put("source", context.sourceType());
        debug.put("rule_score", score.confidence);

        if (score.confidence < 0.68 && aiRuntimeService != null) {
            Map<String, Object> runtime = aiRuntimeService.generate(
                    "intent",
                    promptService.buildIntentPrompt(context, entities),
                    featureStore == null || context.userId().isBlank() ? Map.of() : featureStore.aiSettings(context.userId())
            );
            String runtimeText = String.valueOf(runtime.getOrDefault("text", ""));
            String runtimeIntent = inferIntentFromText(runtimeText);
            if (!"unknown".equals(runtimeIntent)) {
                score = new IntentScore(runtimeIntent, Math.max(score.confidence, 0.74));
            }
            debug.put("provider", runtime.getOrDefault("provider", "demo"));
            debug.put("model", runtime.getOrDefault("model", "demo-intent-v1"));
            debug.put("live", runtime.getOrDefault("live", false));
            debug.put("reason", runtime.getOrDefault("text", runtimeText));
        }

        debug.put("entities", entities.size());
        debug.put("hints", hints);
        String route = routerService.routeForIntent(score.intent, context, entities);
        return new UnderstandingResult(
                context.sourceType().isBlank() ? "unknown" : context.sourceType(),
                score.intent,
                Math.min(0.99, Math.max(0.0, score.confidence)),
                route,
                context.lectureId(),
                context.courseId(),
                entities == null ? List.of() : new ArrayList<>(entities),
                debug
        );
    }

    private IntentScore inferByRule(String text, String sourceType, List<Map<String, Object>> entities) {
        boolean hasSummary = containsAny(text, "요약", "정리", "핵심", "복습");
        boolean hasQuiz = containsAny(text, "문제", "퀴즈", "시험", "문항");
        boolean hasRecommend = containsAny(text, "추천", "다음", "무슨 강의", "어떤 강의");
        boolean hasSearch = containsAny(text, "찾", "검색", "어디", "무엇", "질문");
        boolean transcriptLike = "transcript".equalsIgnoreCase(sourceType);

        if (hasSummary) return new IntentScore("summary", 0.91);
        if (hasQuiz) return new IntentScore("quiz", 0.92);
        if (hasRecommend) return new IntentScore("recommendation", 0.86);
        if (hasSearch) return new IntentScore("answer", 0.75);
        if (transcriptLike) return new IntentScore("lecture_followup", 0.7);
        if (entities != null && entities.stream().anyMatch(entity -> Objects.equals("lecture_id", entity.get("kind")))) {
            return new IntentScore("answer", 0.7);
        }
        return new IntentScore("unknown", 0.5);
    }

    private String inferIntentFromText(String text) {
        String normalized = text == null ? "" : text.toLowerCase(Locale.ROOT);
        if (containsAny(normalized, "summary", "요약", "핵심")) return "summary";
        if (containsAny(normalized, "quiz", "문제", "퀴즈", "시험")) return "quiz";
        if (containsAny(normalized, "recommendation", "추천")) return "recommendation";
        if (containsAny(normalized, "answer", "search", "질문")) return "answer";
        if (containsAny(normalized, "followup", "후속")) return "lecture_followup";
        return "unknown";
    }

    private boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword.toLowerCase(Locale.ROOT))) {
                return true;
            }
        }
        return false;
    }

    private record IntentScore(String intent, double confidence) {}
}
