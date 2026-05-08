package com.myway.backendspring.domain;

import com.myway.backendspring.persistence.FeatureJdbcStore;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class DemoLearningService {
    private static final String ENROLLMENT_SCOPE = "learning_enrollment";
    private static final String LECTURE_COMPLETION_SCOPE = "learning_lecture_completion";
    private final Map<String, CourseDetail> courses = new LinkedHashMap<>();
    private final Map<String, List<MaterialItem>> materialsByCourse = new ConcurrentHashMap<>();
    private final Map<String, List<NoticeItem>> noticesByCourse = new ConcurrentHashMap<>();
    private final List<EnrollmentItem> enrollments = Collections.synchronizedList(new ArrayList<>());
    private final Set<String> completedLectureKeys = Collections.synchronizedSet(new HashSet<>());
    private final FeatureJdbcStore store;
    private final ActivityEventService activityEventService;

    public DemoLearningService(FeatureJdbcStore store, ActivityEventService activityEventService) {
        this.store = store;
        this.activityEventService = activityEventService;
        initSeedData();
    }

    // Backward-compatible constructor for tests and direct instantiation.
    public DemoLearningService() {
        this.store = null;
        this.activityEventService = null;
        initSeedData();
    }

    private void initSeedData() {
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

    public List<CourseCard> listManagedCourseCards(String userId, String role) {
        return courses.values().stream()
                .filter(c -> "admin".equals(role) || c.instructor_id().equals(userId))
                .map(c -> new CourseCard(c.id(), c.title(), c.instructor_id(), progressPercent(userId, c.id())))
                .toList();
    }

    public CourseDetail createCourse(String instructorId, String title, List<String> lectureTitles) {
        String courseId = "crs_" + UUID.randomUUID();
        List<String> titles = lectureTitles == null || lectureTitles.isEmpty() ? List.of(title) : lectureTitles;
        List<LectureItem> lectures = new ArrayList<>();
        for (int i = 0; i < titles.size(); i++) {
            lectures.add(new LectureItem("lec_" + UUID.randomUUID(), courseId, titles.get(i), 25 + (i * 5)));
        }
        CourseDetail detail = new CourseDetail(courseId, title, instructorId, List.copyOf(lectures), 0);
        courses.put(courseId, detail);
        return detail;
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

    public LectureItem getCourseLecture(String courseId, String lectureId) {
        return getCourseLectures(courseId).stream().filter(l -> l.id().equals(lectureId)).findFirst().orElse(null);
    }

    public DashboardView getDashboard(String userId) {
        List<CourseCard> cards = listCourseCards(userId);
        int enrolled = listEnrollments(userId).size();
        int completed = listCompletedLectureIds(userId).size();
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
        EnrollmentItem existing = findEnrollment(userId, courseId);
        if (existing != null) return existing;
        EnrollmentItem item = new EnrollmentItem(UUID.randomUUID().toString(), userId, courseId);
        if (useStore()) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("id", item.id());
            payload.put("user_id", item.user_id());
            payload.put("course_id", item.course_id());
            payload.put("created_at", Instant.now().toString());
            store.upsertKv(ENROLLMENT_SCOPE, enrollmentKey(userId, courseId), payload);
        } else {
            enrollments.add(item);
        }
        appendActivity(userId, "enrollment", "course", courseId, Map.of("enrollment_id", item.id()));
        return item;
    }

    public List<EnrollmentItem> listEnrollments(String userId) {
        if (!useStore()) {
            return enrollments.stream().filter(e -> e.user_id().equals(userId)).toList();
        }
        return store.listKvByScope(ENROLLMENT_SCOPE).stream()
                .filter(item -> userId.equals(String.valueOf(item.getOrDefault("user_id", ""))))
                .map(item -> new EnrollmentItem(
                        String.valueOf(item.getOrDefault("id", "")),
                        String.valueOf(item.getOrDefault("user_id", "")),
                        String.valueOf(item.getOrDefault("course_id", ""))
                ))
                .filter(item -> !item.id().isBlank() && !item.course_id().isBlank())
                .toList();
    }

    public Map<String, Object> completeLecture(String userId, String lectureId) {
        LectureItem lecture = getLecture(lectureId);
        if (lecture == null) return null;

        boolean enrolled = findEnrollment(userId, lecture.course_id()) != null;
        if (!enrolled) return Map.of("reason", "enrollment_required");

        if (useStore()) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("id", completionKey(userId, lectureId));
            payload.put("user_id", userId);
            payload.put("lecture_id", lectureId);
            payload.put("course_id", lecture.course_id());
            payload.put("completed_at", Instant.now().toString());
            store.upsertKv(LECTURE_COMPLETION_SCOPE, completionKey(userId, lectureId), payload);
        } else {
            completedLectureKeys.add(completionKey(userId, lectureId));
        }

        List<LectureItem> lectures = getCourseLectures(lecture.course_id());
        Set<String> completedLectureIds = listCompletedLectureIds(userId);
        long completed = lectures.stream().filter(l -> completedLectureIds.contains(l.id())).count();
        int total = lectures.size();
        int progress = total == 0 ? 0 : (int) Math.round((completed * 100.0) / total);
        appendActivity(
                userId,
                "lecture_complete",
                "lecture",
                lectureId,
                Map.of("course_id", lecture.course_id(), "progress_percent", progress)
        );

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
        Set<String> completedLectureIds = listCompletedLectureIds(userId);
        long completed = lectures.stream().filter(l -> completedLectureIds.contains(l.id())).count();
        return (int) Math.round((completed * 100.0) / lectures.size());
    }

    private EnrollmentItem findEnrollment(String userId, String courseId) {
        if (!useStore()) {
            return enrollments.stream()
                    .filter(e -> e.user_id().equals(userId) && e.course_id().equals(courseId))
                    .findFirst()
                    .orElse(null);
        }
        Map<String, Object> found = store.getKv(ENROLLMENT_SCOPE, enrollmentKey(userId, courseId));
        if (found == null) {
            return null;
        }
        return new EnrollmentItem(
                String.valueOf(found.getOrDefault("id", "")),
                String.valueOf(found.getOrDefault("user_id", "")),
                String.valueOf(found.getOrDefault("course_id", ""))
        );
    }

    private Set<String> listCompletedLectureIds(String userId) {
        if (!useStore()) {
            return completedLectureKeys.stream()
                    .filter(key -> key.startsWith(userId + ":"))
                    .map(key -> key.substring((userId + ":").length()))
                    .collect(java.util.stream.Collectors.toSet());
        }
        return store.listKvByScope(LECTURE_COMPLETION_SCOPE).stream()
                .filter(item -> userId.equals(String.valueOf(item.getOrDefault("user_id", ""))))
                .map(item -> String.valueOf(item.getOrDefault("lecture_id", "")))
                .filter(lectureId -> !lectureId.isBlank())
                .collect(java.util.stream.Collectors.toSet());
    }

    private String enrollmentKey(String userId, String courseId) {
        return userId + ":" + courseId;
    }

    private String completionKey(String userId, String lectureId) {
        return userId + ":" + lectureId;
    }

    private boolean useStore() {
        return store != null;
    }

    private void appendActivity(String userId, String type, String resourceType, String resourceId, Map<String, Object> metadata) {
        if (activityEventService != null) {
            activityEventService.append(userId, type, resourceType, resourceId, metadata);
        }
    }
}
