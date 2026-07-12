---
title: Backend Engineering Glossary
page_type: Reference
difficulty: Beginner
status: Generic
last_reviewed: "2026-07-12"
---

# Backend Engineering Glossary

Technical guides automatically link the first relevant occurrence of these
terms to this page.

## Idempotency {#idempotency}

The property that repeating an operation with the same identity produces the
same externally observable result instead of duplicating its business effect.

## Transactional Outbox {#transactional-outbox}

A pattern that stores a business change and an event record in the same local
database transaction, then publishes the event asynchronously.

## SAGA {#saga}

A distributed business transaction represented as coordinated local
transactions with explicit failure and compensation behavior.

## JWKS {#jwks}

JSON Web Key Set: a published collection of public keys used by resource
servers to verify signed JWTs.

## Fencing Token {#fencing-token}

A monotonically increasing token that lets a resource reject writes from an
older lock holder after its lease has expired.

## Consumer Group {#consumer-group}

A Kafka coordination unit in which partitions are assigned among consumers so
each partition is actively processed by one group member at a time.

## Distributed Lock {#distributed-lock}

A coordination mechanism that grants time-bounded ownership across processes.
Correct designs account for lease expiry, pauses, and stale owners.

## Correlation ID {#correlation-id}

An identifier propagated across requests, events, logs, and traces to connect
work belonging to the same business or technical operation.

## Circuit Breaker {#circuit-breaker}

A resilience policy that temporarily rejects calls to an unhealthy dependency
after failures cross a threshold, allowing recovery and preventing cascades.

## Backpressure {#backpressure}

A mechanism that keeps a fast producer from overwhelming a slower consumer by
controlling demand, buffering within bounds, shedding load, or slowing intake.

## Optimistic Locking {#optimistic-locking}

A concurrency technique that detects conflicting updates using a version or
timestamp rather than holding a database lock for the entire operation.

## Dead Letter Topic {#dead-letter-topic}

A Kafka topic that receives records which could not be processed successfully
after the configured retry and recovery policy.

## RBAC {#rbac}

Role-based access control assigns permissions to roles and roles to identities.

## ABAC {#abac}

Attribute-based access control evaluates identity, resource, action, and
environment attributes to make a contextual authorization decision.

## Retrieval-Augmented Generation {#rag}

An AI pattern that retrieves relevant external context and supplies it to a
language model when generating a response.

## Bulkhead {#bulkhead}

A resilience pattern that isolates resources such as threads, connections, or
concurrency permits so one failing dependency cannot exhaust the entire service.

## Eventual Consistency {#eventual-consistency}

A consistency model in which replicas or independently persisted services may
temporarily disagree but converge after updates and messages are processed.

## CQRS {#cqrs}

Command Query Responsibility Segregation separates write models and operations
from read models so each side can evolve and scale for its workload.

## Cache Stampede {#cache-stampede}

A burst of concurrent recomputation or database requests when a popular cache
entry expires and many callers attempt to rebuild it simultaneously.

## Split Brain {#split-brain}

A failure state in which isolated participants each believe they are the active
owner or leader, risking conflicting decisions and writes.

## mTLS {#mtls}

Mutual TLS authenticates both sides of a connection with certificates while
also providing encryption and transport integrity.

## CSRF {#csrf}

Cross-site request forgery tricks a browser into sending an authenticated
request that the user did not intend, commonly affecting cookie-based sessions.

## Vector Database {#vector-database}

A datastore optimized for indexing embeddings and retrieving nearby vectors by
similarity rather than exact key or text matching.

## Embedding {#embedding}

A numeric vector representation that captures semantic characteristics of text,
images, or other data for similarity search and machine-learning tasks.

## Prompt Injection {#prompt-injection}

An attack in which untrusted instructions attempt to override an AI system's
intended policy, tool constraints, or handling of retrieved information.

## OLTP {#oltp}

Online Transaction Processing: many short, concurrent business reads and writes
that usually require low latency, constraints, and ACID transactions.

## OLAP {#olap}

Online Analytical Processing: scans and aggregates large volumes of current and
historical data for reporting, exploration, forecasting, and decision support.

## NoSQL {#nosql}

An umbrella for non-relational data models such as key-value, document,
wide-column, and graph. It does not imply one consistency or transaction model.

## Partitioning {#partitioning}

Dividing a logical dataset into bounded pieces by range, hash, list, time, or
another key for lifecycle management, pruning, distribution, or parallel work.

## Sharding {#sharding}

Horizontal partitioning that places different subsets of data on independently
scaled nodes or groups. Cross-shard queries and transactions become harder.

## Keyset Pagination {#keyset-pagination}

Pagination that continues after the last stable sort key instead of skipping an
offset, giving bounded deep-page work when the ordering is deterministic.

## Connection Pool {#connection-pool}

A bounded set of reusable database connections. Its wait queue and timeouts are
part of overload control; a larger pool can increase database contention.

## Query Plan {#query-plan}

The optimizer's chosen operators and access paths for a query. Estimated plans
predict work; actual plans add observed row counts, timing, and engine metrics.

## SLI {#sli}

A Service Level Indicator is a measured aspect of user-visible service behavior,
such as successful-request ratio, latency, correctness, or freshness.

## SLO {#slo}

A Service Level Objective is the target value or range for an SLI over a defined
time window. Its allowed failure forms an error budget.

## RPO {#rpo}

Recovery Point Objective is the maximum acceptable amount of committed data loss,
expressed as a time or recovery position.

## RTO {#rto}

Recovery Time Objective is the maximum acceptable time to restore a capability
after disruption.

## CDC {#cdc}

Change Data Capture reads committed source changes, commonly from a database log,
and delivers them to downstream pipelines or projections.

## SBOM {#sbom}

A Software Bill of Materials inventories components and versions contained in a
software artifact so provenance, licensing, and vulnerability exposure can be assessed.

## Watermark {#watermark}

In stream processing, a watermark estimates how far event time has progressed so
windows can produce results while still defining treatment of late events.

## Model Context Protocol {#model-context-protocol}

A protocol through which an AI host/client discovers and invokes bounded server
tools, resources and prompt templates. MCP standardizes interoperability but does
not replace authorization or domain correctness.

## Tool Calling {#tool-calling}

A model produces a structured request for trusted application code to validate,
authorize and execute. Generated tool arguments are proposals, not trusted commands.

## Reranking {#reranking}

Scoring a bounded set of retrieved candidates with a more precise model or policy
after a cheaper first-stage retrieval, trading additional latency and cost for quality.
