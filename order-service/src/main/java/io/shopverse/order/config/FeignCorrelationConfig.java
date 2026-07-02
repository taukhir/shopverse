package io.shopverse.order.config;

import feign.RequestInterceptor;
import io.shopverse.platform.observability.CorrelationConstants;
import org.slf4j.MDC;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FeignCorrelationConfig {

    @Bean
    RequestInterceptor correlationIdRequestInterceptor() {
        return template -> {
            String correlationId = MDC.get(CorrelationConstants.MDC_KEY);
            if (correlationId != null && !correlationId.isBlank()) {
                template.header(CorrelationConstants.HEADER_NAME, correlationId);
            }
        };
    }
}
