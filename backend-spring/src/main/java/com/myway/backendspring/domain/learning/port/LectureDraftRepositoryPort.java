package com.myway.backendspring.domain.learning.port;

import com.myway.backendspring.domain.learning.model.LectureDraft;

import java.util.List;
import java.util.Optional;

public interface LectureDraftRepositoryPort {
    List<LectureDraft> listByCourse(String courseId);
    Optional<LectureDraft> findById(String draftId);
    LectureDraft save(LectureDraft draft);
}
