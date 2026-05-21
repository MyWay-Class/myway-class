package com.myway.backendspring.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI mywayOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("MyWay Class API")
                        .description("내맘대로Class 백엔드 API 문서")
                        .version("v1"))
                .servers(List.of(new Server().url("/")));
    }
}
