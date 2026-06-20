---
title: Spring Infrastructure Internals
---

# Spring Infrastructure Internals

Transactions, repository proxies, Liquibase, JPA auditing, caching, scheduling, Feign, Kafka, Actuator, tracing, Config Client, Eureka, and Gateway differences.

Back to [Spring Boot Internals](../SPRING-BOOT-INTERNALS.md).

## Transaction Auto-Configuration

Spring Data JPA contributes an `EntityManagerFactory`, repositories, and a
transaction manager when datasource and JPA conditions match.

For:

```java
@Transactional
public void reserve(...) {
    // persistence work
}
```

a transaction proxy:

1. starts or joins a transaction;
2. binds persistence resources to the current execution;
3. invokes the target method;
4. flushes changes;
5. commits on success;
6. rolls back for configured failures.

See [Spring Transactions](../../spring/SPRING-TRANSACTIONS.md) for propagation,
isolation, proxy limitations, and Kafka/database boundaries.


## Spring Data Repository Proxies

Repository interfaces do not need hand-written implementations for standard
operations:

```java
public interface InventoryItemRepository
        extends JpaRepository<InventoryItem, Long> {

    Optional<InventoryItem> findByProductId(Long productId);
}
```

Spring Data scans the interface and creates a proxy. Method names can be parsed
into queries; explicit `@Query` definitions are parsed and validated according
to their type.

The proxy delegates through JPA infrastructure and participates in the active
transaction.


## Liquibase And JPA Startup

For persistent Shopverse services:

```text
DataSource
  -> Liquibase migration
  -> EntityManagerFactory
  -> Hibernate schema validation
  -> repositories/services ready
```

Liquibase failure prevents normal startup. Hibernate validation checks that
entity mappings match the migrated schema. Shopverse does not use
`ddl-auto=update` as its migration strategy.


## JPA Auditing

`@EnableJpaAuditing` enables auditing infrastructure. Entity listeners populate
fields such as creation and modification timestamps when entities are
persisted or updated.

Auditing is not a complete business audit trail. Order timeline and DLT replay
records exist because business transitions and operator recovery need explicit
domain evidence.


## Caching

`@EnableCaching` imports cache interception infrastructure:

```java
@Cacheable(cacheNames = "payments", key = "#orderNumber")
public PaymentResponse getByOrderNumber(String orderNumber) {
    // method runs only on a cache miss
}
```

The proxy calculates the key, checks the selected cache, invokes the method on
a miss, and stores the result.

Shopverse currently uses local cache providers. Caches are not distributed
between replicas.


## Scheduling

`@EnableScheduling` registers scheduled-annotation processing:

```java
@Scheduled(fixedDelayString =
        "${shopverse.inventory.expiry-scan-delay-ms:60000}")
public int expireReservations() {
    // ...
}
```

The method is invoked by a scheduler after context startup. `fixedDelay`
measures the delay after the previous invocation completes.

Production concerns:

- avoid overlapping work unless designed;
- set transaction boundaries in an invoked service method;
- restore correlation/logging context for scheduled work;
- coordinate multi-replica jobs;
- bound batch size and duration;
- observe failure and last-success time.

Shopverse schedulers can run on every replica. A database claiming/locking
strategy is required where only one replica should process a row.


## OpenFeign

`@EnableFeignClients` discovers `@FeignClient` interfaces and creates proxies:

```java
@FeignClient(name = "INVENTORY-SERVICE")
public interface InventoryClient {

    @GetMapping("/api/v1/inventory/public/items")
    List<CatalogItemResponse> getItems();
}
```

At invocation:

1. the proxy builds an HTTP request from annotations;
2. request interceptors add headers;
3. service discovery resolves instances;
4. Spring Cloud LoadBalancer selects one;
5. the HTTP client sends the request;
6. response decoding creates the declared Java type.

See [Spring Cloud OpenFeign](../../spring/SPRING-OPENFEIGN.md).


## Kafka Infrastructure

The Kafka starter and configuration create:

- producer factory;
- `KafkaTemplate`;
- consumer factory;
- listener container factory;
- serializer/deserializer configuration;
- observation/metrics integration.

`@KafkaListener` methods are registered as endpoints. Listener containers own
consumer polling threads and invoke application methods after startup.

```text
Kafka consumer poll
  -> listener adapter
  -> argument conversion
  -> listener method
  -> acknowledgment/error/retry handling
```

Listener methods do not run on the Java `main` thread. See
[Spring Kafka](../../spring/SPRING-KAFKA.md) for concurrency, retries, DLT, and delivery
semantics.


## Actuator, Micrometer, And Tracing

Actuator contributes management endpoints and integrates Micrometer.

```text
application code/framework
  -> Micrometer meter or observation
  -> Prometheus registry exposes samples
  -> Prometheus scrapes /actuator/prometheus
```

Tracing handlers create spans for supported observations, inject/extract trace
headers, add trace fields to logging context, and export completed spans to
Zipkin.

Prometheus does not create metrics from application logs. Logs and metrics are
separate signals.


## Config Client And Eureka

Config Client loads remote property sources early enough for application bean
creation. Failure behavior depends on import and fail-fast configuration.

Eureka Client registers the running instance and periodically renews its lease.
Registration happens after enough local application infrastructure exists, but
registration alone does not prove every business path is healthy.

Feign and the gateway use logical service names resolved from discovery rather
than fixed instance URLs.


## Reactive Gateway Difference

API Gateway uses Spring WebFlux rather than the servlet stack:

```text
WebFilter / GlobalFilter
  -> SecurityWebFilterChain
  -> route lookup
  -> load-balanced downstream call
  -> reactive completion signal
```

There is no servlet `DispatcherServlet` for the gateway routing path. Reactive
execution can move between threads, so Reactor Context and Micrometer context
propagation are safer than relying only on thread-local MDC.

See [API Gateway](../API-GATEWAY-GENERIC.md).










