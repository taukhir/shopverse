package io.shopverse.inventory_service.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.orm.ObjectOptimisticLockingFailureException;

import static org.assertj.core.api.Assertions.assertThat;

class ApiExceptionHandlerTest {

    private final ApiExceptionHandler handler = new ApiExceptionHandler();

    @Test
    void insufficientStockExceptionMapsToHttp409WithDomainMessage() {
        var problem = handler.handleInsufficientStock(
                new InsufficientStockException("Insufficient stock for product 42")
        );

        assertThat(problem.getStatus()).isEqualTo(HttpStatus.CONFLICT.value());
        assertThat(problem.getDetail()).isEqualTo("Insufficient stock for product 42");
    }

    @Test
    void optimisticLockingFailureMapsToHttp409WithRetryMessage() {
        var problem = handler.handleOptimisticLockingFailure(
                new ObjectOptimisticLockingFailureException("InventoryItem", 42L)
        );

        assertThat(problem.getStatus()).isEqualTo(HttpStatus.CONFLICT.value());
        assertThat(problem.getDetail()).isEqualTo("Inventory changed concurrently; retry with the latest state");
    }
}
