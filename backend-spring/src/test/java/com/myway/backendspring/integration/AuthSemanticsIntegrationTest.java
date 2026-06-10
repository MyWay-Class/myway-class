package com.myway.backendspring.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Base64;

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

    @Autowired
    private JdbcTemplate jdbcTemplate;

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

    @Test
    void authSession_shouldReturn401_whenPersistedSessionExpires() throws Exception {
        String token = loginAndGetToken("usr_std_001");
        String tokenId = extractTokenId(token);

        jdbcTemplate.update(
                """
                UPDATE auth_sessions
                SET expires_at = ?, updated_at = CURRENT_TIMESTAMP
                WHERE token_id = ?
                """,
                Timestamp.from(Instant.now().minusSeconds(60)),
                tokenId
        );

        assertUnauthenticated(mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
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

    private String extractTokenId(String token) throws Exception {
        String payload = token.split("\\.")[1];
        byte[] decoded = Base64.getUrlDecoder().decode(payload);
        JsonNode root = objectMapper.readTree(new String(decoded, StandardCharsets.UTF_8));
        return root.path("jti").asText();
    }
}
