package io.shopverse.user_service.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI userServiceOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Shopverse User Service API")
                        .description("User, role, permission, password, and audit management APIs.")
                        .version("v1")
                        .license(new License().name("Internal")))
                .servers(List.of(new Server().url("http://localhost:8082")));
    }
}
