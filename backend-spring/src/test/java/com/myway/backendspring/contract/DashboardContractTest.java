package com.myway.backendspring.contract;

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
class DashboardContractTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void dashboard_shouldReturnStatsAndRecentActivities_withStableShape() throws Exception {
        String authHeader = "Bearer " + loginAndGetToken();

        String response = mockMvc.perform(get("/api/v1/dashboard").header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode root = objectMapper.readTree(response);
        JsonNode data = root.path("data");
        JsonNode stats = data.path("stats");
        JsonNode activities = data.path("recent_activities");

        assertThat(root.path("success").asBoolean()).isTrue();
        assertThat(stats.isArray()).isTrue();
        assertThat(stats.size()).isEqualTo(4);
        assertThat(activities.isArray()).isTrue();

        JsonNode firstStat = stats.get(0);
        assertThat(firstStat.path("id").isMissingNode()).isFalse();
        assertThat(firstStat.path("label").isMissingNode()).isFalse();
        assertThat(firstStat.path("value").isMissingNode()).isFalse();
        assertThat(firstStat.path("hint").isMissingNode()).isFalse();
        assertThat(firstStat.path("icon").isMissingNode()).isFalse();
        assertThat(firstStat.path("tone").isMissingNode()).isFalse();
    }

    private String loginAndGetToken() throws Exception {
        String response = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":\"usr_std_001\"}"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode root = objectMapper.readTree(response);
        return root.path("data").path("session_token").asText();
    }
}
