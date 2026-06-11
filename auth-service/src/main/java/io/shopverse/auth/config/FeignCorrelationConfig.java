package io.shopverse.auth.config;

import feign.RequestInterceptor;
import org.slf4j.MDC;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FeignCorrelationConfig {

    @Bean
    RequestInterceptor correlationIdRequestInterceptor() {
        return template -> {
            String correlationId = MDC.get("correlationId");
            if (correlationId != null && !correlationId.isBlank()) {
                template.header("X-Correlation-Id", correlationId);
            }
        };
    }
}
