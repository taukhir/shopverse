---
title: "Quarkus Messaging, Security, And Observability"
description: "Advanced tutorial for REST clients, timeouts and fault tolerance, Kafka messaging, OIDC authorization, health, metrics, logs, traces, and duplicate-safe processing."
sidebar_label: "4. Integration And Security"
tags: ["quarkus", "kafka", "oidc", "observability"]
page_type: Tutorial
difficulty: Advanced
status: maintained
prerequisites: [Quarkus data and transactions, distributed systems fundamentals]
learning_objectives: [Call dependencies with bounded failure behavior, Publish and consume Kafka records safely, Enforce resource authorization, Correlate production evidence]
technologies: [Quarkus REST Client, Kafka, OpenID Connect, OpenTelemetry, SmallRye Health, Micrometer]
last_reviewed: "2026-08-11"
scope: generic
owner: docs-java
reviewer: documentation-maintainers
review_evidence: official-documentation-review
---

# Quarkus Messaging, Security, And Observability

Distributed checkout correctness depends on deadlines, idempotency, durable
state, authorization, and recovery. Framework integrations provide mechanisms;
the application still defines their business semantics.

## 1. Typed REST Client

```java
package example.checkout.inventory;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

@Path("/internal/reservations")
@RegisterRestClient(configKey = "inventory-api")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public interface InventoryClient {

    @POST
    ReservationResponse reserve(ReservationRequest request);
}
```

```java
@ApplicationScoped
public class InventoryGateway {

    private final InventoryClient client;

    public InventoryGateway(
            @RestClient InventoryClient client) {
        this.client = client;
    }
}
```

```properties
quarkus.rest-client.inventory-api.url=http://inventory-service:8080
quarkus.rest-client.inventory-api.connect-timeout=500
quarkus.rest-client.inventory-api.read-timeout=1500
```

Use the exact configuration keys supported by the committed Quarkus platform.
Propagate authentication only where the trust model requires it, and propagate a
safe correlation or trace context without forwarding unrelated credentials.

## 2. Deadline And Resilience Policy

Timeouts must fit inside an overall request deadline. Retries multiply traffic
and are safe only when the remote operation is idempotent or protected by a
stable command key.

MicroProfile Fault Tolerance annotations can express bounded policies:

```java
@ApplicationScoped
public class PricingGateway {

    @Retry(maxRetries = 2, delay = 50)
    @Timeout(1000)
    @CircuitBreaker(requestVolumeThreshold = 20, failureRatio = 0.5)
    public PriceQuote quote(PriceRequest request) {
        return client.quote(request);
    }
}
```

Treat these values as examples, not production defaults. Verify:

- which exceptions and status codes are retryable;
- whether attempts reuse the same idempotency key;
- maximum total attempts across gateway, service, client, mesh, and SDK;
- timeout ordering and cancellation behavior;
- circuit-breaker scope and fallback correctness;
- retry and breaker metrics with low-cardinality labels.

Do not return a fabricated checkout success from a fallback. A fallback must be a
business-valid degraded outcome, such as a cached read or explicit temporary
unavailability.

## 3. Publish Kafka Records

Current Quarkus guides use the `quarkus-messaging-kafka` extension with SmallRye
Reactive Messaging concepts: messages, channels, and connectors.

```java
package example.checkout.messaging;

import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.reactive.messaging.Channel;
import org.eclipse.microprofile.reactive.messaging.Emitter;

@ApplicationScoped
public class OrderEventEmitter {

    @Channel("orders-out")
    Emitter<OrderCreated> emitter;

    public void send(OrderCreated event) {
        emitter.send(event);
    }
}
```

```properties
mp.messaging.outgoing.orders-out.connector=smallrye-kafka
mp.messaging.outgoing.orders-out.topic=orders.created.v1
mp.messaging.outgoing.orders-out.value.serializer=example.checkout.messaging.OrderCreatedSerializer
```

Calling `send` after a database commit can still lose the event if the process
fails between the two actions. Use a transactional outbox or another approved
durable publication pattern when domain state and event intent must remain
atomic.

Use a stable aggregate identifier as the Kafka key when per-order ordering is
required. Global ordering is rarely required and limits scale.

## 4. Consume At Least Once

```java
package example.checkout.messaging;

import io.smallrye.common.annotation.Blocking;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.reactive.messaging.Incoming;

@ApplicationScoped
public class PaymentOutcomeConsumer {

    @Incoming("payment-outcomes")
    @Blocking
    @Transactional
    public void consume(PaymentOutcome event) {
        // Claim event ID in an inbox or deduplication store.
        // Apply a legal idempotent order transition.
        // Persist any new outbox intent in the same transaction.
    }
}
```

Reactive Messaging may invoke handlers on an I/O thread. Blocking database work
must use the supported blocking execution model. A transactional handler is
treated as blocking, but an explicit team convention improves reviewability.

Consumer design must cover:

- duplicate records and concurrent duplicates;
- unknown event versions or types;
- deserialization failures;
- poison messages and dead-letter policy;
- commit strategy and restart behavior;
- partition ordering and concurrency;
- rebalance behavior;
- retry delay and downstream overload;
- replay from an earlier offset;
- schema compatibility across every producer and consumer.

Do not enable Kafka auto-commit casually. Official Quarkus documentation warns
that asynchronous processing with auto-commit can commit records that have not
completed, weakening at-least-once behavior.

## 5. OIDC Authentication

For a bearer-token API, the OIDC extension validates tokens using the configured
identity provider:

```properties
quarkus.oidc.auth-server-url=${OIDC_AUTH_SERVER_URL}
quarkus.oidc.client-id=checkout-service
quarkus.oidc.application-type=service
```

```java
@Path("/api/orders")
@Authenticated
public class OrderResource {

    @GET
    @Path("/{orderId}")
    public OrderResponse find(@PathParam("orderId") String orderId) {
        return orderQueries.findOwnedOrder(orderId);
    }
}
```

Authentication establishes a principal. The service must still enforce object
ownership and domain authorization:

```java
OrderEntity order = repository.findByIdOptional(orderId)
        .orElseThrow(NotFoundException::new);

if (!order.ownerSubject.equals(identity.getPrincipal().getName())) {
    throw new ForbiddenException();
}
```

Never trust a client-provided `accountId`, `profileId`, role, sponsor, or order
owner without server-side authorization against the authenticated subject and
market context.

Security tests need missing token, expired token, wrong audience or issuer,
insufficient role, other-owner identifier, disabled account/profile, and safe
error-response cases.

## 6. Health, Metrics, Logs, And Traces

Use each signal for its intended question:

| Signal | Question | Checkout examples |
|---|---|---|
| liveness | should the process be restarted? | unrecoverable internal failure, not a temporary downstream outage |
| readiness | should this instance receive traffic? | startup incomplete or local capacity unavailable |
| metric | is behavior changing at scale? | checkout outcome count, duration, queue lag, pool saturation |
| structured log | what discrete event occurred? | transition rejected, outbox retry, reconciliation decision |
| trace | where did request time and failure propagate? | gateway to checkout to pricing/payment and messaging |

Avoid making readiness depend directly on every downstream ping; a shared outage
can remove all instances and prevent degraded behavior or recovery. Define health
from the service's ability to provide its promised outcome.

### Metric dimensions

Good low-cardinality labels include operation, bounded outcome, dependency, and
market code when governance allows it. Never use order ID, cart ID, account ID,
profile ID, email, token, correlation ID, or error message as a metric label.

### Correlation

Trace context should flow through HTTP and supported messaging instrumentation.
A separate business correlation ID can help support workflows, but validate and
bound incoming values. Log only identifiers approved for that purpose and do not
place personal or payment data in baggage.

### Sensitive-data rules

Redact authorization headers, cookies, payment tokens, addresses, contact data,
full account/profile payloads, and secret configuration. Review exception and
HTTP-client logging, which can leak bodies even when application logs are safe.

## 7. Production Failure Drill

For a payment-outcome consumer:

1. Process one event successfully and capture order state, inbox row, outbox row,
   offset, log, metric, and trace evidence.
2. Deliver the same event again and prove no duplicate business transition.
3. Fail after database commit but before acknowledgement and restart the service.
4. Confirm redelivery resolves to the existing effect.
5. Deliver a malformed record and verify retry/DLT behavior without blocking the
   partition indefinitely.
6. Replay a bounded time range and verify audit evidence and capacity controls.

## Official References

- [Quarkus REST Client](https://quarkus.io/guides/rest-client)
- [SmallRye Fault Tolerance](https://quarkus.io/guides/smallrye-fault-tolerance)
- [Apache Kafka Reference](https://quarkus.io/guides/kafka)
- [OIDC Bearer Token Authentication](https://quarkus.io/guides/security-oidc-bearer-token-authentication)
- [SmallRye Health](https://quarkus.io/guides/smallrye-health)
- [OpenTelemetry](https://quarkus.io/guides/opentelemetry)
- [Micrometer Metrics](https://quarkus.io/guides/telemetry-micrometer)

## Next

Continue with [Native Images, Containers, And Kubernetes](./QUARKUS-NATIVE-KUBERNETES-PRODUCTION.md).

