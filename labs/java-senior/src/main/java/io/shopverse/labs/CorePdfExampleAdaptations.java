package io.shopverse.labs;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.FormatStyle;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.function.Predicate;
import java.util.regex.Pattern;

/** Executable Shopverse adaptations of examples from the reviewed Core Java chapters. */
public final class CorePdfExampleAdaptations {
    private static final Pattern ORDER_REFERENCE = Pattern.compile("SV-[A-Z0-9]{8,20}");

    private CorePdfExampleAdaptations() {}

    public static boolean validOrderReference(String value) {
        return value != null
                && value.length() <= 23
                && ORDER_REFERENCE.matcher(value).matches();
    }

    public static int totalQuantity(List<OrderLine> lines) {
        Objects.requireNonNull(lines, "lines");
        int total = 0;
        for (OrderLine line : lines) {
            if (line.quantity() == 0) {
                continue;
            }
            total = Math.addExact(total, line.quantity());
        }
        assert total >= 0 : "negative total quantity: " + total;
        return total;
    }

    public static String customerMessage(OrderStatus status) {
        return switch (Objects.requireNonNull(status, "status")) {
            case CREATED -> "Awaiting inventory";
            case RESERVED -> "Awaiting payment";
            case PAID -> "Confirmed";
            case CANCELLED -> "Cancelled";
        };
    }

    public static Predicate<Order> aboveLimit(BigDecimal limit) {
        Objects.requireNonNull(limit, "limit");
        return order -> order.total().compareTo(limit) > 0;
    }

    public static LocalizedOrder localizedOrder(
            Order order, Locale locale, ZoneId zone) {
        Objects.requireNonNull(order, "order");
        Objects.requireNonNull(locale, "locale");
        Objects.requireNonNull(zone, "zone");
        var currency = NumberFormat.getCurrencyInstance(locale);
        var dateTime = DateTimeFormatter.ofLocalizedDateTime(FormatStyle.MEDIUM)
                .localizedBy(locale)
                .withZone(zone);
        return new LocalizedOrder(
                currency.format(order.total()), dateTime.format(order.createdAt()));
    }

    public enum OrderStatus { CREATED, RESERVED, PAID, CANCELLED }

    public record OrderLine(String sku, int quantity) {
        public OrderLine {
            Objects.requireNonNull(sku, "sku");
            if (quantity < 0) throw new IllegalArgumentException("quantity");
        }
    }

    public record Order(BigDecimal total, Instant createdAt) {
        public Order {
            Objects.requireNonNull(total, "total");
            Objects.requireNonNull(createdAt, "createdAt");
        }
    }

    public record LocalizedOrder(String total, String createdAt) {}
}
