package com.myway.backendspring.domain;

import com.myway.backendspring.persistence.FeatureJdbcStore;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.function.Supplier;

@Component
public class DemoLearningLectureMetadataFacade {
    private static final String LECTURE_META_SCOPE = "learning_lecture_meta";
    private static final String TRANSCRIPT_SCOPE = "media_transcript";
    private static final String EXTRACTION_SCOPE = "media_extraction";
    private static final String SPEAKER_REVIEW_SCOPE = "media_speaker_review";

    private final FeatureJdbcStore store;
    private final DemoLearningMetadataSyncFacade metadataSyncFacade;
    private final DemoLearningTranscriptSyncFacade transcriptSyncFacade;
    private final DemoLearningMetadataSupport metadataSupport;
    private final LectureMetadataSyncServiceSupport lectureMetadataSyncServiceSupport;
    private final LectureMetadataSyncSupport lectureMetadataSyncSupport;
    private final LectureDurationResolver lectureDurationResolver;

    public DemoLearningLectureMetadataFacade(
            FeatureJdbcStore store,
            DemoLearningMetadataSyncFacade metadataSyncFacade,
            DemoLearningTranscriptSyncFacade transcriptSyncFacade,
            DemoLearningMetadataSupport metadataSupport,
            LectureMetadataSyncServiceSupport lectureMetadataSyncServiceSupport,
            LectureMetadataSyncSupport lectureMetadataSyncSupport,
            LectureDurationResolver lectureDurationResolver
    ) {
        this.store = store;
        this.metadataSyncFacade = metadataSyncFacade;
        this.transcriptSyncFacade = transcriptSyncFacade;
        this.metadataSupport = metadataSupport;
        this.lectureMetadataSyncServiceSupport = lectureMetadataSyncServiceSupport;
        this.lectureMetadataSyncSupport = lectureMetadataSyncSupport;
        this.lectureDurationResolver = lectureDurationResolver;
    }

    public List<LectureItem> alignCourseLectures(boolean useStore, List<LectureItem> lectures) {
        return transcriptSyncFacade.alignCourseLectures(
                metadataSyncFacade,
                metadataSupport,
                useStore,
                lectures,
                lecture -> alignLectureDuration(useStore, lecture)
        );
    }

    public Map<String, Object> syncAllFromTranscripts(boolean useStore, boolean overwriteExisting, Supplier<List<LectureItem>> lecturesSupplier) {
        return transcriptSyncFacade.syncAll(
                metadataSyncFacade,
                metadataSupport,
                store,
                useStore,
                lecturesSupplier.get(),
                LECTURE_META_SCOPE,
                TRANSCRIPT_SCOPE,
                lectureMetadataSyncServiceSupport,
                lectureMetadataSyncSupport,
                this::buildLectureMetaFromTranscript,
                overwriteExisting
        );
    }

    public Map<String, Object> syncLectureFromTranscript(
            boolean useStore,
            String lectureId,
            boolean overwriteExisting,
            Function<String, LectureItem> lectureResolver
    ) {
        String normalizedLectureId = lectureId == null ? "" : lectureId.trim();
        LectureItem lecture = normalizedLectureId.isBlank() ? null : lectureResolver.apply(normalizedLectureId);
        return transcriptSyncFacade.syncOne(
                metadataSyncFacade,
                metadataSupport,
                store,
                useStore,
                normalizedLectureId,
                lecture,
                LECTURE_META_SCOPE,
                TRANSCRIPT_SCOPE,
                lectureMetadataSyncServiceSupport,
                lectureMetadataSyncSupport,
                this::buildLectureMetaFromTranscript,
                overwriteExisting
        );
    }

    private LectureItem alignLectureDuration(boolean useStore, LectureItem lecture) {
        return metadataSyncFacade.alignLectureDuration(
                metadataSupport,
                store,
                useStore,
                lecture,
                LECTURE_META_SCOPE,
                TRANSCRIPT_SCOPE,
                EXTRACTION_SCOPE,
                lectureMetadataSyncServiceSupport,
                lectureMetadataSyncSupport,
                lectureDurationResolver,
                this::buildLectureMetaFromTranscript
        );
    }

    private Map<String, Object> buildLectureMetaFromTranscript(LectureItem lecture, Map<String, Object> transcript) {
        String lectureId = lecture == null ? "" : lecture.id();
        Map<String, Object> speakerReview = store == null ? null : store.getKv(SPEAKER_REVIEW_SCOPE, lectureId);
        return lectureMetadataSyncSupport.buildLectureMetaFromTranscript(lecture, transcript, speakerReview);
    }
}
