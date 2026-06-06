package com.myway.backendspring.feature.understanding;

import java.util.List;
import java.util.Map;

public interface UnderstandingPromptService {
    String buildEntityPrompt(UnderstandingContext context);

    String buildIntentPrompt(UnderstandingContext context, List<Map<String, Object>> entities);
}
