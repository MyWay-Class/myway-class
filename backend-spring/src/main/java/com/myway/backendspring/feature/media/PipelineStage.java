package com.myway.backendspring.feature.media;

public enum PipelineStage {
    IDLE("idle"),
    QUEUED("queued"),
    TRANSCRIBING("transcribing"),
    COMPLETED("completed"),
    FAILED("failed"),
    CALLBACK("callback");

    private final String value;

    PipelineStage(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }
}
