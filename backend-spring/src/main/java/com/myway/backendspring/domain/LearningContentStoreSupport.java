package com.myway.backendspring.domain;

import com.myway.backendspring.persistence.FeatureJdbcStore;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Component
public class LearningContentStoreSupport {
    public List<MaterialItem> getMaterials(
            boolean useStore,
            FeatureJdbcStore store,
            String materialScope,
            LearningPayloadMapper mapper,
            Map<String, List<MaterialItem>> materialsByCourse,
            String courseId
    ) {
        if (useStore) {
            return store.listKvByScope(materialScope).stream()
                    .map(mapper::fromMaterialPayload)
                    .filter(Objects::nonNull)
                    .filter(m -> courseId.equals(m.course_id()))
                    .toList();
        }
        return materialsByCourse.getOrDefault(courseId, List.of());
    }

    public List<NoticeItem> getNotices(
            boolean useStore,
            FeatureJdbcStore store,
            String noticeScope,
            LearningPayloadMapper mapper,
            Map<String, List<NoticeItem>> noticesByCourse,
            String courseId
    ) {
        if (useStore) {
            return store.listKvByScope(noticeScope).stream()
                    .map(mapper::fromNoticePayload)
                    .filter(Objects::nonNull)
                    .filter(n -> courseId.equals(n.course_id()))
                    .toList();
        }
        return noticesByCourse.getOrDefault(courseId, List.of());
    }

    public MaterialItem addMaterial(
            boolean useStore,
            FeatureJdbcStore store,
            String materialScope,
            LearningPayloadMapper mapper,
            Map<String, List<MaterialItem>> materialsByCourse,
            String courseId,
            String title,
            String summary,
            String fileName
    ) {
        MaterialItem created = new MaterialItem(UUID.randomUUID().toString(), courseId, title, summary, fileName);
        if (useStore) {
            store.upsertKv(materialScope, created.id(), mapper.toMaterialPayload(created));
        } else {
            materialsByCourse.computeIfAbsent(courseId, k -> new ArrayList<>()).add(created);
        }
        return created;
    }

    public NoticeItem addNotice(
            boolean useStore,
            FeatureJdbcStore store,
            String noticeScope,
            LearningPayloadMapper mapper,
            Map<String, List<NoticeItem>> noticesByCourse,
            String courseId,
            String title,
            String content,
            boolean pinned
    ) {
        NoticeItem created = new NoticeItem(UUID.randomUUID().toString(), courseId, title, content, pinned);
        if (useStore) {
            store.upsertKv(noticeScope, created.id(), mapper.toNoticePayload(created));
        } else {
            noticesByCourse.computeIfAbsent(courseId, k -> new ArrayList<>()).add(created);
        }
        return created;
    }
}
