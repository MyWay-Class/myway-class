package com.myway.backendspring.domain;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LectureDraftService {
    private final ConcurrentHashMap<String, LectureDraft> drafts = new ConcurrentHashMap<>();

    public List<LectureDraft> listByCourse(String courseId) {
        return drafts.values().stream()
                .filter(draft -> draft.course_id().equals(courseId))
                .toList();
    }

    public LectureDraft get(String courseId, String draftId) {
        LectureDraft draft = drafts.get(draftId);
        if (draft == null || !draft.course_id().equals(courseId)) {
            return null;
        }
        return draft;
    }

    public LectureDraft create(String courseId, String lectureId, String title, String content) {
        LectureDraft draft = new LectureDraft(
                UUID.randomUUID().toString(),
                courseId,
                lectureId,
                title,
                content,
                "DRAFT"
        );
        drafts.put(draft.id(), draft);
        return draft;
    }

    public LectureDraft update(String courseId, String draftId, String lectureId, String title, String content) {
        LectureDraft existing = get(courseId, draftId);
        if (existing == null) {
            return null;
        }
        LectureDraft updated = new LectureDraft(
                existing.id(),
                existing.course_id(),
                lectureId,
                title,
                content,
                existing.status()
        );
        drafts.put(updated.id(), updated);
        return updated;
    }

    public LectureDraft publish(String courseId, String draftId) {
        LectureDraft existing = get(courseId, draftId);
        if (existing == null) {
            return null;
        }
        LectureDraft published = new LectureDraft(
                existing.id(),
                existing.course_id(),
                existing.lecture_id(),
                existing.title(),
                existing.content(),
                "READY_TO_PUBLISH"
        );
        drafts.put(published.id(), published);
        return published;
    }
}
