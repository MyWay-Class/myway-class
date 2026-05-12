package com.myway.backendspring.feature.media;

public enum MediaStatus {
    PENDING,
    PROCESSING,
    COMPLETED,
    FAILED;

    public static MediaStatus fromNullable(String raw, MediaStatus fallback) {
        if (raw == null || raw.isBlank()) {
            return fallback;
        }
        try {
            return MediaStatus.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ignored) {
            return fallback;
        }
    }
}
