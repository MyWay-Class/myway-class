package com.myway.backendspring.feature.media;

enum PipelineStage {
    QUEUED("queued"),
    TRANSCRIBING("transcribing"),
    COMPLETED("completed"),
    FAILED("failed"),
    CALLBACK("callback");

    private final String value;

    PipelineStage(String value) {
        this.value = value;
    }

    String value() {
        return value;
    }
}
