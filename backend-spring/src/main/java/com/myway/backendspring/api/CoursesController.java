package com.myway.backendspring.api;

import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.auth.SessionView;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/courses")
public class CoursesController {
    private final SessionService sessionService;
    private final DemoLearningService learningService;

    public CoursesController(SessionService sessionService, DemoLearningService learningService) {
        this.sessionService = sessionService;
        this.learningService = learningService;
    }

    public record MaterialInput(String title, String summary, String file_name) {}
    public record NoticeInput(String title, String content, Boolean pinned) {}
    public record CourseCreateInput(String title, String description, String category, String difficulty, List<String> lecture_titles) {}

    @PostMapping
    public ResponseEntity<ApiResponse<CourseDetail>> create(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody CourseCreateInput body) {
        SessionView session = sessionService.me(auth);
        if (session == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        if (!canManageCourses(session.user().role())) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("FORBIDDEN", "강의를 개설할 권한이 없습니다."));
        if (body == null || isBlank(body.title()) || isBlank(body.description()) || isBlank(body.category()) || isBlank(body.difficulty())) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("COURSE_CREATE_FIELDS_REQUIRED", "강의 제목, 설명, 카테고리, 난이도가 필요합니다."));
        }

        List<String> lectureTitles = new ArrayList<>();
        if (body.lecture_titles() != null) {
            for (String lectureTitle : body.lecture_titles()) {
                if (!isBlank(lectureTitle)) {
                    lectureTitles.add(lectureTitle.trim());
                }
            }
        }
        CourseDetail created = learningService.createCourse(session.user().id(), body.title().trim(), lectureTitles);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(created, "새 강의가 개설되었습니다."));
    }

    @GetMapping
    public ApiResponse<List<CourseCard>> list(@RequestHeader(value = "Authorization", required = false) String auth) {
        String userId = sessionService.me(auth) != null ? sessionService.me(auth).user().id() : "guest";
        return ApiResponse.success(learningService.listCourseCards(userId));
    }

    @GetMapping("/manage")
    public ResponseEntity<ApiResponse<List<CourseCard>>> manage(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView session = sessionService.me(auth);
        if (session == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        if (!canManageCourses(session.user().role())) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("FORBIDDEN", "강의 관리 페이지를 사용할 권한이 없습니다."));
        return ResponseEntity.ok(ApiResponse.success(learningService.listManagedCourseCards(session.user().id(), session.user().role()), "내 강의 목록을 조회했습니다."));
    }

    @GetMapping("/{courseId}")
    public ResponseEntity<ApiResponse<CourseDetail>> detail(@PathVariable String courseId, @RequestHeader(value = "Authorization", required = false) String auth) {
        String userId = sessionService.me(auth) != null ? sessionService.me(auth).user().id() : "guest";
        CourseDetail detail = learningService.getCourseDetail(courseId, userId);
        if (detail == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("COURSE_NOT_FOUND", "강의를 찾을 수 없습니다."));
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    @GetMapping("/{courseId}/lectures")
    public ResponseEntity<ApiResponse<List<LectureItem>>> lectures(@PathVariable String courseId) {
        List<LectureItem> items = learningService.getCourseLectures(courseId);
        if (items.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("COURSE_NOT_FOUND", "강의를 찾을 수 없습니다."));
        return ResponseEntity.ok(ApiResponse.success(items));
    }

    @GetMapping("/{courseId}/materials")
    public ApiResponse<List<MaterialItem>> materials(@PathVariable String courseId) {
        return ApiResponse.success(learningService.getMaterials(courseId));
    }

    @PostMapping("/{courseId}/materials")
    public ResponseEntity<ApiResponse<MaterialItem>> addMaterial(@PathVariable String courseId, @RequestHeader(value = "Authorization", required = false) String auth, @RequestBody MaterialInput body) {
        SessionView session = sessionService.me(auth);
        if (session == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        if (body == null || isBlank(body.title()) || isBlank(body.summary()) || isBlank(body.file_name())) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("MATERIAL_FIELDS_REQUIRED", "자료 제목, 요약, 파일명이 필요합니다."));
        }
        MaterialItem item = learningService.addMaterial(session.user().id(), courseId, body.title().trim(), body.summary().trim(), body.file_name().trim());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(item, "자료가 등록되었습니다."));
    }

    @GetMapping("/{courseId}/notices")
    public ApiResponse<List<NoticeItem>> notices(@PathVariable String courseId) {
        return ApiResponse.success(learningService.getNotices(courseId));
    }

    @PostMapping("/{courseId}/notices")
    public ResponseEntity<ApiResponse<NoticeItem>> addNotice(@PathVariable String courseId, @RequestHeader(value = "Authorization", required = false) String auth, @RequestBody NoticeInput body) {
        SessionView session = sessionService.me(auth);
        if (session == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        if (body == null || isBlank(body.title()) || isBlank(body.content())) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("NOTICE_FIELDS_REQUIRED", "공지 제목과 내용이 필요합니다."));
        }
        NoticeItem item = learningService.addNotice(session.user().id(), courseId, body.title().trim(), body.content().trim(), Boolean.TRUE.equals(body.pinned()));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(item, "공지가 등록되었습니다."));
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private boolean canManageCourses(String role) {
        return "admin".equals(role) || "instructor".equals(role);
    }
}
