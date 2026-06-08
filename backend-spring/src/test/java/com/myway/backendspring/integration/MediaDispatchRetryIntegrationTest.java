package com.myway.backendspring.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class MediaDispatchRetryIntegrationTest {
    private static final AtomicInteger dispatchRequests = new AtomicInteger();
    private static HttpServer processorServer;
    private static String processorBaseUrl;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeAll
    static void startProcessorServer() throws IOException {
        processorServer = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        processorServer.createContext("/jobs/audio-extraction", MediaDispatchRetryIntegrationTest::handleDispatch);
        processorServer.start();
        processorBaseUrl = "http://127.0.0.1:" + processorServer.getAddress().getPort();
    }

    @AfterAll
    static void stopProcessorServer() {
        if (processorServer != null) {
            processorServer.stop(0);
        }
    }

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("myway.media.processor.url", () -> processorBaseUrl);
        registry.add("myway.media.processor.token", () -> "");
        registry.add("myway.media.callback.secret", () -> "dev-media-callback-token");
    }

    @Test
    void extractAudio_shouldRetryTransientDispatchFailure() throws Exception {
        String auth = "Bearer " + loginAndGetToken("usr_ins_001");

        String extractionResponse = mockMvc.perform(post("/api/v1/media/extract-audio")
                        .header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lecture_id\":\"lec_java_01\"}"))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode data = objectMapper.readTree(extractionResponse).path("data");
        assertThat(data.path("processing_step").asText()).isEqualTo("dispatched");
        assertThat(data.path("processing_job_id").asText()).isEqualTo("job-123");
        assertThat(dispatchRequests.get()).isEqualTo(2);

        String healthResponse = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\":\"usr_ins_001\"}"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String healthToken = objectMapper.readTree(healthResponse).path("data").path("session_token").asText();
        String health = mockMvc.perform(get("/api/v1/media/processor-health")
                        .header("Authorization", "Bearer " + healthToken))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        JsonNode healthData = objectMapper.readTree(health).path("data");
        assertThat(healthData.path("dispatch_policy").path("max_attempts").asInt()).isEqualTo(3);
        assertThat(healthData.path("long_input_policy").path("strategy").asText()).isEqualTo("manual_split_or_batch_queue");
        assertThat(healthData.path("timing").path("average_dispatch_attempts").asLong()).isGreaterThanOrEqualTo(1L);
    }

    private static void handleDispatch(HttpExchange exchange) throws IOException {
        int attempt = dispatchRequests.incrementAndGet();
        byte[] responseBytes;
        int statusCode;
        if (attempt == 1) {
            statusCode = 503;
            responseBytes = "{\"status\":\"PROCESSING\"}".getBytes(StandardCharsets.UTF_8);
        } else {
            statusCode = 200;
            responseBytes = "{\"job_id\":\"job-123\",\"status\":\"PROCESSING\"}".getBytes(StandardCharsets.UTF_8);
        }
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        exchange.sendResponseHeaders(statusCode, responseBytes.length);
        try (OutputStream outputStream = exchange.getResponseBody()) {
            outputStream.write(responseBytes);
        }
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
