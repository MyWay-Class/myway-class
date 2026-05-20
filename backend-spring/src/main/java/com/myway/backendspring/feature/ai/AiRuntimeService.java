package com.myway.backendspring.feature.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiRuntimeService {
    private static final String DEFAULT_OLLAMA_MODEL = "llama3.1:8b";
    private static final String DEFAULT_GEMINI_MODEL = "gemini-1.5-flash";

    private final ObjectMapper objectMapper;
    private final String ollamaBaseUrl;
    private final String geminiBaseUrl;
    private final String geminiApiKey;

    public AiRuntimeService(
            ObjectMapper objectMapper,
            @Value("${myway.ai.ollama.base-url:http://127.0.0.1:11434}") String ollamaBaseUrl,
            @Value("${myway.ai.gemini.base-url:https://generativelanguage.googleapis.com}") String geminiBaseUrl,
            @Value("${myway.ai.gemini.api-key:}") String geminiApiKey
    ) {
        this.objectMapper = objectMapper;
        this.ollamaBaseUrl = normalizeBaseUrl(ollamaBaseUrl);
        this.geminiBaseUrl = normalizeBaseUrl(geminiBaseUrl);
        this.geminiApiKey = geminiApiKey == null ? "" : geminiApiKey.trim();
    }

    public Map<String, Object> generate(String purpose, String prompt, Map<String, Object> settings) {
        String normalizedPurpose = normalize(purpose);
        String normalizedPrompt = normalize(prompt);
        String provider = normalizeProvider(settings == null ? null : settings.get("provider"));
        String model = normalizeModel(settings == null ? null : settings.get("model"), provider);

        if ("ollama".equals(provider)) {
            RuntimeResult result = generateWithOllama(model, normalizedPrompt);
            return result.toMap(normalizedPurpose);
        }

        if ("gemini".equals(provider)) {
            RuntimeResult result = generateWithGemini(model, normalizedPrompt);
            return result.toMap(normalizedPurpose);
        }

        RuntimeResult fallback = RuntimeResult.fallback(provider, model, "지원하지 않는 provider 설정입니다.");
        return fallback.toMap(normalizedPurpose);
    }

    private RuntimeResult generateWithOllama(String model, String prompt) {
        try {
            RestClient client = RestClient.builder().baseUrl(ollamaBaseUrl).build();
            Map<String, Object> payload = new HashMap<>();
            payload.put("model", model);
            payload.put("prompt", prompt);
            payload.put("stream", false);

            String raw = client.post()
                    .uri("/api/generate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(String.class);
            JsonNode node = objectMapper.readTree(raw == null ? "{}" : raw);
            String text = normalize(node.path("response").asText(""));
            if (text.isBlank()) {
                return RuntimeResult.fallback("ollama", model, "응답 본문이 비어 있습니다.");
            }
            return RuntimeResult.live("ollama", model, text);
        } catch (Exception ex) {
            return RuntimeResult.fallback("ollama", model, "ollama 호출 실패: " + ex.getMessage());
        }
    }

    private RuntimeResult generateWithGemini(String model, String prompt) {
        if (geminiApiKey.isBlank()) {
            return RuntimeResult.fallback("gemini", model, "GEMINI_API_KEY가 비어 있습니다.");
        }
        try {
            RestClient client = RestClient.builder().baseUrl(geminiBaseUrl).build();
            String path = "/v1beta/models/" + model + ":generateContent?key=" + geminiApiKey;
            Map<String, Object> textPart = Map.of("text", prompt);
            Map<String, Object> content = Map.of("parts", List.of(textPart));
            Map<String, Object> payload = Map.of("contents", List.of(content));

            String raw = client.post()
                    .uri(path)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(String.class);
            JsonNode node = objectMapper.readTree(raw == null ? "{}" : raw);
            JsonNode candidates = node.path("candidates");
            if (!candidates.isArray() || candidates.isEmpty()) {
                return RuntimeResult.fallback("gemini", model, "candidates 응답이 없습니다.");
            }
            String text = normalize(candidates.path(0).path("content").path("parts").path(0).path("text").asText(""));
            if (text.isBlank()) {
                return RuntimeResult.fallback("gemini", model, "텍스트 응답이 비어 있습니다.");
            }
            return RuntimeResult.live("gemini", model, text);
        } catch (Exception ex) {
            return RuntimeResult.fallback("gemini", model, "gemini 호출 실패: " + ex.getMessage());
        }
    }

    private String normalizeBaseUrl(String value) {
        String normalized = normalize(value);
        if (normalized.endsWith("/")) {
            return normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    private String normalizeProvider(Object value) {
        String normalized = normalize(value == null ? "" : String.valueOf(value)).toLowerCase();
        return normalized.isBlank() ? "ollama" : normalized;
    }

    private String normalizeModel(Object value, String provider) {
        String normalized = normalize(value == null ? "" : String.valueOf(value));
        if (!normalized.isBlank()) {
            return normalized;
        }
        if ("gemini".equals(provider)) {
            return DEFAULT_GEMINI_MODEL;
        }
        return DEFAULT_OLLAMA_MODEL;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private record RuntimeResult(String provider, String model, String text, boolean live, String error) {
        static RuntimeResult live(String provider, String model, String text) {
            return new RuntimeResult(provider, model, text, true, null);
        }

        static RuntimeResult fallback(String provider, String model, String error) {
            return new RuntimeResult(
                    provider,
                    model,
                    "실호출이 불가하여 데모 응답으로 대체했습니다.",
                    false,
                    error
            );
        }

        Map<String, Object> toMap(String purpose) {
            Map<String, Object> map = new HashMap<>();
            map.put("provider", provider);
            map.put("model", model);
            map.put("live", live);
            map.put("text", text);
            map.put("purpose", purpose);
            if (error != null && !error.isBlank()) {
                map.put("error", error);
            }
            return map;
        }
    }
}
