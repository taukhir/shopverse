package io.shopverse.platform.error;

import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.stream.Collectors;

public final class ApiErrors {

    private static final String INVALID_VALUE = "Invalid value";
    private static final String VALIDATION_FAILED = "Validation failed";

    private ApiErrors() {
    }

    public static ProblemDetail problem(HttpStatus status, String detail) {
        return ProblemDetail.forStatusAndDetail(status, detail);
    }

    public static ProblemDetail validationProblem(MethodArgumentNotValidException exception) {
        String detail = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + defaultMessage(error.getDefaultMessage()))
                .collect(Collectors.joining(", "));
        return problem(HttpStatus.BAD_REQUEST, detail);
    }

    public static ResponseEntity<ApiErrorResponse> response(HttpStatus status, String message) {
        return response(status, message, null);
    }

    public static ResponseEntity<ApiErrorResponse> response(
            HttpStatus status,
            String message,
            Map<String, String> errors
    ) {
        ApiErrorResponse error = new ApiErrorResponse(
                status.value(),
                message,
                LocalDateTime.now(),
                errors
        );

        return ResponseEntity.status(status).body(error);
    }

    public static ResponseEntity<ApiErrorResponse> validationResponse(MethodArgumentNotValidException exception) {
        return response(HttpStatus.BAD_REQUEST, VALIDATION_FAILED, fieldErrors(exception));
    }

    public static ResponseEntity<ApiErrorResponse> constraintViolationResponse(ConstraintViolationException exception) {
        Map<String, String> errors = exception.getConstraintViolations().stream()
                .collect(Collectors.toMap(
                        violation -> violation.getPropertyPath().toString(),
                        violation -> defaultMessage(violation.getMessage()),
                        (first, second) -> first
                ));

        return response(HttpStatus.BAD_REQUEST, VALIDATION_FAILED, errors);
    }

    public static Map<String, String> fieldErrors(MethodArgumentNotValidException exception) {
        return exception.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        fieldError -> fieldError.getField(),
                        fieldError -> defaultMessage(fieldError.getDefaultMessage()),
                        (first, second) -> first
                ));
    }

    private static String defaultMessage(String message) {
        return message == null ? INVALID_VALUE : message;
    }
}
