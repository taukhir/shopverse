package io.shopverse.order.dto;

import java.math.BigDecimal;

public record CatalogItemResponse(
        Long productId,
        String productName,
        BigDecimal price,
        boolean available
) {
}
