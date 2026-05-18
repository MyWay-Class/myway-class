package com.myway.backendspring.api;

import com.myway.backendspring.common.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiValidationExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleMethodArgumentNotValid(MethodArgumentNotValidException exception) {
        if (hasUserIdNotBlankViolation(exception)) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("USER_ID_REQUIRED", "로그인할 사용자 식별자가 필요합니다."));
        }
        return ResponseEntity.badRequest().body(ApiResponse.failure("INVALID_BODY", "요청 본문이 올바르지 않습니다."));
    }

    private boolean hasUserIdNotBlankViolation(MethodArgumentNotValidException exception) {
        return exception.getBindingResult().getFieldErrors().stream()
                .anyMatch(error -> "userId".equals(error.getField()) && "NotBlank".equals(error.getCode()));
    }
}
