# Resilience4j

Shopverse uses annotation-based Resilience4j and centralized YAML configuration. The annotations are implemented through Spring AOP proxies.

For generic Rate Limiter, semaphore/thread-pool Bulkhead, Retry, Circuit
Breaker, Time Limiter, fallback, annotation internals, pattern composition,
metrics, dependencies, and production guidance, see
[Resilience4j patterns](RESILIENCE4J-GENERIC.md).

## Patterns

### Rate Limiter

Controls how many calls enter an API during a refresh period.

```java
@RateLimiter(name = "order-api")
```

Current service limits use zero wait time, so excess calls fail fast.

Inventory specifically uses 150 permissions per one-second refresh period.
Because the annotation is class-level, it applies to each proxied public
Inventory controller method, including public health and catalog methods.

### Bulkhead

Limits concurrent work and prevents one endpoint from consuming all request threads.

```java
@Bulkhead(name = "order-api", type = Bulkhead.Type.SEMAPHORE)
```

The semaphore bulkhead is suitable for synchronous controller work. It does not create another thread pool.

Inventory allows 100 concurrent calls and waits zero time for a permit.
Excess calls fail with `BulkheadFullException`.

### Retry

Repeats a transient operation within a strict attempt and delay budget.

```java
@Retry(name = "inventory-client")
```

Retry only idempotent operations. A checkout or payment charge must have a stable idempotency key before retry.

### Circuit Breaker

Tracks failures and temporarily rejects calls after the configured threshold.

```java
@CircuitBreaker(name = "inventory-client", fallbackMethod = "fallbackCatalog")
```

States are CLOSED, OPEN, and HALF_OPEN. The fallback signature must accept the original arguments plus the exception.

## Internal Order

Spring creates a proxy around the annotated bean. Advice consults the named registry instance configured in YAML, obtains permission, records outcome, and invokes fallback when applicable. Self-invocation inside the same bean bypasses the proxy.

## Current Usage

- User, Order, Inventory, and Payment controllers: RateLimiter and semaphore Bulkhead.
- Order catalog lookup: Retry and CircuitBreaker.
- User role/permission lookup: Retry plus cache.

Gateway-level resilience protects the edge; service-level resilience protects a service's own resource boundary. Avoid stacking large retries at both layers because attempts multiply.

User Service maps `RequestNotPermitted` to HTTP `429` and
`BulkheadFullException` to HTTP `503`. Equivalent explicit mappings are not
currently present in every other service and remain a consistency improvement.

## Practices

- use short timeouts before adding retries;
- use unique named instances per dependency or API class;
- emit metrics and alerts for rejection/open states;
- keep fallbacks explicit and truthful;
- do not hide authentication, validation, or permanent business failures;
- set retry count low enough to stay inside the request deadline.

## Official Reference

- [Resilience4j Spring Boot](https://resilience4j.readme.io/docs/getting-started-3)
