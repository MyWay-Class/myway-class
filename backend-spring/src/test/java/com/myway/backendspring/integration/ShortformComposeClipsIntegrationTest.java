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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ShortformComposeClipsIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void compose_shouldPersistClips_andBuildExportPayload() throws Exception {
        String token = loginAndGetToken();
        String auth = "Bearer " + token;

        String compose = mockMvc.perform(post("/api/v1/shortform/compose")
                        .header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title":"multi lecture shortform",
                                  "description":"clip merge test",
                                  "course_id":"crs_java_bundle",
                                  "clips":[
                                    {"lecture_id":"lec_java_01","start_ms":120000,"end_ms":180000},
                                    {"lecture_id":"lec_java_02","start_ms":60000,"end_ms":240000},
                                    {"lecture_id":"lec_java_03","start_ms":480000,"end_ms":540000}
                                  ]
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode root = objectMapper.readTree(compose);
        JsonNode data = root.path("data");
        assertThat(data.path("id").asText()).isNotBlank();
        assertThat(data.path("clips").isArray()).isTrue();
        assertThat(data.path("clips").size()).isEqualTo(3);
        assertThat(data.path("clips").get(0).path("lecture_id").asText()).isEqualTo("lec_java_01");
        assertThat(data.path("clips").get(1).path("lecture_id").asText()).isEqualTo("lec_java_02");
        assertThat(data.path("clips").get(2).path("lecture_id").asText()).isEqualTo("lec_java_03");

        JsonNode payload = data.path("export_job_payload");
        assertThat(payload.path("shortform_id").asText()).isEqualTo(data.path("id").asText());
        assertThat(payload.path("course_id").asText()).isEqualTo("crs_java_bundle");
        assertThat(payload.path("clips").isArray()).isTrue();
        assertThat(payload.path("clips").size()).isEqualTo(3);
        assertThat(payload.path("clips").get(0).path("start_time_ms").asLong()).isEqualTo(120000);
        assertThat(payload.path("clips").get(1).path("start_time_ms").asLong()).isEqualTo(60000);
        assertThat(payload.path("clips").get(2).path("start_time_ms").asLong()).isEqualTo(480000);
    }

    private String loginAndGetToken() throws Exception {
        String response = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":\"usr_std_001\"}"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response).path("data").path("session_token").asText();
    }
}
