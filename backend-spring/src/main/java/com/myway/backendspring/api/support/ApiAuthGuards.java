package com.myway.backendspring.api.support;

import com.myway.backendspring.auth.RolePolicy;
import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.auth.SessionView;
import com.myway.backendspring.common.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

public final class ApiAuthGuards {
    private ApiAuthGuards() {}

    public static SessionView requireSession(SessionService sessionService, String auth) {
        return sessionService.me(auth);
    }

    public static <T> ResponseEntity<ApiResponse<T>> unauthenticated() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
    }

    public static <T> ResponseEntity<ApiResponse<T>> forbidden(String message) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.failure("FORBIDDEN", message));
    }

    public static boolean isAdmin(SessionView session) {
        return session != null && RolePolicy.isAdmin(session.user().role());
    }
}
