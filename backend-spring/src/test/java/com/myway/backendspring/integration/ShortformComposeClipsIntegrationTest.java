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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
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
                                  "course_id":"crs_java_01",
                                  "clips":[
                                    {"lecture_id":"lec_java_01","start_ms":120000,"end_ms":180000},
                                    {"lecture_id":"lec_java_02","start_ms":60000,"end_ms":240000}
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
        assertThat(data.path("clips").size()).isEqualTo(2);
        assertThat(data.path("clips").get(0).path("lecture_id").asText()).isEqualTo("lec_java_01");
        assertThat(data.path("clips").get(1).path("lecture_id").asText()).isEqualTo("lec_java_02");

        JsonNode payload = data.path("export_job_payload");
        assertThat(payload.path("shortform_id").asText()).isEqualTo(data.path("id").asText());
        assertThat(payload.path("course_id").asText()).isEqualTo("crs_java_01");
        assertThat(payload.path("clips").isArray()).isTrue();
        assertThat(payload.path("clips").size()).isEqualTo(2);
        assertThat(payload.path("clips").get(0).path("start_time_ms").asLong()).isEqualTo(120000);
        assertThat(payload.path("clips").get(1).path("start_time_ms").asLong()).isEqualTo(60000);
    }

    @Test
    void compose_shouldRejectInvalidClipRange() throws Exception {
        String token = loginAndGetToken();
        String auth = "Bearer " + token;

        mockMvc.perform(post("/api/v1/shortform/compose")
                        .header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title":"invalid range",
                                  "course_id":"crs_java_01",
                                  "clips":[
                                    {"lecture_id":"lec_java_01","start_ms":120000,"end_ms":120000}
                                  ]
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_CLIP_RANGE"));
    }

    @Test
    void compose_shouldRejectTooLongClip() throws Exception {
        String token = loginAndGetToken();
        String auth = "Bearer " + token;

        mockMvc.perform(post("/api/v1/shortform/compose")
                        .header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title":"too long clip",
                                  "course_id":"crs_java_01",
                                  "clips":[
                                    {"lecture_id":"lec_java_01","start_ms":0,"end_ms":360001}
                                  ]
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("CLIP_DURATION_EXCEEDED"));
    }

    @Test
    void compose_shouldRejectUnenrolledLectureForStudent() throws Exception {
        String adminAuth = "Bearer " + loginAndGetToken("usr_admin_001");
        String createdCourse = mockMvc.perform(post("/api/v1/courses")
                        .header("Authorization", adminAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title":"권한테스트 강의",
                                  "description":"enroll check",
                                  "category":"backend",
                                  "difficulty":"beginner",
                                  "lectureTitles":["권한 테스트 강의 1"]
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String lectureId = objectMapper.readTree(createdCourse)
                .path("data")
                .path("lectures")
                .path(0)
                .path("id")
                .asText();
        assertThat(lectureId).isNotBlank();

        String studentAuth = "Bearer " + loginAndGetToken();
        mockMvc.perform(post("/api/v1/shortform/compose")
                        .header("Authorization", studentAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title":"forbidden clip",
                                  "clips":[
                                    {"lecture_id":"%s","start_ms":0,"end_ms":60000}
                                  ]
                                }
                                """.formatted(lectureId)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    private String loginAndGetToken() throws Exception {
        return loginAndGetToken("usr_std_001");
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
}
