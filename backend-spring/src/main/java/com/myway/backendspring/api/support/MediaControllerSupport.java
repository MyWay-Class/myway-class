package com.myway.backendspring.api.support;

import com.myway.backendspring.auth.RolePolicy;
import com.myway.backendspring.auth.SessionView;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class MediaControllerSupport {
    public String trimRequired(String value) {
        return value.trim();
    }

    public String optionalOrNull(String value) {
        String trimmed = value == null ? "" : value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    public String optionalOrDefault(String value, String defaultValue) {
        String trimmed = value == null ? "" : value.trim();
        return trimmed.isBlank() ? defaultValue : trimmed;
    }

    public boolean canManageMedia(SessionView session) {
        return session != null && RolePolicy.canManageCourses(session.user().role());
    }

    public boolean isAdmin(SessionView session) {
        return session != null && RolePolicy.isAdmin(session.user().role());
    }

    public Map<String, Object> assembleSummaryResponse(Map<String, Object> note, String style, Map<String, Object> pipeline) {
        return Map.of(
                "note_id", note.get("id"),
                "lecture_id", note.get("lecture_id"),
                "title", note.get("title"),
                "content", note.get("content"),
                "key_concepts", note.get("key_concepts"),
                "keywords", note.get("keywords"),
                "timestamps", note.get("timestamps"),
                "style", style,
                "pipeline", pipeline
        );
    }

    public Map<String, Object> withLectureMetaSync(String lectureId, Map<String, Object> transcribeResult, Map<String, Object> lectureMetaSyncResult) {
        if (lectureId == null || lectureId.isBlank() || transcribeResult == null) {
            return transcribeResult;
        }
        Map<String, Object> merged = new LinkedHashMap<>(transcribeResult);
        merged.put("lecture_meta_sync", lectureMetaSyncResult);
        return merged;
    }
}
