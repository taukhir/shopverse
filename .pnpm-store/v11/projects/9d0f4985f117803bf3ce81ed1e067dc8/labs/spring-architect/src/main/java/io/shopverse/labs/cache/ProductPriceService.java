package io.shopverse.labs.cache;

import java.math.BigDecimal;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class ProductPriceService {
    private final AtomicInteger databaseReads = new AtomicInteger();

    @Cacheable(cacheNames = "product-prices", key = "#sku", sync = true)
    public BigDecimal currentPrice(String sku) {
        databaseReads.incrementAndGet();
        return new BigDecimal("24.99");
    }

    @CacheEvict(cacheNames = "product-prices", key = "#sku")
    public void priceChanged(String sku) {
        // The database update belongs in the transaction; eviction happens at this boundary.
    }

    public int databaseReads() {
        return databaseReads.get();
    }

    public void resetProbe() {
        databaseReads.set(0);
    }
}
