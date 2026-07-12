package io.shopverse.labs;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ThreadPoolSaturationLabTest {
    @Test void boundedPoolRejectsExcessWork() throws Exception {
        var result = ThreadPoolSaturationLab.run(20);
        assertEquals(4, result.largestPool());
        assertEquals(4, result.queued());
        assertEquals(8, result.accepted());
        assertEquals(12, result.rejected());
    }
}
