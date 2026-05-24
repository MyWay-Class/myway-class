package com.myway.backendspring.api;

import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.auth.SessionView;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.domain.CourseDetail;
import com.myway.backendspring.domain.DemoLearningService;
import com.myway.backendspring.domain.EnrollmentItem;
import com.myway.backendspring.domain.LectureItem;
import com.myway.backendspring.feature.shortform.ShortformService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/shortform")
public class ShortformController {
    private static final Set<String> ALLOWED_EXPORT_CALLBACK_STATUSES = Set.of("COMPLETED", "FAILED");
    public record GenerateRequest(String course_id, String mode) {}
    public record SelectCandidatesRequest(@NotBlank String extraction_id, @NotEmpty List<@NotBlank String> candidate_ids) {}
    public record ComposeClipRequest(
            @NotBlank String lecture_id,
            @NotNull @PositiveOrZero Long start_ms,
            @NotNull @PositiveOrZero Long end_ms
    ) {}
    public record ComposeRequest(String title, String description, String course_id, String extraction_id, List<@Valid ComposeClipRequest> clips) {
        public ComposeRequest(String title, String description, String course_id) {
            this(title, description, course_id, null, List.of());
        }
    }
    public record ShareRequest(@NotBlank String video_id, String course_id, String visibility, String message) {}
    public record SaveRequest(@NotBlank String video_id, String note, String folder) {}
    public record LikeRequest(@NotBlank String video_id) {}
    public record RetryFailedExportsRequest(Boolean include_permanent, Integer limit) {}

    private final SessionService sessionService;
    private final DemoLearningService learningService;
    private final ShortformService shortformService;
    private final String callbackToken;
    private final long maxClipDurationMs;

    public ShortformController(
            SessionService sessionService,
            DemoLearningService learningService,
            ShortformService shortformService,
            @Value("${myway.shortform.callback.token:dev-shortform-callback-token}") String callbackToken,
            @Value("${myway.shortform.compose.max-clip-duration-ms:300000}") long maxClipDurationMs
    ) {
        this.sessionService = sessionService;
        this.learningService = learningService;
        this.shortformService = shortformService;
        this.callbackToken = callbackToken;
        this.maxClipDurationMs = Math.max(1000L, maxClipDurationMs);
    }

    private SessionView require(String auth) { return sessionService.me(auth); }
    private <T> ResponseEntity<ApiResponse<T>> unauthenticated() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
    }
    private String orEmpty(String value) {
        return value == null ? "" : value;
    }
    private String trimRequired(String value) {
        return value.trim();
    }
    private boolean isAdmin(SessionView session) {
        return session != null && "admin".equals(session.user().role());
    }
    private boolean isInstructor(SessionView session) {
        return session != null && "instructor".equals(session.user().role());
    }
    private ResponseEntity<ApiResponse<Map<String, Object>>> badRequest(String code, String message) {
        return ResponseEntity.badRequest().body(ApiResponse.failure(code, message));
    }
    private ResponseEntity<ApiResponse<Map<String, Object>>> forbidden(String message) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("FORBIDDEN", message));
    }

    @GetMapping("/library")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> library(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView s = require(auth);
        if (s == null) return unauthenticated();
        return ResponseEntity.ok(ApiResponse.success(shortformService.shortformLibrary(s.user().id())));
    }

    @GetMapping("/community")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> community(@RequestHeader(value = "Authorization", required = false) String auth, @RequestParam(value = "course_id", required = false) String courseId) {
        if (require(auth) == null) return unauthenticated();
        return ResponseEntity.ok(ApiResponse.success(shortformService.shortformCommunity(courseId)));
    }

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generate(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody GenerateRequest body) {
        SessionView s = require(auth);
        if (s == null) return unauthenticated();
        Map<String, Object> payload = Map.of(
                "course_id", orEmpty(body.course_id()),
                "mode", orEmpty(body.mode())
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(shortformService.createShortformExtraction(s.user().id(), payload), "숏폼 후보가 생성되었습니다."));
    }

    @PutMapping("/candidates/select")
    public ResponseEntity<ApiResponse<Map<String, Object>>> select(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody SelectCandidatesRequest body) {
        if (require(auth) == null) return unauthenticated();
        String extractionId = trimRequired(body.extraction_id());
        List<String> candidateIds = body.candidate_ids().stream().map(String::trim).toList();
        Map<String, Object> updated = shortformService.selectShortformCandidates(extractionId, candidateIds);
        if (updated == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("EXTRACTION_NOT_FOUND", "추출 결과를 찾을 수 없습니다."));
        return ResponseEntity.ok(ApiResponse.success(updated, "후보 선택이 반영되었습니다."));
    }

    @GetMapping("/extraction/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> extraction(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable String id) {
        if (require(auth) == null) return unauthenticated();
        Map<String, Object> row = shortformService.getShortformExtraction(id);
        if (row == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("EXTRACTION_NOT_FOUND", "추출 결과를 찾을 수 없습니다."));
        return ResponseEntity.ok(ApiResponse.success(row));
    }

    @PostMapping("/compose")
    public ResponseEntity<ApiResponse<Map<String, Object>>> compose(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody ComposeRequest body) {
        SessionView s = require(auth);
        if (s == null) return unauthenticated();
        List<Map<String, Object>> clips = new java.util.ArrayList<>();
        List<ComposeClipRequest> sourceClips = body.clips() == null ? List.of() : body.clips();
        for (ComposeClipRequest clip : sourceClips) {
            String lectureId = clip.lecture_id().trim();
            long startMs = clip.start_ms();
            long endMs = clip.end_ms();
            if (endMs <= startMs) {
                return badRequest("INVALID_CLIP_RANGE", "clip end_ms는 start_ms보다 커야 합니다.");
            }
            if ((endMs - startMs) > maxClipDurationMs) {
                return badRequest("CLIP_DURATION_EXCEEDED", "clip 길이가 허용 최대치를 초과했습니다.");
            }
            LectureItem lecture = learningService.getLecture(lectureId);
            if (lecture == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.failure("LECTURE_NOT_FOUND", "강의를 찾을 수 없습니다: " + lectureId));
            }
            if (!canComposeFromLecture(s, lecture)) {
                return forbidden("해당 강의 클립을 조합할 권한이 없습니다.");
            }
            if (body.course_id() != null && !body.course_id().isBlank()) {
                String requestedCourseId = body.course_id().trim();
                if (!requestedCourseId.equals(lecture.course_id())) {
                    return badRequest("COURSE_LECTURE_MISMATCH", "course_id와 clip lecture_id가 일치하지 않습니다.");
                }
            }
            clips.add(Map.of(
                    "lecture_id", lectureId,
                    "start_ms", startMs,
                    "end_ms", endMs
            ));
        }
        Map<String, Object> payload = Map.of(
                "title", orEmpty(body.title()),
                "description", orEmpty(body.description()),
                "course_id", orEmpty(body.course_id()),
                "clips", clips,
                "extraction_id", orEmpty(body.extraction_id())
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(shortformService.composeShortform(s.user().id(), payload), "숏폼이 생성되었습니다."));
    }

    private boolean canComposeFromLecture(SessionView session, LectureItem lecture) {
        if (isAdmin(session)) {
            return true;
        }
        if (isInstructor(session)) {
            CourseDetail course = learningService.getCourseDetail(lecture.course_id(), session.user().id());
            return course != null && session.user().id().equals(course.instructor_id());
        }
        List<EnrollmentItem> enrollments = learningService.listEnrollments(session.user().id());
        return enrollments.stream().anyMatch(item -> lecture.course_id().equals(item.course_id()));
    }

    @GetMapping("/video/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> video(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable String id) {
        if (require(auth) == null) return unauthenticated();
        Map<String, Object> row = shortformService.shortformVideo(id);
        if (row == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("SHORTFORM_NOT_FOUND", "숏폼을 찾을 수 없습니다."));
        return ResponseEntity.ok(ApiResponse.success(row));
    }

    @GetMapping("/videos/my")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> videos(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView session = require(auth);
        if (session == null) return unauthenticated();
        return ResponseEntity.ok(ApiResponse.success(shortformService.shortformVideos(session.user().id())));
    }

    @PostMapping("/share")
    public ResponseEntity<ApiResponse<Map<String, Object>>> share(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody ShareRequest body) {
        SessionView session = require(auth);
        if (session == null) return unauthenticated();
        Map<String, Object> payload = Map.of(
                "video_id", body.video_id(),
                "course_id", orEmpty(body.course_id()),
                "visibility", orEmpty(body.visibility()),
                "message", orEmpty(body.message())
        );
        Map<String, Object> row = shortformService.shareShortform(session.user().id(), payload);
        if (row == null) return ResponseEntity.badRequest().body(ApiResponse.failure("SHORTFORM_SHARE_FAILED", "숏폼을 공유할 수 없습니다."));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(row, "숏폼이 공유되었습니다."));
    }

    @PostMapping("/save")
    public ResponseEntity<ApiResponse<Map<String, Object>>> save(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody SaveRequest body) {
        SessionView session = require(auth);
        if (session == null) return unauthenticated();
        Map<String, Object> payload = Map.of(
                "video_id", body.video_id(),
                "note", orEmpty(body.note()),
                "folder", orEmpty(body.folder())
        );
        Map<String, Object> row = shortformService.saveShortform(session.user().id(), payload);
        if (row == null) return ResponseEntity.badRequest().body(ApiResponse.failure("SHORTFORM_SAVE_FAILED", "숏폼을 담아갈 수 없습니다."));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(row, "숏폼이 담아가기 되었습니다."));
    }

    @PostMapping("/like")
    public ResponseEntity<ApiResponse<Map<String, Object>>> like(@RequestHeader(value = "Authorization", required = false) String auth, @Valid @RequestBody LikeRequest body) {
        SessionView session = require(auth);
        if (session == null) return unauthenticated();
        String videoId = trimRequired(body.video_id());
        Map<String, Object> row = shortformService.toggleShortformLike(session.user().id(), videoId);
        if (row == null) return ResponseEntity.badRequest().body(ApiResponse.failure("SHORTFORM_LIKE_FAILED", "좋아요를 처리할 수 없습니다."));
        return ResponseEntity.ok(ApiResponse.success(row, "좋아요 상태가 반영되었습니다."));
    }

    @PostMapping("/{shortformId}/export/retry")
    public ResponseEntity<ApiResponse<Map<String, Object>>> retry(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable String shortformId) {
        SessionView s = require(auth);
        if (s == null) return unauthenticated();

        Map<String, Object> updated = shortformService.retryShortformExport(s.user().id(), shortformId);
        if (updated == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("SHORTFORM_NOT_FOUND", "숏폼을 찾을 수 없습니다."));
        }
        if ("FORBIDDEN".equals(updated.get("error"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("FORBIDDEN", "본인 숏폼만 다시 내보낼 수 있습니다."));
        }

        String status = String.valueOf(updated.getOrDefault("export_status", "PROCESSING"));
        if ("FAILED_PERMANENT".equals(status)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.success(updated, "최대 재시도 횟수를 초과했습니다."));
        }
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(ApiResponse.success(updated, "숏폼 export job이 다시 시작되었습니다."));
    }

    @GetMapping("/admin/export-status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> exportStatus(
            @RequestHeader(value = "Authorization", required = false) String auth
    ) {
        SessionView session = require(auth);
        if (session == null) return unauthenticated();
        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("FORBIDDEN", "운영자 권한이 필요합니다."));
        }
        return ResponseEntity.ok(ApiResponse.success(shortformService.shortformExportStatus()));
    }

    @PostMapping("/admin/export/retry-failed")
    public ResponseEntity<ApiResponse<Map<String, Object>>> retryFailedExports(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) RetryFailedExportsRequest body
    ) {
        SessionView session = require(auth);
        if (session == null) return unauthenticated();
        if (!isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("FORBIDDEN", "운영자 권한이 필요합니다."));
        }
        boolean includePermanent = body != null && Boolean.TRUE.equals(body.include_permanent());
        int limit = body == null || body.limit() == null ? 20 : body.limit();
        Map<String, Object> result = shortformService.retryFailedShortformExports(includePermanent, limit);
        return ResponseEntity.ok(ApiResponse.success(result, "실패한 숏폼 export 재시도가 실행되었습니다."));
    }

    public record ExportCallbackRequest(
            @NotBlank String shortform_id,
            String video_id,
            String status,
            String video_url,
            String error_message,
            @NotNull Long event_version
    ) {}

    @PostMapping("/export/callback")
    public ResponseEntity<ApiResponse<Map<String, Object>>> exportCallback(
            @RequestHeader(value = "X-Callback-Token", required = false) String token,
            @RequestHeader(value = "x-myway-media-callback-secret", required = false) String callbackSecret,
            @Valid @RequestBody ExportCallbackRequest body
    ) {
        String resolvedToken = (token != null && !token.isBlank()) ? token : callbackSecret;
        if (resolvedToken == null || resolvedToken.isBlank() || !resolvedToken.equals(callbackToken)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("FORBIDDEN", "유효한 callback token이 필요합니다."));
        }
        String shortformId = trimRequired(body.shortform_id());

        CallbackPolicyDecision decision = CallbackStateTransitionPolicy.decide(body);
        if (!decision.valid()) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("INVALID_BODY", decision.errorMessage()));
        }

        Map<String, Object> updated = shortformService.applyShortformExportCallback(
                shortformId,
                decision.status(),
                decision.eventVersion(),
                body.video_url(),
                body.error_message()
        );

        if (updated == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("SHORTFORM_NOT_FOUND", "숏폼을 찾을 수 없습니다."));
        }

        if (Boolean.TRUE.equals(updated.get("callback_ignored"))) {
            return ResponseEntity.ok(ApiResponse.success(updated, "오래된 callback 이벤트를 무시했습니다."));
        }

        if ("FAILED_PERMANENT".equals(updated.get("export_status"))) {
            return ResponseEntity.ok(ApiResponse.success(updated, "숏폼 export가 영구 실패 상태로 전환되었습니다."));
        }
        if ("FAILED".equals(updated.get("export_status"))) {
            return ResponseEntity.ok(ApiResponse.success(updated, "숏폼 export가 실패했습니다."));
        }
        return ResponseEntity.ok(ApiResponse.success(updated, "숏폼 export가 완료되었습니다."));
    }

    private record CallbackPolicyDecision(boolean valid, String status, long eventVersion, String errorMessage) {
        static CallbackPolicyDecision valid(String status, long eventVersion) {
            return new CallbackPolicyDecision(true, status, eventVersion, null);
        }

        static CallbackPolicyDecision invalid(String errorMessage) {
            return new CallbackPolicyDecision(false, null, 0L, errorMessage);
        }
    }

    private static final class CallbackStateTransitionPolicy {
        private static CallbackPolicyDecision decide(ExportCallbackRequest body) {
            long eventVersion = body.event_version();
            if (eventVersion < 1L) {
                return CallbackPolicyDecision.invalid("event_version은 1 이상이어야 합니다.");
            }
            String status = body.status() != null ? body.status().trim().toUpperCase() : "COMPLETED";
            if (!ALLOWED_EXPORT_CALLBACK_STATUSES.contains(status)) {
                return CallbackPolicyDecision.invalid("status는 COMPLETED 또는 FAILED만 허용됩니다.");
            }
            return CallbackPolicyDecision.valid(status, eventVersion);
        }
    }
}
