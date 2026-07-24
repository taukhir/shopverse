---
title: API And Event Compatibility
difficulty: Intermediate
page_type: Decision Guide
status: Generic
keywords: [API versioning, backward compatibility, consumer-driven contracts, Avro, Protobuf, JSON Schema, schema registry, event upcasting]
learning_objectives: [Evolve APIs without breaking clients, Apply event schema compatibility rules, Plan deprecation and migration]
technologies: [REST, Kafka, Avro, Protobuf, JSON Schema]
last_reviewed: "2026-07-12"
---

# API And Event Compatibility

This page is the concise compatibility primer. For design ownership, OpenAPI and
AsyncAPI workflows, registry policy, security, operational metrics, migrations,
incident labs, interviews, and revision, use the
[API And Event Schema Governance Path](./API-EVENT-SCHEMA-GOVERNANCE-PATH.md).

Compatibility is a deployment property: producers, consumers, stored data, and
in-flight messages often run different versions simultaneously.

## API Evolution

Prefer additive evolution: add optional request fields, add response fields that
clients ignore, preserve meanings, and keep defaults explicit. Breaking changes
include removing/renaming fields, narrowing accepted values, changing units,
making optional input mandatory, or reinterpreting status/error semantics.

| Versioning method | Strength | Cost |
|---|---|---|
| compatible evolution without version | simplest client experience | requires discipline |
| URI `/v2` | visible and routable | duplicates resources and documentation |
| media type/header | clean URI and representation control | harder discovery, caching, tooling |
| query parameter | easy experimentation | weak semantics and cache complexity |

Version only when compatibility cannot preserve the contract. Publish an owner,
migration guide, usage telemetry, deprecation notice, sunset date/header, and
support window. Never remove a version merely because the newest client shipped.

Use OpenAPI diff gates and consumer-driven contract tests to prove provider
changes against real consumer expectations. Contract tests complement—not
replace—semantic review, integration tests, and production telemetry.

## Event Schema Evolution

| Compatibility | New schema can | Typical use |
|---|---|---|
| backward | read data written by the previous schema | new consumers, old events |
| forward | old consumers read data from new producers | rolling producer upgrade |
| full | provide both directions | independently deployed producers/consumers |

Avro commonly uses writer and reader schemas; Protobuf preserves numeric field
tags and requires removed tags to be reserved; JSON Schema needs conventions for
unknown properties, defaults, and unions. A schema registry stores versions and
enforces configured compatibility, but cannot detect changed business meaning.

Safe changes usually add optional/defaulted fields. Avoid reusing field IDs,
changing numeric meaning, renaming event types in place, or adding mandatory
fields without defaults. Treat keys, partitioning, ordering, headers, and event
semantics as part of the contract, not only the payload.

## Breaking Change Migration

1. Register the new schema and deploy tolerant consumers.
2. Produce old plus new fields, or publish a new event type/topic when semantics differ.
3. Backfill/upcast old events at the boundary when needed.
4. Measure consumers still using the old form.
5. Stop old production, retain replay compatibility, then remove obsolete handling.

Upcasting transforms historical representations into the current domain model;
preserve original immutable events and version every transformation. Dual topics
improve isolation but require reconciliation and a clear source of truth.

## Compatibility Checklist

- Test unknown, missing, null, default, enum, precision, and large-value cases.
- Test old client/new server, new client/old server, and mixed event versions.
- Include authorization, idempotency, pagination, errors, and rate limits.
- Record version ownership, adoption, deprecation, replay, and rollback evidence.

## Recommended Next

Continue with the [API And Event Schema Governance Path](./API-EVENT-SCHEMA-GOVERNANCE-PATH.md)
before running mixed versions with [Kubernetes Workload Engineering](../operations/KUBERNETES-WORKLOAD-ENGINEERING.md).
