package com.myway.backendspring.feature;

import com.myway.backendspring.persistence.FeatureJdbcStore;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class FeatureStoreNoteSupport {

    public Map<String, Object> summarizeLecture(
            FeatureJdbcStore store,
            String mediaNoteScope,
            FeatureStorePayloadSupport payloadSupport,
            String lectureId,
            String style,
            String language
    ) {
        Map<String, Object> note = payloadSupport.lectureSummaryNotePayload(
                UUID.randomUUID().toString(),
                lectureId,
                payloadSupport.normalizeOrDefault(style, "brief"),
                payloadSupport.normalizeOrDefault(language, "ko"),
                Instant.now().toString()
        );
        store.insertEvent(mediaNoteScope, lectureId, String.valueOf(note.get("id")), note);
        return note;
    }

    public List<Map<String, Object>> notes(FeatureJdbcStore store, String mediaNoteScope, String lectureId) {
        return store.listEventsByOwner(mediaNoteScope, lectureId);
    }
}
