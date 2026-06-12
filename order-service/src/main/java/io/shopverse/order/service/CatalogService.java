package io.shopverse.order.service;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import io.shopverse.order.client.InventoryClient;
import io.shopverse.order.dto.CatalogItemResponse;
import io.shopverse.order.exception.ServiceUnavailableException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CatalogService {

    private final InventoryClient inventoryClient;

    @Retry(name = "inventory-client")
    @CircuitBreaker(name = "inventory-client", fallbackMethod = "fallbackCatalog")
    @Cacheable(cacheNames = "catalog")
    public List<CatalogItemResponse> getCatalog() {
        return inventoryClient.getCatalog().stream()
                .map(item -> new CatalogItemResponse(
                        item.productId(),
                        item.productName(),
                        item.unitPrice(),
                        item.available()
                ))
                .toList();
    }

    List<CatalogItemResponse> fallbackCatalog(Throwable throwable) {
        log.warn("Inventory catalog unavailable after retry and circuit-breaker policies", throwable);
        throw new ServiceUnavailableException("Inventory catalog is temporarily unavailable", throwable);
    }
}
