package com.myway.backendspring.api;

import com.myway.backendspring.auth.DemoUser;
import com.myway.backendspring.auth.DemoUsers;
import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.auth.SessionView;
import com.myway.backendspring.common.ApiResponse;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final SessionService sessionService;

    public AuthController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @GetMapping("/users")
    public ApiResponse<List<DemoUser>> users() {
        return ApiResponse.success(DemoUsers.USERS);
    }

    public record LoginBody(@NotBlank String userId) {}

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<SessionView>> login(@RequestBody LoginBody body) {
        if (body == null || body.userId() == null || body.userId().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("USER_ID_REQUIRED", "로그인할 사용자 식별자가 필요합니다."));
        }

        DemoUser user = sessionService.findUser(body.userId().trim()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.failure("USER_NOT_FOUND", "사용자를 찾을 수 없습니다."));
        }

        return ResponseEntity.ok(ApiResponse.success(sessionService.login(user), "로그인되었습니다."));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<SessionView>> me(@RequestHeader(value = "Authorization", required = false) String auth) {
        SessionView session = sessionService.me(auth);
        if (session == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
        }

        return ResponseEntity.ok(ApiResponse.success(session));
    }

    @PostMapping("/logout")
    public ApiResponse<Map<String, Boolean>> logout(@RequestHeader(value = "Authorization", required = false) String auth) {
        sessionService.logout(auth);
        return ApiResponse.success(Map.of("logged_out", true), "로그아웃되었습니다.");
    }
}
