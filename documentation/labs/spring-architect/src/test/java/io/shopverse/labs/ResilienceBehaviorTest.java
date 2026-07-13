package io.shopverse.labs;

import static org.assertj.core.api.Assertions.assertThat;

import io.shopverse.labs.resilience.InventoryAvailabilityService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class ResilienceBehaviorTest {
    @Autowired InventoryAvailabilityService inventory;

    @BeforeEach
    void reset() {
        inventory.resetProbe();
    }

    @Test
    void boundedRetryFailsClosedAfterThreeAttempts() {
        assertThat(inventory.isAvailable("SKU-9")).isFalse();
        assertThat(inventory.attempts()).isEqualTo(3);
    }
}
