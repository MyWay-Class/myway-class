package com.myway.backendspring.api;

import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.auth.SessionView;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.domain.DashboardView;
import com.myway.backendspring.domain.DemoLearningService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {
    private final SessionService sessionService;
    private final DemoLearningService learningService;

    public DashboardController(SessionService sessionService, DemoLearningService learningService) {
        this.sessionService = sessionService;
        this.learningService = learningService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<DashboardView>> dashboard(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView session = sessionService.me(auth);
        if (session == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        }
        return ResponseEntity.ok(ApiResponse.success(learningService.getDashboard(session.user().id())));
    }
}
