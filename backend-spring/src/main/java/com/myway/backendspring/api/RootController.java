package com.myway.backendspring.api;

import com.myway.backendspring.common.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping
public class RootController {
    @GetMapping("/")
    public ApiResponse<Map<String, String>> root() {
        return ApiResponse.success(Map.of(
                "service", "myway-class-backend",
                "status", "ready",
                "documentation", "/api/v1/health"
        ));
    }

    @GetMapping("/api/v1/health")
    public ApiResponse<Map<String, String>> health() {
        return ApiResponse.success(Map.of(
                "status", "ok",
                "service", "myway-class-backend",
                "timestamp", Instant.now().toString()
        ));
    }
}
