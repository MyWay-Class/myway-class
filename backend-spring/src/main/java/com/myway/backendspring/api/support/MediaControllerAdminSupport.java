package com.myway.backendspring.api.support;

import com.myway.backendspring.auth.SessionView;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.domain.DemoLearningService;
import com.myway.backendspring.feature.media.MediaPipelineService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class MediaControllerAdminSupport {
    private final MediaPipelineService mediaPipelineService;
    private final DemoLearningService learningService;
    private final MediaControllerSupport support;

    public MediaControllerAdminSupport(
            MediaPipelineService mediaPipelineService,
            DemoLearningService learningService,
            MediaControllerSupport support
    ) {
        this.mediaPipelineService = mediaPipelineService;
        this.learningService = learningService;
        this.support = support;
    }

    public ResponseEntity<ApiResponse<Map<String, Object>>> upsertTranscriptSpeakerReview(
            SessionView session,
            String lectureId,
            String speakerLabel,
            String instructorName,
            Double confidence,
            String note
    ) {
        if (!support.canManageMedia(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.failure("FORBIDDEN", "화자 검수는 강사와 운영자만 사용할 수 있습니다."));
        }
        if (learningService.getLecture(lectureId) == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.failure("LECTURE_NOT_FOUND", "강의를 찾을 수 없습니다."));
        }
        if (instructorName == null || instructorName.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.failure("INSTRUCTOR_NAME_REQUIRED", "instructor_name이 필요합니다."));
        }
        Map<String, Object> payload = mediaPipelineService.upsertSpeakerReview(
                lectureId,
                speakerLabel,
                instructorName,
                confidence,
                note,
                session.user().id()
        );
        return ResponseEntity.ok(ApiResponse.success(payload, "화자/강사 검수가 저장되었습니다."));
    }

    public ResponseEntity<ApiResponse<Map<String, Object>>> bindLectureVideo(
            SessionView session,
            String lectureId,
            String assetKey,
            String videoUrl
    ) {
        if (!support.canManageMedia(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.failure("FORBIDDEN", "강의 영상 연결은 강사와 운영자만 사용할 수 있습니다."));
        }
        if (learningService.getLecture(lectureId) == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.failure("LECTURE_NOT_FOUND", "강의를 찾을 수 없습니다."));
        }
        Map<String, Object> payload = mediaPipelineService.bindLectureVideoAsset(lectureId, assetKey, videoUrl);
        if (payload == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.failure("INVALID_ASSET_BINDING", "lecture_id와 asset_key를 확인해 주세요."));
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(payload, "강의와 영상 에셋이 연결되었습니다."));
    }

    public ResponseEntity<ApiResponse<Map<String, Object>>> runBatchPipeline(
            SessionView session,
            List<String> lectureIds,
            Integer retryCount,
            boolean forceRun,
            String language,
            String sttProvider,
            String sttModel
    ) {
        if (!support.isAdmin(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.failure("FORBIDDEN", "배치 파이프라인 실행은 운영자만 사용할 수 있습니다."));
        }
        Map<String, Object> result = mediaPipelineService.runBatchPipeline(
                lectureIds,
                retryCount,
                forceRun,
                language,
                sttProvider,
                sttModel
        );
        return ResponseEntity.ok(ApiResponse.success(result, "STT/RAG 배치 파이프라인 실행이 완료되었습니다."));
    }
}
