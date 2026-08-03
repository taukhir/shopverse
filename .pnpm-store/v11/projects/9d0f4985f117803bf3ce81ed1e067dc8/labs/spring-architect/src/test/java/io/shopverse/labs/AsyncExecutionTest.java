package io.shopverse.labs;

import static org.assertj.core.api.Assertions.assertThat;

import io.shopverse.labs.async.OrderProjectionService;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class AsyncExecutionTest {
    @Autowired OrderProjectionService projections;

    @Test
    void namedBoundedExecutorOwnsTheWork() throws Exception {
        var result = projections.rebuild("order-17").get(2, TimeUnit.SECONDS);
        assertThat(result).startsWith("order-17@order-projection-");
    }
}
