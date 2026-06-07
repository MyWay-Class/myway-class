package com.myway.backendspring.api.support;

import com.myway.backendspring.auth.SessionView;
import com.myway.backendspring.common.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;

@Component
public class ShortformControllerSupport {
    private static final Set<String> ALLOWED_EXPORT_CALLBACK_STATUSES = Set.of("COMPLETED", "FAILED");

    public <T> ResponseEntity<ApiResponse<T>> unauthenticated() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
    }

    public String orEmpty(String value) {
        return value == null ? "" : value;
    }

    public String trimRequired(String value) {
        return value.trim();
    }

    public boolean isAdmin(SessionView session) {
        return session != null && "admin".equals(session.user().role());
    }

    public boolean isInstructor(SessionView session) {
        return session != null && "instructor".equals(session.user().role());
    }

    public ResponseEntity<ApiResponse<Map<String, Object>>> badRequest(String code, String message) {
        return ResponseEntity.badRequest().body(ApiResponse.failure(code, message));
    }

    public ResponseEntity<ApiResponse<Map<String, Object>>> forbidden(String message) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.failure("FORBIDDEN", message));
    }

    public CallbackPolicyDecision decideExportCallbackState(String statusInput, Long eventVersionInput) {
        long eventVersion = eventVersionInput == null ? 0L : eventVersionInput;
        if (eventVersion < 1L) {
            return CallbackPolicyDecision.invalid("event_version은 1 이상이어야 합니다.");
        }
        String status = statusInput != null ? statusInput.trim().toUpperCase() : "COMPLETED";
        if (!ALLOWED_EXPORT_CALLBACK_STATUSES.contains(status)) {
            return CallbackPolicyDecision.invalid("status는 COMPLETED 또는 FAILED만 허용됩니다.");
        }
        return CallbackPolicyDecision.valid(status, eventVersion);
    }

    public record CallbackPolicyDecision(boolean valid, String status, long eventVersion, String errorMessage) {
        public static CallbackPolicyDecision valid(String status, long eventVersion) {
            return new CallbackPolicyDecision(true, status, eventVersion, null);
        }

        public static CallbackPolicyDecision invalid(String errorMessage) {
            return new CallbackPolicyDecision(false, null, 0L, errorMessage);
        }
    }
}
