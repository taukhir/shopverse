---
title: Multi-Region Microservices Recovery
description: Service, data, messaging, identity, routing, failover, failback, split-brain, reconciliation, RPO, and RTO for regional outages.
difficulty: Architect
page_type: Architecture Guide
status: Generic
prerequisites: [Microservices, Distributed data, Kubernetes, Disaster recovery]
learning_objectives: [Design whole-system regional recovery, Prevent conflicting writers, Prove RPO RTO and failback]
technologies: [Kubernetes, DNS, Kafka, Databases, OAuth 2.0]
last_reviewed: "2026-07-28"
---

# Multi-Region Microservices Recovery

Multi-region availability is a whole-system property. Moving stateless pods is
insufficient when databases, Kafka, identity, schemas, secrets, object storage,
DNS and external callbacks remain in the failed region.

## Topology Choices

| Topology | Benefit | Cost/risk |
|---|---|---|
| backup and restore | lowest steady cost | longest RTO/RPO |
| pilot light | core data/services prepared | scale-up and validation time |
| warm standby | bounded promotion time | idle cost and replication lag |
| active/passive | clear authority | failover operation and standby capacity |
| active/active by tenant/entity | local availability with explicit ownership | routing and ownership migration |
| unrestricted active/active | high write availability goal | conflict, split-brain and ordering complexity |

## Authority And Fencing

Define which region may mutate each aggregate. During failover, fence source
writers through leases/epochs, routing, credentials or database authority before
promoting target writers where possible. DNS changes alone do not fence old pods
or queued messages.

## Dependency Recovery Graph

Recover in dependency order: identity/secrets/network, authoritative data,
messaging/schema, platform services, application writers, consumers/workflows,
then optional workloads. Each dependency has an RPO, RTO and consistency point.

## Traffic And Client Behavior

Test DNS TTL and caching, load-balancer health, connection reuse, client metadata,
mobile/partner caching, TLS certificates and webhook callback routing. Use staged
traffic with canaries and rollback rather than instant full promotion.

## Data And Workflow Reconciliation

Asynchronous replication creates uncertainty near the failure boundary. Reconcile
database commits, outbox rows, Kafka records, inbox effects, Saga states,
third-party payment references and user-visible results. Prefer duplicate-safe
replay from a conservative point to skipping unknown work.

## Failback

Failback is a new migration: select authority, replicate recovery-period writes,
fence target writers, validate data/schema/offsets, move canary traffic, reconcile,
then restore normal topology. Include failback in every game day.

## Proof

Measure detection and decision time, actual data loss, writer-fencing time,
dependency recovery, traffic promotion, backlog drain, stuck workflows,
reconciliation count and failback duration. Publish achieved RPO/RTO against the
business objective.

## Required Failure Exercises

- complete region loss during writes;
- partial network partition with both regions alive;
- identity or secret service unavailable;
- database promoted but Kafka behind;
- duplicate partner callbacks after routing change;
- stale DNS/long-lived connections;
- recovery region lacks schema/config version;
- original region returns while target accepts writes.

## Recommended Next

Return to [Microservices Production Mastery](./MICROSERVICES-PRODUCTION-MASTERY.md).

