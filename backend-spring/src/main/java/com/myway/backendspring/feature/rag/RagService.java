package com.myway.backendspring.feature.rag;

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
    private final RagRetriever retriever;
    private final RagReranker reranker;
    private final RagAnswerGenerator answerGenerator;
    private final RagIndexRepository ragIndexRepository;
    private final RagEvaluationSupport evaluationSupport;
    private final RagServiceSupport ragServiceSupport;

    public RagService(
            RagRetriever retriever,
            RagReranker reranker,
            RagAnswerGenerator answerGenerator,
            RagIndexRepository ragIndexRepository,
            RagEvaluationSupport evaluationSupport,
            RagServiceSupport ragServiceSupport
    ) {
        this.retriever = retriever;
        this.reranker = reranker;
        this.answerGenerator = answerGenerator;
        this.ragIndexRepository = ragIndexRepository;
        this.evaluationSupport = evaluationSupport;
        this.ragServiceSupport = ragServiceSupport;
    }

    public Map<String, Object> ragOverview(
            String query,
            String lectureId,
            String courseId,
            Integer limit,
            Double minScore,
            boolean includeDebug
    ) {
        return ragOverview(query, lectureId, courseId, limit, minScore, includeDebug, List.of());
    }

    public Map<String, Object> ragOverview(
            String query,
            String lectureId,
            String courseId,
            Integer limit,
            Double minScore,
            boolean includeDebug,
            List<Map<String, Object>> requestEntities
    ) {
        int resolvedLimit = Math.max(1, Math.min(6, limit == null ? 4 : limit));
        String normalizedQuery = normalizeText(query);
        List<String> targetLectureIds = ragServiceSupport.targetLectureIds(lectureId, courseId);
        double threshold = minScore == null ? 0.0 : Math.max(0.0, Math.min(1.0, minScore));

        List<Map<String, Object>> retrieved = retriever.retrieve(normalizedQuery, targetLectureIds, threshold, requestEntities);
        List<Map<String, Object>> rankedChunks = ragServiceSupport.ensureChunkTimestamps(reranker.rerank(retrieved, resolvedLimit));

        List<Map<String, Object>> responseEntities = new ArrayList<>();
        if (lectureId != null && !lectureId.isBlank()) {
            responseEntities.add(Map.of("kind", "lecture_id", "label", "강의", "value", lectureId));
        }
        if (courseId != null && !courseId.isBlank()) {
            responseEntities.add(Map.of("kind", "course_id", "label", "코스", "value", courseId));
        }

        String intent = ragServiceSupport.inferIntent(normalizedQuery);
        String answerText = answerGenerator.generate(normalizedQuery, rankedChunks);
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
        payload.put("entities", responseEntities);
        payload.put("chunks", rankedChunks);
        payload.put("search", Map.of("query", normalizedQuery, "lecture_id", lectureId, "hits", rankedChunks));
        payload.put("answer", answerText);
        payload.put("answer_payload", answerPayload);
        payload.put("provider", Map.of("search_provider", "spring-rag-keyword", "answer_provider", "spring-rag-generator"));
        payload.put("limit", resolvedLimit);
        payload.put("min_score", threshold);
        if (includeDebug) {
            double avgSimilarity = rankedChunks.stream().mapToDouble(item -> evaluationSupport.asDouble(item.get("similarity"))).average().orElse(0.0);
            payload.put("debug", Map.of(
                    "query_tokens", List.of(normalizedQuery.split("[^a-zA-Z0-9가-힣]+")).stream()
                            .map(String::trim)
                            .filter(token -> token.length() > 1)
                            .toList(),
                    "corpus_size", retrieved.size(),
                    "filtered_count", rankedChunks.size(),
                    "avg_similarity", Math.round(avgSimilarity * 1000.0) / 1000.0,
                    "entity_count", requestEntities == null ? 0 : requestEntities.size()
            ));
        }
        return payload;
    }

    public Map<String, Object> ragIndexOverview(String lectureId, String courseId) {
        List<String> lectureIds = ragServiceSupport.targetLectureIds(lectureId, courseId);
        List<Map<String, Object>> chunks = retriever.retrieve("", lectureIds, 0.0, List.of());
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
        List<String> lectureIds = ragServiceSupport.targetLectureIds(lectureId, courseId);
        List<Map<String, Object>> chunks = retriever.retrieve("", lectureIds, 0.0, List.of());
        String key = ragServiceSupport.ragIndexKey(lectureId, courseId);
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
        String key = ragServiceSupport.ragIndexKey(lectureId, courseId);
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
        return evaluationSupport.evaluateBatch(cases, topK, retriever, reranker, answerGenerator);
    }

    private String normalizeText(String text) {
        if (text == null) return "";
        return text.replaceAll("\\s+", " ").trim();
    }
}
