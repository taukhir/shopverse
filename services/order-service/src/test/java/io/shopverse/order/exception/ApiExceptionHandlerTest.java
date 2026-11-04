package io.shopverse.order.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.assertThat;

class ApiExceptionHandlerTest {

    private final ApiExceptionHandler handler = new ApiExceptionHandler();

    @Test
    void serviceUnavailableExceptionMapsToHttp503() {
        var problem = handler.handleServiceUnavailable(
                new ServiceUnavailableException("Inventory catalog is temporarily unavailable", null)
        );

        assertThat(problem.getStatus()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE.value());
    }

    @Test
    void idempotencyKeyConflictExceptionMapsToHttp409() {
        var problem = handler.handleIdempotencyKeyConflict(
                new IdempotencyKeyConflictException("Idempotency key is already owned by another customer")
        );

        assertThat(problem.getStatus()).isEqualTo(HttpStatus.CONFLICT.value());
        assertThat(problem.getDetail()).isEqualTo("Idempotency key is already owned by another customer");
    }
}
