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
        return retrieve(query, lectureIds, minScore, List.of());
    }

    @Override
    public List<Map<String, Object>> retrieve(String query, List<String> lectureIds, double minScore, List<Map<String, Object>> entities) {
        boolean forceFreshCorpus = normalizeText(query).isBlank() && minScore <= 0.0;
        List<Map<String, Object>> corpus = forceFreshCorpus ? buildRagCorpus(lectureIds) : indexedRagCorpus(lectureIds);
        List<Map<String, Object>> scored = new ArrayList<>();
        for (Map<String, Object> chunk : corpus) {
            Map<String, Object> mutable = new HashMap<>(chunk);
            mutable.put("similarity", scoreChunk(query, mutable, entities));
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
        if (indexed.isEmpty()) {
            return buildRagCorpus(lectureIds);
        }
        return enrichSpeakerMetadata(lectureIds, indexed);
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
            Object rawSpeakerSegments = transcript == null ? null : transcript.get("speaker_segments");
            Map<String, String> speakerByRange = buildSpeakerRangeMap(rawSpeakerSegments);
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
                            int startMs = asInt(map.get("start_ms"));
                            int endMs = asInt(map.get("end_ms"));
                            chunk.put("start_ms", startMs);
                            chunk.put("end_ms", endMs);
                            String speaker = speakerByRange.getOrDefault(startMs + ":" + endMs, "");
                            if (!speaker.isBlank()) {
                                chunk.put("speaker_label", speaker);
                                chunk.put("content", "[" + speaker + "] " + chunk.get("content"));
                                chunk.put("excerpt", "[" + speaker + "] " + chunk.get("excerpt"));
                            }
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

    private double scoreChunk(String query, Map<String, Object> chunk, List<Map<String, Object>> entities) {
        String title = String.valueOf(chunk.getOrDefault("title", ""));
        String content = String.valueOf(chunk.getOrDefault("content", ""));
        List<String> queryTokens = tokenize(query);
        List<String> entityTokens = extractEntityTokens(entities);
        if (queryTokens.isEmpty()) {
            return baseScoreForScope(chunk, entities);
        }
        Set<String> haystack = new LinkedHashSet<>(tokenize(title + " " + content));
        long overlap = queryTokens.stream().filter(haystack::contains).count();
        double coverage = overlap / (double) Math.max(3, queryTokens.size());
        double exact = content.contains(query) ? 0.16 : 0;
        double titleBoost = title.contains(query) ? 0.08 : 0;
        double orderBoost = phraseOrderBoost(queryTokens, tokenize(content));
        double diversityPenalty = repeatedTokenPenalty(tokenize(content));
        double scopeBoost = "transcript".equals(chunk.get("source_scope")) ? 0.05 : ("note".equals(chunk.get("source_scope")) ? 0.03 : 0.01);
        double entityBoost = entityBoost(chunk, entities, entityTokens);
        return Math.min(0.99, Math.max(0.0, coverage + exact + titleBoost + orderBoost + scopeBoost + entityBoost - diversityPenalty));
    }

    private double baseScoreForScope(Map<String, Object> chunk, List<Map<String, Object>> entities) {
        double base = "transcript".equals(chunk.get("source_scope")) ? 0.62 : 0.56;
        if (entities != null && !entities.isEmpty()) {
            if ("transcript".equals(chunk.get("source_scope"))) {
                base += 0.04;
            } else if ("note".equals(chunk.get("source_scope"))) {
                base += 0.02;
            }
        }
        return base;
    }

    private double entityBoost(Map<String, Object> chunk, List<Map<String, Object>> entities, List<String> entityTokens) {
        if (entities == null || entities.isEmpty()) {
            return 0.0;
        }
        double boost = 0.0;
        String lectureId = String.valueOf(chunk.getOrDefault("lecture_id", ""));
        String title = normalizeText(String.valueOf(chunk.getOrDefault("title", ""))).toLowerCase();
        String content = normalizeText(String.valueOf(chunk.getOrDefault("content", ""))).toLowerCase();
        for (Map<String, Object> entity : entities) {
            String kind = String.valueOf(entity.getOrDefault("kind", ""));
            String value = normalizeText(String.valueOf(entity.getOrDefault("value", ""))).toLowerCase();
            if (value.isBlank()) {
                continue;
            }
            if ("lecture_id".equals(kind) && value.equalsIgnoreCase(lectureId)) {
                boost += 0.12;
            } else if ("speaker_label".equals(kind) && content.contains(value)) {
                boost += 0.08;
            } else if ("topic".equals(kind) && (title.contains(value) || content.contains(value) || entityTokens.contains(value))) {
                boost += 0.06;
            } else if ("time_range".equals(kind) && "transcript".equals(chunk.get("source_scope"))) {
                boost += 0.04;
            } else if ("action_target".equals(kind)) {
                if ("summary".equals(value) && "transcript".equals(chunk.get("source_scope"))) {
                    boost += 0.05;
                }
                if ("quiz".equals(value) && "note".equals(chunk.get("source_scope"))) {
                    boost += 0.05;
                }
            }
        }
        return Math.min(0.18, boost);
    }

    private List<String> extractEntityTokens(List<Map<String, Object>> entities) {
        if (entities == null || entities.isEmpty()) {
            return List.of();
        }
        List<String> tokens = new ArrayList<>();
        for (Map<String, Object> entity : entities) {
            String value = normalizeText(String.valueOf(entity.getOrDefault("value", ""))).toLowerCase();
            if (!value.isBlank()) {
                tokens.add(value);
            }
        }
        return tokens;
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

    private Map<String, String> buildSpeakerRangeMap(Object rawSpeakerSegments) {
        Map<String, String> speakerByRange = new HashMap<>();
        if (!(rawSpeakerSegments instanceof List<?> list)) {
            return speakerByRange;
        }
        for (Object item : list) {
            if (!(item instanceof Map<?, ?> map)) {
                continue;
            }
            int startMs = asInt(map.get("start_ms"));
            int endMs = asInt(map.get("end_ms"));
            Object rawSpeaker = map.containsKey("speaker_label") ? map.get("speaker_label") : "";
            String speaker = String.valueOf(rawSpeaker).trim();
            if (speaker.isBlank()) {
                continue;
            }
            speakerByRange.put(startMs + ":" + endMs, speaker);
        }
        return speakerByRange;
    }

    private List<Map<String, Object>> enrichSpeakerMetadata(List<String> lectureIds, List<Map<String, Object>> chunks) {
        Map<String, Map<String, String>> speakerRangesByLecture = new HashMap<>();
        for (String lectureId : lectureIds) {
            Map<String, Object> transcript = repository.getKv(FeatureStoreRepository.MEDIA_TRANSCRIPT_SCOPE, lectureId);
            Object rawSpeakerSegments = transcript == null ? null : transcript.get("speaker_segments");
            speakerRangesByLecture.put(lectureId, buildSpeakerRangeMap(rawSpeakerSegments));
        }
        List<Map<String, Object>> enriched = new ArrayList<>(chunks.size());
        for (Map<String, Object> chunk : chunks) {
            Map<String, Object> mutable = new HashMap<>(chunk);
            String lectureId = String.valueOf(mutable.getOrDefault("lecture_id", ""));
            String scope = String.valueOf(mutable.getOrDefault("source_scope", ""));
            if (!lectureId.isBlank() && "transcript".equals(scope)) {
                int startMs = asInt(mutable.get("start_ms"));
                int endMs = asInt(mutable.get("end_ms"));
                Map<String, String> speakerByRange = speakerRangesByLecture.getOrDefault(lectureId, Map.of());
                String speaker = speakerByRange.getOrDefault(startMs + ":" + endMs, "");
                if (!speaker.isBlank()) {
                    mutable.put("speaker_label", speaker);
                    String content = String.valueOf(mutable.getOrDefault("content", ""));
                    String excerpt = String.valueOf(mutable.getOrDefault("excerpt", ""));
                    if (!content.startsWith("[" + speaker + "] ")) {
                        mutable.put("content", "[" + speaker + "] " + content);
                    }
                    if (!excerpt.startsWith("[" + speaker + "] ")) {
                        mutable.put("excerpt", "[" + speaker + "] " + excerpt);
                    }
                }
            }
            enriched.add(mutable);
        }
        return enriched;
    }
}
