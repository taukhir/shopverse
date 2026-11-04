package io.shopverse.order.service;

import io.shopverse.order.client.InventoryClient;
import io.shopverse.order.exception.ServiceUnavailableException;
import org.junit.jupiter.api.Test;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class CatalogServiceTest {

    @Test
    void inventoryFailureIsNotReportedAsAnEmptyCatalog() {
        CatalogService service = new CatalogService(mock(InventoryClient.class), new ConcurrentMapCacheManager("catalog"));
        RuntimeException cause = new RuntimeException("No inventory instance available");

        assertThatThrownBy(() -> service.fallbackCatalog(cause))
                .isInstanceOf(ServiceUnavailableException.class)
                .hasMessage("Inventory catalog is temporarily unavailable")
                .hasCause(cause);
    }

    @Test
    void evictCatalogClearsCachedCatalogSnapshot() {
        ConcurrentMapCacheManager cacheManager = new ConcurrentMapCacheManager("catalog");
        CatalogService service = new CatalogService(mock(InventoryClient.class), cacheManager);
        cacheManager.getCache("catalog").put("SimpleKey []", "stale-catalog");

        service.evictCatalog();

        assertThat(cacheManager.getCache("catalog").get("SimpleKey []")).isNull();
    }
}
