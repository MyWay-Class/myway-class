package com.myway.backendspring.api.support;

import com.myway.backendspring.auth.SessionView;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.domain.CourseDetail;
import com.myway.backendspring.domain.DemoLearningService;
import com.myway.backendspring.domain.EnrollmentItem;
import com.myway.backendspring.domain.LectureItem;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class ShortformComposeValidationSupport {
    private final DemoLearningService learningService;
    private final ShortformControllerSupport support;

    public ShortformComposeValidationSupport(
            DemoLearningService learningService,
            ShortformControllerSupport support
    ) {
        this.learningService = learningService;
        this.support = support;
    }

    public ComposeValidationResult validateAndBuildClips(
            SessionView session,
            String requestedCourseId,
            List<ComposeClipInput> sourceClips,
            long maxClipDurationMs
    ) {
        List<Map<String, Object>> clips = new ArrayList<>();
        for (ComposeClipInput clip : sourceClips) {
            String lectureId = clip.lectureId().trim();
            long startMs = clip.startMs();
            long endMs = clip.endMs();
            if (endMs <= startMs) {
                return ComposeValidationResult.failure(support.badRequest("INVALID_CLIP_RANGE", "clip end_ms는 start_ms보다 커야 합니다."));
            }
            if ((endMs - startMs) > maxClipDurationMs) {
                return ComposeValidationResult.failure(support.badRequest("CLIP_DURATION_EXCEEDED", "clip 길이가 허용 최대치를 초과했습니다."));
            }
            LectureItem lecture = learningService.getLecture(lectureId);
            if (lecture == null) {
                return ComposeValidationResult.failure(
                        ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(ApiResponse.failure("LECTURE_NOT_FOUND", "강의를 찾을 수 없습니다: " + lectureId))
                );
            }
            if (!canComposeFromLecture(session, lecture)) {
                return ComposeValidationResult.failure(support.forbidden("해당 강의 클립을 조합할 권한이 없습니다."));
            }
            if (requestedCourseId != null && !requestedCourseId.isBlank() && !requestedCourseId.trim().equals(lecture.course_id())) {
                return ComposeValidationResult.failure(
                        support.badRequest("COURSE_LECTURE_MISMATCH", "course_id와 clip lecture_id가 일치하지 않습니다.")
                );
            }
            clips.add(Map.of(
                    "lecture_id", lectureId,
                    "start_ms", startMs,
                    "end_ms", endMs
            ));
        }
        return ComposeValidationResult.success(clips);
    }

    private boolean canComposeFromLecture(SessionView session, LectureItem lecture) {
        if (support.isAdmin(session)) {
            return true;
        }
        if (support.isInstructor(session)) {
            CourseDetail course = learningService.getCourseDetail(lecture.course_id(), session.user().id());
            return course != null && session.user().id().equals(course.instructor_id());
        }
        List<EnrollmentItem> enrollments = learningService.listEnrollments(session.user().id());
        return enrollments.stream().anyMatch(item -> lecture.course_id().equals(item.course_id()));
    }

    public record ComposeClipInput(String lectureId, long startMs, long endMs) {}

    public record ComposeValidationResult(
            boolean valid,
            List<Map<String, Object>> clips,
            ResponseEntity<ApiResponse<Map<String, Object>>> errorResponse
    ) {
        public static ComposeValidationResult success(List<Map<String, Object>> clips) {
            return new ComposeValidationResult(true, clips, null);
        }

        public static ComposeValidationResult failure(ResponseEntity<ApiResponse<Map<String, Object>>> errorResponse) {
            return new ComposeValidationResult(false, List.of(), errorResponse);
        }
    }
}
