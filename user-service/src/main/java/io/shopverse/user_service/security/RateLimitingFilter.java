package io.shopverse.user_service.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.ratelimiter.RateLimiter;
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
 * Applies a Resilience4j rate limiter to API requests.
 * <p>
 * The limiter is intentionally per service instance. Use a distributed limiter
 * such as Redis-backed gateway limits when multiple instances must share quota.
 */
@Component
@Order(1)
@RequiredArgsConstructor
public class RateLimitingFilter extends OncePerRequestFilter {

    private final UserServiceProperties properties;
    private final RateLimiter apiRateLimiter;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        UserServiceProperties.RateLimit rateLimit = properties.rateLimit();
        if (!rateLimit.enabled() || !request.getRequestURI().startsWith(ApiConstants.API_V1)) {
            filterChain.doFilter(request, response);
            return;
        }

        if (!apiRateLimiter.acquirePermission()) {
            writeError(response, HttpStatus.TOO_MANY_REQUESTS, ApiConstants.TOO_MANY_REQUESTS_MESSAGE);
            return;
        }

        filterChain.doFilter(request, response);
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
