package com.myway.backendspring.feature.rag;

import com.myway.backendspring.domain.DemoLearningService;
import com.myway.backendspring.domain.LectureItem;
import com.myway.backendspring.feature.repository.FeatureStoreRepository;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class KeywordRagRetriever implements RagRetriever {
    private static final int RAG_CHUNK_MAX_WORDS = 90;
    private static final int RAG_CHUNK_OVERLAP_WORDS = 20;

    private final FeatureStoreRepository repository;
    private final DemoLearningService learningService;
    private final RagIndexRepository ragIndexRepository;

    public KeywordRagRetriever(
            FeatureStoreRepository repository,
            DemoLearningService learningService,
            RagIndexRepository ragIndexRepository
    ) {
        this.repository = repository;
        this.learningService = learningService;
        this.ragIndexRepository = ragIndexRepository;
    }

    @Override
    public List<Map<String, Object>> retrieve(String query, List<String> lectureIds, double minScore) {
        List<Map<String, Object>> corpus = indexedRagCorpus(lectureIds);
        List<Map<String, Object>> scored = new ArrayList<>();
        for (Map<String, Object> chunk : corpus) {
            Map<String, Object> mutable = new HashMap<>(chunk);
            mutable.put("similarity", scoreChunk(query, mutable));
            if (asDouble(mutable.get("similarity")) >= minScore) {
                scored.add(mutable);
            }
        }
        return scored;
    }

    private List<Map<String, Object>> indexedRagCorpus(List<String> lectureIds) {
        if (lectureIds.isEmpty()) {
            return List.of();
        }
        List<Map<String, Object>> indexed = ragIndexRepository.loadChunksByLectureIds(lectureIds);
        return indexed.isEmpty() ? buildRagCorpus(lectureIds) : indexed;
    }

    private List<Map<String, Object>> buildRagCorpus(List<String> lectureIds) {
        List<Map<String, Object>> chunks = new ArrayList<>();
        for (String lectureId : lectureIds) {
            LectureItem lecture = learningService.getLecture(lectureId);
            if (lecture == null) {
                continue;
            }
            Map<String, Object> transcript = repository.getKv(FeatureStoreRepository.MEDIA_TRANSCRIPT_SCOPE, lectureId);
            Object rawSegments = transcript == null ? null : transcript.get("segments");
            if (rawSegments instanceof List<?> list && !list.isEmpty()) {
                int index = 0;
                for (Object item : list) {
                    if (item instanceof Map<?, ?> map) {
                        Object rawText = map.containsKey("text") ? map.get("text") : "";
                        String text = normalizeText(String.valueOf(rawText));
                        if (!text.isBlank()) {
                            Map<String, Object> chunk = buildChunk("transcript_" + lectureId + "_" + (index + 1), lectureId, "transcript",
                                    String.valueOf(transcript.getOrDefault("id", lectureId)),
                                    lecture.title() + " · 트랜스크립트", text, index);
                            chunk.put("start_ms", asInt(map.get("start_ms")));
                            chunk.put("end_ms", asInt(map.get("end_ms")));
                            chunks.add(chunk);
                            index++;
                        }
                    }
                }
            }

            List<Map<String, Object>> noteEvents = repository.listEventsByOwner(FeatureStoreRepository.MEDIA_NOTE_SCOPE, lectureId);
            if (!noteEvents.isEmpty()) {
                int index = 0;
                for (Map<String, Object> note : noteEvents.stream().limit(2).toList()) {
                    String content = normalizeText(String.valueOf(note.getOrDefault("content", "")));
                    if (content.isBlank()) {
                        continue;
                    }
                    for (String part : splitForRag(content, 2)) {
                        chunks.add(buildChunk("note_" + lectureId + "_" + (index + 1), lectureId, "note",
                                String.valueOf(note.getOrDefault("id", lectureId)),
                                lecture.title() + " · 요약 노트", part, index));
                        index++;
                    }
                }
            }

            if (chunks.stream().noneMatch(chunk -> lectureId.equals(String.valueOf(chunk.get("lecture_id"))))) {
                int index = 0;
                for (String part : splitForRag(buildLectureNarrative(lectureId), 2)) {
                    chunks.add(buildChunk("lecture_" + lectureId + "_" + (index + 1), lectureId, "lecture",
                            lectureId, lecture.title() + " · 강의 본문", part, index));
                    index++;
                }
            }
        }
        return chunks;
    }

    private Map<String, Object> buildChunk(String id, String lectureId, String sourceType, String sourceId, String title, String text, int index) {
        String excerpt = text.length() > 240 ? text.substring(0, 240) : text;
        Map<String, Object> chunk = new HashMap<>();
        chunk.put("id", id);
        chunk.put("lecture_id", lectureId);
        chunk.put("source_type", sourceType);
        chunk.put("source_id", sourceId);
        chunk.put("title", title);
        chunk.put("content", excerpt);
        chunk.put("excerpt", excerpt);
        chunk.put("chunk_index", index);
        chunk.put("source_scope", sourceType);
        chunk.put("token_count", tokenize(excerpt).size());
        chunk.put("similarity", 0.0);
        return chunk;
    }

    private double scoreChunk(String query, Map<String, Object> chunk) {
        String title = String.valueOf(chunk.getOrDefault("title", ""));
        String content = String.valueOf(chunk.getOrDefault("content", ""));
        List<String> queryTokens = tokenize(query);
        if (queryTokens.isEmpty()) {
            return "transcript".equals(chunk.get("source_scope")) ? 0.62 : 0.56;
        }
        Set<String> haystack = new LinkedHashSet<>(tokenize(title + " " + content));
        long overlap = queryTokens.stream().filter(haystack::contains).count();
        double coverage = overlap / (double) Math.max(3, queryTokens.size());
        double exact = content.contains(query) ? 0.16 : 0;
        double titleBoost = title.contains(query) ? 0.08 : 0;
        double orderBoost = phraseOrderBoost(queryTokens, tokenize(content));
        double diversityPenalty = repeatedTokenPenalty(tokenize(content));
        double scopeBoost = "transcript".equals(chunk.get("source_scope")) ? 0.05 : ("note".equals(chunk.get("source_scope")) ? 0.03 : 0.01);
        return Math.min(0.99, Math.max(0.0, coverage + exact + titleBoost + orderBoost + scopeBoost - diversityPenalty));
    }

    private List<String> splitForRag(String text, int maxChunks) {
        List<String> words = tokenizeForChunking(text);
        if (words.isEmpty()) return List.of(text);
        int maxWords = Math.max(30, RAG_CHUNK_MAX_WORDS);
        int overlap = Math.max(0, Math.min(RAG_CHUNK_OVERLAP_WORDS, maxWords / 2));
        List<String> parts = new ArrayList<>();
        int cursor = 0;
        while (cursor < words.size() && parts.size() < Math.max(1, maxChunks * 2)) {
            int end = Math.min(words.size(), cursor + maxWords);
            parts.add(String.join(" ", words.subList(cursor, end)));
            if (end >= words.size()) break;
            cursor = Math.max(cursor + 1, end - overlap);
        }
        return parts.isEmpty() ? List.of(text) : parts;
    }

    private String buildLectureNarrative(String lectureId) {
        LectureItem lecture = learningService.getLecture(lectureId);
        if (lecture == null) {
            return "강의 텍스트를 찾을 수 없습니다.";
        }
        return lecture.title() + " 강의에서는 핵심 개념을 설명하고, 실습 흐름과 복습 포인트를 단계적으로 정리합니다. " +
                "특히 자주 혼동되는 개념을 예시로 비교하고, 다음 차시와 연결되는 질문을 중심으로 학습합니다.";
    }

    private List<String> tokenize(String text) {
        String normalized = normalizeText(text).toLowerCase();
        return List.of(normalized.split("[^a-zA-Z0-9가-힣]+")).stream()
                .map(String::trim)
                .filter(token -> token.length() > 1)
                .toList();
    }

    private List<String> tokenizeForChunking(String text) {
        return List.of(normalizeText(text).split("\\s+")).stream()
                .map(String::trim)
                .filter(token -> !token.isBlank())
                .toList();
    }

    private double phraseOrderBoost(List<String> queryTokens, List<String> contentTokens) {
        if (queryTokens.size() < 2 || contentTokens.size() < 2) return 0.0;
        int matchedPairs = 0;
        for (int i = 0; i < queryTokens.size() - 1; i++) {
            String first = queryTokens.get(i);
            String second = queryTokens.get(i + 1);
            for (int j = 0; j < contentTokens.size() - 1; j++) {
                if (first.equals(contentTokens.get(j)) && second.equals(contentTokens.get(j + 1))) {
                    matchedPairs++;
                    break;
                }
            }
        }
        return Math.min(0.08, matchedPairs * 0.02);
    }

    private double repeatedTokenPenalty(List<String> tokens) {
        if (tokens.isEmpty()) return 0.0;
        Map<String, Integer> countByToken = new HashMap<>();
        for (String token : tokens) {
            countByToken.put(token, countByToken.getOrDefault(token, 0) + 1);
        }
        long repeatedKinds = countByToken.values().stream().filter(v -> v >= 4).count();
        return Math.min(0.06, repeatedKinds * 0.01);
    }

    private String normalizeText(String text) {
        if (text == null) return "";
        return text.replaceAll("\\s+", " ").trim();
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

    private int asInt(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (Exception ignored) {
            return 0;
        }
    }
}
