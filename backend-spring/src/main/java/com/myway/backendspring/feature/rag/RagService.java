package com.myway.backendspring.feature.rag;

import com.myway.backendspring.domain.DemoLearningService;
import com.myway.backendspring.domain.LectureItem;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RagService {
    private final DemoLearningService learningService;
    private final RagRetriever retriever;
    private final RagReranker reranker;
    private final RagAnswerGenerator answerGenerator;
    private final RagIndexRepository ragIndexRepository;

    public RagService(
            DemoLearningService learningService,
            RagRetriever retriever,
            RagReranker reranker,
            RagAnswerGenerator answerGenerator,
            RagIndexRepository ragIndexRepository
    ) {
        this.learningService = learningService;
        this.retriever = retriever;
        this.reranker = reranker;
        this.answerGenerator = answerGenerator;
        this.ragIndexRepository = ragIndexRepository;
    }

    public Map<String, Object> ragOverview(
            String query,
            String lectureId,
            String courseId,
            Integer limit,
            Double minScore,
            boolean includeDebug
    ) {
        int resolvedLimit = Math.max(1, Math.min(6, limit == null ? 4 : limit));
        String normalizedQuery = normalizeText(query);
        List<String> targetLectureIds = targetLectureIds(lectureId, courseId);
        double threshold = minScore == null ? 0.0 : Math.max(0.0, Math.min(1.0, minScore));

        List<Map<String, Object>> retrieved = retriever.retrieve(normalizedQuery, targetLectureIds, threshold);
        List<Map<String, Object>> rankedChunks = ensureChunkTimestamps(reranker.rerank(retrieved, resolvedLimit));

        List<Map<String, Object>> entities = new ArrayList<>();
        if (lectureId != null && !lectureId.isBlank()) {
            entities.add(Map.of("kind", "lecture_id", "label", "강의", "value", lectureId));
        }
        if (courseId != null && !courseId.isBlank()) {
            entities.add(Map.of("kind", "course_id", "label", "코스", "value", courseId));
        }

        String intent = inferIntent(normalizedQuery);
        String answerText = answerGenerator.generate(normalizedQuery, rankedChunks);
        String searchProvider = "spring-rag-keyword";
        Map<String, Object> intentPayload = Map.of(
                "intent", intent,
                "confidence", rankedChunks.isEmpty() ? 0.62 : 0.84,
                "action", "answer_with_references",
                "reason", "Spring RAG keyword scoring"
        );

        Map<String, Object> answerPayload = new HashMap<>();
        answerPayload.put("question", normalizedQuery);
        answerPayload.put("lecture_id", lectureId);
        answerPayload.put("intent", intentPayload);
        answerPayload.put("answer", answerText);
        answerPayload.put("references", rankedChunks);
        answerPayload.put("suggestions", List.of("핵심 개념 요약", "시험 대비 문제", "이전 강의와 연결", "숏폼으로 복습"));

        Map<String, Object> payload = new HashMap<>();
        payload.put("query", normalizedQuery);
        payload.put("lecture_id", lectureId);
        payload.put("course_id", courseId);
        payload.put("intent", intentPayload);
        payload.put("entities", entities);
        payload.put("chunks", rankedChunks);
        Map<String, Object> searchPayload = new HashMap<>();
        searchPayload.put("query", normalizedQuery);
        searchPayload.put("lecture_id", lectureId);
        searchPayload.put("hits", rankedChunks);
        payload.put("search", searchPayload);
        payload.put("answer", answerText);
        payload.put("answer_payload", answerPayload);
        payload.put("provider", Map.of("search_provider", searchProvider, "answer_provider", "spring-rag-generator"));
        payload.put("limit", resolvedLimit);
        payload.put("min_score", threshold);
        if (includeDebug) {
            double avgSimilarity = rankedChunks.stream().mapToDouble(item -> asDouble(item.get("similarity"))).average().orElse(0.0);
            payload.put("debug", Map.of(
                    "query_tokens", tokenize(normalizedQuery),
                    "corpus_size", retrieved.size(),
                    "filtered_count", rankedChunks.size(),
                    "avg_similarity", Math.round(avgSimilarity * 1000.0) / 1000.0
            ));
        }
        return payload;
    }

    public Map<String, Object> ragIndexOverview(String lectureId, String courseId) {
        List<String> lectureIds = targetLectureIds(lectureId, courseId);
        List<Map<String, Object>> chunks = retriever.retrieve("", lectureIds, 0.0);
        Set<String> indexedLectures = chunks.stream()
                .map(chunk -> String.valueOf(chunk.getOrDefault("lecture_id", "")))
                .filter(id -> !id.isBlank())
                .collect(Collectors.toCollection(LinkedHashSet::new));
        return Map.of(
                "scope", "rag_chunk_index",
                "lecture_ids", indexedLectures,
                "chunk_count", chunks.size(),
                "indexed_at", Instant.now().toString()
        );
    }

    public Map<String, Object> rebuildRagIndex(String lectureId, String courseId) {
        List<String> lectureIds = targetLectureIds(lectureId, courseId);
        List<Map<String, Object>> chunks = retriever.retrieve("", lectureIds, 0.0);
        String key = ragIndexKey(lectureId, courseId);
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", key);
        payload.put("lecture_id", lectureId);
        payload.put("course_id", courseId);
        payload.put("chunk_count", chunks.size());
        payload.put("chunks", chunks);
        payload.put("updated_at", Instant.now().toString());
        ragIndexRepository.upsertIndex(key, payload);
        return Map.of("index_id", key, "chunk_count", chunks.size(), "updated_at", payload.get("updated_at"));
    }

    public Map<String, Object> clearRagIndex(String lectureId, String courseId) {
        String key = ragIndexKey(lectureId, courseId);
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", key);
        payload.put("lecture_id", lectureId);
        payload.put("course_id", courseId);
        payload.put("chunk_count", 0);
        payload.put("chunks", List.of());
        payload.put("updated_at", Instant.now().toString());
        payload.put("cleared", true);
        ragIndexRepository.upsertIndex(key, payload);
        return Map.of("index_id", key, "cleared", true, "updated_at", payload.get("updated_at"));
    }

    public Map<String, Object> evaluateBatch(List<Map<String, Object>> cases, Integer topK) {
        int k = Math.max(1, Math.min(10, topK == null ? 4 : topK));
        List<Map<String, Object>> evalCases = (cases == null || cases.isEmpty()) ? defaultEvalCases() : cases;
        List<Map<String, Object>> items = new ArrayList<>();
        int hitCount = 0;
        double groundednessSum = 0.0;

        for (Map<String, Object> item : evalCases) {
            String query = normalizeText(String.valueOf(item.getOrDefault("query", "")));
            String lectureId = normalizeText(String.valueOf(item.getOrDefault("lecture_id", "")));
            String expected = normalizeText(String.valueOf(item.getOrDefault("expected", ""))).toLowerCase();
            if (query.isBlank() || lectureId.isBlank()) {
                continue;
            }
            List<Map<String, Object>> retrieved = retriever.retrieve(query, List.of(lectureId), 0.0);
            List<Map<String, Object>> ranked = reranker.rerank(retrieved, k);
            boolean hit = expected.isBlank() || ranked.stream().anyMatch(chunk -> {
                String title = String.valueOf(chunk.getOrDefault("title", "")).toLowerCase();
                String excerpt = String.valueOf(chunk.getOrDefault("excerpt", "")).toLowerCase();
                String id = String.valueOf(chunk.getOrDefault("id", "")).toLowerCase();
                return title.contains(expected) || excerpt.contains(expected) || id.contains(expected);
            });
            if (hit) {
                hitCount++;
            }
            String answer = answerGenerator.generate(query, ranked);
            double groundedness = groundedness(answer, ranked);
            groundednessSum += groundedness;

            Map<String, Object> result = new HashMap<>();
            result.put("query", query);
            result.put("lecture_id", lectureId);
            result.put("expected", expected);
            result.put("hit", hit);
            result.put("groundedness", Math.round(groundedness * 1000.0) / 1000.0);
            result.put("top_k", k);
            result.put("retrieved_count", ranked.size());
            items.add(result);
        }

        int total = items.size();
        double hitAtK = total == 0 ? 0.0 : hitCount / (double) total;
        double groundednessAvg = total == 0 ? 0.0 : groundednessSum / total;
        return Map.of(
                "total", total,
                "top_k", k,
                "hit_at_k", Math.round(hitAtK * 1000.0) / 1000.0,
                "groundedness", Math.round(groundednessAvg * 1000.0) / 1000.0,
                "items", items,
                "evaluated_at", Instant.now().toString()
        );
    }

    private List<String> targetLectureIds(String lectureId, String courseId) {
        if (lectureId != null && !lectureId.isBlank()) return List.of(lectureId);
        if (courseId != null && !courseId.isBlank()) {
            return learningService.getCourseLectures(courseId).stream().map(LectureItem::id).toList();
        }
        return learningService.listCourseCards("usr_std_001").stream()
                .flatMap(card -> learningService.getCourseLectures(card.id()).stream())
                .map(LectureItem::id)
                .distinct()
                .toList();
    }

    private String ragIndexKey(String lectureId, String courseId) {
        if (lectureId != null && !lectureId.isBlank()) return "lecture:" + lectureId;
        if (courseId != null && !courseId.isBlank()) return "course:" + courseId;
        return "global:all";
    }

    private String inferIntent(String query) {
        String normalized = query.toLowerCase();
        if (normalized.contains("요약") || normalized.contains("핵심")) return "summary";
        if (normalized.contains("문제") || normalized.contains("시험") || normalized.contains("퀴즈")) return "quiz";
        if (normalized.contains("숏폼") || normalized.contains("복습")) return "shortform";
        return "qa";
    }

    private double groundedness(String answer, List<Map<String, Object>> chunks) {
        List<String> answerTokens = tokenize(answer);
        if (answerTokens.isEmpty()) {
            return 0.0;
        }
        Set<String> context = new LinkedHashSet<>();
        for (Map<String, Object> chunk : chunks) {
            context.addAll(tokenize(String.valueOf(chunk.getOrDefault("excerpt", ""))));
        }
        if (context.isEmpty()) {
            return 0.0;
        }
        long matched = answerTokens.stream().filter(context::contains).count();
        return Math.min(1.0, matched / (double) answerTokens.size());
    }

    private List<Map<String, Object>> defaultEvalCases() {
        return List.of(
                Map.of("query", "핵심 개념 요약", "lecture_id", "lec_java_01", "expected", "트랜스크립트"),
                Map.of("query", "시험 대비 문제", "lecture_id", "lec_java_02", "expected", "강의")
        );
    }

    private List<String> tokenize(String text) {
        String normalized = normalizeText(text).toLowerCase();
        return List.of(normalized.split("[^a-zA-Z0-9가-힣]+")).stream()
                .map(String::trim)
                .filter(token -> token.length() > 1)
                .toList();
    }

    private String normalizeText(String text) {
        if (text == null) return "";
        return text.replaceAll("\\s+", " ").trim();
    }

    private double asDouble(Object value) {
        if (value instanceof Number number) return number.doubleValue();
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (Exception ignored) {
            return 0.0;
        }
    }

    private List<Map<String, Object>> ensureChunkTimestamps(List<Map<String, Object>> chunks) {
        if (chunks == null || chunks.isEmpty()) {
            return List.of();
        }
        List<Map<String, Object>> normalized = new ArrayList<>(chunks.size());
        for (Map<String, Object> chunk : chunks) {
            Map<String, Object> row = new HashMap<>(chunk);
            long start = row.get("start_ms") instanceof Number number ? number.longValue() : 0L;
            long end;
            if (row.get("end_ms") instanceof Number number) {
                end = number.longValue();
            } else {
                String lectureId = normalizeText(String.valueOf(row.getOrDefault("lecture_id", "")));
                LectureItem lecture = lectureId.isBlank() ? null : learningService.getLecture(lectureId);
                end = lecture == null ? 60_000L : Math.max(60_000L, lecture.duration_minutes() * 60_000L);
            }
            if (end < start) {
                end = start + 1_000L;
            }
            row.put("start_ms", start);
            row.put("end_ms", end);
            normalized.add(row);
        }
        return normalized;
    }
}
