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
class MediaContractTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void mediaEndpoints_shouldReturnSuccessEnvelope_whenAuthenticated() throws Exception {
        String authHeader = "Bearer " + loginAndGetToken("usr_ins_001");

        assertSuccessEnvelope(mockMvc.perform(get("/api/v1/media/providers")
                        .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andReturn());

        assertSuccessEnvelope(mockMvc.perform(post("/api/v1/media/transcribe")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lecture_id\":\"lec_java_01\",\"language\":\"ko\"}"))
                .andExpect(status().isCreated())
                .andReturn());
    }

    @Test
    void mediaEndpoints_shouldReturnFailureEnvelope_whenUnauthorizedOrForbidden() throws Exception {
        assertFailureEnvelope(mockMvc.perform(get("/api/v1/media/providers"))
                        .andExpect(status().isUnauthorized())
                        .andReturn(),
                "UNAUTHENTICATED");

        String authHeader = "Bearer " + loginAndGetToken("usr_ins_001");
        assertFailureEnvelope(mockMvc.perform(post("/api/v1/media/extract-audio/callback")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"extraction_id\":\"abc\",\"status\":\"COMPLETED\"}"))
                .andExpect(status().isForbidden())
                .andReturn(),
                "FORBIDDEN");
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

    private void assertSuccessEnvelope(MvcResult result) throws Exception {
        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(root.path("success").asBoolean()).isTrue();
        assertThat(root.get("data")).isNotNull();
        assertThat(root.path("error").isNull()).isTrue();
        assertThat(root.has("message")).isTrue();
    }

    private void assertFailureEnvelope(MvcResult result, String expectedCode) throws Exception {
        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(root.path("success").asBoolean()).isFalse();
        assertThat(root.path("data").isNull()).isTrue();
        assertThat(root.path("error").path("code").asText()).isEqualTo(expectedCode);
        assertThat(root.path("message").asText()).isNotBlank();
    }
}
