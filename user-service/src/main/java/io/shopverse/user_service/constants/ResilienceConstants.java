package io.shopverse.user_service.constants;

/**
 * Named Resilience4j instances used for filters and safe read-only retries.
 */
public final class ResilienceConstants {

    public static final String API_RATE_LIMITER = "user-service-api-rate-limiter";
    public static final String API_BULKHEAD = "user-service-api-bulkhead";
    public static final String LOOKUP_RETRY = "user-service-lookup-retry";

    private ResilienceConstants() {
    }
}
