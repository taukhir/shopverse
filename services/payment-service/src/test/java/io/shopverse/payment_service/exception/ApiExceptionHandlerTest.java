package io.shopverse.payment_service.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.assertThat;

class ApiExceptionHandlerTest {

    @Test
    void invalidPaymentStateExceptionMapsToHttp409() {
        var problem = new ApiExceptionHandler().handleInvalidPaymentState(
                new InvalidPaymentStateException("Only captured payments can be refunded")
        );

        assertThat(problem.getStatus()).isEqualTo(HttpStatus.CONFLICT.value());
        assertThat(problem.getDetail()).isEqualTo("Only captured payments can be refunded");
    }
}
