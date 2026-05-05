package com.myway.backendspring.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class MediaCallbackVersionIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void extractAudioCallback_shouldIgnoreStaleEvents() throws Exception {
        String auth = "Bearer " + loginAndGetToken("usr_ins_001");

        String extractionResponse = mockMvc.perform(post("/api/v1/media/extract-audio")
                        .header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lecture_id\":\"lec_java_01\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String extractionId = objectMapper.readTree(extractionResponse).path("data").path("id").asText();
        assertThat(extractionId).isNotBlank();

        String failedCallback = mockMvc.perform(post("/api/v1/media/extract-audio/callback")
                        .header("X-Callback-Token", "dev-media-callback-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"extraction_id\":\"" + extractionId + "\",\"status\":\"FAILED\",\"error_message\":\"boom\",\"event_version\":2}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode failedRoot = objectMapper.readTree(failedCallback);
        assertThat(failedRoot.path("data").path("extraction").path("status").asText()).isEqualTo("FAILED");
        assertThat(failedRoot.path("data").path("extraction").path("last_event_version").asLong()).isEqualTo(2L);

        String staleCallback = mockMvc.perform(post("/api/v1/media/extract-audio/callback")
                        .header("X-Callback-Token", "dev-media-callback-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"extraction_id\":\"" + extractionId + "\",\"status\":\"COMPLETED\",\"event_version\":1}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode staleRoot = objectMapper.readTree(staleCallback);
        assertThat(staleRoot.path("data").path("extraction").path("callback_ignored").asBoolean()).isTrue();
        assertThat(staleRoot.path("data").path("extraction").path("status").asText()).isEqualTo("FAILED");
        assertThat(staleRoot.path("data").path("extraction").path("last_event_version").asLong()).isEqualTo(2L);

        String successCallback = mockMvc.perform(post("/api/v1/media/extract-audio/callback")
                        .header("X-Callback-Token", "dev-media-callback-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"extraction_id\":\"" + extractionId + "\",\"status\":\"COMPLETED\",\"event_version\":3}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode successRoot = objectMapper.readTree(successCallback);
        assertThat(successRoot.path("data").path("extraction").path("status").asText()).isEqualTo("COMPLETED");
        assertThat(successRoot.path("data").path("extraction").path("last_event_version").asLong()).isEqualTo(3L);

        mockMvc.perform(post("/api/v1/media/extract-audio/callback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"extraction_id\":\"" + extractionId + "\",\"status\":\"COMPLETED\",\"event_version\":4}"))
                .andExpect(status().isForbidden());
    }

    private String loginAndGetToken(String userId) throws Exception {
        String response = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":\"" + userId + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).path("data").path("session_token").asText();
    }
}
