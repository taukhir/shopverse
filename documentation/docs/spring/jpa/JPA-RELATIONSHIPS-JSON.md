---
title: JPA Relationships And JSON Serialization
---

# JPA Relationships And JSON Serialization

Relationship ownership, Jackson relationship annotations, cascades, orphan removal, and fetch-plan basics.

Back to [Spring Data JPA](../SPRING-DATA-JPA.md).

## Relationship Ownership

JPA relationships describe object navigation and foreign-key ownership. They
must reflect actual query and lifecycle requirements rather than connecting
every related table.

### One-To-One

```java
@Entity
class UserEntity {

    @OneToOne(
            mappedBy = "user",
            fetch = FetchType.LAZY,
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private UserProfileEntity profile;
}
```

```java
@Entity
class UserProfileEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            unique = true,
            foreignKey = @ForeignKey(name = "fk_profile_user")
    )
    private UserEntity user;
}
```

The side containing `@JoinColumn` owns the relationship. Typical SQL:

```sql
select u.id, u.username
from users u
where u.id = ?;

select p.id, p.user_id, p.display_name
from user_profiles p
where p.user_id = ?;
```

Accessing a lazy profile can trigger the second query. A fetch join or
projection can load both intentionally.

### Many-To-One

Many order items normally reference one order:

```java
@ManyToOne(fetch = FetchType.LAZY, optional = false)
@JoinColumn(
        name = "order_id",
        nullable = false,
        foreignKey = @ForeignKey(name = "fk_order_item_order")
)
private OrderEntity order;
```

Typical insert:

```sql
insert into order_items
    (order_id, product_id, quantity, unit_price)
values (?, ?, ?, ?);
```

Always specify `LAZY` for `@ManyToOne` and `@OneToOne` when immediate loading is
not required. Their JPA default is `EAGER`.

### One-To-Many

```java
@OneToMany(
        mappedBy = "order",
        cascade = CascadeType.ALL,
        orphanRemoval = true
)
@OrderColumn(name = "line_position")
private final List<OrderItemEntity> items = new ArrayList<>();
```

Maintain both sides:

```java
public void addItem(OrderItemEntity item) {
    items.add(item);
    item.assignTo(this);
}

public void removeItem(OrderItemEntity item) {
    items.remove(item);
    item.assignTo(null);
}
```

Loading one order and then accessing items usually produces:

```sql
select o.*
from orders o
where o.id = ?;

select i.*
from order_items i
where i.order_id = ?
order by i.line_position;
```

That is acceptable for one aggregate. It becomes N+1 when repeated across many
orders.

Avoid an unidirectional `@OneToMany` with a join column unless its generated
write behavior is understood. A child-owned `@ManyToOne` plus parent
`mappedBy` is usually clearer and more efficient.

### Many-To-Many

```java
@ManyToMany
@JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
)
private Set<RoleEntity> roles = new HashSet<>();
```

Typical load:

```sql
select r.*
from roles r
join user_roles ur on ur.role_id = r.id
where ur.user_id = ?;
```

Use a direct many-to-many only when the join has no business attributes. If it
needs `assignedAt`, `assignedBy`, status, or audit data, map the join table as
its own entity such as `UserRoleEntity`.


## Jackson And Entity Relationships

JPA models object graphs, while Jackson serializes object graphs. Returning a
bidirectional entity relationship directly from a controller can cause:

- infinite JSON recursion;
- unexpected lazy-loading queries;
- `LazyInitializationException` after the transaction closes;
- oversized responses;
- accidental exposure of passwords, audit fields, or internal identifiers;
- unsafe deserialization that mutates relationships clients should not own.

The preferred API design is to map entities to explicit response DTOs:

```java
public record OrderResponse(
        Long id,
        String orderNumber,
        String status,
        List<OrderItemResponse> items
) {
}
```

```java
public OrderResponse toResponse(OrderEntity order) {
    return new OrderResponse(
            order.getId(),
            order.getOrderNumber(),
            order.getStatus().name(),
            order.getItems().stream()
                    .map(item -> new OrderItemResponse(
                            item.getProductId(),
                            item.getQuantity()
                    ))
                    .toList()
    );
}
```

Jackson annotations are still useful for internal models, legacy APIs, or
carefully bounded entity serialization.

Spring Boot's web starter normally supplies Jackson Databind and its annotation
module:

```gradle
implementation 'org.springframework.boot:spring-boot-starter-web'
```

The examples use:

```java
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
```

### `@JsonIgnore`

`@JsonIgnore` excludes a property from both normal serialization and
deserialization:

```java
@Entity
class UserEntity {

    @JsonIgnore
    @Column(name = "password", nullable = false)
    private String encodedPassword;
}
```

It can also break a recursive relationship by hiding the back link:

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "order_id", nullable = false)
@JsonIgnore
private OrderEntity order;
```

Use it for a property that must never appear in that JSON model. Do not treat
it as the only protection for sensitive data; DTO mapping provides a clearer
allowlist of fields.

### `@JsonManagedReference` And `@JsonBackReference`

These annotations represent a parent-child JSON relationship:

```java
@Entity
class OrderEntity {

    @OneToMany(mappedBy = "order")
    @JsonManagedReference
    private List<OrderItemEntity> items = new ArrayList<>();
}
```

```java
@Entity
class OrderItemEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @JsonBackReference
    private OrderEntity order;
}
```

Jackson serializes the managed, or forward, side:

```json
{
  "id": 10,
  "items": [
    {
      "id": 100,
      "quantity": 2
    }
  ]
}
```

It omits the `order` back-reference inside every item, preventing:

```text
order -> items -> order -> items -> ...
```

Use named references when one class has multiple parent-child relationships:

```java
@JsonManagedReference("order-items")
private List<OrderItemEntity> items;

@JsonBackReference("order-items")
private OrderEntity order;
```

This approach intentionally produces an asymmetric JSON graph. It is unsuitable
when clients need both directions represented.

### `@JsonIdentityInfo`

`@JsonIdentityInfo` writes an object fully once and uses its identifier for
later references:

```java
@Entity
@JsonIdentityInfo(
        generator = ObjectIdGenerators.PropertyGenerator.class,
        property = "id"
)
class OrderEntity {

    @OneToMany(mappedBy = "order")
    private List<OrderItemEntity> items = new ArrayList<>();
}
```

```java
@Entity
@JsonIdentityInfo(
        generator = ObjectIdGenerators.PropertyGenerator.class,
        property = "id"
)
class OrderItemEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    private OrderEntity order;
}
```

A repeated Order reference can then be represented as its ID instead of
recursively serializing the complete object:

```json
{
  "id": 10,
  "items": [
    {
      "id": 100,
      "order": 10
    }
  ]
}
```

Use identity serialization when graph identity is part of the intended JSON
contract. It couples the API format to entity identifiers and can be confusing
for clients, so DTOs remain preferable for public REST APIs.

### Choosing A Strategy

| Requirement | Preferred approach |
|---|---|
| Stable public API | response DTOs |
| Hide one sensitive or internal property | `@JsonIgnore`, preferably plus DTOs |
| Serialize parent children but omit child parent | managed/back references |
| Preserve repeated object identity | `@JsonIdentityInfo` |
| Avoid lazy-loading during serialization | fetch explicitly and map inside the transaction |

Jackson annotations control JSON only. They do not change JPA ownership,
cascades, fetching, foreign keys, or transaction behavior.


## Cascades And Orphan Removal

| Cascade | Effect |
|---|---|
| `PERSIST` | persist related entity with owner |
| `MERGE` | merge related detached state |
| `REMOVE` | remove related entity |
| `REFRESH` | refresh related entity |
| `DETACH` | detach related entity |
| `ALL` | applies all cascade operations |

Cascade is an object-lifecycle rule, not a database cascade. Do not use
`CascadeType.ALL` automatically, especially across shared entities or
many-to-many relationships.

`orphanRemoval=true` deletes a child removed from the parent's collection. It
fits privately owned children such as order lines, not shared references.

Database foreign keys and `ON DELETE` behavior must still be defined in
Liquibase.


## Fetch Types And Fetch Plans

JPA defaults:

| Relationship | Default |
|---|---|
| `@OneToMany` | `LAZY` |
| `@ManyToMany` | `LAZY` |
| `@ManyToOne` | `EAGER` |
| `@OneToOne` | `EAGER` |

Treat mapping-level fetch type as a default, not a query plan. Keep
relationships lazy where practical and choose the required graph per use case.

Fetching strategies:

- JPQL `join fetch`;
- `@EntityGraph`;
- interface or DTO projection;
- batch fetching;
- separate bounded queries assembled by the service.

Do not make every relationship eager. Large eager graphs can create cartesian
products, duplicate rows, excessive memory use, and N+1 queries in other
contexts.








