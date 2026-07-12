---
title: System Design Case-Study Workbook
difficulty: Advanced
page_type: Case Study
status: Generic
keywords: [URL shortener, notification service, chat design, feed design, video streaming, payment ledger]
learning_objectives: [Practice complete system designs, Compare workload-specific trade-offs, Record rejected alternatives]
technologies: [System Design]
last_reviewed: "2026-07-12"
---

# System Design Case-Study Workbook

Use the [end-to-end method](./END-TO-END-DESIGN-METHOD.md) for every exercise. Do
not claim these are any company's actual architecture.

| Exercise | Critical deep dive | Common trap |
|---|---|---|
| URL shortener | ID/key generation, redirect cache, abuse/expiry | ignoring hot links and enumeration |
| distributed rate limiter | token state, partitioning, regional quota | one global synchronous counter |
| notification service | preference, template, channel retry, provider receipt | retrying non-idempotent sends blindly |
| distributed scheduler | claim/lease/fencing, delayed work | singleton lock for all independent records |
| chat/WhatsApp | conversation partition, ordering, offline sync, media | global ordering or Redis-only durability |
| social feed | fan-out hybrid, ranking, cursor, deletion | fan-out-on-write for celebrity accounts |
| video/Netflix/YouTube | upload, transcode DAG, manifests, CDN | serving media from application servers |
| ride/food delivery | geospatial index, matching, trip state | using vector similarity for geography |
| maps | tile pipeline, routing graph, traffic updates | computing every route from raw road data |
| web search | crawl frontier, dedupe, index, ranking | one database for crawl and serving |
| Dropbox | chunking, metadata, sync/conflict, dedupe | overwriting concurrent offline edits |
| Gmail | ingest, mailbox index, spam, search, threading | one synchronous write across all projections |
| Stripe-like payments | idempotency, ledger, processor uncertainty | cache-only deduplication |
| Amazon commerce | catalog/search, stock reservation, checkout saga | search index owning price/stock truth |
| Discord/Zoom | realtime gateways, media plane, regional routing | mixing control and media scaling |
| metrics/log platform | ingestion, labels, time partition, retention/query | unbounded cardinality |

## Required Deliverable For Each

1. scope and ranked NFRs;
2. numerical estimates with assumptions;
3. APIs/events and business invariants;
4. schema, indexes, partitioning and retention;
5. high-level and two sequence diagrams;
6. consistency, idempotency and transaction boundaries;
7. overload, hotspots, failover, replay and reconciliation;
8. security/privacy, observability, cost and operations;
9. two rejected alternatives;
10. day-one design and migration triggers for later scale.

## Recommended Next Page

[Interview Evaluation Rubric](./INTERVIEW-RUBRIC.md)
