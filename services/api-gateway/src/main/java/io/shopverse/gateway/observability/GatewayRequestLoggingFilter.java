package io.shopverse.gateway.observability;

import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Optional;
import java.util.UUID;


/**
 *
 * Summary 🚀
 * This class is a global request logging filter for Spring Cloud Gateway.
 * It does 5 main things:
 * 1. Runs for every request entering the API Gateway.
 * 2. Creates or reuses X-Correlation-Id so the same request can be traced across services.
 * 3. Adds correlation ID to request and response headers.
 * 4. Logs request start and completion with method, path, status, and duration.
 * 5. Publishes a Micrometer metric so Prometheus/Grafana can track gateway request counts.
 * It skips logging for /actuator/** to avoid noisy health-check and Prometheus scrape logs.
 */
@Component
public class GatewayRequestLoggingFilter implements GlobalFilter, Ordered {

    private static final String CORRELATION_HEADER = "X-Correlation-Id";

    private static final Logger log =
            LoggerFactory.getLogger(GatewayRequestLoggingFilter.class);

    // Micrometer registry used to publish metrics to monitoring systems like Prometheus.
    private final MeterRegistry meterRegistry;

    public GatewayRequestLoggingFilter(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    /**
     * This method runs for every request coming through Spring Cloud Gateway.
     */
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {

        // Extract HTTP method, for example GET, POST, PUT, DELETE.
        String method = exchange.getRequest().getMethod().name();

        // Extract request path, for example /api/users/1.
        String path = exchange.getRequest().getURI().getPath();

        // Read correlation ID from incoming request header.
        // If missing or blank, generate a new UUID.
        String correlationId = Optional
                .ofNullable(exchange.getRequest()
                        .getHeaders()
                        .getFirst(CORRELATION_HEADER))
                .filter(value -> !value.isBlank())
                .orElseGet(() -> UUID.randomUUID().toString());

        /*
         * WebFlux request/exchange objects are immutable.
         * So we create a mutated copy of the exchange and add/update
         * the X-Correlation-Id header in the request.
         */
        ServerWebExchange correlatedExchange = exchange.mutate()
                .request(request -> request.headers(headers ->
                        headers.set(CORRELATION_HEADER, correlationId)))
                .build();

        // Add the same correlation ID to the response header.
        // This helps clients/frontend teams report the exact request ID.
        correlatedExchange.getResponse()
                .getHeaders()
                .set(CORRELATION_HEADER, correlationId);

        /*
         * Skip logging actuator endpoints like:
         * /actuator/health
         * /actuator/prometheus
         *
         * These are called frequently by monitoring tools and can create noisy logs.
         */
        if (path.startsWith("/actuator/")) {
            return chain.filter(correlatedExchange);
        }

        // Capture start time to calculate request duration later.
        long startedAt = System.nanoTime();

        // Log that request processing has started.
        log.atInfo()
                .addKeyValue("correlationId", correlationId)
                .addKeyValue("method", method)
                .addKeyValue("path", path)
                .log("Gateway request started");

        /*
         * Pass request to the next filter in the Gateway filter chain.
         *
         * doFinally() works like finally block.
         * It runs after request processing completes, fails, or gets cancelled.
         */
        return chain.filter(correlatedExchange).doFinally(signalType -> {

            // Get HTTP response status.
            HttpStatusCode statusCode =
                    correlatedExchange.getResponse().getStatusCode();

            // If status is null, assume 200 OK.
            int status = statusCode == null ? 200 : statusCode.value();

            // Calculate total request duration in milliseconds.
            long durationMs =
                    (System.nanoTime() - startedAt) / 1_000_000;

            /*
             * Increment Micrometer counter metric.
             *
             * In Prometheus this becomes something like:
             * shopverse_gateway_requests_logged_total
             */
            meterRegistry.counter(
                    "shopverse.gateway.requests.logged",
                    "method", method,
                    "status", String.valueOf(status),
                    "outcome", outcome(status)
            ).increment();

            // Log request completion with status and duration.
            log.atInfo()
                    .addKeyValue("correlationId", correlationId)
                    .addKeyValue("method", method)
                    .addKeyValue("path", path)
                    .addKeyValue("status", status)
                    .addKeyValue("durationMs", durationMs)
                    .log("Gateway request completed");
        });
    }

    /**
     * Makes this filter run at the highest priority.
     * This is useful because correlation ID should be available
     * before other filters execute.
     */
    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }

    /**
     * Converts HTTP status code into a readable outcome.
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