package com.myway.backendspring.feature.media;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class MediaTranscriptionMetrics {
    private static final int STT_TARGET_SEGMENT_WORDS = 20;

    public Map<String, Object> sttQualityMetrics(List<Map<String, Object>> segments, int durationMs) {
        if (segments == null || segments.isEmpty()) {
            return Map.of(
                    "segment_count", 0,
                    "avg_words_per_segment", 0,
                    "min_segment_ms", 0,
                    "max_segment_ms", 0,
                    "target_segment_words", STT_TARGET_SEGMENT_WORDS,
                    "quality_score", 0.0
            );
        }
        int totalWords = 0;
        int minMs = Integer.MAX_VALUE;
        int maxMs = 0;
        for (Map<String, Object> segment : segments) {
            int start = asInt(segment.get("start_ms"));
            int end = asInt(segment.get("end_ms"));
            int ms = Math.max(0, end - start);
            minMs = Math.min(minMs, ms);
            maxMs = Math.max(maxMs, ms);
            totalWords += countWords(String.valueOf(segment.getOrDefault("text", "")));
        }
        double avgWords = totalWords / (double) Math.max(1, segments.size());
        double wordFit = 1.0 - Math.min(1.0, Math.abs(avgWords - STT_TARGET_SEGMENT_WORDS) / STT_TARGET_SEGMENT_WORDS);
        double durationFit = 1.0 - Math.min(1.0, Math.abs(durationMs - (segments.size() * 20_000.0)) / Math.max(1.0, durationMs));
        double score = Math.max(0.0, Math.min(1.0, (wordFit * 0.7) + (durationFit * 0.3)));
        return Map.of(
                "segment_count", segments.size(),
                "avg_words_per_segment", Math.round(avgWords * 100.0) / 100.0,
                "min_segment_ms", minMs == Integer.MAX_VALUE ? 0 : minMs,
                "max_segment_ms", maxMs,
                "target_segment_words", STT_TARGET_SEGMENT_WORDS,
                "quality_score", Math.round(score * 1000.0) / 1000.0
        );
    }

    public int countWords(String text) {
        return tokenize(text).size();
    }

    private List<String> tokenize(String text) {
        if (text == null) return List.of();
        String normalized = text.replaceAll("\\s+", " ").trim().toLowerCase();
        return List.of(normalized.split("[^a-zA-Z0-9가-힣]+")).stream()
                .map(String::trim)
                .filter(token -> token.length() > 1)
                .toList();
    }

    private int asInt(Object value) {
        if (value == null) return 0;
        if (value instanceof Number n) return n.intValue();
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (Exception ignored) {
            return 0;
        }
    }
}
