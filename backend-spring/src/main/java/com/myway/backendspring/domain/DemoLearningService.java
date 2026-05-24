package com.myway.backendspring.domain;

import com.myway.backendspring.persistence.FeatureJdbcStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class DemoLearningService {
    private static final String ENROLLMENT_SCOPE = "learning_enrollment";
    private static final String LECTURE_COMPLETION_SCOPE = "learning_lecture_completion";
    private static final String COURSE_SCOPE = "learning_course";
    private static final String MATERIAL_SCOPE = "learning_material";
    private static final String NOTICE_SCOPE = "learning_notice";
    private static final String LECTURE_META_SCOPE = "learning_lecture_meta";
    private static final String TRANSCRIPT_SCOPE = "media_transcript";
    private static final String EXTRACTION_SCOPE = "media_extraction";
    private static final String SPEAKER_REVIEW_SCOPE = "media_speaker_review";
    private static final String DEFAULT_DEMO_STUDENT_ID = "usr_std_001";
    private final Map<String, CourseDetail> courses = new LinkedHashMap<>();
    private final Map<String, List<MaterialItem>> materialsByCourse = new ConcurrentHashMap<>();
    private final Map<String, List<NoticeItem>> noticesByCourse = new ConcurrentHashMap<>();
    private final List<EnrollmentItem> enrollments = Collections.synchronizedList(new ArrayList<>());
    private final Set<String> completedLectureKeys = Collections.synchronizedSet(new HashSet<>());
    private final FeatureJdbcStore store;
    private final ActivityEventService activityEventService;

    @Autowired
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
        if (useStore()) {
            seedStoreDataIfMissing();
            ensureDefaultDemoStudentEnrollmentsInStore();
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

        courses.put("crs_java_01", new CourseDetail("crs_java_01", "Java Spring 백엔드", "usr_ins_001", javaLectures, 0));
        courses.put("crs_react_01", new CourseDetail("crs_react_01", "React 프론트엔드", "usr_ins_001", reactLectures, 0));

        materialsByCourse.put("crs_java_01", new ArrayList<>(List.of(
                new MaterialItem("mat_java_01", "crs_java_01", "강의 자료집", "Spring 핵심 요약", "spring-handbook.pdf")
        )));
        noticesByCourse.put("crs_java_01", new ArrayList<>(List.of(
                new NoticeItem("not_java_01", "crs_java_01", "과제 공지", "1주차 과제를 제출하세요.", true)
        )));
        ensureDefaultDemoStudentEnrollmentsInMemory();
    }

    public List<CourseCard> listCourseCards(String userId) {
        return listAllCourses().stream().map(c -> new CourseCard(c.id(), c.title(), c.instructor_id(), progressPercent(userId, c.id()))).toList();
    }

    public List<CourseCard> listManagedCourseCards(String userId, String role) {
        return listAllCourses().stream()
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
        if (useStore()) {
            store.upsertKv(COURSE_SCOPE, courseId, toCoursePayload(detail));
        } else {
            courses.put(courseId, detail);
        }
        return detail;
    }

    public CourseDetail getCourseDetail(String courseId, String userId) {
        CourseDetail base = findCourse(courseId);
        if (base == null) return null;
        List<LectureItem> alignedLectures = alignLectureDurations(base.lectures());
        return new CourseDetail(base.id(), base.title(), base.instructor_id(), alignedLectures, progressPercent(userId, base.id()));
    }

    public List<LectureItem> getCourseLectures(String courseId) {
        CourseDetail detail = findCourse(courseId);
        return detail == null ? List.of() : alignLectureDurations(detail.lectures());
    }

    public LectureItem getLecture(String lectureId) {
        return listAllCourses().stream().flatMap(c -> c.lectures().stream()).filter(l -> l.id().equals(lectureId)).findFirst().orElse(null);
    }

    public LectureItem getCourseLecture(String courseId, String lectureId) {
        return getCourseLectures(courseId).stream().filter(l -> l.id().equals(lectureId)).findFirst().orElse(null);
    }

    public List<LectureItem> listAllLectures() {
        return listAllCourses().stream()
                .flatMap(course -> course.lectures().stream())
                .toList();
    }

    public DashboardView getDashboard(String userId) {
        List<CourseCard> cards = listCourseCards(userId);
        int enrolled = listEnrollments(userId).size();
        int completed = listCompletedLectureIds(userId).size();
        return new DashboardView(cards, enrolled, completed);
    }

    public List<MaterialItem> getMaterials(String courseId) {
        if (useStore()) {
            return store.listKvByScope(MATERIAL_SCOPE).stream()
                    .map(this::fromMaterialPayload)
                    .filter(Objects::nonNull)
                    .filter(m -> courseId.equals(m.course_id()))
                    .toList();
        }
        return materialsByCourse.getOrDefault(courseId, List.of());
    }

    public List<NoticeItem> getNotices(String courseId) {
        if (useStore()) {
            return store.listKvByScope(NOTICE_SCOPE).stream()
                    .map(this::fromNoticePayload)
                    .filter(Objects::nonNull)
                    .filter(n -> courseId.equals(n.course_id()))
                    .toList();
        }
        return noticesByCourse.getOrDefault(courseId, List.of());
    }

    public MaterialItem addMaterial(String userId, String courseId, String title, String summary, String fileName) {
        MaterialItem created = new MaterialItem(UUID.randomUUID().toString(), courseId, title, summary, fileName);
        if (useStore()) {
            store.upsertKv(MATERIAL_SCOPE, created.id(), toMaterialPayload(created));
        } else {
            materialsByCourse.computeIfAbsent(courseId, k -> new ArrayList<>()).add(created);
        }
        return created;
    }

    public NoticeItem addNotice(String userId, String courseId, String title, String content, boolean pinned) {
        NoticeItem created = new NoticeItem(UUID.randomUUID().toString(), courseId, title, content, pinned);
        if (useStore()) {
            store.upsertKv(NOTICE_SCOPE, created.id(), toNoticePayload(created));
        } else {
            noticesByCourse.computeIfAbsent(courseId, k -> new ArrayList<>()).add(created);
        }
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

    private void ensureDefaultDemoStudentEnrollmentsInMemory() {
        for (CourseDetail course : new ArrayList<>(courses.values())) {
            if (findEnrollment(DEFAULT_DEMO_STUDENT_ID, course.id()) == null) {
                enrollments.add(new EnrollmentItem(UUID.randomUUID().toString(), DEFAULT_DEMO_STUDENT_ID, course.id()));
            }
        }
    }

    private void ensureDefaultDemoStudentEnrollmentsInStore() {
        for (CourseDetail course : listAllCourses()) {
            if (findEnrollment(DEFAULT_DEMO_STUDENT_ID, course.id()) != null) {
                continue;
            }
            Map<String, Object> payload = new HashMap<>();
            payload.put("id", UUID.randomUUID().toString());
            payload.put("user_id", DEFAULT_DEMO_STUDENT_ID);
            payload.put("course_id", course.id());
            payload.put("created_at", Instant.now().toString());
            store.upsertKv(ENROLLMENT_SCOPE, enrollmentKey(DEFAULT_DEMO_STUDENT_ID, course.id()), payload);
        }
    }

    private List<LectureItem> alignLectureDurations(List<LectureItem> lectures) {
        if (lectures == null || lectures.isEmpty()) {
            return List.of();
        }
        if (!useStore()) {
            return lectures;
        }
        return lectures.stream()
                .map(this::alignLectureDuration)
                .toList();
    }

    private LectureItem alignLectureDuration(LectureItem lecture) {
        if (lecture == null || lecture.id() == null || lecture.id().isBlank()) {
            return lecture;
        }
        LectureItem lectureWithMeta = attachLectureMeta(lecture);
        int fallbackMinutes = Math.max(1, lecture.duration_minutes());
        int resolvedMinutes = resolveDurationMinutesFromMedia(lecture.id(), fallbackMinutes);
        if (resolvedMinutes == lecture.duration_minutes()) {
            return lectureWithMeta;
        }
        return new LectureItem(
                lecture.id(),
                lecture.course_id(),
                lecture.title(),
                resolvedMinutes,
                lectureWithMeta.content_text(),
                lectureWithMeta.transcript_excerpt(),
                lectureWithMeta.instructor_name()
        );
    }

    private int resolveDurationMinutesFromMedia(String lectureId, int fallbackMinutes) {
        Map<String, Object> transcript = store.getKv(TRANSCRIPT_SCOPE, lectureId);
        int fromTranscript = toDurationMinutes(transcript == null ? null : transcript.get("duration_ms"));
        if (fromTranscript > 0) {
            return fromTranscript;
        }

        return store.listKvByScope(EXTRACTION_SCOPE).stream()
                .filter(row -> lectureId.equals(String.valueOf(row.getOrDefault("lecture_id", "")).trim()))
                .map(row -> toDurationMinutes(row.get("audio_duration_ms")))
                .filter(duration -> duration > 0)
                .findFirst()
                .orElse(fallbackMinutes);
    }

    private int toDurationMinutes(Object rawDurationMs) {
        if (rawDurationMs == null) {
            return 0;
        }
        long durationMs;
        if (rawDurationMs instanceof Number number) {
            durationMs = number.longValue();
        } else {
            try {
                durationMs = Long.parseLong(String.valueOf(rawDurationMs).trim());
            } catch (Exception ignored) {
                return 0;
            }
        }
        if (durationMs <= 0) {
            return 0;
        }
        return (int) Math.max(1L, Math.round(durationMs / 60000.0d));
    }

    public Map<String, Object> syncLectureMetadataFromTranscripts(boolean overwriteExisting) {
        if (!useStore()) {
            return Map.of(
                    "updated_count", 0,
                    "skipped_count", 0,
                    "items", List.of()
            );
        }

        List<Map<String, Object>> items = new ArrayList<>();
        int updated = 0;
        int skipped = 0;
        for (LectureItem lecture : listAllLectures()) {
            String lectureId = lecture.id();
            Map<String, Object> transcript = store.getKv(TRANSCRIPT_SCOPE, lectureId);
            if (transcript == null) {
                skipped += 1;
                items.add(Map.of("lecture_id", lectureId, "status", "SKIPPED", "reason", "TRANSCRIPT_MISSING"));
                continue;
            }

            Map<String, Object> current = store.getKv(LECTURE_META_SCOPE, lectureId);
            Map<String, Object> suggested = buildLectureMetaFromTranscript(lecture, transcript);
            if (suggested == null || suggested.isEmpty()) {
                skipped += 1;
                items.add(Map.of("lecture_id", lectureId, "status", "SKIPPED", "reason", "SUGGESTION_EMPTY"));
                continue;
            }

            Map<String, Object> merged = mergeLectureMeta(current, suggested, overwriteExisting);
            store.upsertKv(LECTURE_META_SCOPE, lectureId, merged);
            updated += 1;
            items.add(Map.of("lecture_id", lectureId, "status", "UPDATED"));
        }
        return Map.of(
                "updated_count", updated,
                "skipped_count", skipped,
                "items", items
        );
    }

    public Map<String, Object> syncLectureMetadataForLectureFromTranscript(String lectureId, boolean overwriteExisting) {
        if (!useStore()) {
            return Map.of(
                    "lecture_id", lectureId == null ? "" : lectureId,
                    "status", "SKIPPED",
                    "reason", "STORE_DISABLED"
            );
        }
        String normalizedLectureId = lectureId == null ? "" : lectureId.trim();
        if (normalizedLectureId.isBlank()) {
            return Map.of(
                    "lecture_id", "",
                    "status", "SKIPPED",
                    "reason", "LECTURE_ID_REQUIRED"
            );
        }

        LectureItem lecture = getLecture(normalizedLectureId);
        if (lecture == null) {
            return Map.of(
                    "lecture_id", normalizedLectureId,
                    "status", "SKIPPED",
                    "reason", "LECTURE_NOT_FOUND"
            );
        }

        Map<String, Object> transcript = store.getKv(TRANSCRIPT_SCOPE, normalizedLectureId);
        if (transcript == null) {
            return Map.of(
                    "lecture_id", normalizedLectureId,
                    "status", "SKIPPED",
                    "reason", "TRANSCRIPT_MISSING"
            );
        }

        Map<String, Object> current = store.getKv(LECTURE_META_SCOPE, normalizedLectureId);
        Map<String, Object> suggested = buildLectureMetaFromTranscript(lecture, transcript);
        if (suggested == null || suggested.isEmpty()) {
            return Map.of(
                    "lecture_id", normalizedLectureId,
                    "status", "SKIPPED",
                    "reason", "SUGGESTION_EMPTY"
            );
        }

        Map<String, Object> merged = mergeLectureMeta(current, suggested, overwriteExisting);
        store.upsertKv(LECTURE_META_SCOPE, normalizedLectureId, merged);
        return Map.of(
                "lecture_id", normalizedLectureId,
                "status", "UPDATED"
        );
    }

    private void seedStoreDataIfMissing() {
        if (!store.listKvByScope(COURSE_SCOPE).isEmpty()) {
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
        store.upsertKv(COURSE_SCOPE, java.id(), toCoursePayload(java));
        store.upsertKv(COURSE_SCOPE, react.id(), toCoursePayload(react));
        store.upsertKv(MATERIAL_SCOPE, "mat_java_01", Map.of(
                "id", "mat_java_01",
                "course_id", "crs_java_01",
                "title", "강의 자료집",
                "summary", "Spring 핵심 요약",
                "file_name", "spring-handbook.pdf"
        ));
        store.upsertKv(NOTICE_SCOPE, "not_java_01", Map.of(
                "id", "not_java_01",
                "course_id", "crs_java_01",
                "title", "과제 공지",
                "content", "1주차 과제를 제출하세요.",
                "pinned", true
        ));
    }

    private List<CourseDetail> listAllCourses() {
        if (!useStore()) return new ArrayList<>(courses.values());
        return store.listKvByScope(COURSE_SCOPE).stream()
                .map(this::fromCoursePayload)
                .filter(Objects::nonNull)
                .toList();
    }

    private CourseDetail findCourse(String courseId) {
        if (!useStore()) return courses.get(courseId);
        return fromCoursePayload(store.getKv(COURSE_SCOPE, courseId));
    }

    private Map<String, Object> toCoursePayload(CourseDetail detail) {
        List<Map<String, Object>> lectures = detail.lectures().stream()
                .map(l -> {
                    Map<String, Object> row = new HashMap<>();
                    row.put("id", l.id());
                    row.put("course_id", l.course_id());
                    row.put("title", l.title());
                    row.put("duration_minutes", l.duration_minutes());
                    row.put("content_text", l.content_text());
                    row.put("transcript_excerpt", l.transcript_excerpt());
                    row.put("instructor_name", l.instructor_name());
                    return row;
                })
                .toList();
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", detail.id());
        payload.put("title", detail.title());
        payload.put("instructor_id", detail.instructor_id());
        payload.put("lectures", lectures);
        return payload;
    }

    @SuppressWarnings("unchecked")
    private CourseDetail fromCoursePayload(Map<String, Object> payload) {
        if (payload == null) return null;
        String id = String.valueOf(payload.getOrDefault("id", "")).trim();
        if (id.isBlank()) return null;
        String title = String.valueOf(payload.getOrDefault("title", "")).trim();
        String instructorId = String.valueOf(payload.getOrDefault("instructor_id", "")).trim();
        List<LectureItem> lectures = new ArrayList<>();
        Object rawLectures = payload.get("lectures");
        if (rawLectures instanceof List<?> list) {
            for (Object row : list) {
                if (!(row instanceof Map<?, ?> map)) continue;
                String lectureId = String.valueOf(map.containsKey("id") ? map.get("id") : "").trim();
                String courseId = String.valueOf(map.containsKey("course_id") ? map.get("course_id") : id).trim();
                String lectureTitle = String.valueOf(map.containsKey("title") ? map.get("title") : "").trim();
                int duration = parseInt(map.get("duration_minutes"), 0);
                String contentText = String.valueOf(map.containsKey("content_text") ? map.get("content_text") : "").trim();
                String transcriptExcerpt = String.valueOf(map.containsKey("transcript_excerpt") ? map.get("transcript_excerpt") : "").trim();
                String instructorName = String.valueOf(map.containsKey("instructor_name") ? map.get("instructor_name") : "").trim();
                if (!lectureId.isBlank() && !lectureTitle.isBlank()) {
                    lectures.add(new LectureItem(lectureId, courseId, lectureTitle, duration, contentText, transcriptExcerpt, instructorName));
                }
            }
        }
        return new CourseDetail(id, title, instructorId, lectures, 0);
    }

    private Map<String, Object> toMaterialPayload(MaterialItem item) {
        return Map.of(
                "id", item.id(),
                "course_id", item.course_id(),
                "title", item.title(),
                "summary", item.summary(),
                "file_name", item.file_name()
        );
    }

    private MaterialItem fromMaterialPayload(Map<String, Object> payload) {
        if (payload == null) return null;
        String id = String.valueOf(payload.getOrDefault("id", "")).trim();
        String courseId = String.valueOf(payload.getOrDefault("course_id", "")).trim();
        if (id.isBlank() || courseId.isBlank()) return null;
        return new MaterialItem(
                id,
                courseId,
                String.valueOf(payload.getOrDefault("title", "")),
                String.valueOf(payload.getOrDefault("summary", "")),
                String.valueOf(payload.getOrDefault("file_name", ""))
        );
    }

    private Map<String, Object> toNoticePayload(NoticeItem item) {
        return Map.of(
                "id", item.id(),
                "course_id", item.course_id(),
                "title", item.title(),
                "content", item.content(),
                "pinned", item.pinned()
        );
    }

    private NoticeItem fromNoticePayload(Map<String, Object> payload) {
        if (payload == null) return null;
        String id = String.valueOf(payload.getOrDefault("id", "")).trim();
        String courseId = String.valueOf(payload.getOrDefault("course_id", "")).trim();
        if (id.isBlank() || courseId.isBlank()) return null;
        return new NoticeItem(
                id,
                courseId,
                String.valueOf(payload.getOrDefault("title", "")),
                String.valueOf(payload.getOrDefault("content", "")),
                Boolean.parseBoolean(String.valueOf(payload.getOrDefault("pinned", false)))
        );
    }

    private int parseInt(Object value, int fallback) {
        if (value instanceof Number n) return n.intValue();
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (Exception ignored) {
            return fallback;
        }
    }

    private void appendActivity(String userId, String type, String resourceType, String resourceId, Map<String, Object> metadata) {
        if (activityEventService != null) {
            activityEventService.append(userId, type, resourceType, resourceId, metadata);
        }
    }

    private LectureItem attachLectureMeta(LectureItem lecture) {
        if (!useStore()) {
            return lecture;
        }
        String lectureId = lecture.id();
        if (lectureId == null || lectureId.isBlank()) {
            return lecture;
        }
        Map<String, Object> currentMeta = store.getKv(LECTURE_META_SCOPE, lectureId);
        if (isLectureMetaMissing(currentMeta)) {
            Map<String, Object> transcript = store.getKv(TRANSCRIPT_SCOPE, lectureId);
            if (transcript != null) {
                Map<String, Object> suggested = buildLectureMetaFromTranscript(lecture, transcript);
                Map<String, Object> merged = mergeLectureMeta(currentMeta, suggested, false);
                store.upsertKv(LECTURE_META_SCOPE, lectureId, merged);
                currentMeta = merged;
            }
        }
        String content = chooseText(
                asText(currentMeta == null ? null : currentMeta.get("content_text")),
                lecture.content_text(),
                "강의 핵심 내용을 정리 중입니다."
        );
        String excerpt = chooseText(
                asText(currentMeta == null ? null : currentMeta.get("transcript_excerpt")),
                lecture.transcript_excerpt(),
                ""
        );
        String instructorName = chooseText(
                asText(currentMeta == null ? null : currentMeta.get("instructor_name")),
                lecture.instructor_name(),
                ""
        );
        return new LectureItem(
                lecture.id(),
                lecture.course_id(),
                lecture.title(),
                lecture.duration_minutes(),
                content,
                excerpt,
                instructorName
        );
    }

    private boolean isLectureMetaMissing(Map<String, Object> meta) {
        if (meta == null) return true;
        return asText(meta.get("content_text")).isBlank()
                && asText(meta.get("transcript_excerpt")).isBlank()
                && asText(meta.get("instructor_name")).isBlank();
    }

    private Map<String, Object> buildLectureMetaFromTranscript(LectureItem lecture, Map<String, Object> transcript) {
        String lectureId = lecture == null ? "" : lecture.id();
        String fullText = asText(transcript.get("full_text"));
        if (fullText.isBlank()) {
            Object segmentsRaw = transcript.get("segments");
            if (segmentsRaw instanceof List<?> segments) {
                StringBuilder builder = new StringBuilder();
                for (Object segment : segments) {
                    if (!(segment instanceof Map<?, ?> map)) continue;
                    Object textRaw = map.containsKey("text") ? map.get("text") : "";
                    String text = String.valueOf(textRaw).trim();
                    if (!text.isBlank()) {
                        if (!builder.isEmpty()) builder.append(' ');
                        builder.append(text);
                    }
                }
                fullText = builder.toString();
            }
        }

        Map<String, Object> speakerReview = store.getKv(SPEAKER_REVIEW_SCOPE, lectureId);
        String instructorName = asText(speakerReview == null ? null : speakerReview.get("instructor_name"));
        if (instructorName.isBlank()) {
            instructorName = asText(lecture == null ? null : lecture.instructor_name());
        }
        String excerpt = trimToLimit(fullText, 180);
        String content = trimToLimit(fullText, 1200);
        Map<String, Object> meta = new HashMap<>();
        meta.put("lecture_id", lectureId);
        meta.put("content_text", content);
        meta.put("transcript_excerpt", excerpt);
        meta.put("instructor_name", instructorName);
        meta.put("updated_at", Instant.now().toString());
        return meta;
    }

    private Map<String, Object> mergeLectureMeta(Map<String, Object> current, Map<String, Object> suggested, boolean overwriteExisting) {
        Map<String, Object> merged = new HashMap<>();
        if (current != null) {
            merged.putAll(current);
        }
        for (String field : List.of("lecture_id", "updated_at")) {
            if (suggested.containsKey(field)) {
                merged.put(field, suggested.get(field));
            }
        }
        for (String field : List.of("content_text", "transcript_excerpt", "instructor_name")) {
            String currentText = asText(merged.get(field));
            String nextText = asText(suggested.get(field));
            if (overwriteExisting || currentText.isBlank()) {
                if (!nextText.isBlank()) {
                    merged.put(field, nextText);
                }
            }
        }
        merged.put("updated_at", Instant.now().toString());
        return merged;
    }

    private String trimToLimit(String value, int limit) {
        String normalized = asText(value);
        if (normalized.length() <= limit) {
            return normalized;
        }
        return normalized.substring(0, limit).trim();
    }

    private String chooseText(String first, String second, String fallback) {
        String a = asText(first);
        if (!a.isBlank()) return a;
        String b = asText(second);
        if (!b.isBlank()) return b;
        return fallback == null ? "" : fallback;
    }

    private String asText(Object value) {
        if (value == null) return "";
        return String.valueOf(value).trim();
    }
}
