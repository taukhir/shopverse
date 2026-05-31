package io.shopverse.user_service.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.ratelimiter.RateLimiter;
import io.github.resilience4j.ratelimiter.RateLimiterConfig;
import io.shopverse.user_service.config.UserServiceProperties;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

class RateLimitingFilterTest {

    @Test
    void doFilterAllowsRequestsWithinBurstCapacity() throws Exception {
        RateLimitingFilter filter = new RateLimitingFilter(
                new UserServiceProperties(
                        new UserServiceProperties.RateLimit(true, 60, 2),
                        new UserServiceProperties.Bulkhead(true, 100),
                        new UserServiceProperties.Retry(3, 100)
                ),
                rateLimiter(2),
                new ObjectMapper().findAndRegisterModules()
        );
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request(), new MockHttpServletResponse(), chain);
        filter.doFilter(request(), new MockHttpServletResponse(), chain);

        verify(chain, times(2)).doFilter(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
    }

    @Test
    void doFilterRejectsRequestsAboveBurstCapacity() throws Exception {
        RateLimitingFilter filter = new RateLimitingFilter(
                new UserServiceProperties(
                        new UserServiceProperties.RateLimit(true, 1, 1),
                        new UserServiceProperties.Bulkhead(true, 100),
                        new UserServiceProperties.Retry(3, 100)
                ),
                rateLimiter(1),
                new ObjectMapper().findAndRegisterModules()
        );
        FilterChain chain = mock(FilterChain.class);
        MockHttpServletResponse first = new MockHttpServletResponse();
        MockHttpServletResponse second = new MockHttpServletResponse();

        filter.doFilter(request(), first, chain);
        filter.doFilter(request(), second, chain);

        assertThat(first.getStatus()).isEqualTo(200);
        assertThat(second.getStatus()).isEqualTo(429);
    }

    private MockHttpServletRequest request() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/users");
        request.setRemoteAddr("127.0.0.1");
        return request;
    }

    private RateLimiter rateLimiter(int limitForPeriod) {
        return RateLimiter.of("test-rate-limiter", RateLimiterConfig.custom()
                .limitForPeriod(limitForPeriod)
                .limitRefreshPeriod(Duration.ofMinutes(1))
                .timeoutDuration(Duration.ZERO)
                .build());
    }
}
