package io.shopverse.order.service;

import io.shopverse.order.client.InventoryClient;
import io.shopverse.order.exception.ServiceUnavailableException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

class CatalogServiceTest {

    @Test
    void inventoryFailureIsNotReportedAsAnEmptyCatalog() {
        CatalogService service = new CatalogService(mock(InventoryClient.class));
        RuntimeException cause = new RuntimeException("No inventory instance available");

        assertThatThrownBy(() -> service.fallbackCatalog(cause))
                .isInstanceOf(ServiceUnavailableException.class)
                .hasMessage("Inventory catalog is temporarily unavailable")
                .hasCause(cause);
    }
}
