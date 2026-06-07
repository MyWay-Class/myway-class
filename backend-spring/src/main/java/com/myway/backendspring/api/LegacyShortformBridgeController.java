package com.myway.backendspring.api;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.myway.backendspring.auth.SessionService;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.feature.FeatureStoreDomainFacade;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/legacy/shortform")
public class LegacyShortformBridgeController {
    public static final class LegacyBody {
        private final Map<String, Object> payload = new HashMap<>();

        @JsonAnySetter
        public void put(String key, Object value) {
            payload.put(key, value);
        }

        public Map<String, Object> payload() {
            return payload;
        }
    }

    private final ShortformController shortformController;
    private final FeatureStoreDomainFacade featureStore;
    private final SessionService sessionService;

    public LegacyShortformBridgeController(
            ShortformController shortformController,
            FeatureStoreDomainFacade featureStore,
            SessionService sessionService
    ) {
        this.shortformController = shortformController;
        this.featureStore = featureStore;
        this.sessionService = sessionService;
    }

    @GetMapping("/library")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> legacyShortformLibrary(@RequestHeader(value = "Authorization", required = false) String auth) {
        String userId = requireUserId(auth);
        if (userId == null) return unauthenticated();
        return ResponseEntity.ok(ApiResponse.success(featureStore.shortformLibrary(userId), "legacy shortform library 응답을 /api/v1/shortform/library와 동일하게 반환했습니다."));
    }

    @GetMapping("/community")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> legacyShortformCommunity(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestParam(value = "course_id", required = false) String courseId
    ) {
        if (requireUserId(auth) == null) return unauthenticated();
        return ResponseEntity.ok(ApiResponse.success(featureStore.shortformCommunity(courseId), "legacy shortform community 응답을 /api/v1/shortform/community와 동일하게 반환했습니다."));
    }

    @GetMapping("/videos/my")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> legacyShortformVideos(@RequestHeader(value = "Authorization", required = false) String auth) {
        String userId = requireUserId(auth);
        if (userId == null) return unauthenticated();
        return ResponseEntity.ok(ApiResponse.success(featureStore.shortformVideos(userId), "legacy shortform videos 응답을 /api/v1/shortform/videos/my와 동일하게 반환했습니다."));
    }

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyShortformGenerate(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) LegacyBody body
    ) {
        Map<String, Object> payload = payloadOf(body);
        return shortformController.generate(auth, new ShortformController.GenerateRequest(
                text(payload, "course_id"),
                text(payload, "mode"),
                transcriptChunksByLecture(payload),
                transcriptSegmentsByLecture(payload)
        ));
    }

    @PutMapping("/candidates/select")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyShortformSelect(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) LegacyBody body
    ) {
        Map<String, Object> payload = payloadOf(body);
        return shortformController.select(auth, new ShortformController.SelectCandidatesRequest(
                text(payload, "extraction_id"),
                listOfString(payload, "candidate_ids")
        ));
    }

    @GetMapping("/extraction/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyShortformExtraction(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable String id
    ) {
        return shortformController.extraction(auth, id);
    }

    @PostMapping("/compose")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyShortformCompose(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) LegacyBody body
    ) {
        Map<String, Object> payload = payloadOf(body);
        return shortformController.compose(auth, new ShortformController.ComposeRequest(
                text(payload, "title"),
                text(payload, "description"),
                text(payload, "course_id"),
                text(payload, "extraction_id"),
                listOfString(payload, "candidate_ids"),
                List.of()
        ));
    }

    @GetMapping("/video/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyShortformVideo(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable String id
    ) {
        return shortformController.video(auth, id);
    }

    @PostMapping("/share")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyShortformShare(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) LegacyBody body
    ) {
        Map<String, Object> payload = payloadOf(body);
        return shortformController.share(auth, new ShortformController.ShareRequest(
                text(payload, "video_id"),
                text(payload, "course_id"),
                text(payload, "visibility"),
                text(payload, "message")
        ));
    }

    @PostMapping("/save")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyShortformSave(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) LegacyBody body
    ) {
        Map<String, Object> payload = payloadOf(body);
        return shortformController.save(auth, new ShortformController.SaveRequest(
                text(payload, "video_id"),
                text(payload, "note"),
                text(payload, "folder")
        ));
    }

    @PostMapping("/like")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyShortformLike(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) LegacyBody body
    ) {
        Map<String, Object> payload = payloadOf(body);
        return shortformController.like(auth, new ShortformController.LikeRequest(text(payload, "video_id")));
    }

    @PostMapping("/{shortformId}/export/retry")
    public ResponseEntity<ApiResponse<Map<String, Object>>> legacyShortformRetry(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable String shortformId
    ) {
        return shortformController.retry(auth, shortformId);
    }

    private String requireUserId(String auth) {
        var session = sessionService.me(auth);
        return session == null ? null : session.user().id();
    }

    private ResponseEntity<ApiResponse<List<Map<String, Object>>>> unauthenticated() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.failure("UNAUTHENTICATED", "로그인이 필요합니다."));
    }

    private String text(Map<String, Object> body, String key) {
        if (body == null || body.get(key) == null) return "";
        return String.valueOf(body.get(key)).trim();
    }

    private Map<String, Object> payloadOf(LegacyBody body) {
        return body == null ? Map.of() : body.payload();
    }

    private List<String> listOfString(Map<String, Object> body, String key) {
        if (body == null) return List.of();
        Object raw = body.get(key);
        if (!(raw instanceof List<?> items)) return List.of();
        return items.stream().map(String::valueOf).toList();
    }

    @SuppressWarnings("unchecked")
    private Map<String, List<Map<String, Object>>> transcriptChunksByLecture(Map<String, Object> body) {
        return transcriptByLecture(body, "transcript_chunks_by_lecture");
    }

    private Map<String, List<Map<String, Object>>> transcriptSegmentsByLecture(Map<String, Object> body) {
        return transcriptByLecture(body, "transcript_segments_by_lecture");
    }

    private Map<String, List<Map<String, Object>>> transcriptByLecture(Map<String, Object> body, String keyName) {
        if (body == null) return Map.of();
        Object raw = body.get(keyName);
        if (!(raw instanceof Map<?, ?> rawMap)) return Map.of();
        Map<String, List<Map<String, Object>>> result = new HashMap<>();
        for (Map.Entry<?, ?> entry : rawMap.entrySet()) {
            String lectureId = String.valueOf(entry.getKey()).trim();
            if (lectureId.isBlank()) continue;
            Object rawSegments = entry.getValue();
            if (!(rawSegments instanceof List<?> items)) continue;
            List<Map<String, Object>> segments = new java.util.ArrayList<>();
            for (Object item : items) {
                if (!(item instanceof Map<?, ?> segmentMap)) continue;
                Map<String, Object> row = new HashMap<>();
                for (Map.Entry<?, ?> segmentEntry : segmentMap.entrySet()) {
                    row.put(String.valueOf(segmentEntry.getKey()), segmentEntry.getValue());
                }
                segments.add(row);
            }
            result.put(lectureId, segments);
        }
        return result;
    }
}
