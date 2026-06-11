package io.shopverse.inventory_service.observability;

public final class CorrelationConstants {

    public static final String HEADER_NAME = "X-Correlation-Id";
    public static final String MDC_KEY = "correlationId";

    private CorrelationConstants() {
    }
}
