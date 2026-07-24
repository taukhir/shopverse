---
title: API Contract Lifecycle, OpenAPI, Versioning, And Deprecation
description: Govern HTTP and RPC APIs from design through lint, generation, compatibility, security, consumer testing, versioning, deprecation, retirement, and production telemetry.
difficulty: Advanced
page_type: Deep Dive
status: Generic
prerequisites: [API And Event Schema Governance Path]
learning_objectives: [Design stable API contracts, Automate meaningful compatibility checks, Deprecate and retire versions safely]
technologies: [OpenAPI, REST, gRPC]
last_reviewed: "2026-07-24"
---

# API Contract Lifecycle, OpenAPI, Versioning, And Deprecation

## Design-First Contract

Start with user/business capability, resource/action semantics, invariants, actors, authorization,
idempotency, error and consistency behavior. The machine contract then defines paths/methods or
RPCs, request/response/message schemas, status codes, headers/metadata, security schemes, pagination,
rate and size limits and examples.

OpenAPI is useful for HTTP APIs; Protobuf service definitions for gRPC; GraphQL SDL for GraphQL.
Do not force every protocol into one format that loses its semantics.

## OpenAPI Ownership

Decide design-first versus code-first, but establish one canonical artifact and drift gate. Design-
first enables review/code generation before implementation; code-first can reduce drift with runtime
annotations but may expose implementation and make consumer-first review late.

Validate:

- operation IDs, tags, descriptions and ownership;
- schema names, required/nullable/default and format/constraints;
- error representation and documented statuses;
- auth scheme and per-operation authorization intent;
- idempotency headers and conditional request semantics;
- pagination cursor/order and maximum page;
- examples without secrets or customer data;
- server/environment URLs kept separate from portable contract where appropriate.

## Compatibility Categories

Potentially breaking changes include removing/renaming field/operation/status, adding required input,
narrowing accepted values, changing response type, making output nullable unexpectedly, changing
error/authorization/idempotency/pagination/cache semantics, reducing limits or altering units/meaning.

Adding optional request input or ignorable response fields is often compatible, but strict clients and
generated deserializers may reject unknown fields. Test representative consumers; don't assume Postel's law.

## Versioning

Prefer compatible evolution within a stable version. When semantics cannot remain compatible, choose a
major version strategy such as URI, host, media type/header or protocol package. The choice affects routing,
caching, docs, generated clients and support—not correctness by itself.

Do not create v2 for every additive field. Do not make v2 a forever duplicate implementation. Define
adapter/shared domain strategy and retirement milestones.

## Consumer-Driven Contracts

Provider schema diff proves structural rules; consumer contracts prove selected expectations. They do not
prove every consumer, semantics, load, security or runtime availability. Register consumers/owners, verify
contracts in provider CI and retire stale contracts with usage evidence.

## Errors

Standardize stable machine code, human-safe detail, correlation/trace reference, field violations and
retryability without stack/internal leakage. HTTP status or gRPC status is part of behavior. Clients should
not parse free-text messages. Evolve error codes with the same discipline as success schemas.

## Deprecation Lifecycle

1. Publish deprecation, reason, replacement, migration guide, owner, support window and sunset.
2. Add protocol signals where supported and documentation/client warnings.
3. Inventory consumers through registration plus runtime telemetry—not only repository search.
4. Provide compatibility adapter and migration tests.
5. Contact owners and track adoption/SLO/error.
6. Block new consumers on deprecated version.
7. Remove only after zero/approved residual use and rollback window.

Usage telemetry must distinguish endpoint/version/client identity safely and avoid high-cardinality user data.

## Security Governance

Review mass assignment/over-posting, field-level authorization, sensitive response fields, tenant identifier,
resource enumeration, unbounded query/body, SSRF/file/URL fields, webhook signatures, replay/idempotency, rate/
complexity limits and error leakage. Generated SDKs must not embed credentials or log bodies by default.

## CI Gates

```text
format/lint -> schema validation -> breaking diff against released baseline
 -> security/style/ownership policy -> examples/tests -> stub/docs generation
 -> provider/consumer compatibility -> artifact/sign/provenance -> publish portal/registry
```

Allow reviewed exceptions with owner, expiry and migration—not permanent ignore files.

## Interview Questions

**Is adding a response field safe?** Usually for tolerant clients, but strict generated/manual clients may fail;
test the consumer ecosystem and document unknown-field policy.

**How do you version APIs?** Prefer compatible evolution; introduce major version only when semantic/structural
break is unavoidable, then operate adoption and retirement with telemetry.

## Official References

- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
- [HTTP semantics](https://www.rfc-editor.org/rfc/rfc9110)
- [Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457)
- [Sunset header](https://www.rfc-editor.org/rfc/rfc8594)

## Recommended Next

Continue with [Event Contracts, Schema Registry, Avro, Protobuf, And JSON Schema](./EVENT-SCHEMA-REGISTRY-GOVERNANCE.md).

