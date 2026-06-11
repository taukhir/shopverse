package io.shopverse.inventory_service.observability;

import org.slf4j.MDC;

/**
 * Utility class to manage logging correlation contexts.
 * <p>
 * This class injects tracing identifiers (Correlation IDs) into the logging diagnostic context (MDC)
 * to ensure all log statements within a specific block of execution are bound together for easy tracking.
 * </p>
 */
public final class CorrelationContext {

    /**
     * Private constructor to prevent instantiation of this utility class.
     */
    private CorrelationContext() {
        // Explicitly empty to prevent external creation
    }

    /**
     * Executes a given block of code (Runnable) while associating a specific Correlation ID with the current thread's logging context.
     * The context is automatically cleaned up once the action completes, even if an exception occurs.
     *
     * @param correlationId The unique identifier used to track this specific request pipeline or execution trace.
     * @param action        The functional block of code or lambda expression to be executed under this context.
     */
    public static void run(String correlationId, Runnable action) {
        // Uses try-with-resources to put the key into MDC.
        // When the try block exits, MDCCloseable automatically pops/removes the key to prevent thread contamination.
        try (MDC.MDCCloseable ignored = MDC.putCloseable(CorrelationConstants.MDC_KEY, correlationId)) {

            // Execute the actual business logic or action
            action.run();

        } // The 'ignored' closeable object automatically cleans up the MDC state right here
    }
}
