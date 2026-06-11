package io.shopverse.gateway.observability;

import io.micrometer.core.instrument.config.MeterFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * This class removes duplicate/noisy Gateway HTTP client metrics from Micrometer so
 * Prometheus/Grafana dashboards stay cleaner and more useful.
 */
@Configuration
public class MetricsConfig {

    /*
     * Registers a Micrometer MeterFilter bean.
     *
     * MeterFilter allows us to accept, deny, rename,
     * or modify metrics before they are registered.
     */
    @Bean
    MeterFilter gatewayHttpClientRequestFilter() {

        /*
         * Deny means:
         * "Do not register this metric if the condition returns true."
         */
        return MeterFilter.deny(id ->

                /*
                 * Match these Micrometer metric names:
                 *
                 * 1. http.client.requests
                 *    - Completed outgoing HTTP client request metrics.
                 *
                 * 2. http.client.requests.active
                 *    - Currently active/in-flight outgoing HTTP requests.
                 */
                ("http.client.requests".equals(id.getName())
                        || "http.client.requests.active".equals(id.getName()))

                        /*
                         * Only deny these metrics when they contain
                         * spring.cloud.gateway.route.id tag.
                         *
                         * This tag means the metric was created for
                         * a Spring Cloud Gateway route.
                         */
                        && id.getTag("spring.cloud.gateway.route.id") != null
        );
    }
}
