package com.myway.backendspring.feature.understanding;

import com.myway.backendspring.domain.CourseCard;
import com.myway.backendspring.domain.DemoLearningService;
import com.myway.backendspring.domain.LectureItem;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class DefaultEntityExtractionService implements EntityExtractionService {
    private static final Pattern TIME_PATTERN = Pattern.compile("(\\d{1,2}:\\d{2})(?:\\s*[-~]\\s*(\\d{1,2}:\\d{2}))?");
    private static final Pattern DURATION_PATTERN = Pattern.compile("(\\d+)(초|분|시간)");
    private static final List<String> STOPWORDS = List.of("요약", "설명", "추천", "강의", "코스", "알려줘", "해주세요", "해줘", "무엇", "뭐", "왜", "어떻게");

    private final DemoLearningService learningService;

    public DefaultEntityExtractionService(DemoLearningService learningService) {
        this.learningService = learningService;
    }

    @Override
    public List<Map<String, Object>> extractFromText(UnderstandingContext context) {
        List<Map<String, Object>> entities = new ArrayList<>();
        if (!context.lectureId().isBlank()) {
            addEntity(entities, "lecture_id", context.lectureId(), 0.99, "metadata");
        }
        if (!context.courseId().isBlank()) {
            addEntity(entities, "course_id", context.courseId(), 0.99, "metadata");
        }
        extractLectureMatches(context, entities);
        extractCourseMatches(context, entities);
        extractTimeEntities(context, entities);
        extractTopicTerms(context, entities);
        extractActionTargets(context, entities);
        extractSpeaker(context, entities);
        return dedupe(entities);
    }

    @Override
    public List<Map<String, Object>> extractFromTranscript(UnderstandingContext context) {
        List<Map<String, Object>> entities = new ArrayList<>(extractFromText(context));
        extractSpeaker(context, entities);
        if (context.metadata().containsKey("speaker_segments")) {
            addEntity(entities, "speaker_segments", "present", 0.7, "transcript");
        }
        return dedupe(entities);
    }

    @Override
    public List<Map<String, Object>> extractFromChatMessage(UnderstandingContext context) {
        List<Map<String, Object>> entities = new ArrayList<>(extractFromText(context));
        extractTopicTerms(context, entities);
        return dedupe(entities);
    }

    private void extractLectureMatches(UnderstandingContext context, List<Map<String, Object>> entities) {
        String text = lower(context.normalizedText());
        for (LectureItem lecture : learningService.listAllLectures()) {
            String title = lower(lecture.title());
            if (title.isBlank() || !text.contains(title)) {
                continue;
            }
            addEntity(entities, "lecture_title", lecture.id(), 0.88, "catalog");
            addEntity(entities, "course_id", lecture.course_id(), 0.74, "catalog");
        }
    }

    private void extractCourseMatches(UnderstandingContext context, List<Map<String, Object>> entities) {
        String text = lower(context.normalizedText());
        for (CourseCard card : learningService.listCourseCards(context.userId().isBlank() ? "usr_std_001" : context.userId())) {
            String title = lower(card.title());
            if (!title.isBlank() && text.contains(title)) {
                addEntity(entities, "course_title", card.id(), 0.82, "catalog");
            }
        }
    }

    private void extractTimeEntities(UnderstandingContext context, List<Map<String, Object>> entities) {
        String text = context.normalizedText();
        Matcher timeMatcher = TIME_PATTERN.matcher(text);
        while (timeMatcher.find()) {
            addEntity(entities, "time_range", timeMatcher.group(), 0.86, "heuristic");
        }
        Matcher durationMatcher = DURATION_PATTERN.matcher(text);
        while (durationMatcher.find()) {
            addEntity(entities, "duration_hint", durationMatcher.group(), 0.72, "heuristic");
        }
    }

    private void extractTopicTerms(UnderstandingContext context, List<Map<String, Object>> entities) {
        Map<String, Integer> counts = new LinkedHashMap<>();
        for (String token : tokenize(context.normalizedText())) {
            if (STOPWORDS.contains(token)) {
                continue;
            }
            counts.put(token, counts.getOrDefault(token, 0) + 1);
        }
        counts.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(3)
                .forEach(entry -> addEntity(entities, "topic", entry.getKey(), 0.62, "heuristic"));
    }

    private void extractActionTargets(UnderstandingContext context, List<Map<String, Object>> entities) {
        String text = lower(context.normalizedText());
        if (text.contains("요약") || text.contains("정리") || text.contains("핵심")) {
            addEntity(entities, "action_target", "summary", 0.9, "heuristic");
        }
        if (text.contains("문제") || text.contains("퀴즈") || text.contains("시험")) {
            addEntity(entities, "action_target", "quiz", 0.9, "heuristic");
        }
        if (text.contains("추천") || text.contains("다음") || text.contains("어떤 강의")) {
            addEntity(entities, "action_target", "recommendation", 0.82, "heuristic");
        }
    }

    private void extractSpeaker(UnderstandingContext context, List<Map<String, Object>> entities) {
        Object speaker = context.metadata().get("speaker_label");
        if (speaker != null && !String.valueOf(speaker).isBlank()) {
            addEntity(entities, "speaker_label", String.valueOf(speaker), 0.9, "metadata");
        }
    }

    private void addEntity(List<Map<String, Object>> entities, String kind, String value, double confidence, String source) {
        if (value == null || value.isBlank()) {
            return;
        }
        entities.add(Map.of(
                "kind", kind,
                "value", value,
                "confidence", confidence,
                "source", source
        ));
    }

    private List<Map<String, Object>> dedupe(List<Map<String, Object>> entities) {
        Map<String, Map<String, Object>> deduped = new LinkedHashMap<>();
        for (Map<String, Object> entity : entities) {
            String key = String.valueOf(entity.getOrDefault("kind", "")) + ":" + String.valueOf(entity.getOrDefault("value", "")).toLowerCase(Locale.ROOT);
            deduped.putIfAbsent(key, new HashMap<>(entity));
        }
        return new ArrayList<>(deduped.values());
    }

    private List<String> tokenize(String text) {
        if (text == null || text.isBlank()) {
            return List.of();
        }
        return List.of(text.toLowerCase(Locale.ROOT).split("[^a-zA-Z0-9가-힣]+")).stream()
                .map(String::trim)
                .filter(token -> token.length() > 1)
                .toList();
    }

    private String lower(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT).trim();
    }
}
