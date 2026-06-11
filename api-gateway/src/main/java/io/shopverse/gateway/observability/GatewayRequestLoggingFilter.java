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

@Component
public class GatewayRequestLoggingFilter implements GlobalFilter, Ordered {

    private static final String CORRELATION_HEADER = "X-Correlation-Id";
    private static final Logger log = LoggerFactory.getLogger(GatewayRequestLoggingFilter.class);

    private final MeterRegistry meterRegistry;

    public GatewayRequestLoggingFilter(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String method = exchange.getRequest().getMethod().name();
        String path = exchange.getRequest().getURI().getPath();
        String correlationId = Optional.ofNullable(exchange.getRequest().getHeaders().getFirst(CORRELATION_HEADER))
                .filter(value -> !value.isBlank())
                .orElseGet(() -> UUID.randomUUID().toString());

        ServerWebExchange correlatedExchange = exchange.mutate()
                .request(request -> request.headers(headers -> headers.set(CORRELATION_HEADER, correlationId)))
                .build();
        correlatedExchange.getResponse().getHeaders().set(CORRELATION_HEADER, correlationId);

        if (path.startsWith("/actuator/")) {
            return chain.filter(correlatedExchange);
        }

        long startedAt = System.nanoTime();
        log.atInfo()
                .addKeyValue("correlationId", correlationId)
                .addKeyValue("method", method)
                .addKeyValue("path", path)
                .log("Gateway request started");

        return chain.filter(correlatedExchange).doFinally(signalType -> {
            HttpStatusCode statusCode = correlatedExchange.getResponse().getStatusCode();
            int status = statusCode == null ? 200 : statusCode.value();
            long durationMs = (System.nanoTime() - startedAt) / 1_000_000;

            meterRegistry.counter(
                    "shopverse.gateway.requests.logged",
                    "method", method,
                    "status", String.valueOf(status),
                    "outcome", outcome(status)
            ).increment();

            log.atInfo()
                    .addKeyValue("correlationId", correlationId)
                    .addKeyValue("method", method)
                    .addKeyValue("path", path)
                    .addKeyValue("status", status)
                    .addKeyValue("durationMs", durationMs)
                    .log("Gateway request completed");
        });
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }

    private String outcome(int status) {
        return switch (status / 100) {
            case 3 -> "REDIRECTION";
            case 4 -> "CLIENT_ERROR";
            case 5 -> "SERVER_ERROR";
            default -> "SUCCESS";
        };
    }
}
