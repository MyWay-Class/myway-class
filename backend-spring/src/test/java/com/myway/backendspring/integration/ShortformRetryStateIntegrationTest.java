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
class ShortformRetryStateIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void retryAndCallback_shouldTransitionStates_andIgnoreStaleEvents() throws Exception {
        String token = loginAndGetToken();
        String auth = "Bearer " + token;

        String compose = mockMvc.perform(post("/api/v1/shortform/compose")
                        .header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"retry-test\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String shortformId = objectMapper.readTree(compose).path("data").path("id").asText();
        assertThat(shortformId).isNotBlank();

        String retry = mockMvc.perform(post("/api/v1/shortform/" + shortformId + "/export/retry")
                        .header("Authorization", auth))
                .andExpect(status().isAccepted())
                .andReturn().getResponse().getContentAsString();

        JsonNode retryRoot = objectMapper.readTree(retry);
        assertThat(retryRoot.path("data").path("export_status").asText()).isEqualTo("PROCESSING");

        String failedCb = mockMvc.perform(post("/api/v1/shortform/export/callback")
                        .header("X-Callback-Token", "dev-shortform-callback-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"shortform_id\":\"" + shortformId + "\",\"status\":\"FAILED\",\"error_message\":\"boom\",\"event_version\":2}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode failedRoot = objectMapper.readTree(failedCb);
        assertThat(failedRoot.path("data").path("export_status").asText()).isEqualTo("FAILED");

        String staleCb = mockMvc.perform(post("/api/v1/shortform/export/callback")
                        .header("X-Callback-Token", "dev-shortform-callback-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"shortform_id\":\"" + shortformId + "\",\"status\":\"COMPLETED\",\"video_url\":\"https://old\",\"event_version\":1}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode staleRoot = objectMapper.readTree(staleCb);
        assertThat(staleRoot.path("message").asText()).contains("무시");

        String okCb = mockMvc.perform(post("/api/v1/shortform/export/callback")
                        .header("X-Callback-Token", "dev-shortform-callback-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"shortform_id\":\"" + shortformId + "\",\"status\":\"COMPLETED\",\"video_url\":\"https://new\",\"event_version\":3}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode okRoot = objectMapper.readTree(okCb);
        assertThat(okRoot.path("data").path("export_status").asText()).isEqualTo("COMPLETED");
        assertThat(okRoot.path("data").path("video_url").asText()).isEqualTo("https://new");

        mockMvc.perform(post("/api/v1/shortform/export/callback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"shortform_id\":\"" + shortformId + "\",\"status\":\"COMPLETED\",\"event_version\":4}"))
                .andExpect(status().isForbidden());
    }

    private String loginAndGetToken() throws Exception {
        String response = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":\"usr_std_001\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).path("data").path("session_token").asText();
    }
}
