package com.myway.backendspring.domain.learning.application;

import com.myway.backendspring.domain.DemoLearningService;
import com.myway.backendspring.domain.MaterialItem;
import com.myway.backendspring.domain.NoticeItem;
import com.myway.backendspring.domain.learning.model.CourseCard;
import com.myway.backendspring.domain.learning.model.CourseDetail;
import com.myway.backendspring.domain.learning.model.LectureItem;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LearningApplicationService {
    private final DemoLearningService learningService;

    public LearningApplicationService(DemoLearningService learningService) {
        this.learningService = learningService;
    }

    public CourseDetail createCourse(String instructorId, String title, List<String> lectureTitles) {
        return toModel(learningService.createCourse(instructorId, title, lectureTitles));
    }

    public List<CourseCard> listCourseCards(String userId) {
        return learningService.listCourseCards(userId).stream().map(this::toModel).toList();
    }

    public List<CourseCard> listManagedCourseCards(String userId, String role) {
        return learningService.listManagedCourseCards(userId, role).stream().map(this::toModel).toList();
    }

    public CourseDetail getCourseDetail(String courseId, String userId) {
        return toModel(learningService.getCourseDetail(courseId, userId));
    }

    public List<LectureItem> getCourseLectures(String courseId) {
        return learningService.getCourseLectures(courseId).stream().map(this::toModel).toList();
    }

    public LectureItem getCourseLecture(String courseId, String lectureId) {
        return toModel(learningService.getCourseLecture(courseId, lectureId));
    }

    public List<MaterialItem> getMaterials(String courseId) {
        return learningService.getMaterials(courseId);
    }

    public MaterialItem addMaterial(String userId, String courseId, String title, String summary, String fileName) {
        return learningService.addMaterial(userId, courseId, title, summary, fileName);
    }

    public List<NoticeItem> getNotices(String courseId) {
        return learningService.getNotices(courseId);
    }

    public NoticeItem addNotice(String userId, String courseId, String title, String content, boolean pinned) {
        return learningService.addNotice(userId, courseId, title, content, pinned);
    }

    private CourseCard toModel(com.myway.backendspring.domain.CourseCard card) {
        if (card == null) return null;
        return new CourseCard(card.id(), card.title(), card.instructor_id(), card.progress_percent());
    }

    private CourseDetail toModel(com.myway.backendspring.domain.CourseDetail detail) {
        if (detail == null) return null;
        return new CourseDetail(
                detail.id(),
                detail.title(),
                detail.instructor_id(),
                detail.lectures().stream().map(this::toModel).toList(),
                detail.progress_percent()
        );
    }

    private LectureItem toModel(com.myway.backendspring.domain.LectureItem item) {
        if (item == null) return null;
        return new LectureItem(item.id(), item.course_id(), item.title(), item.duration_minutes());
    }
}
