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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AiContractTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void aiEndpoints_shouldReturnSuccessEnvelope_whenAuthenticated() throws Exception {
        String authHeader = "Bearer " + loginAndGetToken("usr_std_001");

        assertSuccessEnvelope(mockMvc.perform(get("/api/v1/ai/insights")
                        .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andReturn());

        assertSuccessEnvelope(mockMvc.perform(get("/api/v1/ai/providers")
                        .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andReturn());

        assertSuccessEnvelope(mockMvc.perform(post("/api/v1/ai/intent")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"다음 강의 추천해줘\",\"lecture_id\":\"lec_java_01\"}"))
                .andExpect(status().isOk())
                .andReturn());

        assertSuccessEnvelope(mockMvc.perform(post("/api/v1/ai/search")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"query\":\"Spring\",\"lecture_id\":\"lec_java_01\"}"))
                .andExpect(status().isOk())
                .andReturn());

        assertSuccessEnvelope(mockMvc.perform(post("/api/v1/ai/answer")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"question\":\"REST API가 뭐야?\",\"lecture_id\":\"lec_java_01\"}"))
                .andExpect(status().isOk())
                .andReturn());

        assertSuccessEnvelope(mockMvc.perform(post("/api/v1/ai/summary")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lecture_id\":\"lec_java_01\",\"style\":\"brief\"}"))
                .andExpect(status().isOk())
                .andReturn());

        assertSuccessEnvelope(mockMvc.perform(post("/api/v1/ai/quiz")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lecture_id\":\"lec_java_01\"}"))
                .andExpect(status().isOk())
                .andReturn());

        assertSuccessEnvelope(mockMvc.perform(post("/api/v1/ai/rag")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"query\":\"요약해줘\",\"lecture_id\":\"lec_java_01\"}"))
                .andExpect(status().isOk())
                .andReturn());
    }

    @Test
    void aiEndpoints_shouldReturnUnauthenticatedEnvelope_whenUnauthorized() throws Exception {
        assertFailureEnvelope(mockMvc.perform(get("/api/v1/ai/insights"))
                        .andExpect(status().isUnauthorized())
                        .andReturn(),
                "UNAUTHENTICATED");

        assertFailureEnvelope(mockMvc.perform(post("/api/v1/ai/intent")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"테스트\"}"))
                        .andExpect(status().isUnauthorized())
                        .andReturn(),
                "UNAUTHENTICATED");
    }

    @Test
    void aiEndpoints_shouldReturnQuotaEnvelope_whenDailyLimitExceeded() throws Exception {
        String authHeader = "Bearer " + loginAndGetToken("usr_std_001");
        mockMvc.perform(put("/api/v1/ai/settings")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"daily_limit\":0}"))
                .andExpect(status().isOk());

        assertFailureEnvelope(mockMvc.perform(post("/api/v1/ai/intent")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"쿼터 테스트\"}"))
                        .andExpect(status().isTooManyRequests())
                        .andReturn(),
                "DAILY_LIMIT_EXCEEDED");
    }

    @Test
    void aiEndpoints_shouldReturnNotFoundEnvelope_whenLectureOrCourseMissing() throws Exception {
        String authHeader = "Bearer " + loginAndGetToken("usr_std_001");

        assertFailureEnvelope(mockMvc.perform(post("/api/v1/ai/summary")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lecture_id\":\"lec_not_found\"}"))
                        .andExpect(status().isNotFound())
                        .andReturn(),
                "LECTURE_NOT_FOUND");

        assertFailureEnvelope(mockMvc.perform(post("/api/v1/ai/rag")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"query\":\"테스트\",\"course_id\":\"crs_not_found\"}"))
                        .andExpect(status().isNotFound())
                        .andReturn(),
                "COURSE_NOT_FOUND");
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
