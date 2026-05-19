package com.myway.backendspring.api;

import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.auth.SessionView;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.domain.learning.application.LearningApplicationService;
import com.myway.backendspring.domain.learning.application.LectureDraftApplicationService;
import com.myway.backendspring.domain.learning.model.CourseDetail;
import com.myway.backendspring.domain.learning.model.LectureDraft;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/lecture-drafts")
public class LectureDraftsController {
    private final SessionService sessionService;
    private final LearningApplicationService learningService;
    private final LectureDraftApplicationService draftService;

    public LectureDraftsController(SessionService sessionService, LearningApplicationService learningService, LectureDraftApplicationService draftService) {
        this.sessionService = sessionService;
        this.learningService = learningService;
        this.draftService = draftService;
    }

    public record DraftInput(String lecture_id, String title, String content) {}

    @GetMapping("/course/{courseId}")
    public ResponseEntity<ApiResponse<List<LectureDraft>>> list(@PathVariable String courseId, @RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView session = sessionService.me(auth);
        ResponseEntity<ApiResponse<Object>> access = requireManageAccess(session, courseId, false);
        if (access != null) return cast(access);
        return ResponseEntity.ok(ApiResponse.success(draftService.listByCourse(courseId)));
    }

    @GetMapping("/course/{courseId}/{draftId}")
    public ResponseEntity<ApiResponse<LectureDraft>> get(@PathVariable String courseId, @PathVariable String draftId, @RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView session = sessionService.me(auth);
        ResponseEntity<ApiResponse<Object>> access = requireManageAccess(session, courseId, false);
        if (access != null) return cast(access);
        LectureDraft draft = draftService.get(courseId, draftId);
        if (draft == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("LECTURE_DRAFT_NOT_FOUND", "강의 초안을 찾을 수 없습니다."));
        return ResponseEntity.ok(ApiResponse.success(draft));
    }

    @PostMapping("/course/{courseId}")
    public ResponseEntity<ApiResponse<LectureDraft>> create(@PathVariable String courseId, @RequestHeader(value = "Authorization", required = false) String auth, @RequestBody DraftInput body) {
        SessionView session = sessionService.me(auth);
        ResponseEntity<ApiResponse<Object>> access = requireManageAccess(session, courseId, true);
        if (access != null) return cast(access);

        CourseDetail detail = learningService.getCourseDetail(courseId, session.user().id());
        String lectureId = resolveCreateLectureId(body, detail);
        if (learningService.getCourseLecture(courseId, lectureId) == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("LECTURE_NOT_FOUND", "차시를 찾을 수 없습니다."));

        LectureDraft draft = draftService.create(
                courseId,
                lectureId,
                resolveDraftTitle(body, "강의 초안"),
                resolveDraftContent(body, "")
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(draft, "강의 초안이 저장되었습니다."));
    }

    @PutMapping("/course/{courseId}/{draftId}")
    public ResponseEntity<ApiResponse<LectureDraft>> update(@PathVariable String courseId, @PathVariable String draftId, @RequestHeader(value = "Authorization", required = false) String auth, @RequestBody DraftInput body) {
        SessionView session = sessionService.me(auth);
        ResponseEntity<ApiResponse<Object>> access = requireManageAccess(session, courseId, true);
        if (access != null) return cast(access);

        LectureDraft existing = draftService.get(courseId, draftId);
        if (existing == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("LECTURE_DRAFT_NOT_FOUND", "강의 초안을 찾을 수 없습니다."));

        String lectureId = resolveUpdateLectureId(body, existing);
        if (learningService.getCourseLecture(courseId, lectureId) == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("LECTURE_NOT_FOUND", "차시를 찾을 수 없습니다."));

        LectureDraft updated = draftService.update(
                courseId,
                draftId,
                lectureId,
                resolveDraftTitle(body, existing.title()),
                resolveDraftContent(body, existing.content())
        );
        return ResponseEntity.ok(ApiResponse.success(updated, "강의 초안이 수정되었습니다."));
    }

    @PostMapping("/course/{courseId}/{draftId}/publish")
    public ResponseEntity<ApiResponse<LectureDraft>> publish(@PathVariable String courseId, @PathVariable String draftId, @RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView session = sessionService.me(auth);
        ResponseEntity<ApiResponse<Object>> access = requireManageAccess(session, courseId, true);
        if (access != null) return cast(access);

        LectureDraft published = draftService.publish(courseId, draftId);
        if (published == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("LECTURE_DRAFT_NOT_FOUND", "강의 초안을 찾을 수 없습니다."));
        return ResponseEntity.ok(ApiResponse.success(published, "강의 초안이 발행 준비 상태로 전환되었습니다."));
    }

    private ResponseEntity<ApiResponse<Object>> requireManageAccess(SessionView session, String courseId, boolean ownerOnly) {
        if (session == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        CourseDetail detail = learningService.getCourseDetail(courseId, session.user().id());
        if (detail == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("COURSE_NOT_FOUND", "강의를 찾을 수 없습니다."));
        boolean canManage = "admin".equals(session.user().role()) || session.user().id().equals(detail.instructor_id());
        boolean canReadDrafts = canManage || (!ownerOnly && "instructor".equals(session.user().role()));
        if (!canReadDrafts) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("FORBIDDEN", "강의 초안에 접근할 권한이 없습니다."));
        return null;
    }

    private String valueOrDefault(String value, String fallback) {
        return isBlank(value) ? fallback : value.trim();
    }

    private String resolveCreateLectureId(DraftInput body, CourseDetail detail) {
        if (body != null && !isBlank(body.lecture_id())) {
            return body.lecture_id().trim();
        }
        return detail.lectures().getFirst().id();
    }

    private String resolveUpdateLectureId(DraftInput body, LectureDraft existing) {
        if (body != null && !isBlank(body.lecture_id())) {
            return body.lecture_id().trim();
        }
        return existing.lecture_id();
    }

    private String resolveDraftTitle(DraftInput body, String fallback) {
        return valueOrDefault(body == null ? null : body.title(), fallback);
    }

    private String resolveDraftContent(DraftInput body, String fallback) {
        return valueOrDefault(body == null ? null : body.content(), fallback);
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    @SuppressWarnings("unchecked")
    private <T> ResponseEntity<ApiResponse<T>> cast(ResponseEntity<ApiResponse<Object>> response) {
        return (ResponseEntity<ApiResponse<T>>) (ResponseEntity<?>) response;
    }
}
