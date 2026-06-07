package com.myway.backendspring.contract;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ResponseEnvelopeContractTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void representativeEndpoints_shouldReturnSuccessEnvelope_whenAuthenticated() throws Exception {
        String authHeader = "Bearer " + loginAndGetToken();

        assertSuccessEnvelope(mockMvc.perform(get("/api/v1/ai/insights").header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andReturn());

        assertSuccessEnvelope(mockMvc.perform(get("/api/v1/media/providers").header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andReturn());

        assertSuccessEnvelope(mockMvc.perform(get("/api/v1/shortform/library").header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andReturn());

        assertSuccessEnvelope(mockMvc.perform(get("/api/v1/custom-courses/my").header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andReturn());
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

    private void assertSuccessEnvelope(MvcResult result) throws Exception {
        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());

        assertThat(root.path("success").asBoolean()).isTrue();
        assertThat(root.get("data")).isNotNull();
        assertThat(root.get("data").isNull()).isFalse();
        assertThat(root.path("error").isNull()).isTrue();
        assertThat(root.has("message")).isTrue();
    }
}
