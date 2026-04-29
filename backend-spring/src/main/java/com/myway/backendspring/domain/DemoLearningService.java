package com.myway.backendspring.domain;

import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class DemoLearningService {
    private final Map<String, CourseDetail> courses = new LinkedHashMap<>();
    private final Map<String, List<MaterialItem>> materialsByCourse = new ConcurrentHashMap<>();
    private final Map<String, List<NoticeItem>> noticesByCourse = new ConcurrentHashMap<>();
    private final List<EnrollmentItem> enrollments = Collections.synchronizedList(new ArrayList<>());
    private final Set<String> completedLectureKeys = Collections.synchronizedSet(new HashSet<>());

    public DemoLearningService() {
        List<LectureItem> javaLectures = List.of(
                new LectureItem("lec_java_01", "crs_java_01", "Spring Boot 시작", 25),
                new LectureItem("lec_java_02", "crs_java_01", "REST API 설계", 35)
        );
        List<LectureItem> reactLectures = List.of(
                new LectureItem("lec_react_01", "crs_react_01", "React 상태관리", 30),
                new LectureItem("lec_react_02", "crs_react_01", "API 연동", 28)
        );

        courses.put("crs_java_01", new CourseDetail("crs_java_01", "Java Spring 백엔드", "usr_ins_001", javaLectures, 0));
        courses.put("crs_react_01", new CourseDetail("crs_react_01", "React 프론트엔드", "usr_ins_001", reactLectures, 0));

        materialsByCourse.put("crs_java_01", new ArrayList<>(List.of(
                new MaterialItem("mat_java_01", "crs_java_01", "강의 자료집", "Spring 핵심 요약", "spring-handbook.pdf")
        )));
        noticesByCourse.put("crs_java_01", new ArrayList<>(List.of(
                new NoticeItem("not_java_01", "crs_java_01", "과제 공지", "1주차 과제를 제출하세요.", true)
        )));
    }

    public List<CourseCard> listCourseCards(String userId) {
        return courses.values().stream().map(c -> new CourseCard(c.id(), c.title(), c.instructor_id(), progressPercent(userId, c.id()))).toList();
    }

    public CourseDetail getCourseDetail(String courseId, String userId) {
        CourseDetail base = courses.get(courseId);
        if (base == null) return null;
        return new CourseDetail(base.id(), base.title(), base.instructor_id(), base.lectures(), progressPercent(userId, base.id()));
    }

    public List<LectureItem> getCourseLectures(String courseId) {
        CourseDetail detail = courses.get(courseId);
        return detail == null ? List.of() : detail.lectures();
    }

    public LectureItem getLecture(String lectureId) {
        return courses.values().stream().flatMap(c -> c.lectures().stream()).filter(l -> l.id().equals(lectureId)).findFirst().orElse(null);
    }

    public DashboardView getDashboard(String userId) {
        List<CourseCard> cards = listCourseCards(userId);
        int enrolled = (int) enrollments.stream().filter(e -> e.user_id().equals(userId)).count();
        int completed = (int) completedLectureKeys.stream().filter(k -> k.startsWith(userId + ":")).count();
        return new DashboardView(cards, enrolled, completed);
    }

    public List<MaterialItem> getMaterials(String courseId) {
        return materialsByCourse.getOrDefault(courseId, List.of());
    }

    public List<NoticeItem> getNotices(String courseId) {
        return noticesByCourse.getOrDefault(courseId, List.of());
    }

    public MaterialItem addMaterial(String userId, String courseId, String title, String summary, String fileName) {
        MaterialItem created = new MaterialItem(UUID.randomUUID().toString(), courseId, title, summary, fileName);
        materialsByCourse.computeIfAbsent(courseId, k -> new ArrayList<>()).add(created);
        return created;
    }

    public NoticeItem addNotice(String userId, String courseId, String title, String content, boolean pinned) {
        NoticeItem created = new NoticeItem(UUID.randomUUID().toString(), courseId, title, content, pinned);
        noticesByCourse.computeIfAbsent(courseId, k -> new ArrayList<>()).add(created);
        return created;
    }

    public EnrollmentItem enroll(String userId, String courseId) {
        EnrollmentItem existing = enrollments.stream().filter(e -> e.user_id().equals(userId) && e.course_id().equals(courseId)).findFirst().orElse(null);
        if (existing != null) return existing;
        EnrollmentItem item = new EnrollmentItem(UUID.randomUUID().toString(), userId, courseId);
        enrollments.add(item);
        return item;
    }

    public List<EnrollmentItem> listEnrollments(String userId) {
        return enrollments.stream().filter(e -> e.user_id().equals(userId)).toList();
    }

    public Map<String, Object> completeLecture(String userId, String lectureId) {
        LectureItem lecture = getLecture(lectureId);
        if (lecture == null) return null;

        boolean enrolled = enrollments.stream().anyMatch(e -> e.user_id().equals(userId) && e.course_id().equals(lecture.course_id()));
        if (!enrolled) return Map.of("reason", "enrollment_required");

        completedLectureKeys.add(userId + ":" + lectureId);

        List<LectureItem> lectures = getCourseLectures(lecture.course_id());
        long completed = lectures.stream().filter(l -> completedLectureKeys.contains(userId + ":" + l.id())).count();
        int total = lectures.size();
        int progress = total == 0 ? 0 : (int) Math.round((completed * 100.0) / total);

        return Map.of(
                "lecture_id", lectureId,
                "course_id", lecture.course_id(),
                "progress_percent", progress,
                "completed_lectures", completed,
                "total_lectures", total
        );
    }

    public SmartChatResult chat(String message) {
        String answer = "[Spring 백엔드 응답] " + (message == null || message.isBlank() ? "질문을 입력해 주세요." : message);
        return new SmartChatResult(answer, List.of("course:crs_java_01", "lecture:lec_java_01"));
    }

    private int progressPercent(String userId, String courseId) {
        List<LectureItem> lectures = getCourseLectures(courseId);
        if (lectures.isEmpty()) return 0;
        long completed = lectures.stream().filter(l -> completedLectureKeys.contains(userId + ":" + l.id())).count();
        return (int) Math.round((completed * 100.0) / lectures.size());
    }
}
