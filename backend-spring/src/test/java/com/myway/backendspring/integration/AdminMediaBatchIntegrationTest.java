package com.myway.backendspring.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("media-contract-test")
class AdminMediaBatchIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void adminMediaBatchEndpoints_shouldRequireAdmin() throws Exception {
        String instructorAuth = "Bearer " + loginAndGetToken("usr_ins_001");

        mockMvc.perform(get("/api/v1/admin/media/batch/status")
                        .header("Authorization", instructorAuth))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/admin/media/batch/run")
                        .header("Authorization", instructorAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"mode\":\"all\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminMediaBatchEndpoints_shouldRunAndExposeStatus() throws Exception {
        String adminAuth = "Bearer " + loginAndGetToken("usr_admin_001");

        String run = mockMvc.perform(post("/api/v1/admin/media/batch/run")
                        .header("Authorization", adminAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"mode\":\"all\"}"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        JsonNode runData = objectMapper.readTree(run).path("data");
        assertThat(runData.path("last_run_at").asText()).isNotBlank();
        assertThat(runData.path("target_count").asInt()).isGreaterThan(0);

        String statusRes = mockMvc.perform(get("/api/v1/admin/media/batch/status")
                        .header("Authorization", adminAuth))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        JsonNode statusData = objectMapper.readTree(statusRes).path("data");
        assertThat(statusData.path("last_run_at").asText()).isNotBlank();
        assertThat(statusData.path("mode").asText()).isIn("all", "failed-only");
    }

    @Test
    void r2MappingEndpoints_shouldAuditAndBulkMapMissingLectures() throws Exception {
        String adminAuth = "Bearer " + loginAndGetToken("usr_admin_001");

        String auditBefore = mockMvc.perform(get("/api/v1/admin/media/r2-mappings/audit")
                        .header("Authorization", adminAuth))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        int missingBefore = objectMapper.readTree(auditBefore).path("data").path("missing_count").asInt();

        String bulk = mockMvc.perform(post("/api/v1/admin/media/r2-mappings/bulk-map")
                        .header("Authorization", adminAuth))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        JsonNode bulkData = objectMapper.readTree(bulk).path("data");
        assertThat(bulkData.path("mapped_count").asInt()).isGreaterThanOrEqualTo(0);

        String auditAfter = mockMvc.perform(get("/api/v1/admin/media/r2-mappings/audit")
                        .header("Authorization", adminAuth))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        int missingAfter = objectMapper.readTree(auditAfter).path("data").path("missing_count").asInt();
        assertThat(missingAfter).isLessThanOrEqualTo(missingBefore);
    }

    private String loginAndGetToken(String userId) throws Exception {
        String response = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":\"" + userId + "\"}"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response).path("data").path("session_token").asText();
    }
}
