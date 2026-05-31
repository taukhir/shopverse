package io.shopverse.user_service.config;

import io.github.resilience4j.bulkhead.Bulkhead;
import io.github.resilience4j.bulkhead.BulkheadConfig;
import io.github.resilience4j.bulkhead.BulkheadRegistry;
import io.github.resilience4j.ratelimiter.RateLimiter;
import io.github.resilience4j.ratelimiter.RateLimiterConfig;
import io.github.resilience4j.ratelimiter.RateLimiterRegistry;
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryConfig;
import io.github.resilience4j.retry.RetryRegistry;
import io.shopverse.user_service.constants.ResilienceConstants;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * Creates Resilience4j primitives used by this service.
 * <p>
 * The project uses Resilience4j core modules directly rather than the Spring Boot
 * starter so the integration remains explicit and compatible with Spring Boot 4.
 */
@Configuration
public class ResilienceConfig {

    /**
     * @param properties environment-backed service properties
     * @return rate limiter for inbound API requests
     */
    @Bean
    public RateLimiter apiRateLimiter(UserServiceProperties properties) {
        UserServiceProperties.RateLimit settings = properties.rateLimit();
        RateLimiterConfig config = RateLimiterConfig.custom()
                .limitForPeriod(Math.max(1, settings.burstCapacity()))
                .limitRefreshPeriod(Duration.ofMinutes(1))
                .timeoutDuration(Duration.ZERO)
                .build();

        return RateLimiterRegistry.of(config).rateLimiter(ResilienceConstants.API_RATE_LIMITER);
    }

    /**
     * @param properties environment-backed service properties
     * @return semaphore bulkhead for inbound API requests
     */
    @Bean
    public Bulkhead apiBulkhead(UserServiceProperties properties) {
        BulkheadConfig config = BulkheadConfig.custom()
                .maxConcurrentCalls(Math.max(1, properties.bulkhead().maxConcurrentRequests()))
                .maxWaitDuration(Duration.ZERO)
                .build();

        return BulkheadRegistry.of(config).bulkhead(ResilienceConstants.API_BULKHEAD);
    }

    /**
     * @param properties environment-backed service properties
     * @return retry instance for safe read-only lookup operations
     */
    @Bean
    public Retry lookupRetry(UserServiceProperties properties) {
        UserServiceProperties.Retry settings = properties.retry();
        RetryConfig config = RetryConfig.custom()
                .maxAttempts(Math.max(1, settings.maxAttempts()))
                .waitDuration(Duration.ofMillis(Math.max(0, settings.waitDurationMillis())))
                .build();

        return RetryRegistry.of(config).retry(ResilienceConstants.LOOKUP_RETRY);
    }
}
