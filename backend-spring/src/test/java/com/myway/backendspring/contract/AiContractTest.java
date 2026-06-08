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
        setDailyLimit(authHeader, 999999);

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

        assertSuccessEnvelope(mockMvc.perform(post("/api/v1/ai/rag/evaluate")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"top_k\":3,\"cases\":[{\"query\":\"핵심 개념 요약\",\"lecture_id\":\"lec_java_01\",\"expected\":\"트랜스크립트\"}]}"))
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
        try {
            setDailyLimit(authHeader, 1);

            mockMvc.perform(post("/api/v1/ai/intent")
                            .header("Authorization", authHeader)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"message\":\"1차 호출\"}"))
                    .andExpect(status().isOk());

            assertFailureEnvelope(mockMvc.perform(post("/api/v1/ai/intent")
                            .header("Authorization", authHeader)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"message\":\"2차 호출\"}"))
                            .andExpect(status().isTooManyRequests())
                            .andReturn(),
                    "DAILY_LIMIT_EXCEEDED");
        } finally {
            setDailyLimit(authHeader, 999999);
        }
    }

    @Test
    void aiEndpoints_shouldRespectRoleAwareQuotaPolicy_andExposeQuotaMetadata() throws Exception {
        String studentAuth = "Bearer " + loginAndGetToken("usr_std_001");
        String instructorAuth = "Bearer " + loginAndGetToken("usr_ins_001");
        String quotaPatch = """
                {
                  "role_daily_limits": {"student": 2, "instructor": 4, "admin": 6},
                  "feature_weights": {"summary": 2, "quiz": 1, "answer": 1, "rag": 2}
                }
                """;

        try {
            setDailyLimit(studentAuth, 0);
            setDailyLimit(instructorAuth, 0);

            mockMvc.perform(put("/api/v1/ai/settings")
                            .header("Authorization", studentAuth)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(quotaPatch))
                    .andExpect(status().isOk());

            mockMvc.perform(post("/api/v1/ai/summary")
                            .header("Authorization", studentAuth)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"lecture_id\":\"lec_java_01\",\"style\":\"brief\"}"))
                    .andExpect(status().isOk());

            MvcResult studentQuotaExceeded = mockMvc.perform(post("/api/v1/ai/summary")
                            .header("Authorization", studentAuth)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"lecture_id\":\"lec_java_01\",\"style\":\"brief\"}"))
                    .andExpect(status().isTooManyRequests())
                    .andReturn();

            assertFailureEnvelope(studentQuotaExceeded, "DAILY_LIMIT_EXCEEDED");
            assertQuotaMetadata(studentQuotaExceeded, "student", "summary", 1, 0);

            mockMvc.perform(put("/api/v1/ai/settings")
                            .header("Authorization", instructorAuth)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(quotaPatch))
                    .andExpect(status().isOk());

            mockMvc.perform(post("/api/v1/ai/summary")
                            .header("Authorization", instructorAuth)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"lecture_id\":\"lec_java_01\",\"style\":\"brief\"}"))
                    .andExpect(status().isOk());

            mockMvc.perform(post("/api/v1/ai/summary")
                            .header("Authorization", instructorAuth)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"lecture_id\":\"lec_java_01\",\"style\":\"brief\"}"))
                    .andExpect(status().isOk());

            MvcResult instructorQuotaExceeded = mockMvc.perform(post("/api/v1/ai/summary")
                            .header("Authorization", instructorAuth)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"lecture_id\":\"lec_java_01\",\"style\":\"brief\"}"))
                    .andExpect(status().isTooManyRequests())
                    .andReturn();

            assertFailureEnvelope(instructorQuotaExceeded, "DAILY_LIMIT_EXCEEDED");
            assertQuotaMetadata(instructorQuotaExceeded, "instructor", "summary", 2, 0);
        } finally {
            setDailyLimit(studentAuth, 999999);
            setDailyLimit(instructorAuth, 999999);
        }
    }

    @Test
    void aiEndpoints_shouldReturnNotFoundEnvelope_whenLectureOrCourseMissing() throws Exception {
        String authHeader = "Bearer " + loginAndGetToken("usr_std_001");
        setDailyLimit(authHeader, 999999);

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

    @Test
    void aiSummaryQuiz_shouldKeepLectureIdRequiredErrorCode_whenLectureIdBlank() throws Exception {
        String authHeader = "Bearer " + loginAndGetToken("usr_std_001");
        setDailyLimit(authHeader, 999999);

        assertFailureEnvelope(mockMvc.perform(post("/api/v1/ai/summary")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lecture_id\":\"\"}"))
                        .andExpect(status().isBadRequest())
                        .andReturn(),
                "LECTURE_ID_REQUIRED");

        assertFailureEnvelope(mockMvc.perform(post("/api/v1/ai/quiz")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lecture_id\":\"\"}"))
                        .andExpect(status().isBadRequest())
                        .andReturn(),
                "LECTURE_ID_REQUIRED");
    }

    @Test
    void aiRag_shouldKeepQueryRequiredErrorCode_whenQueryBlank() throws Exception {
        String authHeader = "Bearer " + loginAndGetToken("usr_std_001");
        setDailyLimit(authHeader, 999999);

        assertFailureEnvelope(mockMvc.perform(post("/api/v1/ai/rag")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"query\":\"\",\"lecture_id\":\"lec_java_01\"}"))
                        .andExpect(status().isBadRequest())
                        .andReturn(),
                "QUERY_REQUIRED");
    }

    @Test
    void aiProviders_shouldReflectRuntimeSelectionAndKeepDefaultFallback() throws Exception {
        String authHeader = "Bearer " + loginAndGetToken("usr_std_001");

        mockMvc.perform(put("/api/v1/ai/settings")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"provider\":\"ollama\",\"model\":\"llama3.1:8b\"}"))
                .andExpect(status().isOk());

        JsonNode devLike = readData(mockMvc.perform(get("/api/v1/ai/providers")
                        .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andReturn());
        assertThat(devLike.path("current").asText()).isEqualTo("ollama");
        assertThat(devLike.path("providers").toString()).contains("demo", "ollama", "gemini");

        mockMvc.perform(put("/api/v1/ai/settings")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"provider\":\"gemini\",\"model\":\"gemini-2.5-flash\"}"))
                .andExpect(status().isOk());

        JsonNode nonDevLike = readData(mockMvc.perform(get("/api/v1/ai/providers")
                        .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andReturn());
        assertThat(nonDevLike.path("current").asText()).isEqualTo("gemini");
        assertThat(nonDevLike.path("providers").toString()).contains("demo");
    }

    @Test
    void aiSearchAndAnswer_shouldIncludeStructuredSources() throws Exception {
        String authHeader = "Bearer " + loginAndGetToken("usr_std_001");
        setDailyLimit(authHeader, 999999);

        JsonNode searchData = readData(mockMvc.perform(post("/api/v1/ai/search")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"query\":\"Spring\",\"lecture_id\":\"lec_java_01\"}"))
                .andExpect(status().isOk())
                .andReturn());

        JsonNode answerData = readData(mockMvc.perform(post("/api/v1/ai/answer")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"question\":\"REST API가 뭐야?\",\"lecture_id\":\"lec_java_01\"}"))
                .andExpect(status().isOk())
                .andReturn());

        assertStructuredSource(searchData.path("sources").get(0));
        assertStructuredSource(answerData.path("sources").get(0));
        assertThat(answerData.path("source_ids").isArray()).isTrue();
    }

    @Test
    void aiRag_shouldKeepTimestampedChunks_whenTranscriptIsNotPrepared() throws Exception {
        String authHeader = "Bearer " + loginAndGetToken("usr_std_001");
        setDailyLimit(authHeader, 999999);

        JsonNode ragData = readData(mockMvc.perform(post("/api/v1/ai/rag")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"query\":\"핵심 개념\",\"lecture_id\":\"lec_react_02\"}"))
                .andExpect(status().isOk())
                .andReturn());

        assertThat(ragData.path("chunks").isArray()).isTrue();
        assertThat(ragData.path("chunks").size()).isGreaterThan(0);
        JsonNode firstChunk = ragData.path("chunks").get(0);
        assertThat(firstChunk.path("start_ms").isNumber()).isTrue();
        assertThat(firstChunk.path("end_ms").isNumber()).isTrue();
        String chunkText = firstChunk.path("text").asText();
        if (chunkText.isBlank()) {
            chunkText = firstChunk.path("excerpt").asText();
        }
        if (chunkText.isBlank()) {
            chunkText = firstChunk.path("content").asText();
        }
        assertThat(chunkText).isNotBlank();
        assertThat(ragData.path("answer").asText()).isNotBlank();
    }

    @Test
    void aiRag_shouldExposeHybridRetrievalSignals_whenSemanticQueryIsUsed() throws Exception {
        String authHeader = "Bearer " + loginAndGetToken("usr_std_001");
        setDailyLimit(authHeader, 999999);

        JsonNode ragData = readData(mockMvc.perform(post("/api/v1/ai/rag")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"query\":\"의미 검색으로 관련 근거를 찾아줘\",\"lecture_id\":\"lec_java_01\"}"))
                .andExpect(status().isOk())
                .andReturn());

        JsonNode provider = ragData.path("provider");
        assertThat(provider.path("search_provider").asText()).isNotBlank();
        assertThat(provider.path("vector_store_provider").asText()).isEqualTo("feature_store");
        assertThat(provider.path("rerank_provider").asText()).isNotBlank();

        JsonNode firstChunk = ragData.path("chunks").get(0);
        assertThat(firstChunk.path("retrieval_mode").asText()).isEqualTo("hybrid");
        assertThat(firstChunk.path("keyword_similarity").isNumber()).isTrue();
        assertThat(firstChunk.path("vector_similarity").isNumber()).isTrue();
        assertThat(firstChunk.path("hybrid_similarity").isNumber()).isTrue();
        assertThat(firstChunk.path("score_breakdown").path("keyword").isNumber()).isTrue();
        assertThat(firstChunk.path("score_breakdown").path("vector").isNumber()).isTrue();
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

    private void assertQuotaMetadata(MvcResult result, String expectedRole, String expectedFeature, int expectedLimit, int expectedRemaining) throws Exception {
        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        JsonNode meta = root.path("error").path("meta");
        assertThat(meta.path("role").asText()).isEqualTo(expectedRole);
        assertThat(meta.path("feature").asText()).isEqualTo(expectedFeature);
        assertThat(meta.path("limit").asInt()).isEqualTo(expectedLimit);
        assertThat(meta.path("remaining").asInt()).isEqualTo(expectedRemaining);
        assertThat(meta.path("reset_at").asText()).isNotBlank();
        assertThat(result.getResponse().getHeader("X-AI-Quota-Remaining")).isEqualTo(String.valueOf(expectedRemaining));
        assertThat(result.getResponse().getHeader("X-AI-Quota-Reset")).isNotBlank();
    }

    private JsonNode readData(MvcResult result) throws Exception {
        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(root.path("success").asBoolean()).isTrue();
        return root.path("data");
    }

    private void assertStructuredSource(JsonNode source) {
        assertThat(source).isNotNull();
        assertThat(source.path("lecture_id").asText()).isNotBlank();
        assertThat(source.path("start_ms").isNumber()).isTrue();
        assertThat(source.path("end_ms").isNumber()).isTrue();
        assertThat(source.path("text").asText()).isNotNull();
        assertThat(source.path("score").isNumber()).isTrue();
    }
}
