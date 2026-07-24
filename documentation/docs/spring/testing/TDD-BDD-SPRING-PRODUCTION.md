---
title: TDD And BDD With Spring In Production
description: Apply behavior-driven design across Spring domain, MVC, persistence, messaging, contract, integration, and production reliability boundaries.
difficulty: Advanced
page_type: Production Guide
status: Generic
prerequisites: [BDD Discovery And Specifications, Spring Boot Testing]
learning_objectives: [Select Spring test boundaries, Drive adapters from contracts, Adopt TDD and BDD in legacy and production systems]
technologies: [Spring Boot Test, MockMvc, Testcontainers, JUnit 5]
last_reviewed: "2026-07-23"
---

# TDD And BDD With Spring In Production

## Boundary Selection

Use the smallest test that can honestly prove the risk.

| Risk | Primary evidence |
|---|---|
| pure pricing/state rule | plain JUnit domain test |
| controller mapping/validation/error JSON | MVC slice |
| JPA mapping/query/locking | repository slice or real database integration |
| security filter/authorization | security-aware MVC/integration test |
| HTTP client serialization/error mapping | stub server or contract test |
| Kafka delivery/retry/schema | broker integration with Testcontainers |
| startup/configuration wiring | bounded context or application context test |
| critical user journey | few system tests plus observability verification |

## Hexagonal TDD Flow

Drive an application service with domain ports first, then prove each adapter contract.

```java
interface PaymentGateway {
    PaymentResult capture(PaymentCommand command);
}

interface OrderRepository {
    Optional<Order> find(String id);
    void save(Order order);
}
```

The unit test discovers orchestration and failure semantics. A separate adapter test proves
JDBC/HTTP/Kafka mapping. This prevents a mock from claiming an integration works.

## Spring Context Discipline

`@SpringBootTest` is not the default for every behavior. Context startup, cache keys,
mocked beans, profiles, dynamic properties, and dirty contexts affect suite performance.
Use slices when they represent the boundary; use full context for cross-configuration risks.

Keep production code constructor-injected and external nondeterminism behind ports. Inject a
`Clock`, deterministic ID source, and scheduler abstraction where the behavior requires it.

## Persistence And Transactions

Tests must expose flush/commit behavior, constraints, isolation, lock timeouts, and database-
specific SQL. A test transaction that always rolls back can hide commit-time failures and
after-commit events. Use the production engine for critical dialect/concurrency behavior.

## Messaging And Eventual Consistency

Assert eventually with a bounded deadline, not an arbitrary sleep. Test duplicate delivery,
out-of-order events, poison payload, retry exhaustion, DLT ownership, consumer restart,
schema compatibility, and idempotent side effects. Separate broker acceptance from business
completion.

## Production Reliability Specifications

Examples should include more than happy-path functional correctness:

- deadline exceeded before downstream result;
- duplicate request after ambiguous network failure;
- partial dependency outage and circuit state;
- pod termination while work is in flight;
- stale read after asynchronous replication;
- authorization changes during a long workflow;
- load shedding and bounded queue behavior;
- reconciliation after a dual-write failure.

Some are best proven by integration, load, chaos, or operational drills—not unit tests.

## Team Adoption

Start with one risky capability and a short feedback loop. Pair on example discovery, limit
WIP, refactor test code, measure suite duration/flakiness and escaped defects, and protect
refactoring time. Do not impose a rigid test count or coverage quota as a proxy for learning.

For legacy code: characterize, create seams, add a new behavior test, change minimally,
refactor, and incrementally move behavior behind stable ports. Preserve production telemetry
and rollback controls.

## CI Layers

```text
commit: unit + focused slices + static checks
pull request: integration + contract + migration compatibility
main/release: broader system, security, performance, packaging evidence
production: synthetic checks, SLOs, canary comparison, rollback/reconciliation drills
```

Quarantine is temporary and owned. Track flake rate, time-to-feedback, failure attribution,
and test effectiveness rather than raw count.

## Official References

- [Spring Framework testing](https://docs.spring.io/spring-framework/reference/testing.html)
- [Spring Boot test slices](https://docs.spring.io/spring-boot/appendix/test-auto-configuration/slices.html)
- [Testcontainers for Java](https://java.testcontainers.org/)

## Recommended Next

Finish with [Interview Questions, Failure Scenarios, Labs, And Revision](./TDD-BDD-INTERVIEW-REVISION.md).

