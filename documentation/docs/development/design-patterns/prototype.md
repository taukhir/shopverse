---
title: "Prototype Pattern in Java"
description: "Copy configured templates safely with explicit deep-copy semantics, immutable variants, and Spring prototype-scope guidance."
sidebar_label: "Prototype"
tags: ["java", "spring", "design-patterns", "creational", "interview"]
page_type: "Deep Dive"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-24"
---

# Prototype Pattern in Java

<DocLabels items={[{label: 'GoF creational', tone: 'advanced'}, {label: 'Copy semantics', tone: 'foundation'}, {label: 'Mutability risk', tone: 'production'}]} />

Prototype creates an object by copying an existing, configured instance. It is
useful when setup is expensive or when many objects share a rich baseline but
need small independent variations.

## The Problem

Suppose Shopverse prepares notification campaigns from a template:

```java
Campaign campaign = new Campaign();
campaign.setSender("orders@shopverse.io");
campaign.setSubject("Your order is ready");
campaign.setHeaders(defaultHeaders());
campaign.setRecipients(new ArrayList<>());
```

Repeating that setup scatters defaults. Copying references is worse:

```java
Campaign copy = original;
copy.getRecipients().add("ana@example.com");
```

There is still only one object, so modifying `copy` modifies `original`.

## The Critical Question: What Does Copy Mean?

Prototype is safe only when the copy contract is explicit:

| State | Typical copy rule |
|---|---|
| immutable value (`String`, `Instant`, value record) | sharing is safe |
| mutable owned collection | create a new collection |
| mutable owned child object | deep-copy it |
| shared service/client | keep the same reference |
| database identity/version | usually clear or generate new identity |
| secret or transient runtime state | intentionally omit it |

## Implementation 1: Explicit Copy Constructor

```java
public final class Campaign {
    private final String sender;
    private final String subject;
    private final Map<String, String> headers;
    private final List<String> recipients;

    public Campaign(
            String sender,
            String subject,
            Map<String, String> headers,
            List<String> recipients
    ) {
        this.sender = Objects.requireNonNull(sender);
        this.subject = Objects.requireNonNull(subject);
        this.headers = new HashMap<>(headers);
        this.recipients = new ArrayList<>(recipients);
    }

    public Campaign(Campaign source) {
        this(source.sender, source.subject, source.headers, source.recipients);
    }

    public Campaign copy() {
        return new Campaign(this);
    }

    public void addRecipient(String email) {
        recipients.add(email);
    }
}
```

The copy constructor documents exactly which state is shared or duplicated. It
also works for final classes and does not rely on JVM cloning rules.

### Drawbacks And Remedies

When a field is added, the copy constructor must be updated. Nested mutable
graphs can make manual deep copying verbose and expensive. Keep aggregate
ownership boundaries clear, favor immutable children, and add a test that
changes every owned mutable part of a copy and verifies the source is unchanged.

## Implementation 2: Immutable Prototype With `with` Methods

Immutable records make sharing safe and variations explicit:

```java
public record NotificationTemplate(
        String sender,
        String subject,
        String body,
        Map<String, String> headers
) {
    public NotificationTemplate {
        headers = Map.copyOf(headers);
    }

    public NotificationTemplate withSubject(String newSubject) {
        return new NotificationTemplate(sender, newSubject, body, headers);
    }

    public NotificationTemplate withBody(String newBody) {
        return new NotificationTemplate(sender, subject, newBody, headers);
    }
}
```

```java
NotificationTemplate delayed =
        orderReadyTemplate.withSubject("Your order is delayed");
```

This is usually the safest Java interpretation of Prototype: reuse immutable
baseline state and return a new value for every variation.

### Drawbacks And Remedies

Many variations can create many `with` methods. Use a [Builder](./builder.md)
for broad multi-field variation. Measure before optimizing allocations; clarity
and isolation usually matter more.

## Implementation 3: Polymorphic `copy`

When different prototype subtypes must preserve their runtime type:

```java
public sealed interface PromotionRule
        permits PercentageRule, FixedAmountRule {
    PromotionRule copy();
}

public record PercentageRule(BigDecimal percentage)
        implements PromotionRule {
    @Override
    public PercentageRule copy() {
        return new PercentageRule(percentage);
    }
}
```

This keeps the operation polymorphic without exposing concrete constructors to
the caller.

## Why `Cloneable` Is Usually A Poor Choice

`Object.clone()` performs a field-by-field shallow copy, uses a marker interface
with no public `clone` method, and bypasses constructors. Mutable references are
shared unless every nested field is copied manually. Prefer a copy constructor,
named `copy` method, immutable value, or builder.

Likewise, copying by Java serialization or JSON round-tripping is slow, can
silently lose type information, and turns a domain operation into a transport
hack.

## Prototype Pattern Versus Spring `prototype` Scope

They are different ideas:

- GoF Prototype creates an object by **copying an existing object**.
- Spring prototype scope asks the container to **create a new bean instance on
  each lookup or injection request**.

```java
@Bean
@Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
ExportSession exportSession() {
    return new ExportSession();
}
```

Spring does not copy an existing `ExportSession`, and it does not manage the
complete destruction lifecycle of prototype-scoped beans. A singleton that
needs fresh instances must request them explicitly, for example through
`ObjectProvider<ExportSession>`.

## When Not To Use It

Avoid Prototype when:

- construction is cheap and a constructor is clearer;
- the object graph has unclear ownership or cycles;
- the object represents persisted identity that must not be duplicated;
- copies would share mutable state that cannot be isolated safely;
- a factory can describe the required variation more clearly.

## Testing Copy Independence

```java
@Test
void copyOwnsItsMutableRecipients() {
    Campaign original = campaignTemplate();
    Campaign copy = original.copy();

    copy.addRecipient("ana@example.com");

    assertThat(copy.recipients()).contains("ana@example.com");
    assertThat(original.recipients()).isEmpty();
}
```

Test equality expectations, identity regeneration, nested collection
independence, omitted transient state, and subtype preservation.

## Interview-Ready Answer

> Prototype creates a new object from an existing configured instance. The hard
> part is defining copy semantics, especially for mutable children and identity.
> In Java I prefer immutable values with `with` methods or explicit copy
> constructors over `Cloneable`. Spring prototype scope is different: it creates
> a new bean per request to the container rather than copying an object.

## Related Patterns

- [Builder](./builder.md) is clearer when many fields vary at once.
- [Factory Method](./factory.md) constructs from inputs rather than copying a
  configured instance.
- [Singleton](./singleton.md) has the opposite lifecycle intent: controlled
  sharing rather than independent copies.

## Official References

- [Java `Object.clone` API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Object.html#clone())
- [Spring prototype scope](https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html#beans-factory-scopes-prototype)
