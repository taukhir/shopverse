---
title: gRPC And Protobuf Architect Interview, Labs, And Revision
description: Practise protocol design, reliability and production scenarios, build hands-on labs, compare alternatives, and revise gRPC and Protobuf rapidly.
difficulty: Advanced
page_type: Interview Guide
status: Generic
prerequisites: [Spring gRPC Production]
learning_objectives: [Answer architect gRPC interviews, Complete compatibility and streaming labs, Defend protocol trade-offs]
technologies: [gRPC, Protocol Buffers, Spring gRPC]
last_reviewed: "2026-07-24"
---

# gRPC And Protobuf Architect Interview, Labs, And Revision

## Top Interview Questions

**gRPC versus REST versus Kafka?** gRPC for typed low-latency internal unary/streaming RPC, REST for broad
HTTP ecosystem/public resources, Kafka for durable replayable decoupled events. Choose per interaction.

**How do you evolve Protobuf safely?** Add new numbered fields, preserve semantics, reserve removed numbers/
names, handle unknown enum/fields, test generated APIs and JSON/transcoding, govern breaking changes.

**What happens when a deadline expires?** Client stops waiting/cancels locally; server may have completed or
committed. Cancellation is cooperative and does not roll back. Mutations need idempotency/status reconciliation.

**How do you backpressure streaming?** HTTP/2 stream/connection flow control plus language readiness/demand,
bounded application buffers, cancellation and slow-consumer policy.

**Why can one channel become a bottleneck?** HTTP/2 stream limits, connection flow control/TCP loss, LB policy,
server concentration or channel queue. Reuse channels but measure whether multiple connections are needed.

**Should every error be `INTERNAL`?** No. Stable canonical statuses and structured details drive client retry/
user behavior; internal is for unexpected non-disclosed failure.

## Architect Scenarios

**Payment RPC times out, then retry duplicates charge.** Stop unsafe retry, query/reconcile by idempotency key,
make charge command idempotent with operation status, propagate deadline and retry only uncommitted/transient path.

**New enum crashes old client.** Old generated code assumed exhaustive known values. Restore tolerant handling,
add unspecified/unknown path and compatibility gate; never require simultaneous rollout.

**Bidirectional stream reconnect loses messages.** Define application sequence/checkpoint/ack, resume token,
deduplication and retention; TCP/gRPC stream alone does not provide durable replay.

**Proxy migration breaks gRPC streaming.** Validate end-to-end HTTP/2, idle/max-age, request/response streaming,
flow control, message size, GOAWAY/drain and TLS ALPN on each hop; canary long-lived streams.

**Need public browser clients.** Evaluate gRPC-Web/transcoding and proxy support versus REST. Account for streaming
limitations, CORS, JSON compatibility, error mapping, tooling and independent public contract governance.

## Hands-On Labs

1. Define v1 order service/messages and generate Java code reproducibly.
2. Add optional field/enum value, remove/reserve field and run breaking/compatibility checks.
3. Implement unary and all three streaming shapes with Spring gRPC.
4. Propagate deadline/cancellation through a downstream call and prove committed work is not rolled back.
5. Add TLS, mTLS/OAuth metadata, authorization interceptor and certificate rotation.
6. Inject UNAVAILABLE/GOAWAY/slow consumer; measure retry attempts, stream flow and channel behavior.
7. Run old/new client/server matrix and ProtoJSON/transcoding compatibility tests.
8. Gracefully drain long-lived streams during rolling deployment and resume from checkpoint.

## Evidence Checklist

- schema lint/breaking report and released baseline;
- deterministic generated artifact/provenance;
- old/new client/server compatibility matrix;
- deadline, cancellation, idempotency and error-status tests;
- stream memory/backpressure/reconnect evidence;
- channel/HTTP2/TLS/load-balancer metrics under load;
- authentication/authorization/tenant and rotation tests;
- graceful shutdown and ambiguous-outcome reconciliation;
- REST/Kafka alternative decision and reconsideration trigger.

## One-Page Revision

- Field number is binary identity; never reuse; reserve removed name/number.
- Presence differs from default; use optional/oneof/FieldMask deliberately.
- Unknown-field binary behavior can be lost through JSON/intermediate systems.
- Channel is long-lived resolver/LB/HTTP2 connectivity; stub defines typed call style.
- Unary, server-stream, client-stream and bidi have different state/backpressure semantics.
- Deadline/cancel do not roll back side effects; client/server outcomes can disagree.
- Canonical status and structured details are a versioned client contract.
- Retry needs idempotency, status classification, jitter, throttle and overall deadline.
- HTTP/2 flow control and max streams bound concurrency; TCP loss still affects connection.
- Spring gRPC adapters map transport to domain; test real TLS/network and mixed versions.

## Official References

- [gRPC guides](https://grpc.io/docs/guides/)
- [Protocol Buffers best practices](https://protobuf.dev/best-practices/dos-donts/)
- [Spring gRPC testing](https://docs.spring.io/spring-grpc/reference/server.html#testing)

## Recommended Next

Return to the [gRPC And Protocol Buffers Architect Path](../GRPC-PROTOBUF-ARCHITECT-PATH.md) and complete the compatibility plus failure labs.
