---
title: Event Contracts, Schema Registry, Avro, Protobuf, And JSON Schema
description: Govern event semantics, envelopes, keys, ordering, schema subjects and IDs, compatibility modes, Avro resolution, Protobuf evolution, JSON Schema, replay, and migrations.
difficulty: Advanced
page_type: Deep Dive
status: Generic
prerequisites: [API Contract Governance]
learning_objectives: [Design durable event contracts, Select schema and compatibility strategy, Preserve mixed-version and replay behavior]
technologies: [Kafka, Avro, Protocol Buffers, JSON Schema, Schema Registry, AsyncAPI]
last_reviewed: "2026-07-24"
---

# Event Contracts, Schema Registry, Avro, Protobuf, And JSON Schema

## Event Contract Beyond Payload

```text
topic/destination + event type and meaning
+ key/partition/order + timestamp semantics
+ payload schema + headers/envelope
+ producer/source of truth + consumers/owners
+ delivery/duplicate/replay/retention/deletion
+ privacy/classification + authorization
+ compatibility/deprecation/support
```

An event is an immutable statement about a fact. Commands request action and usually have intended ownership.
Avoid ambiguous “update” events without changed meaning/state version.

## Envelope Design

Common metadata includes event ID, type, schema/semantic version, occurred-at, producer, aggregate ID/version,
correlation/causation/trace, tenant and payload. Keep routing-critical key in broker key, not only payload. Avoid
duplicating metadata with inconsistent sources or putting secrets/large blobs in headers.

Occurred time, ingestion time and processing time are different. State which controls ordering/windowing.

## Registry Model

A schema registry stores versioned schemas and assigns references/IDs under a subject/naming strategy. Producers
register/use schema; serialized records commonly carry a registry-specific schema identifier; consumers fetch/cache
writer schema and resolve to reader schema. Registry availability, auth, cache, deletion and DR are production concerns.

Subject strategy affects whether topic, record type or topic-record combination owns compatibility. Choose based on
topic heterogeneity, reuse and governance; migration later can be costly.

## Compatibility Modes

| Mode | Practical question |
|---|---|
| backward | can new consumer read old produced/stored data? |
| forward | can old consumer read new producer data? |
| full | do both directions hold? |
| transitive variant | compatible with every retained version, not only latest? |

Deployment order determines need. For long retention/replay, transitive compatibility or explicit upcasting/new
event type may be required. A registry structural check cannot detect semantic changes or application assumptions.

## Avro

Avro uses writer/reader schema resolution. Field names and aliases/defaults affect evolution. Adding a reader field
requires a default to read old data. Removing may be readable by consumers that ignore writer fields. Union/null/default
ordering and logical types need care. Validate precision, decimal scale, timestamp logical type and code generation.

## Protobuf

Numeric tags are wire identity; never reuse removed field/enum numbers and reserve names/numbers. Add fields and enum
values only with tolerant consumers. Presence, oneof and ProtoJSON introduce semantic compatibility concerns. See the
[Protobuf Contract Evolution guide](../grpc/PROTOBUF-CONTRACT-EVOLUTION.md).

## JSON Schema

JSON Schema validates JSON instance shape, types, required, additional properties, combinations and formats as
implemented. Unknown-property policy, numeric precision, null, defaults (often annotations rather than mutation),
format enforcement and `$ref` resolution vary by tooling. Test exact serializer/validator/gateway.

## AsyncAPI

AsyncAPI can describe channels/operations/messages/security/bindings across event systems and improve portals/codegen.
Broker-specific bindings represent topic/partition/group details, but runtime semantics still need governance and tests.

## Safe Evolution And Migration

- deploy tolerant consumers before producers emit new required semantics;
- add optional/defaulted fields without changing existing meaning;
- maintain old and new representations during overlap;
- use new event type/topic when semantics/ownership/key/order fundamentally change;
- translate/upcast at a controlled boundary, preserve original immutable record and transformation version;
- measure consumer schema/version usage and replay oldest retained data;
- retire only after consumers, stored data and recovery paths are safe.

Dual publishing can diverge; define atomic source/outbox, reconciliation and stop criteria. Topic migration changes
offsets, ACLs, quotas, retention, keys and operational ownership—not only schema.

## Breaking Semantic Examples

- amount changes cents to dollars without field/type change;
- timestamp changes occurred-at to processed-at;
- key changes order ID to customer ID, altering ordering/hot partitions;
- enum “CANCELLED” meaning changes before all consumers;
- field becomes encrypted/tokenized and old consumers cannot interpret;
- deletion event removed while replay can resurrect data.

## Interview Questions

**Backward versus forward?** Backward lets new readers consume old data; forward lets old readers consume new data.
Use deployment direction and retained replay window to choose.

**Why use a registry?** Central version/ID/reference/compatibility and client integration; it does not provide semantic
governance, consumer ownership or guaranteed safe rollout by itself.

**Schema version in payload or registry ID?** Registry ID identifies encoding schema; semantic/event version may still
be useful for domain behavior. Avoid inconsistent duplicate version sources.

## Official References

- [Apache Avro schema resolution](https://avro.apache.org/docs/current/specification/#schema-resolution)
- [Protocol Buffers updating message types](https://protobuf.dev/programming-guides/proto3/#updating)
- [JSON Schema](https://json-schema.org/)
- [AsyncAPI Specification](https://www.asyncapi.com/docs/reference/specification/latest)

## Recommended Next

Continue with [Governance Operating Model, Security, Tooling, And Production Operations](./CONTRACT-GOVERNANCE-OPERATIONS.md).

