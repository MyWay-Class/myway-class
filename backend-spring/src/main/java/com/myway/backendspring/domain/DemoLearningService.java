package com.myway.backendspring.domain;

import com.myway.backendspring.persistence.FeatureJdbcStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;

@Service
public class DemoLearningService {
    private static final String ENROLLMENT_SCOPE = "learning_enrollment";
    private static final String LECTURE_COMPLETION_SCOPE = "learning_lecture_completion";
    private static final String COURSE_SCOPE = "learning_course";
    private static final String MATERIAL_SCOPE = "learning_material";
    private static final String NOTICE_SCOPE = "learning_notice";
    private static final String TRANSCRIPT_SCOPE = "media_transcript";
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
    private final DemoLearningDashboardSupport demoLearningDashboardSupport;
    private final DemoLearningLectureQuerySupport demoLearningLectureQuerySupport;
    private final DemoLearningLectureMetadataFacade demoLearningLectureMetadataFacade;
    private final DemoLearningCourseWriteSupport demoLearningCourseWriteSupport;
    private final DemoLearningContentFacade demoLearningContentFacade;
    private final DemoLearningEnrollmentFacade demoLearningEnrollmentFacade;

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
            DemoLearningCourseAccessSupport demoLearningCourseAccessSupport,
            DemoLearningDashboardSupport demoLearningDashboardSupport,
            DemoLearningLectureQuerySupport demoLearningLectureQuerySupport,
            DemoLearningLectureMetadataFacade demoLearningLectureMetadataFacade,
            DemoLearningCourseWriteSupport demoLearningCourseWriteSupport,
            DemoLearningContentFacade demoLearningContentFacade,
            DemoLearningEnrollmentFacade demoLearningEnrollmentFacade
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
        this.demoLearningDashboardSupport = demoLearningDashboardSupport;
        this.demoLearningLectureQuerySupport = demoLearningLectureQuerySupport;
        this.demoLearningLectureMetadataFacade = demoLearningLectureMetadataFacade;
        this.demoLearningCourseWriteSupport = demoLearningCourseWriteSupport;
        this.demoLearningContentFacade = demoLearningContentFacade;
        this.demoLearningEnrollmentFacade = demoLearningEnrollmentFacade;
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
        this.demoLearningDashboardSupport = new DemoLearningDashboardSupport();
        this.demoLearningLectureQuerySupport = new DemoLearningLectureQuerySupport();
        this.demoLearningLectureMetadataFacade = new DemoLearningLectureMetadataFacade(
                null,
                new DemoLearningMetadataSyncFacade(),
                new DemoLearningTranscriptSyncFacade(),
                demoLearningMetadataSupport,
                lectureMetadataSyncServiceSupport,
                lectureMetadataSyncSupport,
                lectureDurationResolver
        );
        this.demoLearningCourseWriteSupport = new DemoLearningCourseWriteSupport();
        this.demoLearningContentFacade = new DemoLearningContentFacade();
        this.demoLearningEnrollmentFacade = new DemoLearningEnrollmentFacade();
        initSeedData();
    }

    private void initSeedData() {
        if (useStore()) {
            courseCatalogStoreSupport.seedStoreDataIfMissing(store, COURSE_SCOPE, MATERIAL_SCOPE, NOTICE_SCOPE, learningPayloadMapper);
            seedTranscriptStoreDataIfMissing();
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

    private void seedTranscriptStoreDataIfMissing() {
        seedTranscriptIfMissing(
                "lec_react_01",
                "trs_ai_seed_001",
                "ko",
                """
                        안녕하세요. 오늘부터 인공지능 강의를 시작합니다. 인공지능은 현재 우리 삶의 여러 영역에 영향을 미치고 있습니다.
                        스마트폰의 음성인식, 추천 알고리즘, 자율주행 자동차까지 모두 인공지능 기술의 예시입니다.
                        인공지능이란 무엇일까요? 간단히 말하면 컴퓨터가 인간처럼 생각하고 학습할 수 있도록 만드는 기술입니다.
                        인공지능의 핵심 기술은 머신러닝, 딥러닝, 자연어처리로 나뉘며, 최근에는 생성형 인공지능이 큰 주목을 받고 있습니다.
                        다음 시간에는 머신러닝의 핵심 개념을 더 자세히 살펴보겠습니다.
                        """.replace("\n", " ").replaceAll("\\s+", " ").trim(),
                List.of(
                        transcriptSegment(0, 0, 36000, "안녕하세요. 오늘부터 인공지능 강의를 시작합니다. 인공지능은 현재 우리 삶의 여러 영역에 영향을 미치고 있습니다."),
                        transcriptSegment(1, 36000, 76000, "스마트폰의 음성인식, 추천 알고리즘, 자율주행 자동차까지 모두 인공지능 기술의 예시입니다."),
                        transcriptSegment(2, 76000, 118000, "인공지능이란 무엇일까요? 간단히 말하면 컴퓨터가 인간처럼 생각하고 학습할 수 있도록 만드는 기술입니다."),
                        transcriptSegment(3, 118000, 141000, "인공지능의 핵심 기술은 머신러닝, 딥러닝, 자연어처리로 나뉘며, 최근에는 생성형 인공지능이 큰 주목을 받고 있습니다."),
                        transcriptSegment(4, 141000, 141000, "다음 시간에는 머신러닝의 핵심 개념을 더 자세히 살펴보겠습니다.")
                ),
                43,
                141000,
                "seed-stt",
                "ai-seed-v1"
        );
    }

    private void seedTranscriptIfMissing(
            String lectureId,
            String transcriptId,
            String language,
            String fullText,
            List<Map<String, Object>> segments,
            int wordCount,
            int durationMs,
            String provider,
            String model
    ) {
        if (store == null || store.getKv(TRANSCRIPT_SCOPE, lectureId) != null) {
            return;
        }
        List<Map<String, Object>> speakerSegments = new ArrayList<>();
        for (Map<String, Object> segment : segments) {
            speakerSegments.add(transcriptSpeakerSegment(segment));
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", transcriptId);
        payload.put("lecture_id", lectureId);
        payload.put("language", language);
        payload.put("full_text", fullText);
        payload.put("segments", segments);
        payload.put("speaker_segments", speakerSegments);
        payload.put("word_count", wordCount);
        payload.put("duration_ms", durationMs);
        payload.put("stt_provider", provider);
        payload.put("stt_model", model);
        payload.put("quality", Map.of(
                "avg_confidence", 0.97,
                "segment_count", segments.size(),
                "transcript_seed", true
        ));
        payload.put("instructor_guess", Map.of(
                "speaker_label", "SPEAKER_01",
                "instructor_name", "강사",
                "confidence", 0.9
        ));
        payload.put("speaker_review", Map.of(
                "speaker_label", "SPEAKER_01",
                "instructor_name", "강사",
                "status", "CONFIRMED",
                "confidence", 0.95
        ));
        payload.put("created_at", "2026-04-13T09:00:00.000Z");
        store.upsertKv(TRANSCRIPT_SCOPE, lectureId, payload);
    }

    private Map<String, Object> transcriptSegment(int index, int startMs, int endMs, String text) {
        Map<String, Object> segment = new HashMap<>();
        segment.put("index", index);
        segment.put("start_ms", startMs);
        segment.put("end_ms", endMs);
        segment.put("text", text);
        return segment;
    }

    private Map<String, Object> transcriptSpeakerSegment(Map<String, Object> segment) {
        Map<String, Object> speakerSegment = new HashMap<>();
        speakerSegment.put("index", segment.get("index"));
        speakerSegment.put("start_ms", segment.get("start_ms"));
        speakerSegment.put("end_ms", segment.get("end_ms"));
        speakerSegment.put("speaker_label", "SPEAKER_01");
        return speakerSegment;
    }

    public List<CourseCard> listCourseCards(String userId) {
        return demoLearningDashboardSupport.listCourseCards(
                userId,
                listAllCourses(),
                this::progressPercent
        );
    }

    public List<CourseCard> listManagedCourseCards(String userId, String role) {
        return demoLearningDashboardSupport.listManagedCourseCards(
                userId,
                role,
                listAllCourses(),
                this::progressPercent
        );
    }

    public CourseDetail createCourse(String instructorId, String title, List<String> lectureTitles) {
        return demoLearningCourseWriteSupport.createCourse(
                useStore(),
                store,
                COURSE_SCOPE,
                learningPayloadMapper,
                courses,
                instructorId,
                title,
                lectureTitles
        );
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
        return demoLearningLectureQuerySupport.getLecture(lectureId, this::listAllCourses);
    }

    public LectureItem getCourseLecture(String courseId, String lectureId) {
        return demoLearningLectureQuerySupport.getCourseLecture(courseId, lectureId, () -> getCourseLectures(courseId));
    }

    public List<LectureItem> listAllLectures() {
        return demoLearningLectureQuerySupport.listAllLectures(this::listAllCourses);
    }

    public DashboardView getDashboard(String userId) {
        List<CourseCard> cards = listCourseCards(userId);
        return demoLearningDashboardSupport.buildDashboard(
                userId,
                cards,
                listEnrollments(userId),
                listCompletedLectureIds(userId)
        );
    }

    public List<MaterialItem> getMaterials(String courseId) {
        return demoLearningContentFacade.getMaterials(
                learningContentStoreSupport,
                useStore(),
                store,
                MATERIAL_SCOPE,
                learningPayloadMapper,
                materialsByCourse,
                courseId
        );
    }

    public List<NoticeItem> getNotices(String courseId) {
        return demoLearningContentFacade.getNotices(
                learningContentStoreSupport,
                useStore(),
                store,
                NOTICE_SCOPE,
                learningPayloadMapper,
                noticesByCourse,
                courseId
        );
    }

    public MaterialItem addMaterial(String userId, String courseId, String title, String summary, String fileName) {
        return demoLearningContentFacade.addMaterial(
                learningContentStoreSupport,
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
        return demoLearningContentFacade.addNotice(
                learningContentStoreSupport,
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
        return demoLearningEnrollmentFacade.enroll(
                userId,
                courseId,
                useStore(),
                store,
                ENROLLMENT_SCOPE,
                learningEnrollmentStoreSupport,
                enrollments,
                this::findEnrollment,
                item -> appendActivity(userId, "enrollment", "course", courseId, Map.of("enrollment_id", item.id()))
        );
    }

    public List<EnrollmentItem> listEnrollments(String userId) {
        return demoLearningEnrollmentFacade.listEnrollments(
                userId,
                useStore(),
                store,
                ENROLLMENT_SCOPE,
                enrollments,
                learningEnrollmentStoreSupport
        );
    }

    public Map<String, Object> completeLecture(String userId, String lectureId) {
        Consumer<Map<String, Object>> activityAppender = summary -> {
            LectureItem lecture = getLecture(lectureId);
            if (lecture == null) return;
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
        };
        return demoLearningEnrollmentFacade.completeLecture(
                userId,
                lectureId,
                this::getLecture,
                this::findEnrollment,
                useStore(),
                store,
                LECTURE_COMPLETION_SCOPE,
                learningEnrollmentStoreSupport,
                completedLectureKeys,
                this::getCourseLectures,
                this::listCompletedLectureIds,
                progressCalculator,
                activityAppender
        );
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
        return demoLearningLectureMetadataFacade.alignCourseLectures(useStore(), lectures);
    }

    public Map<String, Object> syncLectureMetadataFromTranscripts(boolean overwriteExisting) {
        return demoLearningLectureMetadataFacade.syncAllFromTranscripts(useStore(), overwriteExisting, this::listAllLectures);
    }

    public Map<String, Object> syncLectureMetadataForLectureFromTranscript(String lectureId, boolean overwriteExisting) {
        return demoLearningLectureMetadataFacade.syncLectureFromTranscript(useStore(), lectureId, overwriteExisting, this::getLecture);
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

}
