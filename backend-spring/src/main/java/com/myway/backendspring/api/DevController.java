package com.myway.backendspring.api;

import com.myway.backendspring.common.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/dev")
public class DevController {
    private final String appEnv;

    public DevController(@Value("${myway.app.env:development}") String appEnv) {
        this.appEnv = appEnv;
    }

    @PostMapping("/learning-store/reload")
    public ResponseEntity<ApiResponse<Map<String, Object>>> reloadLearningStore() {
        if (!"development".equalsIgnoreCase(appEnv)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.failure("NOT_FOUND", "요청한 리소스를 찾을 수 없습니다."));
        }
        return ResponseEntity.ok(ApiResponse.success(Map.of("reloaded", true), "학습 저장소를 다시 불러왔습니다."));
    }
}
