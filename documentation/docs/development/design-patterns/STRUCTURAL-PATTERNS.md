---
title: Structural Patterns
---

# Structural Patterns

Structural patterns solve composition problems: how classes, interfaces, and
objects fit together without forcing callers to understand every internal
detail.

Use structural patterns when integration boundaries, wrappers, compatibility
layers, or simplified APIs make the system easier to evolve.

## Adapter

Adapter converts one interface into another.

### Problem

Your domain expects this:

```java
public interface PaymentProvider {
    PaymentResult charge(PaymentCommand command);
}
```

But a third-party SDK exposes this:

```java
class LegacyBankClient {
    LegacyBankResponse makePayment(String merchantId, long paise) {
        // external SDK
    }
}
```

If domain code calls `LegacyBankClient` directly, the third-party model leaks
everywhere.

### Adapter Solution

```java
public final class LegacyBankPaymentAdapter implements PaymentProvider {

    private final LegacyBankClient client;
    private final String merchantId;

    public LegacyBankPaymentAdapter(LegacyBankClient client, String merchantId) {
        this.client = client;
        this.merchantId = merchantId;
    }

    public PaymentResult charge(PaymentCommand command) {
        LegacyBankResponse response = client.makePayment(
                merchantId,
                command.amountInPaise()
        );
        return map(response);
    }

    private PaymentResult map(LegacyBankResponse response) {
        return response.success()
                ? PaymentResult.authorized(response.reference())
                : PaymentResult.declined(response.reason());
    }
}
```

### When To Use

- third-party API does not match your domain contract;
- old code must work with new code;
- you want to isolate external DTOs;
- you need a stable interface over an unstable vendor SDK.

## Decorator

Decorator wraps an object to add behavior while preserving the same interface.

### Example: Metrics Around A Payment Provider

```java
public final class MetricsPaymentProvider implements PaymentProvider {

    private final PaymentProvider delegate;
    private final MeterRegistry meterRegistry;

    public MetricsPaymentProvider(
            PaymentProvider delegate,
            MeterRegistry meterRegistry
    ) {
        this.delegate = delegate;
        this.meterRegistry = meterRegistry;
    }

    public PaymentResult charge(PaymentCommand command) {
        Timer.Sample sample = Timer.start(meterRegistry);
        try {
            PaymentResult result = delegate.charge(command);
            meterRegistry.counter("payment.requests", "result", result.status()).increment();
            return result;
        } finally {
            sample.stop(meterRegistry.timer("payment.duration"));
        }
    }
}
```

### Common Decorators

- logging decorator;
- metrics decorator;
- retry decorator;
- tracing decorator;
- caching decorator;
- validation decorator.

Spring AOP often creates decorator-like behavior through proxies.

## Facade

Facade exposes a simpler API over multiple internal services.

### Problem

A controller should not orchestrate too many details:

```java
orderService.create();
inventoryService.reserve();
paymentService.authorize();
timelineService.record();
notificationService.send();
```

That makes the controller business-heavy.

### Facade Solution

```java
@Service
public class CheckoutFacade {

    private final OrderService orderService;
    private final InventoryService inventoryService;
    private final PaymentService paymentService;

    public CheckoutResponse checkout(CheckoutRequest request) {
        Order order = orderService.create(request);
        inventoryService.reserve(order);
        Payment payment = paymentService.authorize(order);
        return CheckoutResponse.from(order, payment);
    }
}
```

The controller calls one use case:

```java
@PostMapping("/checkout")
public CheckoutResponse checkout(@RequestBody CheckoutRequest request) {
    return checkoutFacade.checkout(request);
}
```

In microservices, be careful: a facade should not become a distributed
transaction coordinator unless that is intentionally the architecture.

## Proxy

Proxy controls access to another object.

### Spring Examples

Spring uses proxies for many features:

```java
@Transactional
public void reserveInventory(...) {
}
```

Spring calls the method through a proxy. The proxy opens the transaction,
invokes the target method, commits on success, and rolls back on configured
failures.

Other proxy examples:

- `@PreAuthorize` method security;
- `@Cacheable`;
- `@Async`;
- Feign client interfaces;
- Hibernate lazy-loading proxies.

### Important Proxy Limitation

Self-invocation does not pass through the Spring proxy:

```java
class OrderService {
    public void outer() {
        inner(); // does not go through proxy
    }

    @Transactional
    public void inner() {
    }
}
```

The annotation on `inner` may not apply when called from the same instance.
Move the method to another bean or call through the proxy intentionally.

## Composite

Composite lets callers treat individual objects and groups uniformly.

### Example: Product Bundles

```java
public interface Priceable {
    BigDecimal price();
}

public record ProductItem(String sku, BigDecimal price) implements Priceable {
}

public record ProductBundle(List<Priceable> items) implements Priceable {
    public BigDecimal price() {
        return items.stream()
                .map(Priceable::price)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
```

Now a bundle can contain products or other bundles.

Use Composite for:

- file/folder trees;
- product bundles;
- menu trees;
- rule groups;
- organization hierarchies.

## Bridge

Bridge separates abstraction from implementation so both can vary
independently.

```java
interface NotificationSender {
    void send(String destination, String message);
}

class EmailSender implements NotificationSender {
}

class SmsSender implements NotificationSender {
}

abstract class Notification {
    protected final NotificationSender sender;

    protected Notification(NotificationSender sender) {
        this.sender = sender;
    }

    abstract void notifyUser(String user, String message);
}
```

Use Bridge when you have two dimensions of variation, such as notification type
and delivery channel.

## Pattern Selection

| Problem | Pattern |
|---|---|
| make vendor SDK fit your domain | Adapter |
| add logging/metrics/retry around same contract | Decorator |
| simplify many collaborators behind one use case | Facade |
| add access control/lifecycle behavior | Proxy |
| model tree/group and leaf uniformly | Composite |
| separate two independent variation dimensions | Bridge |

## Interview Questions

### Adapter Versus Facade?

Adapter changes an interface so incompatible code can work together. Facade
simplifies a subsystem behind a higher-level API.

### Decorator Versus Proxy?

Decorator adds behavior while keeping the same interface. Proxy controls access
or lifecycle. In practice they can look similar; intent is the difference.

### Why Does Spring Use Proxies?

Proxies allow Spring to add cross-cutting behavior such as transactions,
security, caching, async execution, and metrics without hardcoding that logic
inside business methods.
