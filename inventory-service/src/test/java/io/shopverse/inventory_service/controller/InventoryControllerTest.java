package io.shopverse.inventory_service.controller;

import io.shopverse.inventory_service.dto.InventoryResponse;
import io.shopverse.inventory_service.exception.ResourceNotFoundException;
import io.shopverse.inventory_service.service.InventoryImageService;
import io.shopverse.inventory_service.service.InventoryService;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class InventoryControllerTest {

    private final InventoryService inventoryService = mock(InventoryService.class);
    private final InventoryImageService inventoryImageService = mock(InventoryImageService.class);
    private final InventoryController controller = new InventoryController(inventoryService, inventoryImageService);

    @Test
    void publicItemReturnsProductById() {
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
        when(inventoryService.getByProductId(103L)).thenReturn(product);

        InventoryResponse response = controller.publicItem(103L);

        assertThat(response.productId()).isEqualTo(103L);
        assertThat(response.productName()).isEqualTo("Pulse Fitness Tracker");
        assertThat(response.available()).isTrue();
        verify(inventoryService).getByProductId(103L);
    }

    @Test
    void publicItemPropagatesMissingProduct() {
        when(inventoryService.getByProductId(404L))
                .thenThrow(new ResourceNotFoundException("Product not found: 404"));

        assertThatThrownBy(() -> controller.publicItem(404L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Product not found: 404");
    }
}
