---
title: Microservices Architect Interview Workbook
description: Twenty-three scenario answers covering service boundaries, data ownership, communication, consistency, resilience, security, deployment, recovery, and operations.
difficulty: Advanced
page_type: Interview
status: maintained
prerequisites: [Microservices architect path]
learning_objectives: [Design service and data boundaries, Compare communication and consistency patterns, Diagnose distributed failure and recovery, Explain deployment security and operational trade-offs]
technologies: [HTTP, Kafka, Databases, Kubernetes]
last_reviewed: "2026-07-30"
scope: generic
owner: docs-architecture
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Microservices Architect Interview Workbook

<DocLabels items={[
  {label: 'Architect interview', tone: 'advanced'},
  {label: '23 expandable answers', tone: 'production'},
  {label: 'Scenario based', tone: 'shopverse'},
]} />

## Boundaries And Data Ownership

<ExpandableAnswer title="When should you choose microservices over a modular monolith?">

Start modular unless independent ownership, deployment, scaling, isolation, or
compliance benefit outweighs network, consistency and operating cost. Preserve
capability boundaries so extraction remains possible; service count is not the goal.

</ExpandableAnswer>

<ExpandableAnswer title="How do you identify a service boundary?">

Start from a business capability and bounded context with one accountable owner,
language, invariants and data. Validate that it can change and deploy independently
without chatty calls or coordinated database transactions. Team topology, compliance,
failure isolation and scaling are inputs; splitting by technical layer or entity
usually produces a distributed monolith.

</ExpandableAnswer>

<ExpandableAnswer title="Why should each service own its database?">

Exclusive write ownership preserves autonomy and prevents another service from
bypassing invariants or coupling to tables and migrations. Cross-service queries use
API composition, replicated read models or analytics pipelines. Database-per-service
does not require a separate database server for every service, but credentials,
schema ownership and mutation authority must remain isolated.

</ExpandableAnswer>

<ExpandableAnswer title="When should you use CQRS or event sourcing?">

CQRS separates write and read models when their consistency, shape or scaling needs
differ; it does not require event sourcing. Event sourcing stores events as the
authoritative state history and adds replay, schema evolution, snapshot and temporal
debugging obligations. Use either only when its audit/read-model benefits justify
operational and cognitive cost.

</ExpandableAnswer>

## Communication And Edge Design

<ExpandableAnswer title="How do you choose synchronous versus asynchronous communication?">

Use synchronous calls when the caller needs an immediate result and the dependency
fits the end-to-end deadline. Use events/queues for decoupling, buffering and
independent progress when eventual consistency is acceptable. Avoid turning one user
request into a long synchronous service chain; asynchronous acceptance still needs a
queryable state, deadline and terminal failure path.

</ExpandableAnswer>

<ExpandableAnswer title="What is the difference between an API gateway and a BFF?">

An API gateway owns cross-cutting edge concerns such as routing, authentication,
rate limiting and observability. A backend for frontend owns client-specific
composition and representation for web, mobile or partner experiences. Neither may
become the owner of every domain workflow, and downstream services must still enforce
authorization at their trust boundaries.

</ExpandableAnswer>

<ExpandableAnswer title="How do discovery and load balancing fail during a rollout?">

Discovery supplies candidates; load balancing selects one. Registration leases,
readiness propagation and client caches create stale-instance windows, so clients
still need deadlines and safe retries. Diagnose which candidate list and instance
were selected, not merely whether the registry or DNS endpoint was reachable.

</ExpandableAnswer>

<ExpandableAnswer title="When does a service mesh help, and what does it not own?">

A mesh can standardize mTLS, identity-aware transport policy, traffic routing and
telemetry without embedding every concern in application code. It adds proxies,
control-plane dependency, resource cost and another incident boundary. It cannot
define business authorization, idempotency, compensation, data consistency or a safe
application fallback.

</ExpandableAnswer>

## Consistency And Messaging

<ExpandableAnswer title="Saga choreography versus orchestration?">

Choreography keeps participants autonomous but can hide the end-to-end state graph.
Orchestration makes workflow and recovery visible but risks centralizing domain logic.
Choose from workflow complexity, auditability and ownership; keep each service's
business invariant and compensation local.

</ExpandableAnswer>

<ExpandableAnswer title="Why use transactional outbox and inbox patterns?">

The outbox commits domain state and event intent atomically in one service database,
then publishes asynchronously, closing the database/broker dual-write gap. Delivery
remains at least once, so consumers need idempotent business transitions or an inbox
record. Monitor unpublished age, retries, poison records, duplicates and replay; do
not call the pattern exactly once.

</ExpandableAnswer>

<ExpandableAnswer title="How do you handle duplicate and out-of-order events?">

Use a stable event/message ID for deduplication and an aggregate key plus sequence or
version when ordering matters. Make state transitions conditional and idempotent,
retain deduplication evidence for the replay horizon, and reject or park impossible
transitions. Ordering is normally per key/partition, not global.

</ExpandableAnswer>

<ExpandableAnswer title="How do you version events safely?">

Treat events as durable contracts: additive evolution first, stable semantics,
schema compatibility checks, tolerant consumers, producer/consumer deployment order,
and replay tests using old records. A new field cannot silently change old meaning.

</ExpandableAnswer>

<ExpandableAnswer title="How do you test HTTP and event contract compatibility?">

Use producer verification and consumer contract/stub tests for request, response,
headers, errors and event schemas. Gate incompatible removals/type changes and test
old consumers against new producers plus replay of old events. Contract tests do not
prove capacity, security policy, broker delivery or end-to-end consistency.

</ExpandableAnswer>

## Resilience, Recovery, And Operations

<ExpandableAnswer title="Can a circuit breaker prevent cascading failure?">

It helps after failures cross configured thresholds. Cascades are primarily bounded
with deadlines, admission control, finite queues, pool isolation and retry budgets.
The breaker must have observable state and a safe fallback; otherwise it can hide loss.

</ExpandableAnswer>

<ExpandableAnswer title="How do backpressure and load shedding differ?">

Backpressure communicates or enforces how fast downstream work can be accepted;
load shedding rejects excess work to preserve bounded latency and recovery. Bound
queues and concurrency before saturation, return explicit retry guidance where safe,
and protect by tenant/workload when required. An unbounded queue converts overload
into latency, memory growth and stale work.

</ExpandableAnswer>

<ExpandableAnswer title="How do you test eventual consistency?">

Assert states and deadlines rather than sleeps: accepted command, durable message,
idempotent consumer effect, duplicate/reordered delivery, transient failure, replay,
compensation and reconciliation. Measure the convergence SLO and terminal failure path.

</ExpandableAnswer>

<ExpandableAnswer title="What is the recovery path for poison messages and permanent failure?">

Classify transient versus permanent errors, bound retries with backoff, move exhausted
records to a DLT/quarantine with original payload and failure metadata, and expose an
audited replay operation. Reconciliation compares authoritative state with derived
effects so lost or stuck work can be detected even when no exception is active.

</ExpandableAnswer>

<ExpandableAnswer title="What observability must cross service boundaries?">

Propagate trace context through HTTP and messaging, and carry stable business and
correlation identifiers needed for long-running workflows. Emit structured logs,
RED/service metrics, dependency spans, queue lag/age and state-transition evidence.
Do not put customer/order/trace IDs in metric labels or log sensitive payloads.

</ExpandableAnswer>

<ExpandableAnswer title="How do you define SLO and operational ownership for a service?">

Assign an owning team, API/event/data contracts, availability and latency SLOs,
dependency budgets, dashboards, alerts, runbooks, on-call and recovery evidence.
Measure business outcomes and asynchronous completion age, not only process uptime.
An independently deployable service without independent operational ownership is an
organizational dependency disguised as architecture.

</ExpandableAnswer>

## Security, Evolution, And Disaster Recovery

<ExpandableAnswer title="How should service identity and authorization work?">

Authenticate workloads with short-lived platform identity and protected transport
such as mTLS where appropriate. The gateway may validate external identity, but each
service authorizes the requested domain resource and distrusts spoofable headers.
Propagate only necessary claims, rotate credentials with overlap, and audit denied
and privileged operations without exposing tokens.

</ExpandableAnswer>

<ExpandableAnswer title="How do you deploy incompatible API, event and database changes safely?">

Use expand-and-contract: deploy additive schema/contract support, migrate/backfill,
observe old and new versions together, switch writers/readers, and remove legacy
behavior only after usage evidence reaches the removal gate. Rolling, canary or
blue-green deployment cannot make an incompatible contract safe by itself.

</ExpandableAnswer>

<ExpandableAnswer title="How do you design multi-region disaster recovery?">

Start with business RTO/RPO and choose active/passive or active/active per workload.
Define global routing, replicated configuration/secrets, data and event replication,
idempotency, conflict/fencing policy, capacity headroom, failover and failback
reconciliation. A successful traffic switch is not recovery proof until data and
in-flight workflows are verified.

</ExpandableAnswer>

<ExpandableAnswer title="How do you migrate a monolith with the strangler pattern?">

Place a controlled routing seam around one capability, establish ownership and
contract tests, redirect reads/writes deliberately, migrate data with reconciliation,
and remove the old path after evidence proves no callers remain. Avoid a permanent
dual-write or shared-database phase; each extraction needs rollback and observability.

</ExpandableAnswer>

## Official References

- [AWS prescriptive microservices guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-integrating-microservices/)
- [AWS database-per-service pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-data-persistence/database-per-service.html)
- [AWS transactional outbox pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html)

## Recommended Next

Return to the [Microservices Learning Guide](../MICROSERVICES-DISTRIBUTED-SYSTEMS.md).
