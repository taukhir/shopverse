package io.shopverse.gateway.observability;

import io.micrometer.core.instrument.config.MeterFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MetricsConfig {

    @Bean
    MeterFilter gatewayHttpClientRequestFilter() {
        return MeterFilter.deny(id ->
                ("http.client.requests".equals(id.getName())
                        || "http.client.requests.active".equals(id.getName()))
                        && id.getTag("spring.cloud.gateway.route.id") != null
        );
    }
}
