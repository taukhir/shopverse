package io.shopverse.order.observability;

import io.micrometer.core.instrument.MeterRegistry;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class RequestLoggingFilter extends OncePerRequestFilter {

    private final MeterRegistry meterRegistry;

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
        response.setHeader(CorrelationConstants.HEADER_NAME, correlationId);

        try (org.slf4j.MDC.MDCCloseable ignored =
                     org.slf4j.MDC.putCloseable(CorrelationConstants.MDC_KEY, correlationId)) {
            long startedAt = System.nanoTime();
            log.info("Order service request started method={} path={}", request.getMethod(), request.getRequestURI());
            try {
                filterChain.doFilter(request, response);
            } finally {
            int status = response.getStatus();
            long durationMs = (System.nanoTime() - startedAt) / 1_000_000;

            meterRegistry.counter(
                    "shopverse.service.requests.logged",
                    "service", "ORDER-SERVICE",
                    "method", request.getMethod(),
                    "status", String.valueOf(status),
                    "outcome", outcome(status)
            ).increment();

            log.info(
                    "Order service request completed method={} path={} status={} durationMs={}",
                    request.getMethod(),
                    request.getRequestURI(),
                    status,
                    durationMs
            );
            }
        }
    }

    private String correlationId(HttpServletRequest request) {
        String supplied = request.getHeader(CorrelationConstants.HEADER_NAME);
        return supplied == null || supplied.isBlank() ? UUID.randomUUID().toString() : supplied;
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
