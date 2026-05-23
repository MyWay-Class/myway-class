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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ShortformAdminExportOpsIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void adminExportStatusAndRetryFailed_shouldWork_forAdminOnly() throws Exception {
        String studentAuth = "Bearer " + loginAndGetToken("usr_std_001");
        String adminAuth = "Bearer " + loginAndGetToken("usr_admin_001");

        String compose = mockMvc.perform(post("/api/v1/shortform/compose")
                        .header("Authorization", studentAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"admin-export-ops-test\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String shortformId = objectMapper.readTree(compose).path("data").path("id").asText();
        assertThat(shortformId).isNotBlank();

        mockMvc.perform(post("/api/v1/shortform/export/callback")
                        .header("X-Callback-Token", "dev-shortform-callback-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"shortform_id\":\"" + shortformId + "\",\"status\":\"FAILED\",\"error_message\":\"ops-fail\",\"event_version\":2}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/shortform/admin/export-status")
                        .header("Authorization", studentAuth))
                .andExpect(status().isForbidden());

        String adminStatus = mockMvc.perform(get("/api/v1/shortform/admin/export-status")
                        .header("Authorization", adminAuth))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode statusRoot = objectMapper.readTree(adminStatus);
        assertThat(statusRoot.path("data").path("failed_count").asInt()).isGreaterThanOrEqualTo(1);

        String retry = mockMvc.perform(post("/api/v1/shortform/admin/export/retry-failed")
                        .header("Authorization", adminAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"include_permanent\":false,\"limit\":20}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode retryRoot = objectMapper.readTree(retry);
        assertThat(retryRoot.path("data").path("retried_count").asInt()).isGreaterThanOrEqualTo(1);
        assertThat(retryRoot.path("data").path("status").path("processing_count").asInt()).isGreaterThanOrEqualTo(1);
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

