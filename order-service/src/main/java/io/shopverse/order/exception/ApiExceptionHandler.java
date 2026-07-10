package io.shopverse.order.exception;

import io.shopverse.platform.error.ApiErrors;
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
}
