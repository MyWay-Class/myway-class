package com.myway.backendspring.domain;

import com.myway.backendspring.persistence.FeatureJdbcStore;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@Component
public class CourseCatalogStoreSupport {
    public List<CourseDetail> listAllCourses(FeatureJdbcStore store, String scope, LearningPayloadMapper mapper) {
        return store.listKvByScope(scope).stream()
                .map(mapper::fromCoursePayload)
                .filter(Objects::nonNull)
                .toList();
    }

    public CourseDetail findCourse(FeatureJdbcStore store, String scope, String courseId, LearningPayloadMapper mapper) {
        return mapper.fromCoursePayload(store.getKv(scope, courseId));
    }

    public void seedStoreDataIfMissing(FeatureJdbcStore store, String courseScope, String materialScope, String noticeScope, LearningPayloadMapper mapper) {
        if (!store.listKvByScope(courseScope).isEmpty()) {
            return;
        }
        List<LectureItem> javaLectures = List.of(
                new LectureItem("lec_java_01", "crs_java_01", "Spring Boot 시작", 25),
                new LectureItem("lec_java_02", "crs_java_01", "REST API 설계", 35)
        );
        List<LectureItem> reactLectures = List.of(
                new LectureItem("lec_react_01", "crs_react_01", "React 상태관리", 30),
                new LectureItem("lec_react_02", "crs_react_01", "API 연동", 28)
        );
        CourseDetail java = new CourseDetail("crs_java_01", "Java Spring 백엔드", "usr_ins_001", javaLectures, 0);
        CourseDetail react = new CourseDetail("crs_react_01", "React 프론트엔드", "usr_ins_001", reactLectures, 0);
        store.upsertKv(courseScope, java.id(), mapper.toCoursePayload(java));
        store.upsertKv(courseScope, react.id(), mapper.toCoursePayload(react));
        store.upsertKv(materialScope, "mat_java_01", Map.of(
                "id", "mat_java_01",
                "course_id", "crs_java_01",
                "title", "강의 자료집",
                "summary", "Spring 핵심 요약",
                "file_name", "spring-handbook.pdf"
        ));
        store.upsertKv(noticeScope, "not_java_01", Map.of(
                "id", "not_java_01",
                "course_id", "crs_java_01",
                "title", "과제 공지",
                "content", "1주차 과제를 제출하세요.",
                "pinned", true
        ));
    }
}
