package io.shopverse.user_service.exceptions;

import io.github.resilience4j.bulkhead.BulkheadFullException;
import io.github.resilience4j.bulkhead.Bulkhead;
import io.github.resilience4j.ratelimiter.RequestNotPermitted;
import io.github.resilience4j.ratelimiter.RateLimiter;
import io.shopverse.user_service.dto.ApiErrorResponse;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleNotFoundReturns404() {
        ResponseEntity<ApiErrorResponse> response = handler.handleNotFound(
                new ResourceNotFoundException("User not found")
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(404);
        assertThat(response.getBody().message()).isEqualTo("User not found");
    }

    @Test
    void handleDuplicateReturns409() {
        ResponseEntity<ApiErrorResponse> response = handler.handleDuplicate(
                new DuplicateResourceException("Email already exists")
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().message()).isEqualTo("Email already exists");
    }

    @Test
    void handleBadRequestReturns400() {
        ResponseEntity<ApiErrorResponse> response = handler.handleBadRequest(
                new BadRequestException("Invalid request")
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().status()).isEqualTo(400);
    }

    @Test
    void handleDataIntegrityViolationReturns409() {
        ResponseEntity<ApiErrorResponse> response = handler.handleDataIntegrityViolation(
                new DataIntegrityViolationException("foreign key violation")
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().message())
                .isEqualTo("Request conflicts with existing data or related records");
    }

    @Test
    void handleRateLimitExceededReturns429() {
        ResponseEntity<ApiErrorResponse> response = handler.handleRateLimitExceeded(
                RequestNotPermitted.createRequestNotPermitted(RateLimiter.ofDefaults("user-service-api-rate-limiter"))
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().message()).isEqualTo("Too many requests. Please retry later");
    }

    @Test
    void handleBulkheadFullReturns503() {
        ResponseEntity<ApiErrorResponse> response = handler.handleBulkheadFull(
                BulkheadFullException.createBulkheadFullException(Bulkhead.ofDefaults("user-service-api-bulkhead"))
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().message()).isEqualTo("Service is busy. Please retry later");
    }
}
