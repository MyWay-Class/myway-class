package com.myway.backendspring.domain.learning.application;

import com.myway.backendspring.domain.learning.model.LectureDraft;
import com.myway.backendspring.domain.learning.port.LectureDraftRepositoryPort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class LectureDraftApplicationService {
    private static final String DRAFT = "DRAFT";
    private static final String READY_TO_PUBLISH = "READY_TO_PUBLISH";
    private final LectureDraftRepositoryPort draftRepository;

    public LectureDraftApplicationService(LectureDraftRepositoryPort draftRepository) {
        this.draftRepository = draftRepository;
    }

    public List<LectureDraft> listByCourse(String courseId) {
        return draftRepository.listByCourse(courseId);
    }

    public LectureDraft get(String courseId, String draftId) {
        return draftRepository.findById(draftId)
                .filter(draft -> draft.course_id().equals(courseId))
                .orElse(null);
    }

    public LectureDraft create(String courseId, String lectureId, String title, String content) {
        LectureDraft draft = new LectureDraft(
                UUID.randomUUID().toString(),
                courseId,
                lectureId,
                title,
                content,
                DRAFT
        );
        return draftRepository.save(draft);
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
        return draftRepository.save(updated);
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
                READY_TO_PUBLISH
        );
        return draftRepository.save(published);
    }
}
