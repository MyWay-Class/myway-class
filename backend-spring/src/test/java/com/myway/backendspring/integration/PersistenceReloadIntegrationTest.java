package com.myway.backendspring.integration;

import com.myway.backendspring.feature.FeatureStoreService;
import com.myway.backendspring.persistence.FeatureJdbcStore;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class PersistenceReloadIntegrationTest {

    @Autowired
    private FeatureJdbcStore store;

    @Test
    void restartLikeServiceRecreation_shouldReloadPersistedAiAndMediaState() {
        FeatureStoreService beforeRestart = new FeatureStoreService(store, 3);
        String userId = "it-user-" + UUID.randomUUID();
        String lectureId = "it-lecture-" + UUID.randomUUID();

        beforeRestart.updateAiSettings(userId, Map.of(
                "daily_limit", 42,
                "provider", "gemini",
                "model", "gemini-2.5-flash"
        ));
        Map<String, Object> extraction = beforeRestart.createExtraction(lectureId);
        assertThat(extraction.get("id")).isNotNull();

        FeatureStoreService afterRestart = new FeatureStoreService(store, 3);

        Map<String, Object> aiSettings = afterRestart.aiSettings(userId);
        assertThat(aiSettings.get("daily_limit")).isEqualTo(42);
        assertThat(aiSettings.get("provider")).isEqualTo("gemini");
        assertThat(aiSettings.get("model")).isEqualTo("gemini-2.5-flash");

        Map<String, Object> pipeline = afterRestart.pipeline(lectureId);
        assertThat(pipeline.get("status")).isEqualTo("READY");

        Map<String, Object> transcript = afterRestart.transcript(lectureId);
        assertThat(transcript).isNotNull();
        assertThat(transcript.get("lecture_id")).isEqualTo(lectureId);

        List<Map<String, Object>> extractions = afterRestart.extractions(lectureId);
        assertThat(extractions).isNotEmpty();
        assertThat(extractions)
                .anySatisfy(row -> assertThat(row.get("id")).isEqualTo(extraction.get("id")));
    }
}
