package com.myway.backendspring.feature.rag;

import com.myway.backendspring.feature.repository.FeatureStoreRepository;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Repository
public class RagIndexRepository {
    private final FeatureStoreRepository repository;

    public RagIndexRepository(FeatureStoreRepository repository) {
        this.repository = repository;
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> loadChunksByLectureIds(List<String> lectureIds) {
        List<Map<String, Object>> indexed = new ArrayList<>();
        for (String lectureId : lectureIds) {
            Map<String, Object> saved = repository.getKv(FeatureStoreRepository.RAG_INDEX_SCOPE, "lecture:" + lectureId);
            if (saved == null || !(saved.get("chunks") instanceof List<?> rows)) {
                continue;
            }
            for (Object row : rows) {
                if (!(row instanceof Map<?, ?> map)) {
                    continue;
                }
                Map<String, Object> chunk = new HashMap<>();
                for (Map.Entry<?, ?> entry : map.entrySet()) {
                    if (entry.getKey() != null) {
                        chunk.put(String.valueOf(entry.getKey()), entry.getValue());
                    }
                }
                indexed.add(chunk);
            }
        }
        return indexed;
    }

    public void upsertIndex(String indexKey, Map<String, Object> payload) {
        repository.upsertKv(FeatureStoreRepository.RAG_INDEX_SCOPE, indexKey, payload);
    }
}
