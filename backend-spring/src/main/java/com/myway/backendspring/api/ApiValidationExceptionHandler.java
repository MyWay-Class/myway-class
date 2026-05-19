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
        if (isCourseCreateInputViolation(exception)) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("COURSE_CREATE_FIELDS_REQUIRED", "강의 제목, 설명, 카테고리, 난이도가 필요합니다."));
        }
        if (isMaterialInputViolation(exception)) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("MATERIAL_FIELDS_REQUIRED", "자료 제목, 요약, 파일명이 필요합니다."));
        }
        if (isNoticeInputViolation(exception)) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("NOTICE_FIELDS_REQUIRED", "공지 제목과 내용이 필요합니다."));
        }
        if (isEnrollmentRequestViolation(exception)) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("COURSE_ID_REQUIRED", "강의 식별자가 필요합니다."));
        }
        return ResponseEntity.badRequest().body(ApiResponse.failure("INVALID_BODY", "요청 본문이 올바르지 않습니다."));
    }

    private boolean hasUserIdNotBlankViolation(MethodArgumentNotValidException exception) {
        return exception.getBindingResult().getFieldErrors().stream()
                .anyMatch(error -> "userId".equals(error.getField()) && "NotBlank".equals(error.getCode()));
    }

    private boolean isCourseCreateInputViolation(MethodArgumentNotValidException exception) {
        return "courseCreateInput".equals(exception.getBindingResult().getObjectName());
    }

    private boolean isMaterialInputViolation(MethodArgumentNotValidException exception) {
        return "materialInput".equals(exception.getBindingResult().getObjectName());
    }

    private boolean isNoticeInputViolation(MethodArgumentNotValidException exception) {
        return "noticeInput".equals(exception.getBindingResult().getObjectName());
    }

    private boolean isEnrollmentRequestViolation(MethodArgumentNotValidException exception) {
        return "enrollmentRequest".equals(exception.getBindingResult().getObjectName());
    }
}
