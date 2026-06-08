package com.myway.backendspring.feature.rag;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class KeywordRagRetriever implements RagRetriever {
    private final KeywordRagCorpusSupport corpusSupport;
    private final KeywordRagScoringSupport scoringSupport;

    public KeywordRagRetriever(KeywordRagCorpusSupport corpusSupport, KeywordRagScoringSupport scoringSupport) {
        this.corpusSupport = corpusSupport;
        this.scoringSupport = scoringSupport;
    }

    @Override
    public List<Map<String, Object>> retrieve(String query, List<String> lectureIds, double minScore) {
        return retrieve(query, lectureIds, minScore, List.of());
    }

    @Override
    public List<Map<String, Object>> retrieve(String query, List<String> lectureIds, double minScore, List<Map<String, Object>> entities) {
        boolean forceFreshCorpus = scoringSupport.normalizeText(query).isBlank() && minScore <= 0.0;
        List<Map<String, Object>> corpus = forceFreshCorpus
                ? corpusSupport.buildRagCorpus(lectureIds)
                : corpusSupport.indexedRagCorpus(lectureIds);

        List<Map<String, Object>> scored = new ArrayList<>();
        for (Map<String, Object> chunk : corpus) {
            Map<String, Object> mutable = new HashMap<>(chunk);
            double keywordScore = scoringSupport.keywordScoreChunk(query, mutable, entities);
            double vectorScore = scoringSupport.vectorScoreChunk(query, mutable);
            double hybridScore = scoringSupport.scoreChunk(query, mutable, entities);
            mutable.put("keyword_similarity", Math.round(keywordScore * 1000.0) / 1000.0);
            mutable.put("vector_similarity", Math.round(vectorScore * 1000.0) / 1000.0);
            mutable.put("hybrid_similarity", Math.round(hybridScore * 1000.0) / 1000.0);
            mutable.put("similarity", hybridScore);
            mutable.put("retrieval_mode", "hybrid");
            mutable.put("score_breakdown", Map.of(
                    "keyword", Math.round(keywordScore * 1000.0) / 1000.0,
                    "vector", Math.round(vectorScore * 1000.0) / 1000.0,
                    "hybrid", Math.round(hybridScore * 1000.0) / 1000.0
            ));
            if (asDouble(mutable.get("similarity")) >= minScore) {
                scored.add(mutable);
            }
        }
        return scored;
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
