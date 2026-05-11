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
class LegacyEndpointMigrationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void legacyMappings_shouldExposeAvailableCoursesMigrationState() throws Exception {
        String response = mockMvc.perform(get("/api/v1/legacy/mappings"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode mappings = objectMapper.readTree(response).path("data").path("mappings");
        assertThat(mappings.isArray()).isTrue();

        JsonNode courseMapping = null;
        for (JsonNode node : mappings) {
            if ("/api/v1/legacy/courses".equals(node.path("legacy").asText())) {
                courseMapping = node;
                break;
            }
        }
        assertThat(courseMapping).isNotNull();
        assertThat(courseMapping.path("status").asText()).isEqualTo("available");

        JsonNode aiSettingsMapping = null;
        JsonNode mediaProvidersMapping = null;
        JsonNode shortformLibraryMapping = null;
        for (JsonNode node : mappings) {
            if ("/api/v1/legacy/ai/settings".equals(node.path("legacy").asText())) {
                aiSettingsMapping = node;
            }
            if ("/api/v1/legacy/media/providers".equals(node.path("legacy").asText())) {
                mediaProvidersMapping = node;
            }
            if ("/api/v1/legacy/shortform/library".equals(node.path("legacy").asText())) {
                shortformLibraryMapping = node;
            }
        }
        assertThat(aiSettingsMapping).isNotNull();
        assertThat(aiSettingsMapping.path("status").asText()).isEqualTo("available");
        assertThat(mediaProvidersMapping).isNotNull();
        assertThat(mediaProvidersMapping.path("status").asText()).isEqualTo("available");
        assertThat(shortformLibraryMapping).isNotNull();
        assertThat(shortformLibraryMapping.path("status").asText()).isEqualTo("available");
    }

    @Test
    void legacyAiReadEndpoints_shouldReturnModernCompatibleData() throws Exception {
        String auth = "Bearer " + loginAndGetToken("usr_std_001");

        String settings = mockMvc.perform(get("/api/v1/legacy/ai/settings")
                        .header("Authorization", auth))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(objectMapper.readTree(settings).path("success").asBoolean()).isTrue();

        String providers = mockMvc.perform(get("/api/v1/legacy/ai/providers")
                        .header("Authorization", auth))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(objectMapper.readTree(providers).path("success").asBoolean()).isTrue();

        String insights = mockMvc.perform(get("/api/v1/legacy/ai/insights")
                        .header("Authorization", auth))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(objectMapper.readTree(insights).path("success").asBoolean()).isTrue();

        String recommendations = mockMvc.perform(get("/api/v1/legacy/ai/recommendations")
                        .header("Authorization", auth))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(objectMapper.readTree(recommendations).path("success").asBoolean()).isTrue();

        String logs = mockMvc.perform(get("/api/v1/legacy/ai/logs")
                        .header("Authorization", auth))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(objectMapper.readTree(logs).path("success").asBoolean()).isTrue();
    }

    @Test
    void legacyMediaReadEndpoints_shouldReturnModernCompatibleData() throws Exception {
        String auth = "Bearer " + loginAndGetToken("usr_ins_001");

        String providers = mockMvc.perform(get("/api/v1/legacy/media/providers")
                        .header("Authorization", auth))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(objectMapper.readTree(providers).path("success").asBoolean()).isTrue();

        String health = mockMvc.perform(get("/api/v1/legacy/media/processor-health")
                        .header("Authorization", auth))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(objectMapper.readTree(health).path("success").asBoolean()).isTrue();

        String pipeline = mockMvc.perform(get("/api/v1/legacy/media/pipeline/lec_java_01")
                        .header("Authorization", auth))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(objectMapper.readTree(pipeline).path("success").asBoolean()).isTrue();
    }

    @Test
    void legacyCoursesEndpoints_shouldReturnModernCompatibleData() throws Exception {
        String auth = "Bearer " + loginAndGetToken("usr_std_001");

        String listResponse = mockMvc.perform(get("/api/v1/legacy/courses")
                        .header("Authorization", auth))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode listData = objectMapper.readTree(listResponse).path("data");
        assertThat(listData.isArray()).isTrue();
        assertThat(listData.size()).isGreaterThan(0);

        String courseId = listData.get(0).path("id").asText();
        assertThat(courseId).isNotBlank();

        String detailResponse = mockMvc.perform(get("/api/v1/legacy/courses/" + courseId)
                        .header("Authorization", auth))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode detailData = objectMapper.readTree(detailResponse).path("data");
        assertThat(detailData.path("id").asText()).isEqualTo(courseId);

        String lecturesResponse = mockMvc.perform(get("/api/v1/legacy/courses/" + courseId + "/lectures")
                        .header("Authorization", auth))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode lecturesData = objectMapper.readTree(lecturesResponse).path("data");
        assertThat(lecturesData.isArray()).isTrue();
        assertThat(lecturesData.size()).isGreaterThan(0);
    }

    @Test
    void legacyShortformReadEndpoints_shouldReturnModernCompatibleData() throws Exception {
        String auth = "Bearer " + loginAndGetToken("usr_std_001");

        String library = mockMvc.perform(get("/api/v1/legacy/shortform/library")
                        .header("Authorization", auth))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(objectMapper.readTree(library).path("success").asBoolean()).isTrue();

        String community = mockMvc.perform(get("/api/v1/legacy/shortform/community")
                        .header("Authorization", auth))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(objectMapper.readTree(community).path("success").asBoolean()).isTrue();

        String myVideos = mockMvc.perform(get("/api/v1/legacy/shortform/videos/my")
                        .header("Authorization", auth))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(objectMapper.readTree(myVideos).path("success").asBoolean()).isTrue();
    }

    @Test
    void courseCreateAndManage_shouldMatchLegacyInstructorSemantics() throws Exception {
        String auth = "Bearer " + loginAndGetToken("usr_ins_001");

        String createResponse = mockMvc.perform(post("/api/v1/courses")
                        .header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Legacy Migration Course",
                                  "description": "Spring migration coverage",
                                  "category": "backend",
                                  "difficulty": "beginner",
                                  "lecture_titles": ["Intro", "Contract"]
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        JsonNode created = objectMapper.readTree(createResponse).path("data");
        assertThat(created.path("id").asText()).isNotBlank();
        assertThat(created.path("title").asText()).isEqualTo("Legacy Migration Course");
        assertThat(created.path("lectures")).hasSize(2);

        String manageResponse = mockMvc.perform(get("/api/v1/courses/manage")
                        .header("Authorization", auth))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode managed = objectMapper.readTree(manageResponse).path("data");
        assertThat(managed).anySatisfy(course -> assertThat(course.path("id").asText()).isEqualTo(created.path("id").asText()));
    }

    @Test
    void lectureDraftLifecycle_shouldCreateUpdateReadAndPublish() throws Exception {
        String auth = "Bearer " + loginAndGetToken("usr_ins_001");

        String createResponse = mockMvc.perform(post("/api/v1/lecture-drafts/course/crs_java_01")
                        .header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lecture_id\":\"lec_java_01\",\"title\":\"Draft title\",\"content\":\"Draft body\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        JsonNode draft = objectMapper.readTree(createResponse).path("data");
        String draftId = draft.path("id").asText();
        assertThat(draftId).isNotBlank();
        assertThat(draft.path("status").asText()).isEqualTo("DRAFT");

        String updateResponse = mockMvc.perform(put("/api/v1/lecture-drafts/course/crs_java_01/" + draftId)
                        .header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lecture_id\":\"lec_java_02\",\"title\":\"Updated title\",\"content\":\"Updated body\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode updated = objectMapper.readTree(updateResponse).path("data");
        assertThat(updated.path("lecture_id").asText()).isEqualTo("lec_java_02");
        assertThat(updated.path("title").asText()).isEqualTo("Updated title");

        String listResponse = mockMvc.perform(get("/api/v1/lecture-drafts/course/crs_java_01")
                        .header("Authorization", auth))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(objectMapper.readTree(listResponse).path("data")).hasSizeGreaterThanOrEqualTo(1);

        String publishResponse = mockMvc.perform(post("/api/v1/lecture-drafts/course/crs_java_01/" + draftId + "/publish")
                        .header("Authorization", auth))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode published = objectMapper.readTree(publishResponse).path("data");
        assertThat(published.path("status").asText()).isEqualTo("READY_TO_PUBLISH");
    }

    @Test
    void aiSettings_shouldAcceptLegacyPutMethod() throws Exception {
        String auth = "Bearer " + loginAndGetToken("usr_admin_001");

        String response = mockMvc.perform(put("/api/v1/ai/settings")
                        .header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"autoRecommend\":true,\"model\":\"spring\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode root = objectMapper.readTree(response);
        assertThat(root.path("success").asBoolean()).isTrue();
        assertThat(root.path("data").path("autoRecommend").asBoolean()).isTrue();
    }

    @Test
    void aiCoreEndpoints_shouldReturnLegacyCompatibleSuccessShapes() throws Exception {
        String auth = "Bearer " + loginAndGetToken("usr_std_001");

        mockMvc.perform(put("/api/v1/ai/settings")
                        .header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"daily_limit\":999999,\"provider\":\"demo\",\"model\":\"demo-v1\"}"))
                .andExpect(status().isOk());

        String intent = mockMvc.perform(post("/api/v1/ai/intent")
                        .header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"다음 강의 추천해줘\",\"lecture_id\":\"lec_java_01\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(objectMapper.readTree(intent).path("data").path("intent").asText()).isNotBlank();

        String search = mockMvc.perform(post("/api/v1/ai/search")
                        .header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"query\":\"Spring\",\"lecture_id\":\"lec_java_01\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(objectMapper.readTree(search).path("data").path("hits").isArray()).isTrue();

        String answer = mockMvc.perform(post("/api/v1/ai/answer")
                        .header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"question\":\"REST API가 뭐야?\",\"lecture_id\":\"lec_java_01\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(objectMapper.readTree(answer).path("data").path("answer").asText()).isNotBlank();

        String summary = mockMvc.perform(post("/api/v1/ai/summary")
                        .header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lecture_id\":\"lec_java_01\",\"style\":\"brief\",\"language\":\"ko\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(objectMapper.readTree(summary).path("data").path("content").asText()).isNotBlank();

        String quiz = mockMvc.perform(post("/api/v1/ai/quiz")
                        .header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lecture_id\":\"lec_java_01\",\"count\":2}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(objectMapper.readTree(quiz).path("data").path("questions").isArray()).isTrue();
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
