package com.myway.backendspring.feature.media;

import com.myway.backendspring.domain.DemoLearningService;
import com.myway.backendspring.domain.LectureItem;
import com.myway.backendspring.feature.repository.FeatureStoreRepository;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class MediaTranscriptionDraftSupport {
    private static final String SPEAKER_REVIEW_SCOPE = "media_speaker_review";
    private static final int PUBLIC_STT_MAX_DURATION_MS = 180_000;
    private static final int FALLBACK_TRANSCRIPT_DURATION_MS = 120_000;

    public int resolveDurationMs(DemoLearningService learningService, String lectureId, Integer durationMsInput) {
        LectureItem lecture = learningService.getLecture(lectureId);
        int lectureDurationMs = lecture == null ? FALLBACK_TRANSCRIPT_DURATION_MS : Math.max(3_000, lecture.duration_minutes() * 60_000);
        int requested = durationMsInput == null || durationMsInput <= 0 ? lectureDurationMs : durationMsInput;
        return Math.min(requested, PUBLIC_STT_MAX_DURATION_MS);
    }

    public String buildLectureNarrative(DemoLearningService learningService, String lectureId) {
        LectureItem lecture = learningService.getLecture(lectureId);
        if (lecture == null) return "강의 텍스트를 찾을 수 없습니다.";
        return lecture.title() + " 강의에서는 핵심 개념을 설명하고, 실습 흐름과 복습 포인트를 단계적으로 정리합니다. " +
                "특히 자주 혼동되는 개념을 예시로 비교하고, 다음 차시와 연결되는 질문을 중심으로 학습합니다.";
    }

    public Map<String, Object> inferInstructorGuess(DemoLearningService learningService, String lectureId) {
        LectureItem lecture = learningService.getLecture(lectureId);
        if (lecture == null) {
            return Map.of(
                    "speaker_label", "SPEAKER_01",
                    "instructor_name", "Unknown Instructor",
                    "confidence", 0.35,
                    "source", "fallback"
            );
        }
        String instructorName = "Instructor";
        String source = "heuristic";
        try {
            var detail = learningService.getCourseDetail(lecture.course_id(), "usr_admin_001");
            String instructorId = detail == null ? "" : String.valueOf(detail.instructor_id());
            if ("usr_ins_001".equals(instructorId)) {
                instructorName = "Instructor Lee";
            } else if (!instructorId.isBlank()) {
                instructorName = instructorId;
                source = "course_instructor_id";
            }
        } catch (Exception ignored) {
            source = "fallback";
        }

        return Map.of(
                "speaker_label", "SPEAKER_01",
                "instructor_name", instructorName,
                "confidence", 0.72,
                "source", source
        );
    }

    public List<Map<String, Object>> buildSpeakerSegments(List<Map<String, Object>> segments, Map<String, Object> instructorGuess) {
        if (segments == null || segments.isEmpty()) {
            return List.of();
        }
        String instructorSpeaker = String.valueOf(instructorGuess.getOrDefault("speaker_label", "SPEAKER_01"));
        List<Map<String, Object>> speakerSegments = new java.util.ArrayList<>();
        for (int i = 0; i < segments.size(); i++) {
            Map<String, Object> segment = segments.get(i);
            Map<String, Object> speaker = new HashMap<>(segment);
            String speakerLabel = (i % 3 == 2) ? "SPEAKER_02" : instructorSpeaker;
            speaker.put("speaker_label", speakerLabel);
            speaker.put("speaker_role", instructorSpeaker.equals(speakerLabel) ? "instructor" : "participant");
            speakerSegments.add(speaker);
        }
        return speakerSegments;
    }

    public Map<String, Object> getSpeakerReview(FeatureStoreRepository repository, String lectureId) {
        if (lectureId == null || lectureId.isBlank()) {
            return Map.of("status", "PENDING");
        }
        Map<String, Object> found = repository.getKv(SPEAKER_REVIEW_SCOPE, lectureId);
        if (found == null) {
            return Map.of("status", "PENDING");
        }
        return found;
    }

    public String normalizeOrDefault(String value, String defaultValue) {
        if (value == null) return defaultValue;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? defaultValue : trimmed;
    }
}
