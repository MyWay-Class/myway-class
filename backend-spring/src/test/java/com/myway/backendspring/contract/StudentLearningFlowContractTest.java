package com.myway.backendspring.contract;

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
class StudentLearningFlowContractTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void studentFlow_shouldSeeEnrolledCourse_watchLecture_andUseTranscriptRag() throws Exception {
        String instructorToken = loginAndGetToken("usr_ins_001");
        String instructorAuthHeader = "Bearer " + instructorToken;
        String token = loginAndGetToken("usr_std_001");
        String authHeader = "Bearer " + token;

        JsonNode coursesData = readData(mockMvc.perform(get("/api/v1/courses")
                        .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andReturn()
        );
        assertThat(coursesData.isArray()).isTrue();
        assertThat(coursesData).isNotEmpty();
        String courseId = coursesData.get(0).path("id").asText();
        assertThat(courseId).isNotBlank();

        JsonNode enrollments = readData(mockMvc.perform(get("/api/v1/enrollments")
                        .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andReturn()
        );
        assertThat(enrollments.isArray()).isTrue();
        assertThat(enrollments).isNotEmpty();
        assertThat(enrollments.findValuesAsText("course_id")).contains(courseId);

        JsonNode courseDetail = readData(mockMvc.perform(get("/api/v1/courses/{courseId}", courseId)
                        .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andReturn()
        );
        JsonNode lectures = courseDetail.path("lectures");
        assertThat(lectures.isArray()).isTrue();
        assertThat(lectures).isNotEmpty();
        String lectureId = lectures.get(0).path("id").asText();
        assertThat(lectureId).isNotBlank();

        readData(mockMvc.perform(post("/api/v1/media/transcribe")
                        .header("Authorization", instructorAuthHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lecture_id\":\"" + lectureId + "\",\"language\":\"ko\"}"))
                .andExpect(status().isCreated())
                .andReturn()
        );

        JsonNode lectureDetail = readData(mockMvc.perform(get("/api/v1/lectures/{lectureId}", lectureId))
                .andExpect(status().isOk())
                .andReturn()
        );
        assertThat(lectureDetail.path("id").asText()).isEqualTo(lectureId);

        JsonNode transcript = readData(mockMvc.perform(get("/api/v1/media/transcript/{lectureId}", lectureId)
                        .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andReturn()
        );
        assertThat(transcript.path("segments").isArray()).isTrue();
        assertThat(transcript.path("segments").size()).isGreaterThan(0);
        JsonNode firstSegment = transcript.path("segments").get(0);
        assertThat(firstSegment.path("start_ms").isNumber()).isTrue();
        assertThat(firstSegment.path("end_ms").isNumber()).isTrue();
        assertThat(firstSegment.path("end_ms").asLong()).isGreaterThan(firstSegment.path("start_ms").asLong());

        JsonNode rag = readData(mockMvc.perform(post("/api/v1/ai/rag")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"query\":\"핵심 개념 요약\",\"lecture_id\":\"" + lectureId + "\"}"))
                .andExpect(status().isOk())
                .andReturn()
        );
        assertThat(rag.path("chunks").isArray()).isTrue();
        assertThat(rag.path("chunks").size()).isGreaterThan(0);
        JsonNode firstChunk = rag.path("chunks").get(0);
        assertThat(firstChunk.path("lecture_id").asText()).isEqualTo(lectureId);
        assertThat(firstChunk.path("start_ms").isNumber()).isTrue();
        assertThat(firstChunk.path("end_ms").isNumber()).isTrue();
        assertThat(firstChunk.path("end_ms").asLong()).isGreaterThan(firstChunk.path("start_ms").asLong());
        assertThat(firstChunk.path("end_ms").asLong()).isLessThanOrEqualTo(transcript.path("duration_ms").asLong() + 1000L);
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

    private JsonNode readData(org.springframework.test.web.servlet.MvcResult result) throws Exception {
        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(root.path("success").asBoolean()).isTrue();
        return root.path("data");
    }
}
