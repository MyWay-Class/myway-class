package com.myway.backendspring.domain;

import com.myway.backendspring.persistence.FeatureJdbcStore;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;

@Component
public class DemoLearningMetadataSupport {
    List<LectureItem> alignLectureDurations(
            List<LectureItem> lectures,
            boolean useStore,
            Function<LectureItem, LectureItem> aligner
    ) {
        if (lectures == null || lectures.isEmpty()) {
            return List.of();
        }
        if (!useStore) {
            return lectures;
        }
        return lectures.stream().map(aligner).toList();
    }

    LectureItem alignLectureDuration(
            FeatureJdbcStore store,
            boolean useStore,
            LectureItem lecture,
            String lectureMetaScope,
            String transcriptScope,
            String extractionScope,
            LectureMetadataSyncServiceSupport lectureMetadataSyncServiceSupport,
            LectureMetadataSyncSupport lectureMetadataSyncSupport,
            LectureDurationResolver lectureDurationResolver,
            LectureMetadataSyncServiceSupport.TranscriptMetaBuilder transcriptMetaBuilder
    ) {
        if (lecture == null || lecture.id() == null || lecture.id().isBlank()) {
            return lecture;
        }
        LectureItem lectureWithMeta = lectureMetadataSyncServiceSupport.attachLectureMeta(
                store,
                useStore,
                lecture,
                lectureMetaScope,
                transcriptScope,
                lectureMetadataSyncSupport,
                transcriptMetaBuilder
        );
        int fallbackMinutes = Math.max(1, lecture.duration_minutes());
        int resolvedMinutes = lectureDurationResolver.resolveDurationMinutesFromMedia(
                store,
                transcriptScope,
                extractionScope,
                lecture.id(),
                fallbackMinutes
        );
        if (resolvedMinutes == lecture.duration_minutes()) {
            return lectureWithMeta;
        }
        return new LectureItem(
                lecture.id(),
                lecture.course_id(),
                lecture.title(),
                resolvedMinutes,
                lectureWithMeta.content_text(),
                lectureWithMeta.transcript_excerpt(),
                lectureWithMeta.instructor_name()
        );
    }

    Map<String, Object> syncAll(
            FeatureJdbcStore store,
            boolean useStore,
            List<LectureItem> lectures,
            String lectureMetaScope,
            String transcriptScope,
            LectureMetadataSyncServiceSupport lectureMetadataSyncServiceSupport,
            LectureMetadataSyncSupport lectureMetadataSyncSupport,
            LectureMetadataSyncServiceSupport.TranscriptMetaBuilder transcriptMetaBuilder,
            boolean overwriteExisting
    ) {
        return lectureMetadataSyncServiceSupport.syncAll(
                store,
                useStore,
                lectures,
                lectureMetaScope,
                transcriptScope,
                lectureMetadataSyncSupport,
                transcriptMetaBuilder,
                overwriteExisting
        );
    }

    Map<String, Object> syncOne(
            FeatureJdbcStore store,
            boolean useStore,
            String lectureId,
            LectureItem lecture,
            String lectureMetaScope,
            String transcriptScope,
            LectureMetadataSyncServiceSupport lectureMetadataSyncServiceSupport,
            LectureMetadataSyncSupport lectureMetadataSyncSupport,
            LectureMetadataSyncServiceSupport.TranscriptMetaBuilder transcriptMetaBuilder,
            boolean overwriteExisting
    ) {
        return lectureMetadataSyncServiceSupport.syncOne(
                store,
                useStore,
                lectureId,
                lecture,
                lectureMetaScope,
                transcriptScope,
                lectureMetadataSyncSupport,
                transcriptMetaBuilder,
                overwriteExisting
        );
    }
}
