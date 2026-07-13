---
title: "Shopverse Refactoring And Production Readiness"
description: "Shopverse Refactoring And Production Readiness with Shopverse examples, failure analysis, and production guidance."
sidebar_label: "Shopverse Refactoring And Production Readiness"
tags: ["shopverse", "architecture", "production"]
page_type: "Guide"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# Shopverse Refactoring And Production Readiness

<DocLabels items={[{label: 'Advanced', tone: 'advanced'}, {label: 'Shopverse', tone: 'shopverse'}, {label: 'Production', tone: 'production'}]} />

## Critical Problem Areas

### 1. Event Contract And Idempotency

Add a standard envelope and inbox before increasing Kafka complexity.

```java
public record ShopverseEvent<T>(
        String eventId,
        String eventType,
        int schemaVersion,
        String aggregateType,
        String aggregateId,
        String correlationId,
        Instant occurredAt,
        T data
) {}
```

Consumer rule:

```java
@Transactional
public void handle(ShopverseEvent<InventoryReservedData> event) {
    if (!inbox.tryRecord(event.eventId(), "order-service")) {
        return;
    }

    orderWorkflow.markInventoryReservedAndPaymentProcessing(
            event.data().orderNumber()
    );
}
```

Database requirement:

```sql
create table inbox_events (
  event_id varchar(80) not null,
  consumer_name varchar(80) not null,
  processed_at timestamp(6) not null,
  primary key (event_id, consumer_name)
);
```

### 2. Outbox Publisher

Keep the existing outbox behavior but move it behind a reusable abstraction.
The production shape should include terminal failure, exponential backoff, and
claim ownership.

```java
public interface OutboxEventStore {
    List<OutboxMessage> claimBatch(String workerId, int batchSize, Duration lease);
    void markPublished(String eventId, KafkaMetadata metadata);
    void markRetryableFailure(String eventId, Throwable cause, Instant nextAttemptAt);
    void markTerminalFailure(String eventId, Throwable cause);
}
```

### 3. Reservation Expiry

Replace open-ended scheduler scans with atomic claims.

```sql
update inventory_reservations
set status = 'EXPIRING', updated_at = current_timestamp(6)
where status = 'RESERVED'
  and expires_at < current_timestamp(6)
order by expires_at
limit 100;
```

Then publish one inventory-failed event per claimed reservation inside the same
transaction as stock release and status transition.

### 4. Checkout Catalog Lookup

Current checkout gets the entire public catalog from Inventory and filters in
Order Service. Preserve behavior but replace the broad dependency with a
targeted catalog lookup.

```java
public interface CatalogService {
    Map<Long, CatalogItemResponse> getAvailableItems(Set<Long> productIds);
}
```

For the current one-item API, this still returns one product. It also prepares
the architecture for multi-item checkout later.

### 5. Auth And Token Lifecycle

Current behavior should remain for the POC, but production should move toward:

1. Auth Server or Spring Authorization Server.
2. Access token TTL measured in minutes.
3. Refresh token rotation and reuse detection.
4. `kid`-based signing key rotation.
5. Token audience validation per service.
6. Internal service authentication independent of customer passwords.

## Refactoring Strategy

### Phase 1: Stabilize Contracts

- Introduce event envelope with `eventId`, `schemaVersion`, and `occurredAt`.
- Add contract tests for all Kafka event producers and consumers.
- Add shared API error response schema.
- Add strict max page size to list endpoints.

### Phase 2: Extract Platform Starters

- `shopverse-observability-starter`: request logging, correlation, MDC, metrics.
- `shopverse-security-starter`: JWT decoder, authority mapping, actuator permit list.
- `shopverse-outbox-starter`: entity base, store interface, publisher, metrics.
- `shopverse-kafka-starter`: event envelope, listener adapter, DLT recording.

Keep these libraries versioned and small.

### Phase 3: Harden Distributed Processing

- Add inbox table to Order, Inventory, and Payment consumers.
- Add terminal outbox failure and retry backoff.
- Add atomic reservation expiry claims.
- Add admin replay workflow with audit trail and approval states.

### Phase 4: Productionize Security

- Move RSA keys out of resources.
- Add key rotation and `kid`.
- Add refresh-token rotation or BFF cookie-based session.
- Restrict actuator, Eureka, Config Server, Kafka, MySQL, and observability ports.
- Add TLS/mTLS for service traffic.

### Phase 5: Scale Read And Write Paths

- Add pagination everywhere a list can grow.
- Replace full-catalog checkout lookup with targeted product lookup.
- Move local simple caches to bounded Caffeine or Redis.
- Add route-specific gateway resilience settings.
- Add database indexes for owner and timeline queries if missing under load tests.

## Improved Production-Grade Code Targets

These are target shapes, not behavior changes to apply blindly.

### Typed Domain Exception

```java
public final class IdempotencyKeyConflictException extends RuntimeException {
    public IdempotencyKeyConflictException(String key) {
        super("Idempotency key is already owned by another customer: " + key);
    }
}
```

### Controller Stays Thin

```java
@PostMapping("/checkout")
public ResponseEntity<OrderResponse> checkout(
        @Valid @RequestBody CheckoutRequest request,
        @RequestHeader("Idempotency-Key") @NotBlank @Size(max = 100) String key,
        Authentication authentication
) {
    OrderResponse response = checkoutUseCase.checkout(
            new CheckoutCommand(request.items(), authentication.getName(), key)
    );

    return ResponseEntity.status(HttpStatus.CREATED).body(response);
}
```

### Event Envelope Usage

```java
outbox.enqueue(ShopverseEvent.of(
        "OrderCreated",
        "ORDER",
        saved.getOrderNumber(),
        saved.getCorrelationId(),
        new OrderCreatedData(
                saved.getId(),
                saved.getOrderNumber(),
                saved.getCustomerUsername(),
                lineItems(saved),
                saved.getTotalAmount()
        )
));
```

### Pageable List Endpoint

```java
@GetMapping("/admin/all")
@PreAuthorize("hasRole('ADMIN')")
public PageResponse<OrderResponse> allOrders(
        @PageableDefault(size = 25, sort = "createdAt", direction = Sort.Direction.DESC)
        Pageable pageable
) {
    return orderQueryService.getAllOrders(PageLimit.enforce(pageable, 100));
}
```

### Security Starter Shape

```java
@Configuration(proxyBeanMethods = false)
@EnableMethodSecurity
public class ShopverseResourceServerAutoConfiguration {
    @Bean
    JwtAuthenticationConverter shopverseJwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter authorities = new JwtGrantedAuthoritiesConverter();
        authorities.setAuthoritiesClaimName("permissions");
        authorities.setAuthorityPrefix("");

        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(authorities);
        return converter;
    }
}
```

## Performance Improvements

| Improvement | Expected result |
|---|---|
| Targeted catalog lookup | Lower checkout latency and less Inventory payload transfer. |
| Pageable reads | Predictable memory, response size, and database load. |
| Bounded cache provider | Safer memory behavior and explicit TTL/size policy. |
| Outbox batch claims | Higher publish throughput and cleaner multi-replica scale. |
| Consumer inbox | Safe at-least-once Kafka processing. |
| Atomic scheduler claims | Reservation expiry remains correct with multiple replicas. |
| Load tests around checkout | Confirms optimistic locking and outbox lag under contention. |

## Production Security Target State

No system is permanently finished, so this section defines the operational
target required before real production exposure. These items are hardening
criteria, not current POC guarantees:

1. All external traffic enters through a TLS-terminated gateway or ingress.
2. Services are private by default and communicate over mTLS or signed internal
   service tokens.
3. JWTs validate issuer, audience, expiry, signature, algorithm, and `kid`.
4. RSA private keys are never packaged in application resources.
5. Access tokens are short-lived; refresh tokens are rotated, hashed at rest,
   device-bound where possible, and revocable.
6. Actuator endpoints are split by management port and restricted to monitoring
   infrastructure.
7. Admin APIs require role checks, audit logs, and replay/change justification.
8. Secrets come from a managed secret store and CI performs secret scanning.
9. Browser sessions use HttpOnly secure cookies or a BFF pattern for production.
10. CSP, secure headers, allowed origins, dependency scanning, image scanning,
    and SBOM generation are part of CI/CD.

## Recommended Onboarding Path

1. Read `README.md` for service map and local run commands.
2. Read `documentation/docs/architecture/SYSTEM-DESIGN.md` for intended
   architecture.
3. Trace `OrderController.checkout` into `OrderServiceImpl.checkout`.
4. Follow the outbox publisher in Order, Inventory, and Payment.
5. Follow the Kafka listeners for inventory reserved, payment completed, and
   payment failed.
6. Review `SecurityConfig` in Gateway, User, Order, Inventory, and Payment.
7. Run the complete demo and inspect order timeline, logs, traces, and outbox
   tables.
8. Start refactoring only after adding contract tests around the flow being
   touched.

## Production Readiness Checklist

This checklist defines the target bar for production exposure. It should be
used as a gap assessment, not as a statement that all items are already in the
runtime.

| Area | Ready when |
|---|---|
| Events | Envelope, schema versioning, event IDs, contract tests, and compatibility rules exist. |
| Consumers | Inbox idempotency exists for every Kafka listener. |
| Outbox | Batch claims, retry backoff, terminal failure, lag metrics, and replay audit exist. |
| Security | Key rotation, refresh lifecycle, service auth, restricted internals, and TLS/mTLS exist. |
| APIs | Pagination, max limits, typed errors, and ownership checks are consistent. |
| Data | Indexes are validated with realistic volume and query plans. |
| Caching | Cache provider, TTL, max size, and invalidation model match deployment topology. |
| Observability | Dashboards, alerts, trace sampling, log retention, and runbooks are defined. |
| Delivery | CI runs unit, slice, contract, integration, image, and secret/dependency scans. |
| Operations | Backup, restore, incident response, DLT replay, and rollback procedures are documented. |

## Bottom Line

The current architecture is a solid microservices learning platform. The
highest-value next move is not more business features. It is extracting the
repeated platform patterns, formalizing event contracts, adding inbox
idempotency, hardening outbox/replay behavior, and moving security from
local-demo posture to production posture.

Those changes preserve the current functionality while improving scalability,
maintainability, security, and operational confidence.

## Official References

- [Spring Framework reference](https://docs.spring.io/spring-framework/reference/)
- [Google Site Reliability Engineering book](https://sre.google/sre-book/table-of-contents/)
- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)

## Recommended Next

Return to [Shopverse Architecture Audit](./SHOPVERSE-ONBOARDING-ARCHITECTURE-AUDIT.md) to select the next focused guide.
