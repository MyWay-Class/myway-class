package com.myway.backendspring.feature.media;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class MediaBatchScheduler {

    private final MediaBatchService mediaBatchService;
    private final boolean enabled;

    public MediaBatchScheduler(
            MediaBatchService mediaBatchService,
            @Value("${myway.media.batch.auto.enabled:true}") boolean enabled
    ) {
        this.mediaBatchService = mediaBatchService;
        this.enabled = enabled;
    }

    @Scheduled(fixedDelayString = "${myway.media.batch.auto.interval-ms:43200000}", initialDelayString = "${myway.media.batch.auto.initial-delay-ms:60000}")
    public void runAutoBatch() {
        if (!enabled) {
            return;
        }
        mediaBatchService.runBatch("all", true);
    }
}
