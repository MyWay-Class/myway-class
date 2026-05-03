package com.myway.backendspring.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AdminEndpointMigrationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void mediaEndpoints_shouldSupportLegacyAdminFlow() throws Exception {
        String auth = "Bearer " + loginAndGetToken("usr_ins_001");

        String transcribe = mockMvc.perform(post("/api/v1/media/transcribe")
                        .header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lecture_id\":\"lec_java_01\",\"language\":\"ko\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        assertThat(objectMapper.readTree(transcribe).path("data").path("transcript_id").asText()).isNotBlank();

        String summarize = mockMvc.perform(post("/api/v1/media/summarize")
                        .header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lecture_id\":\"lec_java_01\",\"style\":\"brief\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        assertThat(objectMapper.readTree(summarize).path("data").path("note_id").asText()).isNotBlank();

        String notes = mockMvc.perform(get("/api/v1/media/notes/lec_java_01")
                        .header("Authorization", auth))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(objectMapper.readTree(notes).path("data").isArray()).isTrue();

        String extraction = mockMvc.perform(post("/api/v1/media/extract-audio")
                        .header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lecture_id\":\"lec_java_01\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String extractionId = objectMapper.readTree(extraction).path("data").path("id").asText();
        assertThat(extractionId).isNotBlank();

        mockMvc.perform(post("/api/v1/media/extract-audio/callback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"extraction_id\":\"" + extractionId + "\",\"status\":\"COMPLETED\"}"))
                .andExpect(status().isForbidden());

        String callback = mockMvc.perform(post("/api/v1/media/extract-audio/callback")
                        .header("X-Callback-Token", "dev-media-callback-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"extraction_id\":\"" + extractionId + "\",\"status\":\"COMPLETED\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(objectMapper.readTree(callback).path("data").path("extraction").path("status").asText()).isEqualTo("COMPLETED");
    }

    @Test
    void shortformEndpoints_shouldSupportLegacyAdminFlow() throws Exception {
        String auth = "Bearer " + loginAndGetToken("usr_std_001");

        String generate = mockMvc.perform(post("/api/v1/shortform/generate")
                        .header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"course_id\":\"crs_java_01\",\"mode\":\"cross\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        JsonNode extraction = objectMapper.readTree(generate).path("data");
        String extractionId = extraction.path("id").asText();
        String candidateId = extraction.path("candidates").get(0).path("id").asText();
        assertThat(extractionId).isNotBlank();
        assertThat(candidateId).isNotBlank();

        String selected = mockMvc.perform(put("/api/v1/shortform/candidates/select")
                        .header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"extraction_id\":\"" + extractionId + "\",\"candidate_ids\":[\"" + candidateId + "\"]}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(objectMapper.readTree(selected).path("data").path("id").asText()).isEqualTo(extractionId);

        String compose = mockMvc.perform(post("/api/v1/shortform/compose")
                        .header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"extraction_id\":\"" + extractionId + "\",\"title\":\"admin-flow\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String videoId = objectMapper.readTree(compose).path("data").path("id").asText();
        assertThat(videoId).isNotBlank();

        String videos = mockMvc.perform(get("/api/v1/shortform/videos/my")
                        .header("Authorization", auth))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(objectMapper.readTree(videos).path("data").isArray()).isTrue();

        String share = mockMvc.perform(post("/api/v1/shortform/share")
                        .header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"video_id\":\"" + videoId + "\",\"course_id\":\"crs_java_01\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        assertThat(objectMapper.readTree(share).path("data").path("video_id").asText()).isEqualTo(videoId);

        String save = mockMvc.perform(post("/api/v1/shortform/save")
                        .header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"video_id\":\"" + videoId + "\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        assertThat(objectMapper.readTree(save).path("data").path("saved").asBoolean()).isTrue();

        String like = mockMvc.perform(post("/api/v1/shortform/like")
                        .header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"video_id\":\"" + videoId + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(objectMapper.readTree(like).path("data").path("liked").isBoolean()).isTrue();
    }

    @Test
    void devReload_shouldBeAvailableInDevelopment() throws Exception {
        String response = mockMvc.perform(post("/api/v1/dev/learning-store/reload"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(objectMapper.readTree(response).path("data").path("reloaded").asBoolean()).isTrue();
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
