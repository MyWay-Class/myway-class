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
class ShortformCustomCoursesContractTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shortformAndCustomCourseEndpoints_shouldReturnSuccessEnvelope_whenAuthenticated() throws Exception {
        String authHeader = "Bearer " + loginAndGetToken("usr_std_001");

        assertSuccessEnvelope(mockMvc.perform(post("/api/v1/shortform/generate")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"course_id\":\"crs_java_01\",\"mode\":\"cross\"}"))
                .andExpect(status().isCreated())
                .andReturn());

        assertSuccessEnvelope(mockMvc.perform(post("/api/v1/custom-courses/compose")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"course_id\":\"crs_java_01\",\"title\":\"내 코스\"}"))
                .andExpect(status().isCreated())
                .andReturn());
    }

    @Test
    void shortformAndCustomCourseEndpoints_shouldReturnUnauthenticatedEnvelope_whenUnauthorized() throws Exception {
        assertFailureEnvelope(mockMvc.perform(get("/api/v1/shortform/library"))
                        .andExpect(status().isUnauthorized())
                        .andReturn(),
                "UNAUTHENTICATED");

        assertFailureEnvelope(mockMvc.perform(get("/api/v1/custom-courses/my"))
                        .andExpect(status().isUnauthorized())
                        .andReturn(),
                "UNAUTHENTICATED");
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
