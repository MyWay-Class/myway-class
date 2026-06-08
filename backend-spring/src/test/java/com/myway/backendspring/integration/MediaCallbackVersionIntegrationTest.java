package com.myway.backendspring.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.myway.backendspring.api.support.CallbackSecuritySupport;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@SpringBootTest
@AutoConfigureMockMvc
class MediaCallbackVersionIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CallbackSecuritySupport callbackSecuritySupport;

    @Test
    void extractAudioCallback_shouldIgnoreStaleEvents() throws Exception {
        String auth = "Bearer " + loginAndGetToken("usr_ins_001");

        String extractionResponse = mockMvc.perform(post("/api/v1/media/extract-audio")
                        .header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lecture_id\":\"lec_java_01\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String extractionId = objectMapper.readTree(extractionResponse).path("data").path("id").asText();
        assertThat(extractionId).isNotBlank();

        String failedCallback = mockMvc.perform(post("/api/v1/media/extract-audio/callback")
                        .header("X-Callback-Token", "dev-media-callback-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"extraction_id\":\"" + extractionId + "\",\"status\":\"FAILED\",\"error_message\":\"boom\",\"event_version\":2}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode failedRoot = objectMapper.readTree(failedCallback);
        assertThat(failedRoot.path("data").path("extraction").path("status").asText()).isEqualTo("FAILED");
        assertThat(failedRoot.path("data").path("extraction").path("processing_error_code").asText()).isEqualTo("PROCESSOR_CALLBACK_FAILED");
        assertThat(failedRoot.path("data").path("extraction").path("callback_status").asText()).isEqualTo("APPLIED");
        assertThat(failedRoot.path("data").path("extraction").path("last_event_version").asLong()).isEqualTo(2L);

        String staleCallback = mockMvc.perform(post("/api/v1/media/extract-audio/callback")
                        .header("X-Callback-Token", "dev-media-callback-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"extraction_id\":\"" + extractionId + "\",\"status\":\"COMPLETED\",\"event_version\":1}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode staleRoot = objectMapper.readTree(staleCallback);
        assertThat(staleRoot.path("data").path("extraction").path("callback_ignored").asBoolean()).isTrue();
        assertThat(staleRoot.path("data").path("extraction").path("callback_status").asText()).isEqualTo("IGNORED_STALE");
        assertThat(staleRoot.path("data").path("extraction").path("status").asText()).isEqualTo("FAILED");
        assertThat(staleRoot.path("data").path("extraction").path("last_event_version").asLong()).isEqualTo(2L);
        assertThat(staleRoot.path("data").path("pipeline").path("audio_status").asText()).isEqualTo("FAILED");
        assertThat(staleRoot.path("data").path("pipeline").path("processing_error_code").asText()).isEqualTo("PROCESSOR_CALLBACK_FAILED");

        String successCallback = mockMvc.perform(post("/api/v1/media/extract-audio/callback")
                        .header("X-Callback-Token", "dev-media-callback-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"extraction_id\":\"" + extractionId + "\",\"status\":\"COMPLETED\",\"event_version\":3}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode successRoot = objectMapper.readTree(successCallback);
        assertThat(successRoot.path("data").path("extraction").path("status").asText()).isEqualTo("PROCESSING");
        assertThat(successRoot.path("data").path("extraction").path("callback_ignored").asBoolean()).isFalse();
        assertThat(successRoot.path("data").path("extraction").path("callback_status").asText()).isEqualTo("APPLIED");
        assertThat(successRoot.path("data").path("pipeline").path("transcript_status").asText()).isEqualTo("COMPLETED");
        assertThat(successRoot.path("data").path("extraction").path("last_event_version").asLong()).isEqualTo(3L);

        String staleAfterSuccess = mockMvc.perform(post("/api/v1/media/extract-audio/callback")
                        .header("X-Callback-Token", "dev-media-callback-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"extraction_id\":\"" + extractionId + "\",\"status\":\"FAILED\",\"error_message\":\"late-error\",\"event_version\":2}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode staleAfterSuccessRoot = objectMapper.readTree(staleAfterSuccess);
        assertThat(staleAfterSuccessRoot.path("data").path("extraction").path("callback_ignored").asBoolean()).isTrue();
        assertThat(staleAfterSuccessRoot.path("data").path("extraction").path("callback_status").asText()).isEqualTo("IGNORED_STALE");
        assertThat(staleAfterSuccessRoot.path("data").path("extraction").path("last_event_version").asLong()).isEqualTo(3L);
        assertThat(staleAfterSuccessRoot.path("data").path("pipeline").path("transcript_status").asText()).isEqualTo("COMPLETED");

        mockMvc.perform(post("/api/v1/media/extract-audio/callback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"extraction_id\":\"" + extractionId + "\",\"status\":\"COMPLETED\",\"event_version\":4}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void extractAudioCallback_shouldRejectReplayForSignedCallbacks() throws Exception {
        String auth = "Bearer " + loginAndGetToken("usr_ins_001");

        String extractionResponse = mockMvc.perform(post("/api/v1/media/extract-audio")
                        .header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lecture_id\":\"lec_java_01\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String extractionId = objectMapper.readTree(extractionResponse).path("data").path("id").asText();
        assertThat(extractionId).isNotBlank();

        String issuedAt = Instant.now().toString();
        String nonce = "media-replay-" + extractionId;
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("extraction_id", extractionId);
        payload.put("lecture_id", "lec_java_01");
        payload.put("status", "COMPLETED");
        payload.put("event_version", 3L);
        payload.put("error_message", null);
        payload.put("audio_url", null);
        payload.put("processing_job_id", null);
        payload.put("processing_stage", null);
        payload.put("processing_step", null);
        payload.put("audio_format", null);
        payload.put("sample_rate", null);
        payload.put("channels", null);
        payload.put("sync_mode", "AUTO");
        payload.put("overwrite_policy", "OVERWRITE");
        payload.put("approval_state", "PENDING");
        payload.put("notification_channel", "dashboard");

        String signature = callbackSecuritySupport.signMediaCallback(
                "dev-media-callback-token",
                "media_extraction",
                issuedAt,
                nonce,
                payload
        );

        String callbackBody = """
                {
                  "extraction_id":"%s",
                  "lecture_id":"lec_java_01",
                  "status":"COMPLETED",
                  "event_version":3,
                  "issued_at":"%s",
                  "nonce":"%s",
                  "signature":"%s"
                }
                """.formatted(extractionId, issuedAt, nonce, signature);

        String signedCallback = mockMvc.perform(post("/api/v1/media/extract-audio/callback")
                        .header("X-Callback-Token", "dev-media-callback-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(callbackBody))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode signedRoot = objectMapper.readTree(signedCallback);
        assertThat(signedRoot.path("data").path("extraction").path("callback_status").asText()).isEqualTo("APPLIED");
        assertThat(signedRoot.path("data").path("extraction").path("last_event_version").asLong()).isEqualTo(3L);

        mockMvc.perform(post("/api/v1/media/extract-audio/callback")
                        .header("X-Callback-Token", "dev-media-callback-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(callbackBody))
                .andExpect(status().isConflict());
    }

    private String loginAndGetToken(String userId) throws Exception {
        String response = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":\"" + userId + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).path("data").path("session_token").asText();
    }
}
