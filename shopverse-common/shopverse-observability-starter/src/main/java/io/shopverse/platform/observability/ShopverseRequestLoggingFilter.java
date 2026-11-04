package io.shopverse.platform.observability;

import io.micrometer.core.instrument.MeterRegistry;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

public class ShopverseRequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(ShopverseRequestLoggingFilter.class);

    private final MeterRegistry meterRegistry;
    private final String serviceName;
    private final String metricName;
    private final String actuatorPathPrefix;

    public ShopverseRequestLoggingFilter(
            MeterRegistry meterRegistry,
            String serviceName,
            String metricName,
            String actuatorPathPrefix
    ) {
        this.meterRegistry = meterRegistry;
        this.serviceName = serviceName;
        this.metricName = metricName;
        this.actuatorPathPrefix = actuatorPathPrefix;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        if (request.getRequestURI().startsWith(actuatorPathPrefix)) {
            filterChain.doFilter(request, response);
            return;
        }

        String correlationId = correlationId(request);
        response.setHeader(CorrelationConstants.HEADER_NAME, correlationId);

        try (MDC.MDCCloseable ignored = MDC.putCloseable(CorrelationConstants.MDC_KEY, correlationId)) {
            long startedAt = System.nanoTime();
            log.info("{} request started method={} path={}", serviceName, request.getMethod(), request.getRequestURI());
            try {
                filterChain.doFilter(request, response);
            } finally {
                int status = response.getStatus();
                long durationMs = (System.nanoTime() - startedAt) / 1_000_000;

                meterRegistry.counter(
                        metricName,
                        "service", serviceName,
                        "method", request.getMethod(),
                        "status", String.valueOf(status),
                        "outcome", outcome(status)
                ).increment();

                log.info(
                        "{} request completed method={} path={} status={} durationMs={}",
                        serviceName,
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
