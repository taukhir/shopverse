package io.shopverse.order.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.assertThat;

class ApiExceptionHandlerTest {

    @Test
    void serviceUnavailableExceptionMapsToHttp503() {
        var problem = new ApiExceptionHandler().handleServiceUnavailable(
                new ServiceUnavailableException("Inventory catalog is temporarily unavailable", null)
        );

        assertThat(problem.getStatus()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE.value());
    }
}
