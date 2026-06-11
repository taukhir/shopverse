package io.shopverse.config.observability;

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

    private static final String CORRELATION_HEADER = "X-Correlation-Id";
    private static final String CORRELATION_MDC_KEY = "correlationId";
    private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);

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
        if (request.getRequestURI().startsWith("/actuator/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String correlationId = correlationId(request);
        response.setHeader(CORRELATION_HEADER, correlationId);

        try (var ignored = org.slf4j.MDC.putCloseable(CORRELATION_MDC_KEY, correlationId)) {
            long startedAt = System.nanoTime();
            log.info("Config server request started method={} path={}", request.getMethod(), request.getRequestURI());
            try {
                filterChain.doFilter(request, response);
            } finally {
            int status = response.getStatus();
            long durationMs = (System.nanoTime() - startedAt) / 1_000_000;

            meterRegistry.counter(
                    "shopverse.service.requests.logged",
                    "service", "CONFIG-SERVER",
                    "method", request.getMethod(),
                    "status", String.valueOf(status),
                    "outcome", outcome(status)
            ).increment();

            log.info(
                    "Config server request completed method={} path={} status={} durationMs={}",
                    request.getMethod(),
                    request.getRequestURI(),
                    status,
                    durationMs
            );
            }
        }
    }

    private String correlationId(HttpServletRequest request) {
        return Optional.ofNullable(request.getHeader(CORRELATION_HEADER))
                .filter(value -> !value.isBlank())
                .orElseGet(() -> UUID.randomUUID().toString());
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
