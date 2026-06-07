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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AiUnderstandingContractTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void intentEndpoint_shouldReturnStructuredUnderstandingResult() throws Exception {
        String authHeader = "Bearer " + loginAndGetToken("usr_std_001");
        setDailyLimit(authHeader, 999999);

        JsonNode data = readData(mockMvc.perform(post("/api/v1/ai/intent")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"Spring 요약해줘\",\"lecture_id\":\"lec_java_01\"}"))
                .andExpect(status().isOk())
                .andReturn());

        assertThat(data.path("intent").asText()).isNotBlank();
        assertThat(data.path("action").asText()).isNotBlank();
        assertThat(data.path("confidence").asDouble()).isBetween(0.0, 1.0);
        assertThat(data.path("provider").asText()).isNotBlank();
    }

    @Test
    void smartChat_shouldUseUnderstandingPipeline_contract() throws Exception {
        String authHeader = "Bearer " + loginAndGetToken("usr_std_001");
        setDailyLimit(authHeader, 999999);

        JsonNode data = readData(mockMvc.perform(post("/api/v1/smart/chat")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"REST API가 뭐야?\"}"))
                .andExpect(status().isOk())
                .andReturn());

        assertThat(data.toString()).contains("answer");
    }

    private JsonNode readData(org.springframework.test.web.servlet.MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString()).path("data");
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

    private void setDailyLimit(String authHeader, int dailyLimit) throws Exception {
        mockMvc.perform(put("/api/v1/ai/settings")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"daily_limit\":" + dailyLimit + "}"))
                .andExpect(status().isOk());
    }
}
