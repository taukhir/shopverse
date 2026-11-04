package io.shopverse.platform.observability;

import org.slf4j.MDC;

import java.util.function.Supplier;

public final class CorrelationContext {

    private CorrelationContext() {
    }

    public static void run(String correlationId, Runnable action) {
        try (MDC.MDCCloseable ignored = MDC.putCloseable(CorrelationConstants.MDC_KEY, correlationId)) {
            action.run();
        }
    }

    public static <T> T call(String correlationId, Supplier<T> action) {
        try (MDC.MDCCloseable ignored = MDC.putCloseable(CorrelationConstants.MDC_KEY, correlationId)) {
            return action.get();
        }
    }
}
