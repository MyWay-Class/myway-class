package com.myway.backendspring.api.support;

import com.myway.backendspring.api.AiController;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class AiControllerRagSupport {
    public Integer topK(AiController.RagEvaluateRequest body) {
        return body == null ? null : body.top_k();
    }

    public List<Map<String, Object>> evaluateCases(AiController.RagEvaluateRequest body) {
        if (body == null || body.cases() == null) {
            return List.of();
        }
        return body.cases().stream()
                .map(AiController.RagEvaluateCaseRequest::payload)
                .collect(Collectors.toList());
    }

    public boolean includeDebug(Boolean includeDebug) {
        return Boolean.TRUE.equals(includeDebug);
    }
}
