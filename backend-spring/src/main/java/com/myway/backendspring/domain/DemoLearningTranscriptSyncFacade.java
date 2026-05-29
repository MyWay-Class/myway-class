package com.myway.backendspring.domain;

import com.myway.backendspring.persistence.FeatureJdbcStore;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;

@Service
public class DemoLearningTranscriptSyncFacade {

    public List<LectureItem> alignCourseLectures(
            DemoLearningMetadataSyncFacade metadataSyncFacade,
            DemoLearningMetadataSupport metadataSupport,
            boolean useStore,
            List<LectureItem> lectures,
            Function<LectureItem, LectureItem> alignLectureDuration
    ) {
        return metadataSyncFacade.alignLectureDurations(
                metadataSupport,
                lectures,
                useStore,
                alignLectureDuration
        );
    }

    public Map<String, Object> syncAll(
            DemoLearningMetadataSyncFacade metadataSyncFacade,
            DemoLearningMetadataSupport metadataSupport,
            FeatureJdbcStore store,
            boolean useStore,
            List<LectureItem> lectures,
            String lectureMetaScope,
            String transcriptScope,
            LectureMetadataSyncServiceSupport syncServiceSupport,
            LectureMetadataSyncSupport syncSupport,
            LectureMetadataSyncServiceSupport.TranscriptMetaBuilder buildLectureMetaFromTranscript,
            boolean overwriteExisting
    ) {
        return metadataSyncFacade.syncAll(
                metadataSupport,
                store,
                useStore,
                lectures,
                lectureMetaScope,
                transcriptScope,
                syncServiceSupport,
                syncSupport,
                buildLectureMetaFromTranscript,
                overwriteExisting
        );
    }

    public Map<String, Object> syncOne(
            DemoLearningMetadataSyncFacade metadataSyncFacade,
            DemoLearningMetadataSupport metadataSupport,
            FeatureJdbcStore store,
            boolean useStore,
            String lectureId,
            LectureItem lecture,
            String lectureMetaScope,
            String transcriptScope,
            LectureMetadataSyncServiceSupport syncServiceSupport,
            LectureMetadataSyncSupport syncSupport,
            LectureMetadataSyncServiceSupport.TranscriptMetaBuilder buildLectureMetaFromTranscript,
            boolean overwriteExisting
    ) {
        return metadataSyncFacade.syncOne(
                metadataSupport,
                store,
                useStore,
                lectureId,
                lecture,
                lectureMetaScope,
                transcriptScope,
                syncServiceSupport,
                syncSupport,
                buildLectureMetaFromTranscript,
                overwriteExisting
        );
    }
}
