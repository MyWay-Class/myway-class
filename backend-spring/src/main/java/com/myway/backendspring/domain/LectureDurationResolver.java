package com.myway.backendspring.domain;

import com.myway.backendspring.persistence.FeatureJdbcStore;
import org.springframework.stereotype.Component;

@Component
public class LectureDurationResolver {
    public int resolveDurationMinutesFromMedia(
            FeatureJdbcStore store,
            String transcriptScope,
            String extractionScope,
            String lectureId,
            int fallbackMinutes
    ) {
        var transcript = store.getKv(transcriptScope, lectureId);
        int fromTranscript = toDurationMinutes(transcript == null ? null : transcript.get("duration_ms"));
        if (fromTranscript > 0) {
            return fromTranscript;
        }

        return store.listKvByScope(extractionScope).stream()
                .filter(row -> lectureId.equals(String.valueOf(row.getOrDefault("lecture_id", "")).trim()))
                .map(row -> toDurationMinutes(row.get("audio_duration_ms")))
                .filter(duration -> duration > 0)
                .findFirst()
                .orElse(fallbackMinutes);
    }

    private int toDurationMinutes(Object rawDurationMs) {
        if (rawDurationMs == null) {
            return 0;
        }
        long durationMs;
        if (rawDurationMs instanceof Number number) {
            durationMs = number.longValue();
        } else {
            try {
                durationMs = Long.parseLong(String.valueOf(rawDurationMs).trim());
            } catch (Exception ignored) {
                return 0;
            }
        }
        if (durationMs <= 0) {
            return 0;
        }
        return (int) Math.max(1L, Math.round(durationMs / 60000.0d));
    }
}
