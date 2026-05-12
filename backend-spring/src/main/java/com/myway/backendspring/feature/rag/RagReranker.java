package com.myway.backendspring.feature.rag;

import java.util.List;
import java.util.Map;

public interface RagReranker {
    List<Map<String, Object>> rerank(List<Map<String, Object>> chunks, int limit);
}
