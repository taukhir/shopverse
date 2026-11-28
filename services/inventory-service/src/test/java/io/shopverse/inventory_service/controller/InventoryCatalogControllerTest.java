package io.shopverse.inventory_service.controller;

import io.shopverse.inventory_service.dto.InventoryResponse;
import io.shopverse.inventory_service.exception.ResourceNotFoundException;
import io.shopverse.inventory_service.service.catalog.InventoryCatalogService;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class InventoryCatalogControllerTest {

    private final InventoryCatalogService inventoryCatalogService = mock(InventoryCatalogService.class);
    private final InventoryCatalogController controller = new InventoryCatalogController(inventoryCatalogService);

    @Test
    void getItemReturnsProductById() {
        InventoryResponse product = new InventoryResponse(
                3L,
                103L,
                "Pulse Fitness Tracker",
                "KeyForge",
                "SV-103-2026",
                "Computer Accessories",
                "Demo product",
                "http://localhost:9000/shopverse-product-images/products/103.png",
                "products/103.png",
                BigDecimal.valueOf(72.49),
                61,
                0,
                true,
                Instant.parse("2026-07-11T00:00:00Z")
        );
        when(inventoryCatalogService.getByProductId(103L)).thenReturn(product);

        InventoryResponse response = controller.getItem(103L);

        assertThat(response.productId()).isEqualTo(103L);
        assertThat(response.productName()).isEqualTo("Pulse Fitness Tracker");
        assertThat(response.available()).isTrue();
        verify(inventoryCatalogService).getByProductId(103L);
    }

    @Test
    void getItemPropagatesMissingProduct() {
        when(inventoryCatalogService.getByProductId(404L))
                .thenThrow(new ResourceNotFoundException("Product not found: 404"));

        assertThatThrownBy(() -> controller.getItem(404L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Product not found: 404");
    }
}

