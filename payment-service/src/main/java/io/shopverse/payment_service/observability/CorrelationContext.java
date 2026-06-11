package io.shopverse.payment_service.observability;

import org.slf4j.MDC;

public final class CorrelationContext {

    private CorrelationContext() {
    }

    public static void run(String correlationId, Runnable action) {
        try (MDC.MDCCloseable ignored = MDC.putCloseable(CorrelationConstants.MDC_KEY, correlationId)) {
            action.run();
        }
    }
}
