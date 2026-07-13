---
title: Java Enums
---

# Java Enums

Enums model a fixed set of named constants with type safety.

```java
enum PaymentStatus {
    PENDING,
    AUTHORIZED,
    CAPTURED,
    DECLINED,
    REFUNDED
}
```

Use enums for finite domain states such as order status, payment status,
roles, event types, and workflow steps.

## Enum With Fields And Methods

```java
enum PaymentMethod {
    CARD(true),
    UPI(true),
    CASH_ON_DELIVERY(false);

    private final boolean online;

    PaymentMethod(boolean online) {
        this.online = online;
    }

    boolean isOnline() {
        return online;
    }
}
```

## Enum In Switch

```java
String label = switch (status) {
    case PENDING -> "Waiting";
    case AUTHORIZED, CAPTURED -> "Successful";
    case DECLINED, REFUNDED -> "Closed";
};
```

## Persistence Note

In JPA, prefer string storage:

```java
@Enumerated(EnumType.STRING)
private PaymentStatus status;
```

Avoid `EnumType.ORDINAL` for long-lived databases because reordering enum
constants changes stored meaning.

## Interview Questions

<ExpandableAnswer title="Can an enum implement an interface?">

Yes. Each enum constant can use the shared implementation or provide its own method body.

</ExpandableAnswer>

<ExpandableAnswer title="Can an enum extend a class?">

No. Every enum implicitly extends `java.lang.Enum`, so Java's single-inheritance rule prevents another superclass.

</ExpandableAnswer>

<ExpandableAnswer title="Why should ordinal persistence be avoided?">

Reordering or inserting enum constants changes their numeric positions and can silently change the meaning of existing database values.

</ExpandableAnswer>

## Official References

- [JLS enum classes](https://docs.oracle.com/javase/specs/jls/se25/html/jls-8.html#jls-8.9)
- [`EnumMap`](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/EnumMap.html)
