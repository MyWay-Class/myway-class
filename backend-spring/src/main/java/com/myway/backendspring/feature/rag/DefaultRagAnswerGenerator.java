package com.myway.backendspring.feature.rag;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class DefaultRagAnswerGenerator implements RagAnswerGenerator {
    @Override
    public String generate(String query, List<Map<String, Object>> chunks) {
        if (chunks.isEmpty()) {
            return "질문과 관련된 강의 근거를 찾지 못했습니다. 강의 또는 코스를 다시 선택해 주세요.";
        }
        String context = chunks.stream()
                .map(chunk -> String.valueOf(chunk.getOrDefault("excerpt", "")))
                .filter(text -> !text.isBlank())
                .limit(2)
                .collect(Collectors.joining(" "));
        return "질문 \"" + query + "\"에 대해 강의 근거를 정리하면 다음과 같습니다. " + context;
    }
}
