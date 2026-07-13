---
title: Hibernate Annotations And Mapping
status: "maintained"
last_reviewed: "2026-07-13"
---


# Hibernate Annotations And Mapping

Core Hibernate/JPA annotations, dynamic SQL, transient fields, and generated identifiers.

[Back to Hibernate](../HIBERNATE.md).

## Core Hibernate And JPA Annotations

| Annotation | Purpose |
|---|---|
| `@Entity` | persistent entity |
| `@Table` | table, index, and unique constraint mapping |
| `@Id` | primary key |
| `@GeneratedValue` | generated identifier strategy |
| `@Column` | column details |
| `@Transient` | excludes a field from ORM persistence |
| `@Enumerated` | enum storage strategy |
| `@Embedded` / `@Embeddable` | value object stored in owner table |
| `@EmbeddedId` / `@IdClass` | composite identifier |
| `@OneToOne` | one-to-one association |
| `@ManyToOne` | many rows reference one parent |
| `@OneToMany` | parent collection |
| `@ManyToMany` | join-table association |
| `@JoinColumn` | foreign-key column |
| `@Version` | optimistic locking |
| `@MappedSuperclass` | inherited persistent mappings without a table |
| `@EntityListeners` | lifecycle listener registration |
| `@PrePersist` / `@PostPersist` | insert lifecycle callbacks |
| `@PreUpdate` / `@PostUpdate` | update lifecycle callbacks |
| `@PreRemove` / `@PostRemove` | delete lifecycle callbacks |
| `@PostLoad` | callback after entity load |
| `@Convert` | attribute converter |

Hibernate also provides provider-specific annotations such as `@BatchSize`,
`@Fetch`, `@Formula`, `@CreationTimestamp`, `@UpdateTimestamp`,
`@DynamicInsert`, and `@DynamicUpdate`. Prefer standard JPA annotations when
they satisfy the requirement.


## Dynamic Insert And Update SQL

Hibernate normally prepares reusable SQL shapes containing all mapped writable
columns. `@DynamicInsert` and `@DynamicUpdate` are Hibernate-specific
optimizations that generate SQL from the values or dirty fields involved in a
particular operation.

### `@DynamicInsert`

```java
import org.hibernate.annotations.DynamicInsert;

@Entity
@DynamicInsert
@Table(name = "products")
public class ProductEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(name = "status", nullable = false)
    private String status;
}
```

Without dynamic insert, Hibernate can generate one stable statement:

```sql
insert into products (description, name, status) values (?, ?, ?)
```

With `@DynamicInsert`, null properties that are eligible for omission can be
left out:

```sql
insert into products (name) values (?)
```

This is useful when:

- the table has database defaults that must run when a column is omitted;
- an entity has many nullable columns and inserts populate only a small subset;
- measurements show a meaningful benefit.

It is not a general-purpose default. Dynamic SQL shapes reduce prepared
statement reuse and increase SQL-generation and statement-cache variety.

### `@DynamicUpdate`

```java
import org.hibernate.annotations.DynamicUpdate;

@Entity
@DynamicUpdate
@Table(name = "products")
public class ProductEntity {

    @Id
    private Long id;

    private String name;

    private BigDecimal price;

    private String description;

    @Version
    private long version;
}
```

When only `price` changes, a normal static update can include all writable
columns:

```sql
update products
set description = ?, name = ?, price = ?, version = ?
where id = ? and version = ?
```

Dynamic update can generate:

```sql
update products
set price = ?, version = ?
where id = ? and version = ?
```

Potential benefits:

- less data sent for wide tables;
- fewer columns touched by database triggers;
- reduced risk of unnecessary index maintenance for unchanged columns;
- clearer SQL during diagnostics.

Tradeoffs:

- many possible SQL shapes reduce statement-plan and prepared-statement reuse;
- Hibernate must build SQL based on dirty state;
- it does not replace optimistic locking;
- it does not make detached-object updates automatically safe;
- the benefit is usually small for narrow entities.

Hibernate dirty checking already determines whether a managed entity needs an
update. `@DynamicUpdate` changes the columns in that update; it does not cause
dirty checking.

### `insertable` And `updatable`

JPA's `@Column` flags are mapping rules, not dynamic SQL optimizations:

```java
@Column(
        name = "created_at",
        insertable = false,
        updatable = false
)
private Instant createdAt;

@Column(
        name = "external_reference",
        updatable = false
)
private String externalReference;
```

| Setting | Meaning |
|---|---|
| `insertable = false` | omit this mapped property from ORM-generated `INSERT` statements |
| `updatable = false` | omit it from ORM-generated `UPDATE` statements |

Common uses include:

- database-generated timestamps;
- computed or trigger-managed columns;
- a read-only duplicate mapping of the same database column;
- immutable business values that are written once.

For a database default, omit the column during insert:

```sql
create table products (
    id bigint primary key auto_increment,
    name varchar(120) not null,
    status varchar(30) not null default 'ACTIVE',
    created_at timestamp not null default current_timestamp
);
```

```java
@Column(name = "status", insertable = false)
private String status;

@Column(
        name = "created_at",
        insertable = false,
        updatable = false
)
private Instant createdAt;
```

After insertion, refresh the entity or use a provider-supported generated-value
mapping if the application immediately needs the database-generated value.

Do not use `updatable = false` as an authorization control. Java code can still
change the in-memory field, bulk SQL can update the column, and other
applications can modify it. Enforce true invariants through service rules,
database permissions, constraints, and appropriate auditing.

### Production Decision

| Requirement | Recommended mapping |
|---|---|
| Stable SQL and effective statement reuse | default static insert/update |
| Database default for selected null columns | `@DynamicInsert` or `insertable = false`, based on semantics |
| Wide table with measured sparse updates | consider `@DynamicUpdate` |
| Column must never be changed by ORM | `updatable = false` |
| Database owns column generation | non-insertable/non-updatable or generated-value mapping |

Measure generated SQL, database plan-cache behavior, trigger effects, and batch
throughput before applying dynamic annotations broadly.


## `@Transient`

```java
@Transient
private BigDecimal displayTotal;
```

The field is not mapped to a database column.

Java's `transient` keyword and JPA `@Transient` are related but different:

- Java `transient` excludes a field from Java serialization;
- JPA `@Transient` excludes it from ORM persistence.

Do not use `@Transient` for business state that must survive a restart.


## `@GeneratedValue`

```java
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;
```

Strategies:

| Strategy | Description |
|---|---|
| `IDENTITY` | database identity/auto-increment column |
| `SEQUENCE` | database sequence, often with allocation optimization |
| `TABLE` | table-based ID allocation; usually less efficient |
| `UUID` | provider/JPA UUID generation where supported |
| `AUTO` | provider selects a strategy |

Sequence example:

```java
@Id
@GeneratedValue(
        strategy = GenerationType.SEQUENCE,
        generator = "order_seq"
)
@SequenceGenerator(
        name = "order_seq",
        sequenceName = "order_seq",
        allocationSize = 50
)
private Long id;
```

`IDENTITY` can reduce insert batching because Hibernate often needs each
generated key immediately. Select a strategy compatible with the database and
write-volume requirements.






