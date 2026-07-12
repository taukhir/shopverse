---
title: SRE, Disaster Recovery, And Chaos Engineering
difficulty: Advanced
page_type: Runbook
status: Generic
keywords: [SLI, SLO, error budget, incident management, postmortem, disaster recovery, chaos engineering, game day]
learning_objectives: [Define user-centered reliability targets, Coordinate incidents and learning, Prove recovery with controlled failure experiments]
technologies: [Prometheus, Grafana, Kubernetes]
last_reviewed: "2026-07-12"
---

# SRE, Disaster Recovery, And Chaos Engineering

## SLIs, SLOs, And Error Budgets

An SLI measures user-relevant behavior; an SLO sets its target over a window.
Availability, latency, correctness, freshness, durability, and coverage may each
need separate indicators. Use good/eligible events and exclude only explicitly
defined traffic. Percentiles describe latency distribution; an SLO is a policy.

The error budget is the permitted unreliability. Use burn-rate alerts across fast
and slow windows to detect both acute and sustained consumption. Budget policy
can slow releases, prioritize reliability, or require review; it is not permission
to cause avoidable failures.

## Alert And Readiness Quality

Page for actionable user impact or imminent budget loss. Tickets/dashboards suit
capacity trends and informational conditions. Every page needs owner, severity,
context, runbook, safe first actions, and escalation. Test alerts and eliminate
flapping, duplicates, missing-data ambiguity, and unactionable thresholds.

Operational readiness reviews verify ownership, dependencies, SLOs, dashboards,
alerts, capacity, security, migrations, backups/restores, failover, rollback,
runbooks, support, and known risks before launch.

## Incident Management

Assign incident commander, operations lead, communications lead, and scribe as
scale requires. Stabilize user impact, establish a timeline, preserve evidence,
communicate facts/uncertainty/next update, and avoid many uncoordinated changes.

Blameless postmortems describe impact, detection, timeline, contributing technical
and organizational conditions, what helped/hurt, and owned measurable actions.
Track actions to completion and validate that fixes reduce recurrence or impact.

## Disaster Recovery

Map services and data by recovery dependency order: identity/secrets/network,
databases, brokers/storage, platform services, applications, then projections and
batch jobs. Define RTO/RPO, region/data residency, DNS/traffic steering, capacity,
credentials, backups, replication, reconciliation, communication, and return home.

| Model | Cost | Recovery characteristic |
|---|---:|---|
| backup and restore | low | longest RTO |
| pilot light | medium-low | core data/services warm |
| warm standby | medium-high | scaled-down complete environment |
| active-active | highest | low RTO, hardest data/conflict model |

Run game days for zone/region loss and dependency recovery, not only individual
process restarts. Measure real RPO/RTO and degraded capacity.

## Chaos Engineering

Write a hypothesis: under a named failure, a user SLO remains within a bound and
recovery completes within a time. Begin in tests, use smallest blast radius,
steady-state metrics, abort conditions, owner, communication, and automatic
cleanup. Inject latency, loss, process/node/zone failure, dependency errors,
expired credentials, clock skew, disk pressure, database failover, broker lag,
and control-plane outages as justified.

Chaos is not random destruction. Never run without authorization, containment,
observability, and a learning objective. Convert findings into automated tests,
capacity changes, runbooks, and architecture improvements.

## Recommended Next Page

Read [Performance, Capacity, And FinOps](./PERFORMANCE-CAPACITY-FINOPS.md).
