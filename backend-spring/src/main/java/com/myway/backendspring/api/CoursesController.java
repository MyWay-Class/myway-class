package com.myway.backendspring.api;

import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.auth.SessionView;
import com.myway.backendspring.auth.RolePolicy;
import com.myway.backendspring.api.support.ApiAuthGuards;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.domain.MaterialItem;
import com.myway.backendspring.domain.NoticeItem;
import com.myway.backendspring.domain.learning.application.LearningApplicationService;
import com.myway.backendspring.domain.learning.model.CourseCard;
import com.myway.backendspring.domain.learning.model.CourseDetail;
import com.myway.backendspring.domain.learning.model.LectureItem;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/courses")
public class CoursesController {
    private final SessionService sessionService;
    private final LearningApplicationService learningService;

    public CoursesController(SessionService sessionService, LearningApplicationService learningService) {
        this.sessionService = sessionService;
        this.learningService = learningService;
    }

    public record MaterialInput(
            @NotBlank String title,
            @NotBlank String summary,
            @NotBlank String file_name
    ) {}
    public record NoticeInput(@NotBlank String title, @NotBlank String content, Boolean pinned) {}
    public record CourseCreateInput(
            @NotBlank String title,
            @NotBlank String description,
            @NotBlank String category,
            @NotBlank String difficulty,
            List<String> lecture_titles
    ) {}

    @PostMapping
    public ResponseEntity<ApiResponse<CourseDetail>> create(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody CourseCreateInput body) {
        SessionView session = ApiAuthGuards.requireSession(sessionService, auth);
        if (session == null) return ApiAuthGuards.unauthenticated();
        if (!RolePolicy.canManageCourses(session.user().role())) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("FORBIDDEN", "강의를 개설할 권한이 없습니다."));

        List<String> lectureTitles = new ArrayList<>();
        if (body.lecture_titles() != null) {
            for (String lectureTitle : body.lecture_titles()) {
                if (lectureTitle != null && !lectureTitle.trim().isEmpty()) {
                    lectureTitles.add(lectureTitle.trim());
                }
            }
        }
        CourseDetail created = learningService.createCourse(session.user().id(), body.title().trim(), lectureTitles);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(created, "새 강의가 개설되었습니다."));
    }

    @GetMapping
    public ApiResponse<List<CourseCard>> list(@RequestHeader(value = "Authorization", required = false) String auth) {
        String userId = userIdOrGuest(auth);
        return ApiResponse.success(learningService.listCourseCards(userId));
    }

    @GetMapping("/manage")
    public ResponseEntity<ApiResponse<List<CourseCard>>> manage(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView session = ApiAuthGuards.requireSession(sessionService, auth);
        if (session == null) return ApiAuthGuards.unauthenticated();
        if (!RolePolicy.canManageCourses(session.user().role())) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("FORBIDDEN", "강의 관리 페이지를 사용할 권한이 없습니다."));
        return ResponseEntity.ok(ApiResponse.success(learningService.listManagedCourseCards(session.user().id(), session.user().role()), "내 강의 목록을 조회했습니다."));
    }

    @GetMapping("/{courseId}")
    public ResponseEntity<ApiResponse<CourseDetail>> detail(@PathVariable String courseId, @RequestHeader(value = "Authorization", required = false) String auth) {
        String userId = userIdOrGuest(auth);
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
    public ResponseEntity<ApiResponse<MaterialItem>> addMaterial(@PathVariable String courseId, @RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody MaterialInput body) {
        SessionView session = ApiAuthGuards.requireSession(sessionService, auth);
        if (session == null) return ApiAuthGuards.unauthenticated();
        MaterialItem item = learningService.addMaterial(session.user().id(), courseId, body.title().trim(), body.summary().trim(), body.file_name().trim());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(item, "자료가 등록되었습니다."));
    }

    @GetMapping("/{courseId}/notices")
    public ApiResponse<List<NoticeItem>> notices(@PathVariable String courseId) {
        return ApiResponse.success(learningService.getNotices(courseId));
    }

    @PostMapping("/{courseId}/notices")
    public ResponseEntity<ApiResponse<NoticeItem>> addNotice(@PathVariable String courseId, @RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody NoticeInput body) {
        SessionView session = ApiAuthGuards.requireSession(sessionService, auth);
        if (session == null) return ApiAuthGuards.unauthenticated();
        NoticeItem item = learningService.addNotice(session.user().id(), courseId, body.title().trim(), body.content().trim(), Boolean.TRUE.equals(body.pinned()));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(item, "공지가 등록되었습니다."));
    }

    private String userIdOrGuest(String auth) {
        SessionView session = ApiAuthGuards.requireSession(sessionService, auth);
        return session != null ? session.user().id() : "guest";
    }
}
