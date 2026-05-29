package com.myway.backendspring.domain;

import com.myway.backendspring.persistence.FeatureJdbcStore;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class DemoLearningContentFacade {

    public List<MaterialItem> getMaterials(
            LearningContentStoreSupport learningContentStoreSupport,
            boolean useStore,
            FeatureJdbcStore store,
            String materialScope,
            LearningPayloadMapper payloadMapper,
            Map<String, List<MaterialItem>> materialsByCourse,
            String courseId
    ) {
        return learningContentStoreSupport.getMaterials(
                useStore,
                store,
                materialScope,
                payloadMapper,
                materialsByCourse,
                courseId
        );
    }

    public List<NoticeItem> getNotices(
            LearningContentStoreSupport learningContentStoreSupport,
            boolean useStore,
            FeatureJdbcStore store,
            String noticeScope,
            LearningPayloadMapper payloadMapper,
            Map<String, List<NoticeItem>> noticesByCourse,
            String courseId
    ) {
        return learningContentStoreSupport.getNotices(
                useStore,
                store,
                noticeScope,
                payloadMapper,
                noticesByCourse,
                courseId
        );
    }

    public MaterialItem addMaterial(
            LearningContentStoreSupport learningContentStoreSupport,
            boolean useStore,
            FeatureJdbcStore store,
            String materialScope,
            LearningPayloadMapper payloadMapper,
            Map<String, List<MaterialItem>> materialsByCourse,
            String courseId,
            String title,
            String summary,
            String fileName
    ) {
        return learningContentStoreSupport.addMaterial(
                useStore,
                store,
                materialScope,
                payloadMapper,
                materialsByCourse,
                courseId,
                title,
                summary,
                fileName
        );
    }

    public NoticeItem addNotice(
            LearningContentStoreSupport learningContentStoreSupport,
            boolean useStore,
            FeatureJdbcStore store,
            String noticeScope,
            LearningPayloadMapper payloadMapper,
            Map<String, List<NoticeItem>> noticesByCourse,
            String courseId,
            String title,
            String content,
            boolean pinned
    ) {
        return learningContentStoreSupport.addNotice(
                useStore,
                store,
                noticeScope,
                payloadMapper,
                noticesByCourse,
                courseId,
                title,
                content,
                pinned
        );
    }
}
