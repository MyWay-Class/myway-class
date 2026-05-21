package com.myway.backendspring.contract;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("media-contract-test")
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
                "CALLBACK_UNAUTHORIZED");
    }

    @Test
    void mediaManagementEndpoints_shouldAllowOnlyInstructorOrAdmin() throws Exception {
        String studentAuth = "Bearer " + loginAndGetToken("usr_std_001");
        String instructorAuth = "Bearer " + loginAndGetToken("usr_ins_001");

        assertFailureEnvelope(mockMvc.perform(post("/api/v1/media/extract-audio")
                        .header("Authorization", studentAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lecture_id\":\"lec_java_01\"}"))
                .andExpect(status().isForbidden())
                .andReturn(), "FORBIDDEN");

        assertFailureEnvelope(mockMvc.perform(post("/api/v1/media/upload-video")
                        .header("Authorization", studentAuth)
                        .queryParam("lecture_id", "lec_java_01"))
                .andExpect(status().isForbidden())
                .andReturn(), "FORBIDDEN");

        assertSuccessEnvelope(mockMvc.perform(post("/api/v1/media/extract-audio")
                        .header("Authorization", instructorAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lecture_id\":\"lec_java_01\"}"))
                .andExpect(status().isCreated())
                .andReturn());
    }

    @Test
    void uploadVideo_shouldRequireLectureId_forInstructorOrAdmin() throws Exception {
        String instructorAuth = "Bearer " + loginAndGetToken("usr_ins_001");

        mockMvc.perform(post("/api/v1/media/upload-video")
                        .header("Authorization", instructorAuth))
                .andExpect(status().isBadRequest());
    }

    @Test
    void uploadVideo_shouldAutoBindLectureVideoAsset_withoutManualBindingEndpoint() throws Exception {
        String instructorAuth = "Bearer " + loginAndGetToken("usr_ins_001");

        JsonNode uploadData = readData(mockMvc.perform(post("/api/v1/media/upload-video")
                        .header("Authorization", instructorAuth)
                        .queryParam("lecture_id", "lec_java_01"))
                .andExpect(status().isCreated())
                .andReturn());
        String uploadedAssetKey = uploadData.path("asset_key").asText();
        assertThat(uploadedAssetKey).isNotBlank();

        JsonNode boundData = readData(mockMvc.perform(get("/api/v1/media/lecture-video/lec_java_01")
                        .header("Authorization", instructorAuth))
                .andExpect(status().isOk())
                .andReturn());
        assertThat(boundData.path("lecture_id").asText()).isEqualTo("lec_java_01");
        assertThat(boundData.path("asset_key").asText()).isEqualTo(uploadedAssetKey);
        assertThat(boundData.path("video_url").asText()).isEqualTo("/api/v1/media/assets/" + uploadedAssetKey);
    }

    @Test
    void mediaProviders_shouldExposeDemoAsDefaultPolicyForTranscribePlan() throws Exception {
        String authHeader = "Bearer " + loginAndGetToken("usr_ins_001");

        JsonNode data = readData(mockMvc.perform(get("/api/v1/media/providers")
                        .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andReturn());

        JsonNode plans = data.path("plans");
        JsonNode transcribePlan = null;
        for (JsonNode plan : plans) {
            if ("transcribe".equals(plan.path("feature").asText())) {
                transcribePlan = plan;
                break;
            }
        }
        assertThat(transcribePlan).isNotNull();
        assertThat(transcribePlan.path("current_provider").asText()).isEqualTo("demo");
        assertThat(transcribePlan.path("recommended_chain").get(0).asText()).isEqualTo("demo");
    }

    @Test
    void mediaCallbackAutoTranscribe_shouldUseDemoDefault_whenProviderNotExplicitlyRequested() throws Exception {
        String authHeader = "Bearer " + loginAndGetToken("usr_ins_001");

        JsonNode extraction = readData(mockMvc.perform(post("/api/v1/media/extract-audio")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lecture_id\":\"lec_java_01\"}"))
                .andExpect(status().isCreated())
                .andReturn());
        String extractionId = extraction.path("id").asText();
        assertThat(extractionId).isNotBlank();

        JsonNode callbackData = readData(mockMvc.perform(post("/api/v1/media/extract-audio/callback")
                        .header("X-Callback-Token", "dev-media-callback-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"extraction_id\":\"" + extractionId + "\",\"status\":\"COMPLETED\",\"event_version\":1}"))
                .andExpect(status().isOk())
                .andReturn());

        JsonNode transcript = callbackData.path("transcript");
        assertThat(transcript.path("stt_provider").asText()).isEqualTo("demo");
        assertThat(transcript.path("stt_model").asText()).isEqualTo("cf-whisper");
    }

    @Test
    void mediaWriteEndpoints_shouldKeepLectureIdRequiredErrorCode_whenLectureIdBlank() throws Exception {
        String authHeader = "Bearer " + loginAndGetToken("usr_ins_001");

        assertFailureEnvelope(mockMvc.perform(post("/api/v1/media/extract-audio")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lecture_id\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andReturn(), "LECTURE_ID_REQUIRED");

        assertFailureEnvelope(mockMvc.perform(post("/api/v1/media/transcribe")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lecture_id\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andReturn(), "LECTURE_ID_REQUIRED");

        assertFailureEnvelope(mockMvc.perform(post("/api/v1/media/summarize")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lecture_id\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andReturn(), "LECTURE_ID_REQUIRED");
    }

    @Test
    void transcribe_shouldCapDurationToPublicPolicyLimit() throws Exception {
        String authHeader = "Bearer " + loginAndGetToken("usr_ins_001");

        JsonNode transcript = readData(mockMvc.perform(post("/api/v1/media/transcribe")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lecture_id\":\"lec_java_01\",\"language\":\"ko\",\"duration_ms\":999999}"))
                .andExpect(status().isCreated())
                .andReturn());

        assertThat(transcript.path("duration_ms").asInt()).isEqualTo(180000);
        assertThat(transcript.path("stt_provider").asText()).isEqualTo("demo");
        assertThat(transcript.path("stt_model").asText()).isEqualTo("cf-whisper");
    }

    @Test
    void transcribe_shouldUseDemoDefaults_whenProviderAndModelAreOmitted() throws Exception {
        String authHeader = "Bearer " + loginAndGetToken("usr_ins_001");

        JsonNode transcript = readData(mockMvc.perform(post("/api/v1/media/transcribe")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lecture_id\":\"lec_java_01\",\"language\":\"ko\"}"))
                .andExpect(status().isCreated())
                .andReturn());

        assertThat(transcript.path("stt_provider").asText()).isEqualTo("demo");
        assertThat(transcript.path("stt_model").asText()).isEqualTo("cf-whisper");
    }

    @Test
    void pipelineRunBatch_shouldAllowOnlyAdmin_andReturnSummary() throws Exception {
        String adminAuth = "Bearer " + loginAndGetToken("usr_adm_001");
        String instructorAuth = "Bearer " + loginAndGetToken("usr_ins_001");

        assertFailureEnvelope(mockMvc.perform(post("/api/v1/media/pipeline/run-batch")
                        .header("Authorization", instructorAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"retry_count\":1}"))
                .andExpect(status().isForbidden())
                .andReturn(), "FORBIDDEN");

        JsonNode response = readData(mockMvc.perform(post("/api/v1/media/pipeline/run-batch")
                        .header("Authorization", adminAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lecture_ids\":[\"lec_java_01\"],\"retry_count\":1,\"force_run\":true}"))
                .andExpect(status().isOk())
                .andReturn());

        JsonNode summary = response.path("summary");
        assertThat(summary.has("success")).isTrue();
        assertThat(summary.has("failed")).isTrue();
        assertThat(summary.has("pending")).isTrue();
        assertThat(response.path("items").isArray()).isTrue();
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

    private JsonNode readData(MvcResult result) throws Exception {
        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(root.path("success").asBoolean()).isTrue();
        return root.path("data");
    }
}
