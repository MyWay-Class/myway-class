package com.myway.backendspring.feature.understanding;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class InputUnderstandingServiceTest {

    @Autowired
    private InputUnderstandingService service;

    @Test
    void understand_shouldReturnStructuredResult_forChatInput() {
        UnderstandingContext context = new UnderstandingContext(
                "usr_std_001",
                "lec_java_01",
                null,
                "chat",
                "Spring 요약해줘",
                "Spring 요약해줘",
                Map.of("origin", "chat")
        );

        UnderstandingResult result = service.understand(context);

        assertThat(result).isNotNull();
        assertThat(result.inputType()).isEqualTo("chat");
        assertThat(result.lectureId()).isEqualTo("lec_java_01");
        assertThat(result.intent()).isNotBlank();
        assertThat(result.route()).isNotBlank();
        assertThat(result.entities()).isNotEmpty();
        assertThat(result.confidence()).isBetween(0.0, 1.0);
    }

    @Test
    void understandTranscript_shouldPreserveTranscriptContext() {
        UnderstandingResult result = service.understandTranscript(
                "lec_java_02",
                "Spring Boot REST API 설계에 대한 강의입니다.",
                Map.of("source", "transcript")
        );

        assertThat(result).isNotNull();
        assertThat(result.inputType()).isEqualTo("transcript");
        assertThat(result.lectureId()).isEqualTo("lec_java_02");
        assertThat(result.entities()).isNotEmpty();
        assertThat(result.debug()).containsKey("source");
    }
}
