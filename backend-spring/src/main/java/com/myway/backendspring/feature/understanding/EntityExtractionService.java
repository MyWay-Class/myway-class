package com.myway.backendspring.feature.understanding;

import java.util.List;
import java.util.Map;

public interface EntityExtractionService {
    List<Map<String, Object>> extractFromText(UnderstandingContext context);

    List<Map<String, Object>> extractFromTranscript(UnderstandingContext context);

    List<Map<String, Object>> extractFromChatMessage(UnderstandingContext context);
}
