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
        if (isAiIntentMessageViolation(exception)) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("MESSAGE_REQUIRED", "message가 필요합니다."));
        }
        if (isAiSearchQueryViolation(exception)) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("QUERY_REQUIRED", "query가 필요합니다."));
        }
        if (isAiAnswerQuestionViolation(exception)) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("QUESTION_REQUIRED", "question이 필요합니다."));
        }
        if (isAiLectureIdViolation(exception)) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("LECTURE_ID_REQUIRED", "lecture_id가 필요합니다."));
        }
        if (isShortformSelectExtractionViolation(exception)) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("EXTRACTION_ID_REQUIRED", "extraction_id가 필요합니다."));
        }
        if (isShortformSelectCandidatesViolation(exception)) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("CANDIDATE_IDS_REQUIRED", "candidate_ids가 필요합니다."));
        }
        if (isShortformLikeVideoViolation(exception)) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("VIDEO_ID_REQUIRED", "video_id가 필요합니다."));
        }
        if (isShortformShareVideoViolation(exception)) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("VIDEO_ID_REQUIRED", "video_id가 필요합니다."));
        }
        if (isShortformSaveVideoViolation(exception)) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("VIDEO_ID_REQUIRED", "video_id가 필요합니다."));
        }
        if (isShortformCallbackIdViolation(exception)) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("SHORTFORM_ID_REQUIRED", "shortform_id가 필요합니다."));
        }
        if (isMediaLectureIdViolation(exception)) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("LECTURE_ID_REQUIRED", "lecture_id가 필요합니다."));
        }
        if (isAdminAssignmentStudentIdsViolation(exception)) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("STUDENT_IDS_REQUIRED", "student_ids가 필요합니다."));
        }
        if (isAdminAssignmentStudentIdViolation(exception)) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("STUDENT_ID_REQUIRED", "student_ids에는 비어 있지 않은 사용자 식별자가 필요합니다."));
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

    private boolean isAiIntentMessageViolation(MethodArgumentNotValidException exception) {
        return hasNotBlankViolation(exception, "intentRequest", "message")
                || hasNotBlankViolation(exception, "smartChatRequest", "message");
    }

    private boolean isAiSearchQueryViolation(MethodArgumentNotValidException exception) {
        return hasNotBlankViolation(exception, "searchRequest", "query")
                || hasNotBlankViolation(exception, "ragRequest", "query");
    }

    private boolean isAiAnswerQuestionViolation(MethodArgumentNotValidException exception) {
        return hasNotBlankViolation(exception, "answerRequest", "question");
    }

    private boolean isAiLectureIdViolation(MethodArgumentNotValidException exception) {
        return hasNotBlankViolation(exception, "summaryRequest", "lecture_id")
                || hasNotBlankViolation(exception, "quizRequest", "lecture_id");
    }

    private boolean hasNotBlankViolation(MethodArgumentNotValidException exception, String objectName, String fieldName) {
        if (!objectName.equals(exception.getBindingResult().getObjectName())) {
            return false;
        }
        return exception.getBindingResult().getFieldErrors().stream()
                .anyMatch(error -> fieldName.equals(error.getField()) && "NotBlank".equals(error.getCode()));
    }

    private boolean hasNotEmptyViolation(MethodArgumentNotValidException exception, String objectName, String fieldName) {
        if (!objectName.equals(exception.getBindingResult().getObjectName())) {
            return false;
        }
        return exception.getBindingResult().getFieldErrors().stream()
                .anyMatch(error -> fieldName.equals(error.getField()) && "NotEmpty".equals(error.getCode()));
    }

    private boolean isShortformSelectExtractionViolation(MethodArgumentNotValidException exception) {
        return hasNotBlankViolation(exception, "selectCandidatesRequest", "extraction_id");
    }

    private boolean isShortformSelectCandidatesViolation(MethodArgumentNotValidException exception) {
        return hasNotEmptyViolation(exception, "selectCandidatesRequest", "candidate_ids");
    }

    private boolean isShortformLikeVideoViolation(MethodArgumentNotValidException exception) {
        return hasNotBlankViolation(exception, "likeRequest", "video_id");
    }

    private boolean isShortformShareVideoViolation(MethodArgumentNotValidException exception) {
        return hasNotBlankViolation(exception, "shareRequest", "video_id");
    }

    private boolean isShortformSaveVideoViolation(MethodArgumentNotValidException exception) {
        return hasNotBlankViolation(exception, "saveRequest", "video_id");
    }

    private boolean isShortformCallbackIdViolation(MethodArgumentNotValidException exception) {
        return hasNotBlankViolation(exception, "exportCallbackRequest", "shortform_id");
    }

    private boolean isMediaLectureIdViolation(MethodArgumentNotValidException exception) {
        return hasNotBlankViolation(exception, "extractAudioRequest", "lecture_id")
                || hasNotBlankViolation(exception, "transcribeRequest", "lecture_id")
                || hasNotBlankViolation(exception, "summarizeRequest", "lecture_id");
    }

    private boolean isAdminAssignmentStudentIdsViolation(MethodArgumentNotValidException exception) {
        return hasViolationByCode(exception, "assignmentUpdateRequest", "student_ids", "NotNull");
    }

    private boolean isAdminAssignmentStudentIdViolation(MethodArgumentNotValidException exception) {
        if (!"assignmentUpdateRequest".equals(exception.getBindingResult().getObjectName())) {
            return false;
        }
        return exception.getBindingResult().getFieldErrors().stream()
                .anyMatch(error -> error.getField().startsWith("student_ids[") && "NotBlank".equals(error.getCode()));
    }

    private boolean hasViolationByCode(MethodArgumentNotValidException exception, String objectName, String fieldName, String code) {
        if (!objectName.equals(exception.getBindingResult().getObjectName())) {
            return false;
        }
        return exception.getBindingResult().getFieldErrors().stream()
                .anyMatch(error -> fieldName.equals(error.getField()) && code.equals(error.getCode()));
    }

}
