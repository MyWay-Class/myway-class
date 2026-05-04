package com.myway.backendspring.api;

import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.auth.SessionView;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.domain.DemoLearningService;
import com.myway.backendspring.domain.SmartChatResult;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/smart")
public class SmartController {
    private final SessionService sessionService;
    private final DemoLearningService learningService;

    public SmartController(SessionService sessionService, DemoLearningService learningService) {
        this.sessionService = sessionService;
        this.learningService = learningService;
    }

    public record SmartChatRequest(String message) {}

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<SmartChatResult>> chat(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody SmartChatRequest body) {
        SessionView session = sessionService.me(auth);
        if (session == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        }

        SmartChatResult result = learningService.chat(body != null ? body.message() : null);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
