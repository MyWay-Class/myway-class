package com.myway.backendspring.integration;

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
class AuthSemanticsIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void representativeEndpoints_shouldReturn401AndUnauthenticated_whenMissingAuthorization() throws Exception {
        assertUnauthenticated(mockMvc.perform(get("/api/v1/ai/insights"))
                .andExpect(status().isUnauthorized())
                .andReturn());

        assertUnauthenticated(mockMvc.perform(get("/api/v1/media/providers"))
                .andExpect(status().isUnauthorized())
                .andReturn());

        assertUnauthenticated(mockMvc.perform(get("/api/v1/shortform/library"))
                .andExpect(status().isUnauthorized())
                .andReturn());

        assertUnauthenticated(mockMvc.perform(get("/api/v1/custom-courses/my"))
                .andExpect(status().isUnauthorized())
                .andReturn());

        assertUnauthenticated(mockMvc.perform(post("/api/v1/ai/intent")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"추천\"}"))
                .andExpect(status().isUnauthorized())
                .andReturn());

        assertUnauthenticated(mockMvc.perform(post("/api/v1/media/transcribe")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lecture_id\":\"lec_java_01\"}"))
                .andExpect(status().isUnauthorized())
                .andReturn());

        assertUnauthenticated(mockMvc.perform(post("/api/v1/shortform/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"course_id\":\"crs_java_01\"}"))
                .andExpect(status().isUnauthorized())
                .andReturn());

        assertUnauthenticated(mockMvc.perform(post("/api/v1/custom-courses/compose")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"course_id\":\"crs_java_01\"}"))
                .andExpect(status().isUnauthorized())
                .andReturn());
    }

    private void assertUnauthenticated(MvcResult result) throws Exception {
        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());

        assertThat(root.path("success").asBoolean()).isFalse();
        assertThat(root.path("data").isNull()).isTrue();
        assertThat(root.path("error").path("code").asText()).isEqualTo("UNAUTHENTICATED");
        assertThat(root.path("error").path("message").asText()).isNotBlank();
        assertThat(root.path("message").asText()).isNotBlank();
    }
}
