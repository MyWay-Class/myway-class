package com.myway.backendspring.api;

import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.auth.SessionView;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.domain.DashboardView;
import com.myway.backendspring.domain.DemoLearningService;
import com.myway.backendspring.domain.ActivityEventService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {
    private final SessionService sessionService;
    private final DemoLearningService learningService;
    private final ActivityEventService activityEventService;

    public DashboardController(SessionService sessionService, DemoLearningService learningService, ActivityEventService activityEventService) {
        this.sessionService = sessionService;
        this.learningService = learningService;
        this.activityEventService = activityEventService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> dashboard(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView session = sessionService.me(auth);
        if (session == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        }
        DashboardView view = learningService.getDashboard(session.user().id());
        int totalCourses = view.courses().size();
        int averageProgress = totalCourses == 0
                ? 0
                : (int) Math.round(view.courses().stream().mapToInt(course -> course.progress_percent()).average().orElse(0));

        List<Map<String, Object>> recentActivities = new ArrayList<>();
        for (Map<String, Object> event : activityEventService.recent(session.user().id(), 12)) {
            String type = String.valueOf(event.getOrDefault("type", "insight"));
            Map<String, Object> metadata = event.get("metadata") instanceof Map<?, ?> map
                    ? (Map<String, Object>) map
                    : Map.of();
            recentActivities.add(Map.of(
                    "id", String.valueOf(event.getOrDefault("id", "")),
                    "type", normalizeActivityType(type),
                    "title", activityTitle(type),
                    "detail", activityDetail(type, metadata),
                    "timestamp", String.valueOf(event.getOrDefault("occurred_at", "")),
                    "icon", activityIcon(type),
                    "tone", activityTone(type)
            ));
        }

        Map<String, Object> payload = Map.of(
                "learner_name", session.user().name(),
                "role", normalizeRole(session.user().role()),
                "total_courses", totalCourses,
                "active_enrollments", view.enrolled_count(),
                "average_progress", averageProgress,
                "courses", view.courses(),
                "stats", List.of(),
                "recent_activities", recentActivities,
                "next_action", "이어서 학습할 강의를 선택하세요."
        );
        return ResponseEntity.ok(ApiResponse.success(payload));
    }

    private String normalizeRole(String role) {
        if (role == null) return "student";
        return switch (role.toLowerCase()) {
            case "admin" -> "admin";
            case "instructor" -> "instructor";
            default -> "student";
        };
    }

    private String normalizeActivityType(String type) {
        if (type == null) return "insight";
        if (type.startsWith("ai_")) return "ai_chat";
        if ("enrollment".equals(type)) return "enrollment";
        if ("lecture_complete".equals(type)) return "lecture_complete";
        if (type.startsWith("media_extraction")) return "insight";
        return "insight";
    }

    private String activityTitle(String type) {
        if (type == null) return "최근 활동";
        if (type.startsWith("ai_")) return "AI 기능 사용";
        if ("enrollment".equals(type)) return "수강 신청";
        if ("lecture_complete".equals(type)) return "강의 완료";
        if (type.startsWith("media_extraction")) return "미디어 처리";
        return "최근 활동";
    }

    private String activityDetail(String type, Map<String, Object> metadata) {
        if (type == null) return "활동이 기록되었습니다.";
        if ("lecture_complete".equals(type)) {
            return "강의 진도가 반영되었습니다.";
        }
        if ("enrollment".equals(type)) {
            return "코스 수강이 등록되었습니다.";
        }
        if (type.startsWith("media_extraction_failed")) {
            return "오디오 추출 처리에 실패했습니다.";
        }
        if (type.startsWith("media_extraction_completed")) {
            return "오디오 추출과 전사가 완료되었습니다.";
        }
        if (type.startsWith("ai_")) {
            return "AI 요청이 처리되었습니다.";
        }
        return String.valueOf(metadata.getOrDefault("message", "활동이 기록되었습니다."));
    }

    private String activityIcon(String type) {
        if (type == null) return "sparkles";
        if ("lecture_complete".equals(type)) return "check-circle";
        if ("enrollment".equals(type)) return "book-open";
        if (type.startsWith("ai_")) return "sparkles";
        if (type.startsWith("media_extraction")) return "video";
        return "sparkles";
    }

    private String activityTone(String type) {
        if (type == null) return "slate";
        if ("lecture_complete".equals(type)) return "emerald";
        if ("enrollment".equals(type)) return "indigo";
        if (type.startsWith("ai_")) return "violet";
        if (type.startsWith("media_extraction_failed")) return "amber";
        if (type.startsWith("media_extraction")) return "indigo";
        return "slate";
    }
}
