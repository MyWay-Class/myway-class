package com.myway.backendspring.feature.media;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class MediaBatchScheduler {

    private final MediaBatchService mediaBatchService;
    private final boolean enabled;
    private final String autoMode;

    public MediaBatchScheduler(
            MediaBatchService mediaBatchService,
            @Value("${myway.media.batch.auto.enabled:true}") boolean enabled,
            @Value("${myway.media.batch.auto.mode:all}") String autoMode
    ) {
        this.mediaBatchService = mediaBatchService;
        this.enabled = enabled;
        this.autoMode = normalizeMode(autoMode);
    }

    @Scheduled(fixedDelayString = "${myway.media.batch.auto.interval-ms:43200000}", initialDelayString = "${myway.media.batch.auto.initial-delay-ms:60000}")
    public void runAutoBatch() {
        if (!enabled) {
            return;
        }
        mediaBatchService.runBatch(autoMode, true);
    }

    private String normalizeMode(String mode) {
        if (mode == null) {
            return "all";
        }
        return "failed-only".equalsIgnoreCase(mode.trim()) ? "failed-only" : "all";
    }
}
