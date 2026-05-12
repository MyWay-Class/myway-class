package com.myway.backendspring.feature.media;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
class TranscriptSegmenter {
    private static final int FALLBACK_SEGMENT_MIN_MS = 1_000;

    List<Map<String, Object>> split(String text, int durationMs) {
        List<String> words = tokenizeForChunking(text);
        if (words.isEmpty()) return List.of();
        int segmentCount = Math.min(8, Math.max(3, (int) Math.ceil(words.size() / 20.0)));
        int wordsPerSegment = Math.max(1, (int) Math.ceil(words.size() / (double) segmentCount));
        List<Map<String, Object>> segments = new ArrayList<>();
        for (int i = 0; i < segmentCount; i++) {
            int start = i * wordsPerSegment;
            int end = Math.min(words.size(), start + wordsPerSegment);
            if (start >= end) break;
            int startMs = (int) Math.round((i / (double) segmentCount) * durationMs);
            int endMs = i == segmentCount - 1 ? durationMs : (int) Math.round(((i + 1) / (double) segmentCount) * durationMs);
            Map<String, Object> segment = new HashMap<>();
            segment.put("index", i);
            segment.put("start_ms", startMs);
            segment.put("end_ms", Math.max(startMs + FALLBACK_SEGMENT_MIN_MS, endMs));
            segment.put("text", String.join(" ", words.subList(start, end)));
            segments.add(segment);
        }
        return segments;
    }

    private List<String> tokenizeForChunking(String text) {
        if (text == null) return List.of();
        return List.of(text.replaceAll("\\s+", " ").trim().split("\\s+")).stream()
                .map(String::trim)
                .filter(token -> !token.isBlank())
                .toList();
    }
}
