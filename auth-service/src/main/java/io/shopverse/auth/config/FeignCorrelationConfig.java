package io.shopverse.auth.config;

import feign.RequestInterceptor;
import org.slf4j.MDC;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FeignCorrelationConfig {

    /**
     * This bean is automatically picked up by OpenFeign.
     *
     * It runs before every outgoing Feign HTTP request.
     * The purpose is to propagate the correlation ID from the current service
     * to the next downstream service.
     */
    @Bean
    RequestInterceptor correlationIdRequestInterceptor() {

        return template -> {

            /*
             * Read the correlationId from MDC.
             *
             * MDC stores request-scoped logging data.
             * Usually, the correlationId is added to MDC by a filter/interceptor
             * when the request first enters the service.
             */
            String correlationId = MDC.get("correlationId");

            /*
             * Only add the header if correlationId is present and not blank.
             *
             * This avoids sending empty or invalid headers to downstream services.
             */
            if (correlationId != null && !correlationId.isBlank()) {

                /*
                 * Add the correlation ID to the outgoing Feign request header.
                 *
                 * This allows the next microservice to receive the same correlation ID,
                 * put it into its own MDC, and include it in its logs.
                 */
                template.header("X-Correlation-Id", correlationId);
            }
        };
    }
}