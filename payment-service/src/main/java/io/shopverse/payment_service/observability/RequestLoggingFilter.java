package io.shopverse.payment_service.observability;

import io.micrometer.core.instrument.MeterRegistry;
import io.shopverse.payment_service.constants.PaymentConstants;
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

@Slf4j
@Component
@RequiredArgsConstructor
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final String REQUEST_COUNTER = "shopverse.service.requests.logged";

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
            log.info("Payment service request started method={} path={}", request.getMethod(), request.getRequestURI());
            try {
                filterChain.doFilter(request, response);
            } finally {
            int status = response.getStatus();
            long durationMs = (System.nanoTime() - startedAt) / 1_000_000;

            meterRegistry.counter(
                    REQUEST_COUNTER,
                    "service", PaymentConstants.SERVICE_NAME,
                    "method", request.getMethod(),
                    "status", String.valueOf(status),
                    "outcome", outcome(status)
            ).increment();

            log.info(
                    "Payment service request completed method={} path={} status={} durationMs={}",
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
