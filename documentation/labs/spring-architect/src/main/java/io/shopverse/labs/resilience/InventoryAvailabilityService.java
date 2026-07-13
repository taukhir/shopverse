package io.shopverse.labs.resilience;

import io.github.resilience4j.retry.annotation.Retry;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Service;

@Service
public class InventoryAvailabilityService {
    private final AtomicInteger attempts = new AtomicInteger();

    @Retry(name = "inventory", fallbackMethod = "fallbackAvailability")
    public boolean isAvailable(String sku) {
        attempts.incrementAndGet();
        throw new IllegalStateException("inventory timeout");
    }

    private boolean fallbackAvailability(String sku, IllegalStateException failure) {
        return false; // fail closed: never promise stock that was not confirmed
    }

    public int attempts() {
        return attempts.get();
    }

    public void resetProbe() {
        attempts.set(0);
    }
}
