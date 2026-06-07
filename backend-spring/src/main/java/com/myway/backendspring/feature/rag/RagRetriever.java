package com.myway.backendspring.feature.rag;

import java.util.List;
import java.util.Map;

public interface RagRetriever {
    List<Map<String, Object>> retrieve(String query, List<String> lectureIds, double minScore);

    default List<Map<String, Object>> retrieve(String query, List<String> lectureIds, double minScore, List<Map<String, Object>> entities) {
        return retrieve(query, lectureIds, minScore);
    }
}
