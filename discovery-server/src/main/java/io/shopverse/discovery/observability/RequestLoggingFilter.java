package io.shopverse.discovery.observability;

import io.micrometer.core.instrument.MeterRegistry;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

@Component
public class RequestLoggingFilter extends OncePerRequestFilter {

    // Header name used to pass correlation id between services
    private static final String CORRELATION_HEADER = "X-Correlation-Id";

    // Key used inside MDC so logs can print correlationId
    private static final String CORRELATION_MDC_KEY = "correlationId";

    // Logger for this filter
    private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);

    // Micrometer registry used to publish custom metrics to Prometheus/Grafana
    private final MeterRegistry meterRegistry;

    public RequestLoggingFilter(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        /*
         * Skip actuator endpoints.
         *
         * Reason:
         * /actuator/health and /actuator/prometheus are called frequently.
         * Logging them can create unnecessary noise.
         */
        if (request.getRequestURI().startsWith("/actuator/")) {
            filterChain.doFilter(request, response);
            return;
        }

        /*
         * Get correlation id from incoming request.
         * If client/API gateway already sent it, reuse it.
         * Otherwise generate a new UUID.
         */
        String correlationId = correlationId(request);

        /*
         * Add correlation id to response header.
         * This helps client or upstream services know the correlation id
         * used for this request.
         */
        response.setHeader(CORRELATION_HEADER, correlationId);

        /*
         * Put correlation id into MDC.
         *
         * Any logs written during this request can include correlationId,
         * if logging pattern is configured properly.
         *
         * putCloseable automatically removes correlationId from MDC
         * when try block finishes.
         */
        try (var ignored = org.slf4j.MDC.putCloseable(CORRELATION_MDC_KEY, correlationId)) {

            // Start time used to calculate request duration
            long startedAt = System.nanoTime();

            // Log request start
            log.info(
                    "Discovery server request started method={} path={}",
                    request.getMethod(),
                    request.getRequestURI()
            );

            try {
                /*
                 * Continue request processing.
                 *
                 * This sends request to next filter/controller.
                 */
                filterChain.doFilter(request, response);
            } finally {

                /*
                 * finally block runs even if an exception happens.
                 * So we can still log completion and record metrics.
                 */

                // HTTP response status code, example: 200, 404, 500
                int status = response.getStatus();

                // Total request time in milliseconds
                long durationMs = (System.nanoTime() - startedAt) / 1_000_000;

                /*
                 * Increment custom metric counter.
                 *
                 * This metric can be scraped by Prometheus
                 * and visualized in Grafana.
                 */
                meterRegistry.counter(
                        "shopverse.service.requests.logged",
                        "service", "DISCOVERY-SERVER",
                        "method", request.getMethod(),
                        "status", String.valueOf(status),
                        "outcome", outcome(status)
                ).increment();

                // Log request completion
                log.info(
                        "Discovery server request completed method={} path={} status={} durationMs={}",
                        request.getMethod(),
                        request.getRequestURI(),
                        status,
                        durationMs
                );
            }
        }
    }

    /*
     * Returns correlation id from request header.
     *
     * If X-Correlation-Id is missing or blank,
     * generate a new UUID.
     */
    private String correlationId(HttpServletRequest request) {
        return Optional.ofNullable(request.getHeader(CORRELATION_HEADER))
                .filter(value -> !value.isBlank())
                .orElseGet(() -> UUID.randomUUID().toString());
    }

    /*
     * Converts HTTP status code into a readable outcome.
     *
     * Example:
     * 2xx -> SUCCESS
     * 4xx -> CLIENT_ERROR
     * 5xx -> SERVER_ERROR
     */
    private String outcome(int status) {
        return switch (status / 100) {
            case 3 -> "REDIRECTION";
            case 4 -> "CLIENT_ERROR";
            case 5 -> "SERVER_ERROR";
            default -> "SUCCESS";
        };
    }
}
