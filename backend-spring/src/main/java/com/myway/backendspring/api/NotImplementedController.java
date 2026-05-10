package com.myway.backendspring.api;

import com.myway.backendspring.common.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class NotImplementedController {

    @GetMapping("/legacy/mappings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyMappings() {
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "status", "migration_in_progress",
                "mappings", List.of(
                        Map.of("legacy", "/api/v1/legacy/courses", "replacement", "/api/v1/courses"),
                        Map.of("legacy", "/api/v1/legacy/ai/*", "replacement", "/api/v1/ai/*"),
                        Map.of("legacy", "/api/v1/legacy/media/*", "replacement", "/api/v1/media/*"),
                        Map.of("legacy", "/api/v1/legacy/shortform/*", "replacement", "/api/v1/shortform/*")
                )
        ), "legacy API 매핑 정보를 반환했습니다."));
    }

    @GetMapping("/legacy/{domain}")
    public ResponseEntity<ApiResponse<Object>> legacyDomain(@PathVariable String domain) {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
                .body(ApiResponse.failure("NOT_IMPLEMENTED", "legacy/" + domain + " API는 이관 중입니다. /api/v1/legacy/mappings를 확인하세요."));
    }

    @RequestMapping(value = {"/legacy", "/legacy/**"})
    public ResponseEntity<ApiResponse<Object>> notImplemented() {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
                .body(ApiResponse.failure("NOT_IMPLEMENTED", "Spring 백엔드 마이그레이션 중인 API입니다. /api/v1/legacy/mappings를 확인하세요."));
    }
}
