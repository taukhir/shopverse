package io.shopverse.payment_service.exception;

import io.shopverse.platform.error.ApiErrors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    ProblemDetail handleNotFound(ResourceNotFoundException exception) {
        return ApiErrors.problem(HttpStatus.NOT_FOUND, exception.getMessage());
    }

    @ExceptionHandler(InvalidPaymentStateException.class)
    ProblemDetail handleInvalidPaymentState(InvalidPaymentStateException exception) {
        return ApiErrors.problem(HttpStatus.CONFLICT, exception.getMessage());
    }
}
