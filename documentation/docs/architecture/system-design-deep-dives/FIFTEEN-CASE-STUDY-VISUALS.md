---
title: Fifteen System Design Visual Blueprints
difficulty: Advanced
page_type: Case Study
status: Generic
keywords: [system design diagrams, URL shortener, chat, feed, video, ride matching, payment ledger]
learning_objectives: [Recognize dominant ownership boundaries, Trace critical read and write paths, Identify derived versus authoritative data]
technologies: [Kafka, PostgreSQL, Redis, CDN, Object Storage]
last_reviewed: "2026-07-12"
---

# Fifteen System Design Visual Blueprints

These are educational starting points, not claims about a named company's private
architecture. Every diagram needs requirements, estimates, schemas, failure tests,
and rejected alternatives from the [case-study workbook](./CASE-STUDY-WORKBOOK.md).

## 1. URL Shortener

```mermaid
flowchart LR
  Creator --> API --> IDs["ID/key allocator"] --> DB["URL system of record"]
  Reader --> Edge["CDN / redirect edge"] --> Cache --> DB
  DB --> Events --> Analytics
```

The database owns key-to-target mapping; cache and analytics are derived. Protect
against enumeration, malicious destinations, hot links, and expiration races.

## 2. Distributed Rate Limiter

```mermaid
flowchart LR
  Request --> Gateway --> Local["Local token cache"] --> Global["Sharded quota state"]
  Policy --> Gateway
  Gateway -->|allow| Service
  Gateway -->|reject + retry metadata| Client
```

Define quota identity, burst, refill, regional allocation, clock behavior, and
whether temporary over-admission or unavailability is preferred during partition.

## 3. Notification Service

```mermaid
flowchart LR
  Producer --> API --> Outbox --> Broker
  Broker --> Preference --> Template --> Channel["Email / SMS / push adapters"]
  Channel --> Receipt --> Status
  Broker --> DLT["Manual review / dead letter"]
```

Use a stable notification identity, preference snapshot policy, provider idempotency,
bounded retries, receipts, suppression, and channel-specific rate limits.

## 4. Distributed Scheduler

```mermaid
flowchart LR
  Tick --> Claim["Atomic row/shard claim"] --> Workers
  Workers --> Effect --> Outbox
  Lease["lease + fencing generation"] --> Claim
  Reaper["expired claim recovery"] --> Claim
```

Claims own records, not merely method execution. Remote effects remain idempotent
and stale workers are rejected using claim tokens/fencing.

## 5. WhatsApp-Like Chat

```mermaid
flowchart LR
  Sender --> Gateway --> Router --> Log["Conversation-partitioned message log"]
  Log --> Delivery --> Recipient
  Log --> Offline["Device sync / offline inbox"]
  Recipient --> Receipts --> Router
```

Preserve per-conversation order, stable message IDs, durable history, device cursors,
bounded presence, reconnect replay, encryption key lifecycle, and hot-group handling.

## 6. Social Feed

```mermaid
flowchart LR
  Author --> PostStore --> Event --> Fanout
  Fanout --> Inbox["Materialized follower inboxes"]
  Reader --> Rank --> Inbox
  Rank --> PostStore
  Celebrity["High-fanout authors"] --> ReadMerge["fan-out on read"] --> Rank
```

Use a hybrid fan-out model, cursor-based pagination, deletion propagation, ranking
versioning, and isolation for celebrity traffic.

## 7. Video Streaming

```mermaid
flowchart LR
  Uploader --> Multipart --> Origin["Object storage"] --> Workflow --> Transcode
  Transcode --> Renditions --> CDN
  Viewer --> Control["Auth / catalog / manifest"] --> CDN
```

Separate control and media planes. Track resumable upload state, idempotent workflow
steps, codec/bitrate renditions, signed playback, origin shielding, and rights.

## 8. Uber-Like Ride Matching

```mermaid
flowchart LR
  Driver --> Location --> Geo["Cell/geospatial index"]
  Rider --> Trip --> Match --> Geo
  Match --> Claim["Atomic driver offer/claim"] --> Trip
  Trip --> Payment
```

Location is ephemeral and high-volume; trip and payment state are durable. Candidate
search is not assignment—the atomic claim decides the winner.

## 9. Web Search

```mermaid
flowchart LR
  Seeds --> Frontier --> Crawlers --> Parse --> Dedupe
  Dedupe --> IndexBuild --> Shards --> Query
  Query --> Rank --> Results
  Signals --> Rank
```

Bound politeness and crawl traps, canonicalize/deduplicate content, publish versioned
index segments, isolate query latency, and evaluate ranking on labeled queries.

## 10. Dropbox-Like File Sync

```mermaid
flowchart LR
  Client --> Chunk["chunk + hash"] --> Blob["Object storage"]
  Client --> Metadata --> ChangeLog
  ChangeLog --> Devices --> Reconcile
  Metadata --> Versions --> Reconcile
```

Metadata owns paths, versions and authorization; blobs own immutable bytes. Handle
offline conflicts, resumable chunks, dedupe privacy, tombstones and device cursors.

## 11. Gmail-Like Mail

```mermaid
flowchart LR
  SMTP --> Ingress --> Spam --> Mailbox["Durable mailbox store"]
  Mailbox --> Index --> Search
  Mailbox --> Threading --> API --> User
  User --> Send --> Egress --> SMTP
```

Separate durable delivery from searchable projections. Define message identity,
threading, quota, spam decisions, attachment storage and outbound retry semantics.

## 12. Stripe-Like Payment Ledger

```mermaid
flowchart LR
  Client --> Idempotency --> PaymentSM["Payment state machine"]
  PaymentSM --> Ledger["Append-only double-entry ledger"]
  PaymentSM --> Provider
  Provider --> Webhook --> Reconcile --> PaymentSM
  PaymentSM --> Outbox
```

The ledger and payment state are authoritative. Treat provider timeouts as unknown,
reconcile by stable IDs, constrain transitions, and never use cache-only deduplication.

## 13. Amazon-Like Commerce

```mermaid
flowchart LR
  Seller --> Catalog --> SearchIndex
  Buyer --> SearchIndex --> Cart --> Order
  Order --> Inventory["Atomic reservation"] --> Payment --> Fulfillment
  Order --> Events --> SearchIndex
```

Search is derived; checkout revalidates price and stock. Model reservation expiry,
idempotent payment, saga compensation, seller isolation and order history.

## 14. Discord/Zoom-Like Realtime Media

```mermaid
flowchart LR
  Client --> Gateway["Signaling / channel gateway"] --> Session
  Session --> Placement --> SFU["Regional media relay / SFU"]
  Client <--> SFU
  SFU --> Recording --> ObjectStore
```

Separate durable chat/session metadata, signaling connections and high-bandwidth
media. Design regional placement, reconnect, permissions, congestion and recording.

## 15. Metrics And Logging Platform

```mermaid
flowchart LR
  Agents --> Gateway --> Buffer --> PartitionedStore
  PartitionedStore --> Index["labels / metadata index"]
  Query --> Planner --> PartitionedStore
  Lifecycle --> Compact --> Archive
```

Bound label cardinality, batch/compress ingestion, partition by time and tenant,
apply retention, isolate expensive queries, and preserve backpressure under bursts.

## Official References

- [Google SRE Book](https://sre.google/sre-book/table-of-contents/)
- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- [Apache Kafka design documentation](https://kafka.apache.org/documentation/#design)
- [RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)

## Recommended Next Page

Score a complete answer with the [System Design Interview Evaluation Rubric](./INTERVIEW-RUBRIC.md).
