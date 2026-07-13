package io.shopverse.labs;

import static org.assertj.core.api.Assertions.assertThat;

import io.shopverse.labs.cache.ProductPriceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class CacheBehaviorTest {
    @Autowired ProductPriceService prices;

    @BeforeEach
    void reset() {
        prices.priceChanged("SKU-42");
        prices.resetProbe();
    }

    @Test
    void cacheAsideAvoidsRepeatedDatabaseReadsAndEvictsOnChange() {
        prices.currentPrice("SKU-42");
        prices.currentPrice("SKU-42");
        assertThat(prices.databaseReads()).isEqualTo(1);

        prices.priceChanged("SKU-42");
        prices.currentPrice("SKU-42");
        assertThat(prices.databaseReads()).isEqualTo(2);
    }
}
