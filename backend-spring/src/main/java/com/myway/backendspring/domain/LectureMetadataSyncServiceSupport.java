package com.myway.backendspring.domain;

import com.myway.backendspring.persistence.FeatureJdbcStore;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class LectureMetadataSyncServiceSupport {
    public Map<String, Object> syncAll(
            FeatureJdbcStore store,
            boolean useStore,
            List<LectureItem> lectures,
            String lectureMetaScope,
            String transcriptScope,
            LectureMetadataSyncSupport lectureMetadataSyncSupport,
            TranscriptMetaBuilder transcriptMetaBuilder,
            boolean overwriteExisting
    ) {
        if (!useStore) {
            return Map.of("updated_count", 0, "skipped_count", 0, "items", List.of());
        }
        List<Map<String, Object>> items = new ArrayList<>();
        int updated = 0;
        int skipped = 0;
        for (LectureItem lecture : lectures) {
            String lectureId = lecture.id();
            Map<String, Object> transcript = store.getKv(transcriptScope, lectureId);
            if (transcript == null) {
                skipped += 1;
                items.add(Map.of("lecture_id", lectureId, "status", "SKIPPED", "reason", "TRANSCRIPT_MISSING"));
                continue;
            }
            Map<String, Object> current = store.getKv(lectureMetaScope, lectureId);
            Map<String, Object> suggested = transcriptMetaBuilder.build(lecture, transcript);
            if (suggested == null || suggested.isEmpty()) {
                skipped += 1;
                items.add(Map.of("lecture_id", lectureId, "status", "SKIPPED", "reason", "SUGGESTION_EMPTY"));
                continue;
            }
            Map<String, Object> merged = lectureMetadataSyncSupport.mergeLectureMeta(current, suggested, overwriteExisting);
            store.upsertKv(lectureMetaScope, lectureId, merged);
            updated += 1;
            items.add(Map.of("lecture_id", lectureId, "status", "UPDATED"));
        }
        return Map.of("updated_count", updated, "skipped_count", skipped, "items", items);
    }

    public Map<String, Object> syncOne(
            FeatureJdbcStore store,
            boolean useStore,
            String lectureId,
            LectureItem lecture,
            String lectureMetaScope,
            String transcriptScope,
            LectureMetadataSyncSupport lectureMetadataSyncSupport,
            TranscriptMetaBuilder transcriptMetaBuilder,
            boolean overwriteExisting
    ) {
        String normalizedLectureId = lectureId == null ? "" : lectureId.trim();
        if (!useStore) return Map.of("lecture_id", normalizedLectureId, "status", "SKIPPED", "reason", "STORE_DISABLED");
        if (normalizedLectureId.isBlank()) return Map.of("lecture_id", "", "status", "SKIPPED", "reason", "LECTURE_ID_REQUIRED");
        if (lecture == null) return Map.of("lecture_id", normalizedLectureId, "status", "SKIPPED", "reason", "LECTURE_NOT_FOUND");

        Map<String, Object> transcript = store.getKv(transcriptScope, normalizedLectureId);
        if (transcript == null) return Map.of("lecture_id", normalizedLectureId, "status", "SKIPPED", "reason", "TRANSCRIPT_MISSING");

        Map<String, Object> current = store.getKv(lectureMetaScope, normalizedLectureId);
        Map<String, Object> suggested = transcriptMetaBuilder.build(lecture, transcript);
        if (suggested == null || suggested.isEmpty()) return Map.of("lecture_id", normalizedLectureId, "status", "SKIPPED", "reason", "SUGGESTION_EMPTY");

        Map<String, Object> merged = lectureMetadataSyncSupport.mergeLectureMeta(current, suggested, overwriteExisting);
        store.upsertKv(lectureMetaScope, normalizedLectureId, merged);
        return Map.of("lecture_id", normalizedLectureId, "status", "UPDATED");
    }

    public LectureItem attachLectureMeta(
            FeatureJdbcStore store,
            boolean useStore,
            LectureItem lecture,
            String lectureMetaScope,
            String transcriptScope,
            LectureMetadataSyncSupport lectureMetadataSyncSupport,
            TranscriptMetaBuilder transcriptMetaBuilder
    ) {
        if (!useStore) return lecture;
        String lectureId = lecture.id();
        if (lectureId == null || lectureId.isBlank()) return lecture;

        Map<String, Object> currentMeta = store.getKv(lectureMetaScope, lectureId);
        if (lectureMetadataSyncSupport.isLectureMetaMissing(currentMeta)) {
            Map<String, Object> transcript = store.getKv(transcriptScope, lectureId);
            if (transcript != null) {
                Map<String, Object> suggested = transcriptMetaBuilder.build(lecture, transcript);
                Map<String, Object> merged = lectureMetadataSyncSupport.mergeLectureMeta(currentMeta, suggested, false);
                store.upsertKv(lectureMetaScope, lectureId, merged);
                currentMeta = merged;
            }
        }

        String content = lectureMetadataSyncSupport.chooseText(
                lectureMetadataSyncSupport.asText(currentMeta == null ? null : currentMeta.get("content_text")),
                lecture.content_text(),
                "강의 핵심 내용을 정리 중입니다."
        );
        String excerpt = lectureMetadataSyncSupport.chooseText(
                lectureMetadataSyncSupport.asText(currentMeta == null ? null : currentMeta.get("transcript_excerpt")),
                lecture.transcript_excerpt(),
                ""
        );
        String instructorName = lectureMetadataSyncSupport.chooseText(
                lectureMetadataSyncSupport.asText(currentMeta == null ? null : currentMeta.get("instructor_name")),
                lecture.instructor_name(),
                ""
        );
        return new LectureItem(
                lecture.id(),
                lecture.course_id(),
                lecture.title(),
                lecture.duration_minutes(),
                content,
                excerpt,
                instructorName
        );
    }

    @FunctionalInterface
    public interface TranscriptMetaBuilder {
        Map<String, Object> build(LectureItem lecture, Map<String, Object> transcript);
    }
}
