package io.shopverse.user_service.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Runtime-tunable settings for the user-service.
 *
 * @param rateLimit request rate limiting configuration
 * @param bulkhead  concurrent request isolation configuration
 * @param retry     retry configuration for safe read-only operations
 */
@ConfigurationProperties(prefix = "shopverse.user-service")
public record UserServiceProperties(
        RateLimit rateLimit,
        Bulkhead bulkhead,
        Retry retry
) {

    public UserServiceProperties {
        if (rateLimit == null) {
            rateLimit = new RateLimit(true, 60, 120);
        }
        if (bulkhead == null) {
            bulkhead = new Bulkhead(true, 100);
        }
        if (retry == null) {
            retry = new Retry(3, 100);
        }
    }

    /**
     * @param enabled               enables or disables the HTTP API rate limiter
     * @param refillTokensPerMinute tokens made available per minute
     * @param burstCapacity         maximum requests allowed in a short burst
     */
    public record RateLimit(
            boolean enabled,
            int refillTokensPerMinute,
            int burstCapacity
    ) {
    }

    /**
     * @param enabled               enables or disables the HTTP API bulkhead
     * @param maxConcurrentRequests maximum concurrent requests allowed per instance
     */
    public record Bulkhead(
            boolean enabled,
            int maxConcurrentRequests
    ) {
    }

    /**
     * @param maxAttempts        maximum attempts for safe read-only retry operations
     * @param waitDurationMillis wait duration between retry attempts
     */
    public record Retry(
            int maxAttempts,
            long waitDurationMillis
    ) {
    }
}
