---
title: Networking, gRPC, And Service Mesh
difficulty: Advanced
page_type: Concept
status: Generic
keywords: [DNS, TCP, TLS, HTTP2, HTTP3, gRPC, service mesh, Istio, Linkerd, mTLS]
learning_objectives: [Trace a request through network layers, Choose REST gRPC or asynchronous messaging, Evaluate service-mesh benefits and failure modes]
technologies: [HTTP, gRPC, TLS, Istio, Linkerd]
last_reviewed: "2026-07-12"
---

# Networking, gRPC, And Service Mesh

A request normally crosses DNS resolution, connection establishment, TLS,
load-balancing/proxy hops, protocol parsing, application queues, and dependencies.
Each layer adds latency, limits, caching, retries, and failure modes.

## Protocol Layers

- **DNS:** cached name-to-address discovery with TTL and stale-record behavior.
- **TCP:** ordered byte stream, congestion control, handshakes, retransmission,
  head-of-line blocking, keepalive, and ephemeral-port constraints.
- **TLS:** identity, encryption, handshake cost, certificate rotation, and trust roots.
- **HTTP/1.1:** familiar, but parallelism often uses multiple connections.
- **HTTP/2:** multiplexed streams and header compression over one TCP connection.
- **HTTP/3:** HTTP over QUIC/UDP, avoiding TCP-level cross-stream blocking.

Connection pooling and reuse usually matter more than micro-optimizing payload
parsing. Set connect, TLS, request, idle, and total deadlines deliberately.

## gRPC

gRPC uses Protobuf contracts and HTTP/2 for unary and streaming calls. It is a
strong fit for typed internal APIs, low-overhead communication, and bidirectional
streams. Browser/public compatibility, debugging, proxy support, schema evolution,
load balancing, and deadline propagation require deliberate design.

Always propagate deadlines and cancellation, map status codes consistently,
limit message sizes, control streams, and make retries idempotent. Health,
reflection, observability, and generated-code versioning belong in the platform.

| Need | Start with |
|---|---|
| public resource API and broad tooling | REST/HTTP |
| typed internal unary/streaming RPC | gRPC |
| decoupled replayable state change | event/message broker |
| browser server-to-client updates | SSE or WebSocket |

## Service Mesh

A mesh places proxies or node-level data planes around service traffic and adds
mTLS identity, telemetry, traffic policy, and authorization. Istio offers broad
policy/routing features; Linkerd emphasizes a smaller focused model. Product
details evolve—evaluate current supported versions and operational fit.

Benefits are consistency and central policy. Costs include more hops, CPU/memory,
configuration, certificate/control-plane failure modes, debugging layers, and the
risk of retries multiplying across application, proxy, gateway, and client.

Define one retry owner per call, budgets and deadlines, outlier handling, circuit
breaking, connection limits, and mTLS identity. A mesh cannot fix non-idempotent
operations, missing authorization, poor SLOs, or a saturated database.

## Recommended Next Page

Continue with [Asynchronous And Real-Time Systems](./ASYNC-REALTIME-DISTRIBUTED-TIME.md).
