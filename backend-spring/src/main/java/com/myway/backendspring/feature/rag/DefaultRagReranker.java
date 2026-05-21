package com.myway.backendspring.feature.rag;

import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Component
public class DefaultRagReranker implements RagReranker {
    @Override
    public List<Map<String, Object>> rerank(List<Map<String, Object>> chunks, int limit) {
        return chunks.stream()
                .sorted(Comparator
                        .comparingDouble((Map<String, Object> item) -> asDouble(item.get("similarity"))).reversed()
                        .thenComparing(item -> String.valueOf(item.getOrDefault("title", ""))))
                .limit(limit)
                .toList();
    }

    private double asDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (Exception ignored) {
            return 0.0;
        }
    }
}
