package com.myway.backendspring.feature.rag;

import java.util.List;
import java.util.Map;

public interface RagAnswerGenerator {
    String generate(String query, List<Map<String, Object>> chunks);
}
