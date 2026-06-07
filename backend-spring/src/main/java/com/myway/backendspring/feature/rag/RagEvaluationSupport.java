package com.myway.backendspring.feature.rag;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class RagEvaluationSupport {
    public Map<String, Object> evaluateBatch(List<Map<String, Object>> cases, Integer topK, RagRetriever retriever, RagReranker reranker, RagAnswerGenerator answerGenerator) {
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

    public double asDouble(Object value) {
        if (value instanceof Number number) return number.doubleValue();
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (Exception ignored) {
            return 0.0;
        }
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
}
