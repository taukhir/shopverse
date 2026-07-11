package io.shopverse.order.service;

import feign.FeignException;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import io.shopverse.order.client.InventoryClient;
import io.shopverse.order.dto.CatalogItemResponse;
import io.shopverse.order.exception.ResourceNotFoundException;
import io.shopverse.order.exception.ServiceUnavailableException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CatalogService {

    static final String CATALOG_CACHE = "catalog";

    private final InventoryClient inventoryClient;
    private final CacheManager cacheManager;

    @Retry(name = "inventory-client")
    @CircuitBreaker(name = "inventory-client", fallbackMethod = "fallbackCatalog")
    @Cacheable(cacheNames = CATALOG_CACHE)
    public List<CatalogItemResponse> getCatalog() {
        return inventoryClient.getCatalog().stream()
                .map(this::toCatalogItemResponse)
                .toList();
    }

    public CatalogItemResponse getProduct(Long productId) {
        try {
            return toCatalogItemResponse(inventoryClient.getCatalogItem(productId));
        } catch (FeignException.NotFound exception) {
            throw new ResourceNotFoundException("Product is unavailable or does not exist: " + productId);
        } catch (FeignException exception) {
            throw new ServiceUnavailableException("Inventory product lookup is temporarily unavailable", exception);
        }
    }

    public void evictCatalog() {
        var cache = cacheManager.getCache(CATALOG_CACHE);
        if (cache != null) {
            cache.clear();
        }
    }

    List<CatalogItemResponse> fallbackCatalog(Throwable throwable) {
        log.warn("Inventory catalog unavailable after retry and circuit-breaker policies", throwable);
        throw new ServiceUnavailableException("Inventory catalog is temporarily unavailable", throwable);
    }

    private CatalogItemResponse toCatalogItemResponse(io.shopverse.order.client.InventoryCatalogItem item) {
        return new CatalogItemResponse(
                item.productId(),
                item.productName(),
                item.unitPrice(),
                item.available(),
                item.imageUrl(),
                item.imageKey()
        );
    }
}
