---
title: Java Timed Mock Interviews
description: Timed senior and architect Java interview sets with expected evidence and scoring.
---

# Java Timed Mock Interviews

<DocLabels items={[
  {label: 'Interview workbook', tone: 'foundation'},
  {label: 'Senior to architect', tone: 'advanced'},
  {label: 'Timed practice', tone: 'intermediate'},
  {label: 'Evidence-scored', tone: 'production'},
]} />

<DocCallout type="tip" title="Preserve the interview constraint">
Answer and score each round within its stated timebox before opening any model
guidance. The goal is to produce a defensible decision under time pressure, not
to reconstruct a perfect answer after reading the rubric.
</DocCallout>

## 30-Minute Senior Round

Timebox each answer to five minutes:

1. Resolve an overload family containing `long`, `Integer`, `Number` and varargs.
2. Explain overriding versus static hiding using one parent reference.
3. Diagnose a mutable key that cannot be found in `HashMap`.
4. Configure a bounded executor for 20 database connections.
5. Explain why a parallel stream slowed an HTTP endpoint.
6. Interpret low heap usage with a container OOM kill.

Score 0–3 each: correctness, mechanism and production evidence. Target: 15/18.

## 60-Minute Lead Round

- Design a Shopverse order-dashboard aggregator using explicit deadlines,
  execution ownership, context propagation and partial-failure policy.
- Review an entity `equals/hashCode` implementation with generated IDs and proxies.
- Diagnose common-pool starvation involving parallel streams and futures.
- Select G1 versus ZGC for a latency-sensitive 16 GiB heap.
- Explain rolling compatibility for REST, Kafka and cached serialized state.

Target answer includes rejected alternatives, observability, capacity, security,
rollout and rollback. Target: 4/5 dimensions on every scenario.

## 90-Minute Architect Round

Design the Java runtime model for order, inventory and payment services under a
10× traffic spike. Cover:

- platform versus virtual thread choice;
- DB/HTTP/Kafka admission and backpressure;
- transaction/idempotency boundaries;
- heap/native/container budgets;
- executor and scheduler isolation;
- wire compatibility;
- JFR, GC, pool and trace evidence;
- graceful shutdown and recovery;
- PII handling in logs and diagnostic artifacts.

<ExpandableAnswer title="Show architect model answer and scoring guide">

A strong answer begins with workload and SLO assumptions: request mix, blocking
ratio, latency targets, failure budget, per-service CPU, database capacity, Kafka
partitions, and dependency limits. It uses virtual threads for high-concurrency
blocking I/O only where the runtime and libraries support them, while semaphores,
connection pools, bounded Kafka consumption, and deadlines protect scarce
resources. CPU-heavy work remains isolated in bounded execution capacity.

Correctness is explicit. Checkout uses an idempotency key, local transactions
protect service-owned state, and a transactional outbox publishes durable events.
Cross-service completion uses a recoverable workflow with deduplication and
compensation rather than a distributed lock or an assumed global transaction.
Wire and event changes follow additive, mixed-version-compatible rollout rules.

Memory planning leaves container headroom beyond heap for metaspace, code cache,
thread stacks, direct buffers, native libraries, and collector needs. Separate
executors or admission gates prevent order aggregation, payment, inventory, and
maintenance work from starving one another. Shutdown stops admission, drains
bounded in-flight work, checkpoints consumers, and makes unfinished operations
safe to retry.

Operational proof combines service-level latency and error metrics with pool and
admission wait time, Kafka lag, database saturation, JFR profiles, unified GC
logs, native-memory evidence, and end-to-end traces. Diagnostic access is audited,
PII is redacted, and artifacts have bounded retention. Rollout begins with load
tests and a canary whose rollback preserves message and storage compatibility.

Score each dimension from 0 to 3:

| Dimension | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| Capacity and concurrency | absent | names thread types | bounds major resources | derives limits from workload and validates overload behavior |
| Correctness and compatibility | absent | happy path only | idempotency and mixed versions | recovery, deduplication, migration, and rollback are coherent |
| Runtime and memory | absent | heap only | heap plus major native areas | budgets container headroom and supplies diagnostic evidence |
| Operations and recovery | absent | generic monitoring | concrete metrics and shutdown | correlated evidence, canary gates, and tested recovery |
| Security | absent | mentions PII | redaction and access control | audited diagnostics, retention, and incident-safe evidence handling |

A credible architect answer scores at least 2 in every dimension and 3 in at
least three dimensions. A high total does not compensate for a zero in
correctness, recovery, or security.

</ExpandableAnswer>

## Review Method

Record the response. For each claim ask: “Which specification/API guarantee or
measurement supports this?” Re-answer weak sections using an executable lab.

## Official References

- [JDK troubleshooting guide](https://docs.oracle.com/en/java/javase/25/troubleshoot/)

## Recommended Next

Return to [Java Concepts In Shopverse](./JAVA-SHOPVERSE-CROSSWALK.md) for codebase context.
