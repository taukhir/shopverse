package io.shopverse.user_service.observability;

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
        if (request.getRequestURI().equals("/actuator/prometheus")) {
            filterChain.doFilter(request, response);
            return;
        }

        long startedAt = System.nanoTime();
        log.info("User service request started method={} path={}", request.getMethod(), request.getRequestURI());

        try {
            filterChain.doFilter(request, response);
        } finally {
            int status = response.getStatus();
            long durationMs = (System.nanoTime() - startedAt) / 1_000_000;

            meterRegistry.counter(
                    "shopverse.service.requests.logged",
                    "service", "USER-SERVICE",
                    "method", request.getMethod(),
                    "status", String.valueOf(status),
                    "outcome", outcome(status)
            ).increment();

            log.info(
                    "User service request completed method={} path={} status={} durationMs={}",
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
