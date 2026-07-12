---
title: Multi-Tenancy, Object Storage, And Feature Flags
difficulty: Advanced
page_type: Decision Guide
status: Generic
keywords: [multi-tenancy, noisy neighbor, presigned URL, multipart upload, object storage, feature flag]
learning_objectives: [Choose a tenant isolation model, Design secure object upload and lifecycle flows, Operate feature flags safely]
technologies: [PostgreSQL, S3, MinIO, Spring Boot]
last_reviewed: "2026-07-12"
---

# Multi-Tenancy, Object Storage, And Feature Flags

## Multi-Tenancy Models

| Model | Isolation | Cost/operations | Best fit |
|---|---|---|---|
| shared tables with `tenant_id` | logical | lowest | many small tenants |
| schema per tenant | stronger namespace | migration/connection complexity | moderate tenant count |
| database per tenant | strong operational/data boundary | highest | regulated or large tenants |
| hybrid tiers | matched to tenant needs | routing/movement complexity | diverse customer sizes |

Enforce tenant identity from authenticated context, not a trusted request field.
Every key, unique constraint, query, cache key, search/vector document, event,
object path, metric, audit record, and background job must preserve tenant scope.
Database row-level security can add defense in depth but must be tested with pools,
admin paths, migrations, and bypass roles.

Control noisy neighbors with per-tenant rate/concurrency quotas, pool admission,
queue fairness, storage limits, query budgets, and shard movement. Design tenant
provisioning, key rotation, export, deletion, restore, region residency, schema
migration, and promotion between isolation tiers.

## Object And File Storage

Store bytes in object storage and durable metadata/status in a database. A secure
upload flow issues a short-lived, size/type/key-scoped presigned URL, uploads
directly, verifies completion/checksum, scans content, and only then marks the
object available. Never trust extension or client MIME type alone.

Use multipart upload for large objects with part checksums, retry, abort, and
orphan cleanup. Object keys should be opaque and authorization should be checked
before generating download URLs. Define encryption, versioning, retention/legal
hold, replication, CDN cache policy, lifecycle transition, deletion, and restore.

Content-addressed deduplication saves space but creates ownership, reference
counting, privacy-deletion, and hash-disclosure risks. Scan decompression bombs,
archives, active content, and malware in an isolated bounded pipeline.

## Feature Flags And Dynamic Configuration

Flags separate deployment from release. Types include release, experiment,
operational kill switch, permission/entitlement, and configuration flags. Do not
use a release flag as permanent authorization.

Every flag needs owner, purpose, default/fail behavior, targeting, start/expiry,
audit history, metrics, and removal task. Evaluate consistently for one request
or business operation; log the evaluated variant without leaking sensitive
targeting data. Cache with bounded staleness and define behavior when the flag
service is unavailable.

Progressive delivery uses internal → canary → cohort → percentage → full rollout
with SLO gates and an independent kill switch. Remove both flag and dead branch;
stale interacting flags create an untestable combinatorial system.

## Recommended Next Page

Continue with [Data Pipelines And Search Operations](../data/DATA-PIPELINES-SEARCH-OPERATIONS.md).
