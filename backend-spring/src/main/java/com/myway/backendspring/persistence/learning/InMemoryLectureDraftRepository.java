package com.myway.backendspring.persistence.learning;

import com.myway.backendspring.domain.learning.model.LectureDraft;
import com.myway.backendspring.domain.learning.port.LectureDraftRepositoryPort;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class InMemoryLectureDraftRepository implements LectureDraftRepositoryPort {
    private final ConcurrentHashMap<String, LectureDraft> drafts = new ConcurrentHashMap<>();

    @Override
    public List<LectureDraft> listByCourse(String courseId) {
        return drafts.values().stream()
                .filter(draft -> draft.course_id().equals(courseId))
                .toList();
    }

    @Override
    public Optional<LectureDraft> findById(String draftId) {
        return Optional.ofNullable(drafts.get(draftId));
    }

    @Override
    public LectureDraft save(LectureDraft draft) {
        drafts.put(draft.id(), draft);
        return draft;
    }
}
