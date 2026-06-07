package com.myway.backendspring.feature.rag;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class KeywordRagScoringSupport {
    public double scoreChunk(String query, Map<String, Object> chunk, List<Map<String, Object>> entities) {
        String title = String.valueOf(chunk.getOrDefault("title", ""));
        String content = String.valueOf(chunk.getOrDefault("content", ""));
        List<String> queryTokens = tokenize(query);
        List<String> entityTokens = extractEntityTokens(entities);
        if (queryTokens.isEmpty()) {
            return baseScoreForScope(chunk, entities);
        }
        Set<String> haystack = new LinkedHashSet<>(tokenize(title + " " + content));
        long overlap = queryTokens.stream().filter(haystack::contains).count();
        double coverage = overlap / (double) Math.max(3, queryTokens.size());
        double exact = content.contains(query) ? 0.16 : 0;
        double titleBoost = title.contains(query) ? 0.08 : 0;
        double orderBoost = phraseOrderBoost(queryTokens, tokenize(content));
        double diversityPenalty = repeatedTokenPenalty(tokenize(content));
        double scopeBoost = "transcript".equals(chunk.get("source_scope")) ? 0.05 : ("note".equals(chunk.get("source_scope")) ? 0.03 : 0.01);
        double entityBoost = entityBoost(chunk, entities, entityTokens);
        return Math.min(0.99, Math.max(0.0, coverage + exact + titleBoost + orderBoost + scopeBoost + entityBoost - diversityPenalty));
    }

    public double baseScoreForScope(Map<String, Object> chunk, List<Map<String, Object>> entities) {
        double base = "transcript".equals(chunk.get("source_scope")) ? 0.62 : 0.56;
        if (entities != null && !entities.isEmpty()) {
            if ("transcript".equals(chunk.get("source_scope"))) {
                base += 0.04;
            } else if ("note".equals(chunk.get("source_scope"))) {
                base += 0.02;
            }
        }
        return base;
    }

    public double entityBoost(Map<String, Object> chunk, List<Map<String, Object>> entities, List<String> entityTokens) {
        if (entities == null || entities.isEmpty()) {
            return 0.0;
        }
        double boost = 0.0;
        String lectureId = String.valueOf(chunk.getOrDefault("lecture_id", ""));
        String title = normalizeText(String.valueOf(chunk.getOrDefault("title", ""))).toLowerCase();
        String content = normalizeText(String.valueOf(chunk.getOrDefault("content", ""))).toLowerCase();
        for (Map<String, Object> entity : entities) {
            String kind = String.valueOf(entity.getOrDefault("kind", ""));
            String value = normalizeText(String.valueOf(entity.getOrDefault("value", ""))).toLowerCase();
            if (value.isBlank()) {
                continue;
            }
            if ("lecture_id".equals(kind) && value.equalsIgnoreCase(lectureId)) {
                boost += 0.12;
            } else if ("speaker_label".equals(kind) && content.contains(value)) {
                boost += 0.08;
            } else if ("topic".equals(kind) && (title.contains(value) || content.contains(value) || entityTokens.contains(value))) {
                boost += 0.06;
            } else if ("time_range".equals(kind) && "transcript".equals(chunk.get("source_scope"))) {
                boost += 0.04;
            } else if ("action_target".equals(kind)) {
                if ("summary".equals(value) && "transcript".equals(chunk.get("source_scope"))) {
                    boost += 0.05;
                }
                if ("quiz".equals(value) && "note".equals(chunk.get("source_scope"))) {
                    boost += 0.05;
                }
            }
        }
        return Math.min(0.18, boost);
    }

    public List<String> extractEntityTokens(List<Map<String, Object>> entities) {
        if (entities == null || entities.isEmpty()) {
            return List.of();
        }
        List<String> tokens = new ArrayList<>();
        for (Map<String, Object> entity : entities) {
            String value = normalizeText(String.valueOf(entity.getOrDefault("value", ""))).toLowerCase();
            if (!value.isBlank()) {
                tokens.add(value);
            }
        }
        return tokens;
    }

    public List<String> tokenize(String text) {
        String normalized = normalizeText(text).toLowerCase();
        return List.of(normalized.split("[^a-zA-Z0-9가-힣]+")).stream()
                .map(String::trim)
                .filter(token -> token.length() > 1)
                .toList();
    }

    public double phraseOrderBoost(List<String> queryTokens, List<String> contentTokens) {
        if (queryTokens.size() < 2 || contentTokens.size() < 2) return 0.0;
        int matchedPairs = 0;
        for (int i = 0; i < queryTokens.size() - 1; i++) {
            String first = queryTokens.get(i);
            String second = queryTokens.get(i + 1);
            for (int j = 0; j < contentTokens.size() - 1; j++) {
                if (first.equals(contentTokens.get(j)) && second.equals(contentTokens.get(j + 1))) {
                    matchedPairs++;
                    break;
                }
            }
        }
        return Math.min(0.08, matchedPairs * 0.02);
    }

    public double repeatedTokenPenalty(List<String> tokens) {
        if (tokens.isEmpty()) return 0.0;
        Map<String, Integer> countByToken = new HashMap<>();
        for (String token : tokens) {
            countByToken.put(token, countByToken.getOrDefault(token, 0) + 1);
        }
        long repeatedKinds = countByToken.values().stream().filter(v -> v >= 4).count();
        return Math.min(0.06, repeatedKinds * 0.01);
    }

    public String normalizeText(String text) {
        if (text == null) return "";
        return text.replaceAll("\\s+", " ").trim();
    }

    public int asInt(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (Exception ignored) {
            return 0;
        }
    }
}
