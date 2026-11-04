package io.shopverse.platform.error;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ApiErrorsTest {

    @Test
    void problemUsesStatusAndDetail() {
        var problem = ApiErrors.problem(HttpStatus.CONFLICT, "Duplicate request");

        assertThat(problem.getStatus()).isEqualTo(HttpStatus.CONFLICT.value());
        assertThat(problem.getDetail()).isEqualTo("Duplicate request");
    }

    @Test
    void responseUsesStatusMessageAndErrors() {
        var response = ApiErrors.response(
                HttpStatus.BAD_REQUEST,
                "Validation failed",
                Map.of("email", "must be valid")
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        assertThat(response.getBody().message()).isEqualTo("Validation failed");
        assertThat(response.getBody().errors()).containsEntry("email", "must be valid");
    }
}
