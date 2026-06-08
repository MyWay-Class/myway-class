package com.myway.backendspring.feature.shortform;

import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ShortformExportStateMachineServiceTest {

    private final ShortformRetrySupport retrySupport = new ShortformRetrySupport();
    private final ShortformStatusSupport statusSupport = new ShortformStatusSupport();
    private final ShortformExportStateMachineService service = new ShortformExportStateMachineService(retrySupport, statusSupport);

    @Test
    void retryExport_shouldTransitionToProcessingUntilLimit_thenFailedPermanent() {
        Map<String, Object> video = new HashMap<>();
        video.put("retry_count", 2);
        video.put("export_status", "FAILED");

        Map<String, Object> retried = service.retryExport(video, 3);
        assertThat(retried.get("export_status")).isEqualTo("PROCESSING");
        assertThat(retried.get("retry_count")).isEqualTo(3);

        Map<String, Object> capped = service.retryExport(retried, 3);
        assertThat(capped.get("export_status")).isEqualTo("FAILED_PERMANENT");
        assertThat(capped.get("retry_count")).isEqualTo(3);
    }

    @Test
    void applyExportCallback_shouldIgnoreStaleEvents_andRespectRetryCap() {
        Map<String, Object> video = new HashMap<>();
        video.put("retry_count", 3);
        video.put("last_event_version", 2L);

        Map<String, Object> stale = service.applyExportCallback(video, "COMPLETED", 1L, "https://old", null, 3);
        assertThat(stale.get("callback_ignored")).isEqualTo(true);

        Map<String, Object> failed = service.applyExportCallback(video, "FAILED", 3L, null, "boom", 3);
        assertThat(failed.get("export_status")).isEqualTo("FAILED_PERMANENT");
        assertThat(failed.get("error_message")).isEqualTo("boom");
        assertThat(failed.get("last_event_version")).isEqualTo(3L);
    }

    @Test
    void exportStatus_shouldSummarizeFailedPermanentItems() {
        Map<String, Object> failedPermanent = new HashMap<>();
        failedPermanent.put("id", "sf_1");
        failedPermanent.put("title", "sample");
        failedPermanent.put("user_id", "usr_std_001");
        failedPermanent.put("export_status", "FAILED_PERMANENT");
        failedPermanent.put("retry_count", 3);
        failedPermanent.put("error_message", "boom");
        failedPermanent.put("updated_at", "2026-06-08T00:00:00Z");

        Map<String, Object> status = service.exportStatus(List.of(failedPermanent), 60_000L);

        assertThat(status.get("failed_permanent_count")).isEqualTo(1L);
        assertThat(status.get("failed_items")).asList().hasSize(1);
        assertThat(((List<?>) status.get("failed_items")).get(0).toString()).contains("sf_1");
    }
}
