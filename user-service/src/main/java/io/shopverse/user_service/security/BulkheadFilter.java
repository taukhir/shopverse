package io.shopverse.user_service.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.bulkhead.Bulkhead;
import io.shopverse.user_service.constants.ApiConstants;
import io.shopverse.user_service.config.UserServiceProperties;
import io.shopverse.user_service.dto.ApiErrorResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;

/**
 * Applies a Resilience4j semaphore bulkhead to isolate this instance from
 * overload when too many requests arrive concurrently.
 */
@Component
@Order(2)
@RequiredArgsConstructor
public class BulkheadFilter extends OncePerRequestFilter {

    private final UserServiceProperties properties;
    private final Bulkhead apiBulkhead;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        UserServiceProperties.Bulkhead bulkhead = properties.bulkhead();
        if (!bulkhead.enabled() || !request.getRequestURI().startsWith(ApiConstants.API_V1)) {
            filterChain.doFilter(request, response);
            return;
        }

        if (!apiBulkhead.tryAcquirePermission()) {
            writeError(response, HttpStatus.SERVICE_UNAVAILABLE, ApiConstants.SERVICE_BUSY_MESSAGE);
            return;
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            apiBulkhead.onComplete();
        }
    }

    private void writeError(HttpServletResponse response, HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), new ApiErrorResponse(
                status.value(),
                message,
                LocalDateTime.now(),
                null
        ));
    }
}
