package io.shopverse.order.service;

import io.shopverse.order.dto.CatalogItemResponse;
import io.shopverse.order.dto.CheckoutRequest;
import io.shopverse.order.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

/** Shared item/price validation for both immediate checkout and persisted-checkout creation. */
@Component
@RequiredArgsConstructor
class CheckoutItemValidator {

    private final CatalogService catalogService;

    record ValidatedItem(Long productId, String productName, int quantity, BigDecimal unitPrice) {
    }

    List<ValidatedItem> validateItems(CheckoutRequest request) {
        return request.items().stream()
                .map(item -> {
                    CatalogItemResponse product = catalogService.getProduct(item.productId());
                    if (!product.available()) {
                        throw new ResourceNotFoundException(
                                "Product is unavailable or does not exist: " + item.productId());
                    }
                    return new ValidatedItem(item.productId(), product.productName(), item.quantity(), product.price());
                })
                .toList();
    }
}
