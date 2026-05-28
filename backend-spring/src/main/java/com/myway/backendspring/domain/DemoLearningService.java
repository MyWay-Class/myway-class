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
    private final LearningProgressCalculator progressCalculator;
    private final LectureMetadataSyncSupport lectureMetadataSyncSupport;
    private final LearningEnrollmentStoreSupport learningEnrollmentStoreSupport;
    private final LearningPayloadMapper learningPayloadMapper;
    private final LectureDurationResolver lectureDurationResolver;
    private final CourseCatalogStoreSupport courseCatalogStoreSupport;
    private final LearningContentStoreSupport learningContentStoreSupport;
    private final LectureMetadataSyncServiceSupport lectureMetadataSyncServiceSupport;
    private final DemoLearningProgressSupport demoLearningProgressSupport;
    private final DemoLearningMetadataSupport demoLearningMetadataSupport;
    private final DemoLearningBootstrapSupport demoLearningBootstrapSupport;
    private final DemoLearningCourseAccessSupport demoLearningCourseAccessSupport;

    @Autowired
    public DemoLearningService(
            FeatureJdbcStore store,
            ActivityEventService activityEventService,
            LearningProgressCalculator progressCalculator,
            LectureMetadataSyncSupport lectureMetadataSyncSupport,
            LearningEnrollmentStoreSupport learningEnrollmentStoreSupport,
            LearningPayloadMapper learningPayloadMapper,
            LectureDurationResolver lectureDurationResolver,
            CourseCatalogStoreSupport courseCatalogStoreSupport,
            LearningContentStoreSupport learningContentStoreSupport,
            LectureMetadataSyncServiceSupport lectureMetadataSyncServiceSupport,
            DemoLearningProgressSupport demoLearningProgressSupport,
            DemoLearningMetadataSupport demoLearningMetadataSupport,
            DemoLearningBootstrapSupport demoLearningBootstrapSupport,
            DemoLearningCourseAccessSupport demoLearningCourseAccessSupport
    ) {
        this.store = store;
        this.activityEventService = activityEventService;
        this.progressCalculator = progressCalculator;
        this.lectureMetadataSyncSupport = lectureMetadataSyncSupport;
        this.learningEnrollmentStoreSupport = learningEnrollmentStoreSupport;
        this.learningPayloadMapper = learningPayloadMapper;
        this.lectureDurationResolver = lectureDurationResolver;
        this.courseCatalogStoreSupport = courseCatalogStoreSupport;
        this.learningContentStoreSupport = learningContentStoreSupport;
        this.lectureMetadataSyncServiceSupport = lectureMetadataSyncServiceSupport;
        this.demoLearningProgressSupport = demoLearningProgressSupport;
        this.demoLearningMetadataSupport = demoLearningMetadataSupport;
        this.demoLearningBootstrapSupport = demoLearningBootstrapSupport;
        this.demoLearningCourseAccessSupport = demoLearningCourseAccessSupport;
        initSeedData();
    }

    // Backward-compatible constructor for tests and direct instantiation.
    public DemoLearningService() {
        this.store = null;
        this.activityEventService = null;
        this.progressCalculator = new LearningProgressCalculator();
        this.lectureMetadataSyncSupport = new LectureMetadataSyncSupport();
        this.learningEnrollmentStoreSupport = new LearningEnrollmentStoreSupport();
        this.learningPayloadMapper = new LearningPayloadMapper();
        this.lectureDurationResolver = new LectureDurationResolver();
        this.courseCatalogStoreSupport = new CourseCatalogStoreSupport();
        this.learningContentStoreSupport = new LearningContentStoreSupport();
        this.lectureMetadataSyncServiceSupport = new LectureMetadataSyncServiceSupport();
        this.demoLearningProgressSupport = new DemoLearningProgressSupport();
        this.demoLearningMetadataSupport = new DemoLearningMetadataSupport();
        this.demoLearningBootstrapSupport = new DemoLearningBootstrapSupport();
        this.demoLearningCourseAccessSupport = new DemoLearningCourseAccessSupport();
        initSeedData();
    }

    private void initSeedData() {
        if (useStore()) {
            courseCatalogStoreSupport.seedStoreDataIfMissing(store, COURSE_SCOPE, MATERIAL_SCOPE, NOTICE_SCOPE, learningPayloadMapper);
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
            store.upsertKv(COURSE_SCOPE, courseId, learningPayloadMapper.toCoursePayload(detail));
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
        return learningContentStoreSupport.getMaterials(
                useStore(),
                store,
                MATERIAL_SCOPE,
                learningPayloadMapper,
                materialsByCourse,
                courseId
        );
    }

    public List<NoticeItem> getNotices(String courseId) {
        return learningContentStoreSupport.getNotices(
                useStore(),
                store,
                NOTICE_SCOPE,
                learningPayloadMapper,
                noticesByCourse,
                courseId
        );
    }

    public MaterialItem addMaterial(String userId, String courseId, String title, String summary, String fileName) {
        return learningContentStoreSupport.addMaterial(
                useStore(),
                store,
                MATERIAL_SCOPE,
                learningPayloadMapper,
                materialsByCourse,
                courseId,
                title,
                summary,
                fileName
        );
    }

    public NoticeItem addNotice(String userId, String courseId, String title, String content, boolean pinned) {
        return learningContentStoreSupport.addNotice(
                useStore(),
                store,
                NOTICE_SCOPE,
                learningPayloadMapper,
                noticesByCourse,
                courseId,
                title,
                content,
                pinned
        );
    }

    public EnrollmentItem enroll(String userId, String courseId) {
        EnrollmentItem existing = findEnrollment(userId, courseId);
        if (existing != null) return existing;
        EnrollmentItem item = new EnrollmentItem(UUID.randomUUID().toString(), userId, courseId);
        if (useStore()) {
            learningEnrollmentStoreSupport.upsertEnrollment(store, ENROLLMENT_SCOPE, item);
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
        return learningEnrollmentStoreSupport.listEnrollments(store, ENROLLMENT_SCOPE, userId);
    }

    public Map<String, Object> completeLecture(String userId, String lectureId) {
        LectureItem lecture = getLecture(lectureId);
        if (lecture == null) return null;

        boolean enrolled = findEnrollment(userId, lecture.course_id()) != null;
        if (!enrolled) return Map.of("reason", "enrollment_required");

        if (useStore()) {
            learningEnrollmentStoreSupport.upsertLectureCompletion(
                    store,
                    LECTURE_COMPLETION_SCOPE,
                    userId,
                    lectureId,
                    lecture.course_id()
            );
        } else {
            completedLectureKeys.add(completionKey(userId, lectureId));
        }

        List<LectureItem> lectures = getCourseLectures(lecture.course_id());
        Set<String> completedLectureIds = listCompletedLectureIds(userId);
        Map<String, Object> summary = progressCalculator.completionSummary(
                lectureId,
                lecture.course_id(),
                lectures,
                completedLectureIds
        );
        appendActivity(
                userId,
                "lecture_complete",
                "lecture",
                lectureId,
                Map.of(
                        "course_id", lecture.course_id(),
                        "progress_percent", summary.get("progress_percent")
                )
        );
        return summary;
    }

    public SmartChatResult chat(String message) {
        String answer = "[Spring 백엔드 응답] " + (message == null || message.isBlank() ? "질문을 입력해 주세요." : message);
        return new SmartChatResult(answer, List.of("course:crs_java_01", "lecture:lec_java_01"));
    }

    private int progressPercent(String userId, String courseId) {
        List<LectureItem> lectures = getCourseLectures(courseId);
        return demoLearningProgressSupport.progressPercent(
                userId,
                courseId,
                lectures,
                completedLectureKeys,
                useStore(),
                store,
                learningEnrollmentStoreSupport,
                progressCalculator,
                LECTURE_COMPLETION_SCOPE
        );
    }

    private EnrollmentItem findEnrollment(String userId, String courseId) {
        return demoLearningProgressSupport.findEnrollment(
                userId,
                courseId,
                enrollments,
                useStore(),
                store,
                learningEnrollmentStoreSupport,
                ENROLLMENT_SCOPE
        );
    }

    private Set<String> listCompletedLectureIds(String userId) {
        return demoLearningProgressSupport.listCompletedLectureIds(
                userId,
                completedLectureKeys,
                useStore(),
                store,
                learningEnrollmentStoreSupport,
                LECTURE_COMPLETION_SCOPE
        );
    }

    private String completionKey(String userId, String lectureId) {
        return demoLearningProgressSupport.completionKey(userId, lectureId, learningEnrollmentStoreSupport);
    }

    private boolean useStore() {
        return store != null;
    }

    private void ensureDefaultDemoStudentEnrollmentsInMemory() {
        demoLearningBootstrapSupport.ensureDefaultDemoStudentEnrollmentsInMemory(
                DEFAULT_DEMO_STUDENT_ID,
                enrollments,
                new ArrayList<>(courses.values()),
                this::findEnrollment
        );
    }

    private void ensureDefaultDemoStudentEnrollmentsInStore() {
        demoLearningBootstrapSupport.ensureDefaultDemoStudentEnrollmentsInStore(
                store,
                ENROLLMENT_SCOPE,
                DEFAULT_DEMO_STUDENT_ID,
                listAllCourses(),
                learningEnrollmentStoreSupport
        );
    }

    private List<LectureItem> alignLectureDurations(List<LectureItem> lectures) {
        return demoLearningMetadataSupport.alignLectureDurations(lectures, useStore(), this::alignLectureDuration);
    }

    private LectureItem alignLectureDuration(LectureItem lecture) {
        return demoLearningMetadataSupport.alignLectureDuration(
                store,
                useStore(),
                lecture,
                LECTURE_META_SCOPE,
                TRANSCRIPT_SCOPE,
                EXTRACTION_SCOPE,
                lectureMetadataSyncServiceSupport,
                lectureMetadataSyncSupport,
                lectureDurationResolver,
                this::buildLectureMetaFromTranscript
        );
    }

    public Map<String, Object> syncLectureMetadataFromTranscripts(boolean overwriteExisting) {
        return demoLearningMetadataSupport.syncAll(
                store,
                useStore(),
                listAllLectures(),
                LECTURE_META_SCOPE,
                TRANSCRIPT_SCOPE,
                lectureMetadataSyncServiceSupport,
                lectureMetadataSyncSupport,
                this::buildLectureMetaFromTranscript,
                overwriteExisting
        );
    }

    public Map<String, Object> syncLectureMetadataForLectureFromTranscript(String lectureId, boolean overwriteExisting) {
        String normalizedLectureId = lectureId == null ? "" : lectureId.trim();
        LectureItem lecture = normalizedLectureId.isBlank() ? null : getLecture(normalizedLectureId);
        return demoLearningMetadataSupport.syncOne(
                store,
                useStore(),
                normalizedLectureId,
                lecture,
                LECTURE_META_SCOPE,
                TRANSCRIPT_SCOPE,
                lectureMetadataSyncServiceSupport,
                lectureMetadataSyncSupport,
                this::buildLectureMetaFromTranscript,
                overwriteExisting
        );
    }

    private List<CourseDetail> listAllCourses() {
        return demoLearningCourseAccessSupport.listAllCourses(
                useStore(),
                courses,
                store,
                COURSE_SCOPE,
                courseCatalogStoreSupport,
                learningPayloadMapper
        );
    }

    private CourseDetail findCourse(String courseId) {
        return demoLearningCourseAccessSupport.findCourse(
                useStore(),
                courses,
                store,
                COURSE_SCOPE,
                courseId,
                courseCatalogStoreSupport,
                learningPayloadMapper
        );
    }

    private void appendActivity(String userId, String type, String resourceType, String resourceId, Map<String, Object> metadata) {
        if (activityEventService != null) {
            activityEventService.append(userId, type, resourceType, resourceId, metadata);
        }
    }

    private Map<String, Object> buildLectureMetaFromTranscript(LectureItem lecture, Map<String, Object> transcript) {
        String lectureId = lecture == null ? "" : lecture.id();
        Map<String, Object> speakerReview = store.getKv(SPEAKER_REVIEW_SCOPE, lectureId);
        return lectureMetadataSyncSupport.buildLectureMetaFromTranscript(lecture, transcript, speakerReview);
    }
}
