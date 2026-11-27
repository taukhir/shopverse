package io.shopverse.order.exception;

import io.shopverse.platform.error.ApiErrors;
import io.shopverse.platform.web.pagination.InvalidPageRequestException;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    ProblemDetail handleNotFound(ResourceNotFoundException exception) {
        return ApiErrors.problem(HttpStatus.NOT_FOUND, exception.getMessage());
    }

    @ExceptionHandler(ServiceUnavailableException.class)
    ProblemDetail handleServiceUnavailable(ServiceUnavailableException exception) {
        return ApiErrors.problem(HttpStatus.SERVICE_UNAVAILABLE, exception.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail handleValidation(MethodArgumentNotValidException exception) {
        return ApiErrors.validationProblem(exception);
    }

    @ExceptionHandler(IdempotencyKeyConflictException.class)
    ProblemDetail handleIdempotencyKeyConflict(IdempotencyKeyConflictException exception) {
        return ApiErrors.problem(HttpStatus.CONFLICT, exception.getMessage());
    }

    @ExceptionHandler(CheckoutVersionMismatchException.class)
    ProblemDetail handleCheckoutVersionMismatch(CheckoutVersionMismatchException exception) {
        return ApiErrors.problem(HttpStatus.CONFLICT, exception.getMessage());
    }

    @ExceptionHandler(CheckoutExpiredException.class)
    ProblemDetail handleCheckoutExpired(CheckoutExpiredException exception) {
        return ApiErrors.problem(HttpStatus.CONFLICT, exception.getMessage());
    }

    @ExceptionHandler(CheckoutAlreadyPlacedException.class)
    ProblemDetail handleCheckoutAlreadyPlaced(CheckoutAlreadyPlacedException exception) {
        return ApiErrors.problem(HttpStatus.CONFLICT, exception.getMessage());
    }

    @ExceptionHandler(InvalidOrderStateException.class)
    ProblemDetail handleInvalidOrderState(InvalidOrderStateException exception) {
        return ApiErrors.problem(HttpStatus.BAD_REQUEST, exception.getMessage());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ProblemDetail handleDuplicate(DataIntegrityViolationException exception) {
        return ApiErrors.problem(
                HttpStatus.CONFLICT,
                "A concurrent request already created this idempotent checkout; retry with the same key"
        );
    }

    @ExceptionHandler(ConstraintViolationException.class)
    ProblemDetail handleConstraintViolation(ConstraintViolationException exception) {
        return ApiErrors.problem(HttpStatus.BAD_REQUEST, exception.getMessage());
    }

    @ExceptionHandler(InvalidPageRequestException.class)
    ProblemDetail handleInvalidPage(InvalidPageRequestException exception) {
        return ApiErrors.problem(HttpStatus.BAD_REQUEST, exception.getMessage());
    }
}
