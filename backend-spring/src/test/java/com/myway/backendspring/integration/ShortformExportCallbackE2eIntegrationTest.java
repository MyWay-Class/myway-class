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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ShortformExportCallbackE2eIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void compose_thenCallbackSecret_shouldMarkCompletedAndExposeVideoUrl() throws Exception {
        String token = loginAndGetToken();
        String auth = "Bearer " + token;

        String compose = mockMvc.perform(post("/api/v1/shortform/compose")
                        .header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title":"e2e callback",
                                  "description":"compose -> callback",
                                  "course_id":"crs_java_01",
                                  "clips":[
                                    {"lecture_id":"lec_java_01","start_ms":120000,"end_ms":180000}
                                  ]
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        JsonNode composeData = objectMapper.readTree(compose).path("data");
        String shortformId = composeData.path("id").asText();
        assertThat(shortformId).isNotBlank();
        assertThat(composeData.path("export_job_payload").path("callback").path("url").asText())
                .contains("/api/v1/shortform/export/callback");
        assertThat(composeData.path("export_job_payload").path("callback").path("secret").asText())
                .isEqualTo("dev-shortform-callback-token");

        String callback = mockMvc.perform(post("/api/v1/shortform/export/callback")
                        .header("x-myway-media-callback-secret", "dev-shortform-callback-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "shortform_id":"%s",
                                  "status":"COMPLETED",
                                  "video_url":"https://cdn.example.com/shortform/%s.mp4",
                                  "event_version":1
                                }
                                """.formatted(shortformId, shortformId)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode callbackData = objectMapper.readTree(callback).path("data");
        assertThat(callbackData.path("export_status").asText()).isEqualTo("COMPLETED");
        assertThat(callbackData.path("video_url").asText()).contains(shortformId + ".mp4");

        String video = mockMvc.perform(get("/api/v1/shortform/video/" + shortformId)
                        .header("Authorization", auth))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode videoData = objectMapper.readTree(video).path("data");
        assertThat(videoData.path("export_status").asText()).isEqualTo("COMPLETED");
        assertThat(videoData.path("video_url").asText()).contains(shortformId + ".mp4");
    }

    private String loginAndGetToken() throws Exception {
        String response = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":\"usr_std_001\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).path("data").path("session_token").asText();
    }
}
