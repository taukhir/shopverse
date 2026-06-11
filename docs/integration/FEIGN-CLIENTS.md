# Feign Clients

OpenFeign provides declarative synchronous HTTP clients. Shopverse uses logical Eureka service names instead of hard-coded instance URLs.

## Implemented Clients

- Auth Service calls User Service through `@FeignClient(name = "USER-SERVICE")`.
- Order Service reads the public inventory catalog through `@FeignClient(name = "INVENTORY-SERVICE")`.
- Spring Cloud LoadBalancer resolves a healthy registered instance.

```java
@FeignClient(name = "USER-SERVICE", configuration = FeignCorrelationConfig.class)
public interface UserClient {
    @GetMapping("/api/v1/internal/users/authenticated")
    UserResponse authenticatedUser();
}
```

## Why Feign

- The Java interface is the client contract.
- Spring MVC annotations describe method, path, and parameters.
- Eureka and LoadBalancer handle service location.
- Micrometer observation can create client spans.
- Interceptors consistently add internal authentication or correlation headers.

Service-name resolution and instance selection are explained in
[Load balancing](../architecture/LOAD-BALANCING-GENERIC.md).

## Correlation Propagation

```java
@Bean
RequestInterceptor correlationIdRequestInterceptor() {
    return template -> {
        String correlationId = MDC.get("correlationId");
        if (correlationId != null && !correlationId.isBlank()) {
            template.header("X-Correlation-Id", correlationId);
        }
    };
}
```

Micrometer propagates W3C trace headers independently. The interceptor preserves the business correlation ID.

## Error And Resilience Rules

- Put `@Retry` and `@CircuitBreaker` on the service method that owns the remote operation, not on the Feign interface.
- Retry only safe or idempotent calls.
- Bound retries and define a fallback that returns an explicit degraded response.
- Do not log passwords, Basic credentials, JWTs, or full sensitive response bodies.
- Configure connection and read timeouts centrally.

Order's catalog call uses annotation-based Retry and CircuitBreaker with a fallback. Authentication failures are deliberately not hidden behind a fallback.
