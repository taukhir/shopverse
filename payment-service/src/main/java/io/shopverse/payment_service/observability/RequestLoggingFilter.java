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
        if (request.getRequestURI().equals("/actuator/prometheus")) {
            filterChain.doFilter(request, response);
            return;
        }

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
