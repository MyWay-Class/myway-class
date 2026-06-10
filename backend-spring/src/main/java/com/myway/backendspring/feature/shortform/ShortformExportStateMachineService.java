package com.myway.backendspring.feature.shortform;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class ShortformExportStateMachineService {
    private final ShortformRetrySupport retrySupport;
    private final ShortformStatusSupport statusSupport;

    public ShortformExportStateMachineService(
            ShortformRetrySupport retrySupport,
            ShortformStatusSupport statusSupport
    ) {
        this.retrySupport = retrySupport;
        this.statusSupport = statusSupport;
    }

    public Map<String, Object> retryExport(Map<String, Object> video, int shortformMaxRetry) {
        return retrySupport.retryExport(video, shortformMaxRetry);
    }

    public Map<String, Object> applyExportCallback(
            Map<String, Object> video,
            String status,
            long eventVersion,
            String videoUrl,
            String errorMessage,
            int shortformMaxRetry
    ) {
        return retrySupport.applyExportCallback(video, status, eventVersion, videoUrl, errorMessage, shortformMaxRetry);
    }

    public Map<String, Object> exportStatus(List<Map<String, Object>> videos, long staleProcessingThresholdMs) {
        return statusSupport.shortformExportStatus(videos, staleProcessingThresholdMs, retrySupport);
    }
}
