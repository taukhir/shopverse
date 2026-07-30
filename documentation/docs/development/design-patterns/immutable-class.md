---
title: "Immutable Classes in Java: Rules, Defensive Copies, and Clone Safety"
description: "Design deeply immutable Java classes, protect mutable inputs and outputs, avoid clone leaks, preserve invariants, and choose records, builders, or copy methods safely."
sidebar_label: "Immutable Classes And Defensive Copies"
tags: ["java", "design-patterns", "immutability", "defensive-copy", "interview"]
page_type: Deep Dive
difficulty: Intermediate
status: maintained
last_reviewed: "2026-07-28"
scope: generic
owner: docs-development
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Immutable Classes in Java: Rules, Defensive Copies, and Clone Safety

<DocLabels items={[{label: 'Object construction', tone: 'intermediate'}, {label: 'Java', tone: 'foundation'}, {label: 'Thread-safety foundation', tone: 'production'}]} />

An immutable object cannot have its observable state changed after construction. Immutability
reduces aliasing bugs, makes invariants easier to preserve, enables safe sharing, and often makes
thread safety much easier. It is a design property of the entire reachable state, not merely a
class with `final` fields.

<DocCallout type="tip" title="Immutability is not a GoF pattern">

It is an object-design technique that strengthens Factory, Builder, Prototype, Value Object, and
functional-style designs. This page sits beside creational patterns because construction is where
an immutable object's ownership and invariants must be established.

</DocCallout>

## The Problem: Reference Leaks

This class looks immutable but is not:

```java
public final class OrderSnapshot {
    private final List<String> items;
    private final Date createdAt;

    public OrderSnapshot(List<String> items, Date createdAt) {
        this.items = items;          // input reference escapes into the object
        this.createdAt = createdAt;  // Date is mutable
    }

    public List<String> items() {
        return items;                // internal reference escapes to the caller
    }

    public Date createdAt() {
        return createdAt;
    }
}
```

```java
List<String> source = new ArrayList<>(List.of("book"));
Date time = new Date();
OrderSnapshot snapshot = new OrderSnapshot(source, time);

source.add("phone");                 // changes snapshot through constructor alias
snapshot.items().clear();            // changes snapshot through getter alias
snapshot.createdAt().setTime(0);     // changes nested mutable object
```

`final` prevents a field from pointing at another object. It does not freeze the object already
referenced by that field.

## Rules For A Deeply Immutable Class

| Rule | What it prevents |
|---|---|
| establish all state during construction | partially initialized objects |
| validate every invariant at the constructor boundary | invalid instances from alternate callers |
| expose no mutating methods | direct state changes |
| make fields `private final` | reassignment and uncontrolled access |
| prevent unsafe subclassing with `final` or controlled sealing | a subtype adding mutable behavior or weakening guarantees |
| defensively copy mutable constructor inputs | later caller mutations changing internal state |
| never expose owned mutable state directly | callers mutating the object through getters |
| make reachable element types immutable or copy them deeply | shallow-copy leaks |
| do not publish `this` from the constructor | other threads observing incomplete state |
| avoid `Cloneable` as the copy contract | shallow copies and unclear ownership |

An immutable class may still contain a mutable implementation detail, such as a cached hash, only
when that mutation cannot change externally observable value semantics and is safely synchronized.

## A Correct Immutable Aggregate

```java
public final class PurchaseOrder {
    private final UUID id;
    private final Instant createdAt;
    private final List<LineItem> items;
    private final Map<String, String> attributes;

    public PurchaseOrder(
            UUID id,
            Instant createdAt,
            Collection<LineItem> items,
            Map<String, String> attributes
    ) {
        this.id = Objects.requireNonNull(id, "id");
        this.createdAt = Objects.requireNonNull(createdAt, "createdAt");
        this.items = List.copyOf(Objects.requireNonNull(items, "items"));
        this.attributes = Map.copyOf(
                Objects.requireNonNull(attributes, "attributes")
        );
        if (this.items.isEmpty()) {
            throw new IllegalArgumentException("an order needs at least one item");
        }
    }

    public UUID id() {
        return id;                    // UUID is immutable
    }

    public Instant createdAt() {
        return createdAt;             // Instant is immutable
    }

    public List<LineItem> items() {
        return items;                 // already an unmodifiable snapshot
    }

    public Map<String, String> attributes() {
        return attributes;
    }

    public PurchaseOrder withAttribute(String key, String value) {
        Map<String, String> changed = new HashMap<>(attributes);
        changed.put(key, value);
        return new PurchaseOrder(id, createdAt, items, changed);
    }
}

public record LineItem(String sku, int quantity, BigDecimal unitPrice) {
    public LineItem {
        Objects.requireNonNull(sku, "sku");
        Objects.requireNonNull(unitPrice, "unitPrice");
        if (quantity < 1 || unitPrice.signum() < 0) {
            throw new IllegalArgumentException("invalid line item");
        }
    }
}
```

`UUID`, `Instant`, `String`, `BigDecimal`, and the validated `LineItem` record are immutable values.
`List.copyOf` and `Map.copyOf` take unmodifiable snapshots of the containers. The `with` method
creates a new value rather than changing the existing one.

<CodeWalkthrough
  title="Build an immutable value safely"
  steps={[
    {title: 'Own constructor input', code: 'this.items = List.copyOf(items);', explanation: 'The object stores an unmodifiable snapshot of the caller collection, so later structural changes to the source list cannot change this value.'},
    {title: 'Validate once', code: 'if (this.items.isEmpty()) {\n    throw new IllegalArgumentException("items required");\n}', explanation: 'The constructor is the invariant boundary. Every factory, builder, and deserializer must ultimately pass through equivalent validation.'},
    {title: 'Return a new value', code: 'return new PurchaseOrder(id, createdAt, items, changed);', explanation: 'A with-method creates a new instance and preserves the original. Unchanged immutable components may be shared safely.'},
  ]}
/>

<ExpandableAnswer title="Code explanation: where immutability is enforced">

1. The class is `final`, so a subtype cannot add a setter while still being passed as a
   `PurchaseOrder`.
2. The constructor is the only state-entry boundary and validates required and cross-field rules.
3. Immutable values are safely shared; mutable collection containers are copied on input.
4. Accessors return immutable values or the unmodifiable snapshots owned by the object.
5. `withAttribute` copies into temporary mutable construction state, then the constructor freezes
   the new snapshot. The original order remains unchanged.

</ExpandableAnswer>

<ExpandableAnswer title="Dry run: attempts to mutate an immutable order">

```java
List<LineItem> source = new ArrayList<>();
source.add(new LineItem("BOOK", 1, new BigDecimal("20.00")));

PurchaseOrder original = new PurchaseOrder(
        UUID.randomUUID(), Instant.now(), source, Map.of("channel", "WEB")
);
source.clear();
```

The constructor already copied `source`, so `original.items()` still contains `BOOK`.

```java
original.items().clear();
```

The returned list is unmodifiable, so this throws `UnsupportedOperationException` rather than
changing the order.

```java
PurchaseOrder changed = original.withAttribute("priority", "HIGH");
```

`changed` contains both attributes; `original` still contains only `channel=WEB`. Identity differs,
but all unchanged immutable values may be shared safely.

</ExpandableAnswer>

## Shallow Versus Deep Immutability

`List.copyOf` copies the container, not its elements:

```java
final class MutableItem {
    private int quantity;
    int quantity() { return quantity; }
    void quantity(int value) { quantity = value; }
}

List<MutableItem> frozenList = List.copyOf(mutableItems);
mutableItems.get(0).quantity(99); // visible through frozenList
```

Choose one explicit ownership strategy:

1. require immutable element types at the API boundary;
2. map mutable inputs into immutable domain values;
3. deep-copy every owned mutable child;
4. share a mutable collaborator only when it is intentionally outside the object's value state.

Deep copying arbitrary object graphs is expensive and ambiguous around cycles, identities, file
handles, database sessions, and shared services. Clear aggregate boundaries are more valuable than
a generic reflection-based copier.

## Defensive Copy Recipes

| Mutable input | Copy on construction | Safe return |
|---|---|---|
| `List`, `Set`, `Map` of immutable elements | `List.copyOf`, `Set.copyOf`, `Map.copyOf` | return the stored unmodifiable snapshot |
| array | `input.clone()` or `Arrays.copyOf` | return another clone/copy |
| legacy `Date` | convert with `date.toInstant()` or `new Date(date.getTime())` | prefer `Instant`; otherwise return a new `Date` |
| mutable child object | explicit copy constructor or immutable mapping | return immutable view/value or a new copy |
| `ByteBuffer` | copy remaining bytes into owned storage | return a read-only buffer over isolated storage or a fresh copy |

`Collections.unmodifiableList(source)` is only a read-only view. Mutating `source` still changes what
the view exposes. `List.copyOf(source)` takes a snapshot, but still does not copy mutable elements.

## Records Are Only Shallowly Immutable

A record makes component fields final and supplies accessors, but it does not copy components:

```java
public record Shipment(List<String> trackingEvents) {
    public Shipment {
        trackingEvents = List.copyOf(trackingEvents);
    }
}
```

The compact constructor reassigns the parameter that becomes the field. Without that copy, the
record would expose the caller's mutable list directly.

## Builders Without Mutability Leaks

A builder is intentionally mutable; its product need not be. Copy mutable values when they enter
the builder and again when the product is constructed if a builder can be reused:

```java
public Builder tags(Collection<String> tags) {
    this.tags = new ArrayList<>(tags);
    return this;
}

public Product build() {
    return new Product(name, List.copyOf(tags));
}
```

Required values should enter the builder factory or constructor. The immutable product constructor
must still validate invariants because reflection, deserialization, generated code, or future APIs
may bypass the builder.

## Clone: What To Avoid And How To Prevent It

`Object.clone()` performs a field-by-field shallow copy. `Cloneable` is only a marker and does not
declare a public `clone` method. Constructors are not used for the copied object's initialization,
and mutable references remain shared unless repaired manually.

Prefer, in order:

- returning the same instance for a truly immutable value;
- a copy constructor when ownership rules need to be explicit;
- a named `copy()` method;
- `withX` methods for one or two changes;
- `toBuilder()` when many fields may change.

To prevent unsupported cloning:

1. do not implement `Cloneable`;
2. do not expose a public `clone` method;
3. make the class `final` so a subtype cannot introduce a misleading clone contract;
4. if a clone-capable superclass forces the issue, override `clone` as `final` and throw
   `CloneNotSupportedException` where the superclass contract permits it.

```java
@Override
protected final Object clone() throws CloneNotSupportedException {
    throw new CloneNotSupportedException("PurchaseOrder is immutable; share it safely");
}
```

Do not add this override to every normal class: inheriting `Object.clone()` without implementing
`Cloneable` already rejects cloning. The override is useful only when an inherited API has exposed
or enabled cloning.

<DocCallout type="mistake" title="Serialization is not a deep-copy design">

Java serialization or JSON round-tripping is slow, may omit transient state, can change runtime
types, couples copying to a transport format, and can bypass normal construction paths. Use an
explicit domain copy contract instead.

</DocCallout>

## Inheritance, Reflection, Serialization, And Frameworks

- `final` is the clearest way to preserve a class-level immutability promise. A sealed hierarchy
  works only when every permitted subtype preserves the same rules.
- Reflection and low-level facilities can violate ordinary access rules; strong module boundaries
  and avoiding unsafe libraries reduce this risk. Immutability promises normally cover supported
  application APIs, not arbitrary memory corruption.
- Deserialization frameworks may use reflection or generated constructors. Keep validation in a
  canonical constructor and test the actual serialization path.
- JPA entities are lifecycle-managed, proxyable, and normally mutable. Use immutable value objects
  inside an aggregate and map persistence state deliberately instead of forcing every entity into
  an immutable shape.
- Lazy-loaded collections and proxies are not immutable snapshots. Do not expose them as domain
  values outside the persistence boundary.

## Thread Safety And Safe Publication

Properly constructed immutable objects can be shared without locking because their state never
changes and Java's final-field semantics help other threads observe initialized values. This does
not make operations around multiple objects atomic, and it does not make a referenced mutable
service safe. Never publish `this` from a constructor through callbacks, static collections, event
registration, or starting a thread.

## Implementation Choices And Trade-Offs

| Approach | Strength | Drawback | Use when |
|---|---|---|---|
| final class | full API and validation control | manual equality/accessors | rich domain value or aggregate snapshot |
| record | compact value semantics | shallow immutability; fixed representation | transparent data carrier with validated components |
| builder plus immutable product | readable many-field construction | boilerplate and reusable-builder risks | many optional fields or staged assembly |
| copy constructor | explicit ownership semantics | must evolve with every field | mutable input or Prototype-style copy |
| `with` methods | clear persistent updates | many methods for wide variation | a few common field changes |
| persistent collections | efficient structural sharing | extra library and unfamiliar model | large values with frequent immutable updates |

## Tests That Prove Immutability

```java
@Test
void constructorAndAccessorsDoNotLeakCollections() {
    List<LineItem> source = new ArrayList<>(List.of(item("BOOK")));
    PurchaseOrder order = orderFrom(source);

    source.clear();
    assertThat(order.items()).hasSize(1);
    assertThatThrownBy(() -> order.items().clear())
            .isInstanceOf(UnsupportedOperationException.class);
}

@Test
void withMethodLeavesOriginalUnchanged() {
    PurchaseOrder original = order();
    PurchaseOrder changed = original.withAttribute("priority", "HIGH");

    assertThat(original.attributes()).doesNotContainKey("priority");
    assertThat(changed.attributes()).containsEntry("priority", "HIGH");
}
```

Also test nulls, invalid combinations, mutable nested elements, array/date accessors, builder reuse,
serialization round trips, equality/hash stability, and concurrent reads when the value crosses
threads.

## Drawbacks And Solutions

| Drawback | Practical response |
|---|---|
| copies allocate memory | measure; use immutable sharing or persistent collections for proven hot paths |
| many-field changes are verbose | use a safe builder or focused transformation function |
| deep copies are expensive | make nested values immutable and clarify ownership boundaries |
| framework expects setters/proxies | isolate framework entities/DTOs and map to immutable domain values |
| cyclic graphs are awkward | model identities and relationships instead of embedding the whole graph |
| caches appear to violate immutability | keep cache state observationally invisible and thread-safe |

## Interview Questions

<ExpandableAnswer title="Is a class immutable when every field is final?">

No. `final` prevents field reassignment, but a referenced list, array, date, buffer, or child object
may still mutate. Immutability requires protecting the complete observable state with immutable
children or defensive copies at input and output boundaries.

</ExpandableAnswer>

<ExpandableAnswer title="List.copyOf versus Collections.unmodifiableList?">

`List.copyOf` creates an unmodifiable snapshot of the source container. `unmodifiableList` creates
a read-only view backed by the original list, so mutations through another alias remain visible.
Neither operation deep-copies mutable elements.

</ExpandableAnswer>

<ExpandableAnswer title="Why is Cloneable usually avoided?">

It is a marker rather than a useful copy interface; `Object.clone()` is shallow, bypasses normal
constructor initialization for the new object, and leaves nested ownership unclear. Explicit copy
constructors, named copy methods, immutable sharing, or builders communicate the contract better.

</ExpandableAnswer>

<ExpandableAnswer title="Are Java records immutable?">

They are shallowly immutable because their component fields are final. If a component is a mutable
list, array, date, or object, callers can still change observable state unless the canonical or
compact constructor makes an appropriate defensive copy.

</ExpandableAnswer>

<ExpandableAnswer title="Why are immutable objects useful in concurrent code?">

They remove write/write and read/write races on their own state and can normally be safely shared
after correct construction. They do not make a multi-object workflow atomic or repair thread-unsafe
mutable collaborators referenced elsewhere.

</ExpandableAnswer>

## Related Patterns

- [Builder](./builder.md) separates mutable assembly from an immutable product.
- [Prototype](./prototype.md) requires explicit shallow/deep copy semantics.
- [Factory Method](./factory.md) can hide validation and select an immutable implementation.
- [Singleton](./singleton.md) controls sharing; immutability can make shared singleton state safer.

## Official References

- [Java `Object.clone`](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Object.html#clone())
- [Java `List.copyOf`](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/List.html#copyOf(java.util.Collection))
- [Java `Collections.unmodifiableList`](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Collections.html#unmodifiableList(java.util.List))
- [Java records specification](https://docs.oracle.com/javase/specs/jls/se25/html/jls-8.html#jls-8.10)
- [Java final-field semantics](https://docs.oracle.com/javase/specs/jls/se25/html/jls-17.html#jls-17.5)

## Recommended Next

Continue with [Builder](./builder.md) for controlled construction and
[Prototype](./prototype.md) for explicit copy semantics.
