---
title: API And Event Schema Governance Interview, Labs, And Revision
description: Practise governance designs, compatibility incidents, migration labs, architect interview questions, evidence, and rapid revision.
difficulty: Advanced
page_type: Interview Guide
status: Generic
prerequisites: [Contract Governance Operations]
learning_objectives: [Answer governance interviews, Complete mixed-version and registry labs, Defend lifecycle trade-offs]
technologies: [OpenAPI, AsyncAPI, Avro, Protobuf, JSON Schema, Schema Registry]
last_reviewed: "2026-07-24"
---

# API And Event Schema Governance Interview, Labs, And Revision

## Top Interview Questions

**How do you govern without slowing teams?** Federated domain ownership, automated cheap checks, reusable templates/
SDKs, self-service catalog, semantic review only for risk, transparent exceptions and measurable feedback.

**Structural versus semantic compatibility?** Structural means parser/schema can exchange data; semantic means meaning,
units, invariants, errors, ordering and behavior remain valid. Tooling cannot prove semantics alone.

**How do you make a breaking change?** Introduce new major contract/event type, support overlap/adapters, deploy tolerant
consumers/servers first, measure adoption, migrate/backfill/replay, stop old production/use, preserve rollback and retire.

**What if no consumers are registered?** Use runtime evidence—gateway telemetry, consumer groups, schema ID access,
repository search—and treat unknown/dormant external consumers according to published support policy.

**Schema registry is down—does Kafka stop?** Producers/consumers using cached known schemas may continue; cold clients,
new IDs or registration can fail. Behavior depends on serializer/cache; define and test degraded operation.

**OpenAPI code-first or design-first?** Either can work with one canonical artifact and drift gate. Choose based on
workflow/consumers; design-first strengthens early collaboration, code-first can align runtime if disciplined.

## Architect Scenarios

**Currency field changed meaning with same type.** Structural checks pass but semantic contract breaks. Stop producer,
identify time/range/consumers, correct with new field/event version and conversion, replay/reconcile, add semantic unit rule.

**Need to remove customer PII from retained events.** Inventory topics/replicas/archives/consumers/indexes, apply legal/
security deletion design, tokenization/minimization or cryptographic erasure, publish correction/tombstone as supported,
rebuild projections and prevent future collection. Append-only retention needs prior privacy design.

**Old mobile clients cannot be forced to upgrade.** Preserve backward API behavior/support version, route by version,
collect privacy-safe usage, use server adapter, publish sunset policy, and remove only per contractual/risk decision.

**Two teams claim ownership of one event.** Establish source-of-truth domain and semantic owner; other team consumes or
publishes its own fact. Avoid a shared mutable enterprise event with unclear invariants.

## Hands-On Labs

1. Design OpenAPI order endpoint with validation, auth, idempotency, pagination and problem errors.
2. Run lint/breaking diff for additive, required input, removed response and semantic-unit changes.
3. Define the same event in Avro, Protobuf and JSON Schema; compare presence/default/unknown behavior.
4. Run old/new producer/consumer matrix under backward, forward and full-transitive policies.
5. Evolve key/ordering/event semantics via new event type and reconcile dual-publication.
6. Simulate registry outage with warm and cold clients; validate cache/fail/retry behavior.
7. Execute deprecation using catalog owner, usage telemetry, migration guide and sunset gate.
8. Restore registry from backup and prove stored old messages still decode by preserved schema ID/reference.

## Evidence Checklist

- canonical contract and owner/lifecycle/security metadata;
- lint/structural diff and semantic review;
- mixed-version provider/consumer matrix;
- registry compatibility policy and released baseline;
- generated artifact provenance and drift check;
- usage/consumer inventory and deprecation adoption;
- replay of oldest retained event;
- registry outage/restore and ID consistency;
- sensitive-data review and incident runbook;
- exception owner/expiry and architecture decision.

## One-Page Revision

- Contract includes semantics, errors, auth, idempotency, ordering, limits and lifecycle—not only schema.
- Prefer additive evolution; version when compatibility cannot preserve behavior.
- OpenAPI/Protobuf/AsyncAPI are canonical artifacts only with ownership and drift gates.
- Backward = new reads old; forward = old reads new; transitive covers all retained versions.
- Registry enforces structural policy and IDs; semantic safety needs review/tests/telemetry.
- Avro uses writer/reader resolution; Protobuf tags are identity; JSON Schema tooling behavior varies.
- Key, topic, headers, timestamp, retention and deletion are part of event contract.
- Breaking migration requires overlap, tolerant side first, usage measurement, replay and retirement.
- Consumer catalog combines declared and runtime evidence; dormant replay consumers matter.
- Secure registry, generated code and schemas as supply-chain/control-plane assets.

## Official References

- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
- [AsyncAPI Specification](https://www.asyncapi.com/docs/reference/specification/latest)
- [Apache Avro specification](https://avro.apache.org/docs/current/specification/)
- [Protocol Buffers best practices](https://protobuf.dev/best-practices/dos-donts/)

## Recommended Next

Return to the [API And Event Schema Governance Path](../API-EVENT-SCHEMA-GOVERNANCE-PATH.md) and complete the mixed-version plus registry recovery labs.
