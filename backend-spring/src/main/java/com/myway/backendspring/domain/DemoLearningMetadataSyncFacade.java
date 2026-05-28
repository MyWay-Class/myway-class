package com.myway.backendspring.domain;

import com.myway.backendspring.persistence.FeatureJdbcStore;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.BiFunction;

@Component
public class DemoLearningMetadataSyncFacade {

    public List<LectureItem> alignLectureDurations(
            DemoLearningMetadataSupport metadataSupport,
            List<LectureItem> lectures,
            boolean useStore,
            java.util.function.Function<LectureItem, LectureItem> aligner
    ) {
        return metadataSupport.alignLectureDurations(lectures, useStore, aligner);
    }

    public LectureItem alignLectureDuration(
            DemoLearningMetadataSupport metadataSupport,
            FeatureJdbcStore store,
            boolean useStore,
            LectureItem lecture,
            String lectureMetaScope,
            String transcriptScope,
            String extractionScope,
            LectureMetadataSyncServiceSupport lectureMetadataSyncServiceSupport,
            LectureMetadataSyncSupport lectureMetadataSyncSupport,
            LectureDurationResolver lectureDurationResolver,
            BiFunction<LectureItem, Map<String, Object>, Map<String, Object>> metaBuilder
    ) {
        return metadataSupport.alignLectureDuration(
                store,
                useStore,
                lecture,
                lectureMetaScope,
                transcriptScope,
                extractionScope,
                lectureMetadataSyncServiceSupport,
                lectureMetadataSyncSupport,
                lectureDurationResolver,
                metaBuilder
        );
    }

    public Map<String, Object> syncAll(
            DemoLearningMetadataSupport metadataSupport,
            FeatureJdbcStore store,
            boolean useStore,
            List<LectureItem> lectures,
            String lectureMetaScope,
            String transcriptScope,
            LectureMetadataSyncServiceSupport lectureMetadataSyncServiceSupport,
            LectureMetadataSyncSupport lectureMetadataSyncSupport,
            BiFunction<LectureItem, Map<String, Object>, Map<String, Object>> metaBuilder,
            boolean overwriteExisting
    ) {
        return metadataSupport.syncAll(
                store,
                useStore,
                lectures,
                lectureMetaScope,
                transcriptScope,
                lectureMetadataSyncServiceSupport,
                lectureMetadataSyncSupport,
                metaBuilder,
                overwriteExisting
        );
    }

    public Map<String, Object> syncOne(
            DemoLearningMetadataSupport metadataSupport,
            FeatureJdbcStore store,
            boolean useStore,
            String normalizedLectureId,
            LectureItem lecture,
            String lectureMetaScope,
            String transcriptScope,
            LectureMetadataSyncServiceSupport lectureMetadataSyncServiceSupport,
            LectureMetadataSyncSupport lectureMetadataSyncSupport,
            BiFunction<LectureItem, Map<String, Object>, Map<String, Object>> metaBuilder,
            boolean overwriteExisting
    ) {
        return metadataSupport.syncOne(
                store,
                useStore,
                normalizedLectureId,
                lecture,
                lectureMetaScope,
                transcriptScope,
                lectureMetadataSyncServiceSupport,
                lectureMetadataSyncSupport,
                metaBuilder,
                overwriteExisting
        );
    }
}
