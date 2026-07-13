package io.shopverse.labs;

import static io.shopverse.labs.CorePdfExampleAdaptations.*;
import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;
import org.junit.jupiter.api.Test;

class CorePdfExampleAdaptationsTest {
    @Test
    void validatesBoundedOrderReferences() {
        assertTrue(validOrderReference("SV-ABCD1234"));
        assertFalse(validOrderReference("SV-lowercase"));
        assertFalse(validOrderReference("SV-" + "A".repeat(21)));
        assertFalse(validOrderReference(null));
    }

    @Test
    void usesExplicitFlowAndExactArithmetic() {
        var lines = List.of(new OrderLine("SKU-1", 2), new OrderLine("SKU-2", 0));
        assertEquals(2, totalQuantity(lines));
        assertEquals("Awaiting payment", customerMessage(OrderStatus.RESERVED));
    }

    @Test
    void capturesAnEffectivelyFinalLimit() {
        var order = new Order(new BigDecimal("125.00"), Instant.EPOCH);
        assertTrue(aboveLimit(new BigDecimal("100.00")).test(order));
    }

    @Test
    void localizesAtThePresentationBoundary() {
        var order = new Order(new BigDecimal("123456.78"), Instant.parse("2026-07-13T10:15:30Z"));
        var localized = localizedOrder(order, Locale.US, ZoneId.of("UTC"));
        assertTrue(localized.total().contains("123,456.78"));
        assertFalse(localized.createdAt().isBlank());
    }
}
