package com.myway.backendspring.common;

import java.util.Map;

public record ApiResponse<T>(boolean success, T data, ApiError error, String message) {
    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(true, data, null, message);
    }

    public static <T> ApiResponse<T> success(T data) {
        return success(data, null);
    }

    public static <T> ApiResponse<T> failure(String code, String message) {
        return new ApiResponse<>(false, null, new ApiError(code, message), message);
    }

    public static <T> ApiResponse<T> failure(String code, String message, Map<String, Object> meta) {
        return new ApiResponse<>(false, null, new ApiError(code, message, meta), message);
    }
}
