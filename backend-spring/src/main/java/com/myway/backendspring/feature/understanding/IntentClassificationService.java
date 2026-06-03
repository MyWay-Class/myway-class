package com.myway.backendspring.feature.understanding;

import java.util.List;
import java.util.Map;

public interface IntentClassificationService {
    UnderstandingResult classify(UnderstandingContext context, List<Map<String, Object>> entities);

    UnderstandingResult classifyWithContext(UnderstandingContext context, List<Map<String, Object>> entities, Map<String, Object> hints);
}
