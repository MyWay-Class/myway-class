package com.myway.backendspring.common;

import java.util.Map;

public record ApiError(String code, String message, Map<String, Object> meta) {
    public ApiError(String code, String message) {
        this(code, message, Map.of());
    }
}
