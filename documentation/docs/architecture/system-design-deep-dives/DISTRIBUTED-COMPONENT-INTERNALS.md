---
title: Distributed Component Internals
difficulty: Advanced
page_type: Reference
status: Generic
keywords: [load balancer internals, consistent hashing, distributed ID, cache invalidation, quorum, replication repair, CDN]
learning_objectives: [Explain component behavior beneath architecture boxes, Identify scaling and failure limits, Choose components from access and consistency requirements]
technologies: [Kafka, Redis, CDN, Object Storage]
last_reviewed: "2026-07-12"
---

# Distributed Component Internals

![Twelve-panel atlas of distributed-system building blocks and their main failure questions](/img/diagrams/distributed-systems-atlas.svg)

*Each box is an ownership and capacity mechanism, not a magic service. The labels
under it identify the failure behavior a design must explain.*

| Component | Internal decision | Failure/scaling question |
|---|---|---|
| load balancer | L4/L7, health, algorithm, connection reuse | stale health, uneven long connections, retry storms |
| gateway/proxy | routing, auth, limits, buffering | blast radius, body/stream limits, config rollout |
| cache | key, eviction, TTL, write policy | invalidation, stampede, hot key, stale authorization |
| queue/log | acknowledgment, ordering, retention, partition | redelivery, poison work, lag, hotspot, rebalance |
| database | transaction, index, replica, shard | lock/connection limit, lag, skew, cross-shard correctness |
| search | analyzer, shard, refresh, ranking | mapping explosion, merge load, reindex/rebuild |
| object store/CDN | key, multipart, cache policy | integrity, invalidation, origin failure, egress |
| realtime gateway | connection ownership, fan-out, resume | slow client, reconnect storm, regional affinity |

## Load Balancing And Hashing

Round robin ignores request duration; least-connections can help heterogeneous
duration but connection multiplexing complicates signals; EWMA/latency algorithms
need outlier and feedback-loop care. Health checks should prove traffic eligibility
without making all instances fail during a shared dependency outage.

Consistent/rendezvous hashing limits key movement on membership change. Virtual
nodes improve balance but not celebrity hot keys. Replication, membership epochs,
draining and rebalancing are part of ownership correctness.

## Rate Limits And IDs

Fixed window is simple/bursty; sliding log accurate/expensive; sliding counters
approximate; token bucket permits controlled bursts; leaky bucket smooths output.
Distributed enforcement trades consistency, latency and availability. Partition
quota by identity and protect global plus dependency-specific limits.

Distributed IDs trade locality, coordination, opacity and clock dependence. IDs
do not replace idempotency or version/order fields.

## Replication And Quorum

Leader/follower simplifies conflicts but creates leader failover/fencing. Multi-
leader accepts regional writes but requires conflict rules. Leaderless quorum uses
versions, read repair and anti-entropy. `R + W > N` is not sufficient without
overlapping replica sets, correct sloppy quorum/handoff semantics, versions and
failure assumptions. Repair, tombstones and compaction affect correctness/cost.

## Cache And CDN

Cache-aside tolerates misses but risks stale/invalidation races. Write-through,
write-behind and refresh-ahead change latency/durability. Use request coalescing,
jittered TTL, stale-while-revalidate, negative caching and bounded entries.

CDNs cache near users using cache keys, TTL, validation and purge. Signed URLs/
cookies protect access only when keys and cache variation are correct. Origin
shielding reduces fan-out; range requests support large media.

## Search, Presence, And Fan-Out

Search indexes are derived and refreshed asynchronously. Presence is lease-like
ephemeral state. Feed/chat fan-out can occur on write, read, or hybrid for high-
fanout users. Always define ordering scope, cursor, deduplication and reconnect/replay.

## Recommended Next Page

[Case-Study Design Workbook](./CASE-STUDY-WORKBOOK.md)

## Official References

- [Google Site Reliability Engineering book](https://sre.google/sre-book/table-of-contents/)
- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- [RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)
