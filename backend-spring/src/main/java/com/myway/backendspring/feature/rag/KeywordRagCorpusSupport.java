package com.myway.backendspring.feature.rag;

import com.myway.backendspring.domain.DemoLearningService;
import com.myway.backendspring.domain.LectureItem;
import com.myway.backendspring.feature.repository.FeatureStoreRepository;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class KeywordRagCorpusSupport {
    private static final int RAG_CHUNK_MAX_WORDS = 90;
    private static final int RAG_CHUNK_OVERLAP_WORDS = 20;

    private final FeatureStoreRepository repository;
    private final DemoLearningService learningService;
    private final RagIndexRepository ragIndexRepository;
    private final KeywordRagScoringSupport scoringSupport;

    public KeywordRagCorpusSupport(
            FeatureStoreRepository repository,
            DemoLearningService learningService,
            RagIndexRepository ragIndexRepository,
            KeywordRagScoringSupport scoringSupport
    ) {
        this.repository = repository;
        this.learningService = learningService;
        this.ragIndexRepository = ragIndexRepository;
        this.scoringSupport = scoringSupport;
    }

    public List<Map<String, Object>> indexedRagCorpus(List<String> lectureIds) {
        if (lectureIds.isEmpty()) return List.of();
        List<Map<String, Object>> indexed = ragIndexRepository.loadChunksByLectureIds(lectureIds);
        return indexed.isEmpty() ? buildRagCorpus(lectureIds) : enrichSpeakerMetadata(lectureIds, indexed);
    }

    public List<Map<String, Object>> buildRagCorpus(List<String> lectureIds) {
        List<Map<String, Object>> chunks = new ArrayList<>();
        for (String lectureId : lectureIds) {
            LectureItem lecture = learningService.getLecture(lectureId);
            if (lecture == null) continue;

            Map<String, Object> transcript = repository.getKv(FeatureStoreRepository.MEDIA_TRANSCRIPT_SCOPE, lectureId);
            Object rawSegments = transcript == null ? null : transcript.get("segments");
            Object rawSpeakerSegments = transcript == null ? null : transcript.get("speaker_segments");
            Map<String, String> speakerByRange = buildSpeakerRangeMap(rawSpeakerSegments);

            if (rawSegments instanceof List<?> list && !list.isEmpty()) {
                int index = 0;
                for (Object item : list) {
                    if (!(item instanceof Map<?, ?> map)) continue;
                    String text = scoringSupport.normalizeText(String.valueOf(map.containsKey("text") ? map.get("text") : ""));
                    if (text.isBlank()) continue;

                    Map<String, Object> chunk = buildChunk(
                            "transcript_" + lectureId + "_" + (index + 1),
                            lectureId,
                            "transcript",
                            String.valueOf(transcript.getOrDefault("id", lectureId)),
                            lecture.title() + " · 트랜스크립트",
                            text,
                            index
                    );
                    int startMs = scoringSupport.asInt(map.get("start_ms"));
                    int endMs = scoringSupport.asInt(map.get("end_ms"));
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

            List<Map<String, Object>> noteEvents = repository.listEventsByOwner(FeatureStoreRepository.MEDIA_NOTE_SCOPE, lectureId);
            if (!noteEvents.isEmpty()) {
                int index = 0;
                for (Map<String, Object> note : noteEvents.stream().limit(2).toList()) {
                    String content = scoringSupport.normalizeText(String.valueOf(note.getOrDefault("content", "")));
                    if (content.isBlank()) continue;
                    for (String part : splitForRag(content, 2)) {
                        chunks.add(buildChunk(
                                "note_" + lectureId + "_" + (index + 1),
                                lectureId,
                                "note",
                                String.valueOf(note.getOrDefault("id", lectureId)),
                                lecture.title() + " · 요약 노트",
                                part,
                                index
                        ));
                        index++;
                    }
                }
            }

            if (chunks.stream().noneMatch(chunk -> lectureId.equals(String.valueOf(chunk.get("lecture_id"))))) {
                String narrative = lecture.title() + " 강의에서는 핵심 개념을 설명하고, 실습 흐름과 복습 포인트를 단계적으로 정리합니다. " +
                        "특히 자주 혼동되는 개념을 예시로 비교하고, 다음 차시와 연결되는 질문을 중심으로 학습합니다.";
                int index = 0;
                for (String part : splitForRag(narrative, 2)) {
                    chunks.add(buildChunk("lecture_" + lectureId + "_" + (index + 1), lectureId, "lecture", lectureId, lecture.title() + " · 강의 본문", part, index));
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
        chunk.put("token_count", scoringSupport.tokenize(excerpt).size());
        chunk.put("similarity", 0.0);
        chunk.put("retrieval_mode", "hybrid");
        chunk.put("vector_embedding", scoringSupport.buildEmbedding(title + " " + excerpt));
        chunk.put("embedding_dimensions", 12);
        return chunk;
    }

    private List<String> splitForRag(String text, int maxChunks) {
        String normalized = scoringSupport.normalizeText(text);
        List<String> words = normalized.isBlank()
                ? List.of()
                : List.of(normalized.split("\\s+")).stream().map(String::trim).filter(token -> !token.isBlank()).toList();
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

    private Map<String, String> buildSpeakerRangeMap(Object rawSpeakerSegments) {
        Map<String, String> speakerByRange = new HashMap<>();
        if (!(rawSpeakerSegments instanceof List<?> list)) return speakerByRange;
        for (Object item : list) {
            if (!(item instanceof Map<?, ?> map)) continue;
            int startMs = scoringSupport.asInt(map.get("start_ms"));
            int endMs = scoringSupport.asInt(map.get("end_ms"));
            String speaker = String.valueOf(map.containsKey("speaker_label") ? map.get("speaker_label") : "").trim();
            if (!speaker.isBlank()) {
                speakerByRange.put(startMs + ":" + endMs, speaker);
            }
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
            if (!lectureId.isBlank() && "transcript".equals(String.valueOf(mutable.getOrDefault("source_scope", "")))) {
                int startMs = scoringSupport.asInt(mutable.get("start_ms"));
                int endMs = scoringSupport.asInt(mutable.get("end_ms"));
                String speaker = speakerRangesByLecture.getOrDefault(lectureId, Map.of()).getOrDefault(startMs + ":" + endMs, "");
                if (!speaker.isBlank()) {
                    mutable.put("speaker_label", speaker);
                    String content = String.valueOf(mutable.getOrDefault("content", ""));
                    String excerpt = String.valueOf(mutable.getOrDefault("excerpt", ""));
                    if (!content.startsWith("[" + speaker + "] ")) mutable.put("content", "[" + speaker + "] " + content);
                    if (!excerpt.startsWith("[" + speaker + "] ")) mutable.put("excerpt", "[" + speaker + "] " + excerpt);
                }
            }
            enriched.add(mutable);
        }
        return enriched;
    }
}
