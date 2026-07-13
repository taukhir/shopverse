---
title: Integration Tests And Testcontainers
description: Real MySQL and Kafka integration testing for migrations, transactions, outbox behavior, broker contracts, container lifecycle, and bounded end-to-end evidence.
difficulty: Advanced
page_type: Testing
status: Implemented
learning_objectives:
  - Use Testcontainers when a database or broker protocol is part of the claim
  - Coordinate container and Spring TestContext lifecycles safely
  - Prove transaction, migration, Kafka, and critical journey behavior with deadlines
technologies: [Testcontainers 2.0.5, MySQL 8.4, Kafka 3.9.1, Spring Boot 4]
last_reviewed: "2026-07-13"
---

# Integration Tests And Testcontainers

<DocLabels items={[
  {label: 'Advanced', tone: 'advanced'},
  {label: 'Real infrastructure', tone: 'production'},
  {label: 'Shopverse current', tone: 'shopverse'},
]} />

Integration testing, Testcontainers, transactional tests, Kafka integration testing, and end-to-end testing.

<DocCallout type="tip" title="Use the real dependency for a dependency claim">
Mocks cannot prove MySQL locking, Liquibase syntax, Kafka acknowledgements, or
transaction visibility across connections. Keep the integration scope narrow,
start only required services, and retain deterministic cleanup.
</DocCallout>

Back to [Spring Boot Testing](../SPRING-BOOT-TESTING.md).

## Integration Tests

Integration tests verify collaboration that mocks cannot prove:

- Liquibase migrations;
- real database constraints;
- transaction commit and rollback;
- optimistic/pessimistic locking;
- outbox persistence;
- Kafka producer/consumer behavior;
- serialization contracts;
- application context wiring.

Keep each test focused. A single integration class does not need to prove the
entire platform.


## Testcontainers

Testcontainers starts disposable dependencies in Docker for tests:

```mermaid
sequenceDiagram
    participant JUnit
    participant TC as Testcontainers
    participant Docker
    participant Spring
    participant Test

    JUnit->>TC: initialize @Container fields
    TC->>Docker: start MySQL and Kafka containers
    Docker-->>TC: mapped ports and connection details
    TC->>Spring: register dynamic properties
    Spring->>Spring: start application context and migrations
    JUnit->>Test: execute integration tests
    TC->>Docker: stop disposable containers
```

Advantages:

- uses the real database/broker product;
- clean, repeatable state;
- dynamic isolated ports;
- same pattern locally and in CI;
- no shared developer database;
- validates migrations and production dialect behavior.

Costs:

- requires Docker;
- image pulls and startup consume time/resources;
- poorly scoped containers can make suites slow;
- parallel suites can exhaust Docker or host memory.


## Testcontainers Example

```java
@Testcontainers(disabledWithoutDocker = true)
@SpringBootTest
class InfrastructureIntegrationTest {

    @Container
    static final MySQLContainer<?> MYSQL =
            new MySQLContainer<>("mysql:8.4");

    @Container
    static final KafkaContainer KAFKA =
            new KafkaContainer("apache/kafka-native:3.9.1");

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
        registry.add("spring.kafka.bootstrap-servers",
                KAFKA::getBootstrapServers);
    }
}
```

Static containers are shared by tests in that class, reducing startup cost.
The Jupiter extension manages their lifecycle.

`disabledWithoutDocker=true` is convenient for unit-only local work, but CI
must clearly require Docker. A skipped integration suite must not be mistaken
for successful infrastructure verification.


## Testing Transactions

To prove commit and rollback, use an explicit transaction:

```java
transactionTemplate.executeWithoutResult(status ->
        outboxService.enqueue(...)
);
assertThat(outboxCount(id)).isOne();

transactionTemplate.executeWithoutResult(status -> {
    outboxService.enqueue(...);
    status.setRollbackOnly();
});
assertThat(outboxCount(id)).isZero();
```

This verifies that the test observes committed state outside the transaction.

Be careful with `@Transactional` on test methods: automatic rollback is useful
for cleanup, but can hide commit callbacks, locking behavior, and visibility
from another connection.


## Kafka Integration Testing

Producer acknowledgement:

```java
var result = kafkaTemplate
        .send(topic, "order-key", payload)
        .get(10, TimeUnit.SECONDS);

assertThat(result.getRecordMetadata().topic()).isEqualTo(topic);
assertThat(result.getRecordMetadata().offset())
        .isGreaterThanOrEqualTo(0);
```

Consumer tests should:

- use unique topics or isolated groups;
- await with a strict deadline;
- assert the business side effect;
- handle duplicates;
- stop listeners/executors cleanly;
- avoid unbounded sleeps.


## End-To-End Testing

An E2E test treats the system as deployed:

```text
authenticate
  -> call gateway checkout
  -> await terminal SAGA state
  -> read timeline/payment
  -> verify security and recovery
```

It proves routing, security, databases, Kafka, and service collaboration.
Failures are slower to diagnose, so E2E tests should cover a few critical
journeys rather than every validation branch.

Use generated correlation and idempotency IDs for isolation.

## Shopverse Current And Proposed Evidence

<DocCallout type="shopverse" title="Current: three services share an explicit infrastructure-test convention">
Order, Inventory, and Payment use Testcontainers `2.0.5` with MySQL `8.4` and
Kafka `3.9.1`. Their separate `integrationTest` task uses one Gradle fork and
disables JUnit parallel execution. Dynamic properties connect Boot to container
ports, and CI runs the task separately from unit tests.
</DocCallout>

<DocCallout type="production" title="Proposed: align container and cached-context lifetime">
Keep static containers alive for every test that can reuse their Spring context,
or adopt Boot's `spring-boot-testcontainers` service connections through an owned
migration. Add container startup, migration, poll deadline, and teardown evidence
before increasing parallelism.
</DocCallout>

## Expandable Interview Checks

<ExpandableAnswer title="Why can a transactional test hide production behavior?">

Automatic rollback can prevent commit callbacks and make all reads share one
transaction. Use explicit transactions and another connection when commit,
locking, or cross-transaction visibility is the claim.

</ExpandableAnswer>

<ExpandableAnswer title="Why should a cached Spring context not outlive its Testcontainer?">

Beans in the reused context retain connection details for a stopped dependency,
causing later tests or shutdown callbacks to fail unpredictably.

</ExpandableAnswer>

<ExpandableAnswer title="What should a Kafka integration test assert beyond send success?">

Assert the durable business side effect, key and schema contract, duplicate
handling, consumer-group isolation, bounded completion, and clean listener shutdown.

</ExpandableAnswer>

## Official References

- [Spring Boot Testcontainers](https://docs.spring.io/spring-boot/reference/testing/testcontainers.html)
- [Testcontainers JUnit 5](https://java.testcontainers.org/test_framework_integration/junit_5/)
- [Spring Kafka testing](https://docs.spring.io/spring-kafka/reference/testing.html)

## Recommended Next

<TopicCards items={[
  {title: 'Async and contract reliability', href: '/spring/testing/ASYNC-CONTRACT-FLAKY-TESTS', description: 'Use bounded polling and isolated topics for eventual outcomes.', icon: 'route', tags: ['Awaitility', 'Kafka']},
  {title: 'CI test reliability', href: '/spring/testing/TEST-CI-RELIABILITY-OPERATIONS', description: 'Shard infrastructure tests without exceeding Docker or context capacity.', icon: 'gauge', tags: ['CI', 'Artifacts']},
]} />







