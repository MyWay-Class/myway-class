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
            mutable.put("similarity", scoringSupport.scoreChunk(query, mutable, entities));
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
