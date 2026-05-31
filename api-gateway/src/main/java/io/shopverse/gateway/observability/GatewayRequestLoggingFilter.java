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

@Component
public class GatewayRequestLoggingFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(GatewayRequestLoggingFilter.class);

    private final MeterRegistry meterRegistry;

    public GatewayRequestLoggingFilter(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String method = exchange.getRequest().getMethod().name();
        String path = exchange.getRequest().getURI().getPath();

        if (path.equals("/actuator/prometheus")) {
            return chain.filter(exchange);
        }

        long startedAt = System.nanoTime();
        log.info("Gateway request started method={} path={}", method, path);

        return chain.filter(exchange).doFinally(signalType -> {
            HttpStatusCode statusCode = exchange.getResponse().getStatusCode();
            int status = statusCode == null ? 200 : statusCode.value();
            long durationMs = (System.nanoTime() - startedAt) / 1_000_000;

            meterRegistry.counter(
                    "shopverse.gateway.requests.logged",
                    "method", method,
                    "status", String.valueOf(status),
                    "outcome", outcome(status)
            ).increment();

            log.info(
                    "Gateway request completed method={} path={} status={} durationMs={}",
                    method,
                    path,
                    status,
                    durationMs
            );
        });
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }

    private String outcome(int status) {
        if (status >= 500) {
            return "SERVER_ERROR";
        }
        if (status >= 400) {
            return "CLIENT_ERROR";
        }
        if (status >= 300) {
            return "REDIRECTION";
        }
        return "SUCCESS";
    }
}
