---
title: TLS, Certificates, HTTP/1.1, And HTTP/2 Diagnosis
description: Trace TLS 1.2/1.3, PKI chains, hostname validation, SNI, ALPN, mTLS, rotation, HTTP semantics, HTTP/2 frames, streams, flow control, and failures.
difficulty: Advanced
page_type: Deep Dive
status: Generic
prerequisites: [TCP Connection Diagnosis]
learning_objectives: [Explain secure connection negotiation, Diagnose certificates and trust, Operate HTTP/2 pools and streams safely]
technologies: [TLS 1.3, X.509, HTTP/1.1, HTTP/2]
last_reviewed: "2026-07-24"
---

# TLS, Certificates, HTTP/1.1, And HTTP/2 Diagnosis

## TLS Goals And Handshake

TLS authenticates peers (normally server, optionally client), negotiates algorithms/keys and provides
confidentiality/integrity. TLS 1.3 reduces handshake round trips and removes legacy algorithms.

Conceptually:

```text
ClientHello: versions, cipher suites, key share, SNI, ALPN
ServerHello: selection and key share
server certificate + proof + Finished
client validation + Finished
encrypted application data
```

Exact messages differ by version/resumption/client authentication. Session resumption reduces cost but has
ticket/key rotation and replay considerations; TLS 1.3 0-RTT data can be replayed and must be restricted to
safe operations.

## Certificate Validation

A client validates time, signature chain to a trusted root, hostname/IP against SAN, key usage/policy,
revocation policy where configured, and algorithm constraints. The server sends leaf plus needed intermediates,
normally not the root. A browser/client may succeed due to cached intermediates while another fails.

SNI tells a multi-tenant endpoint which certificate/site is requested. ALPN negotiates application protocol
such as `h2` or `http/1.1` inside TLS.

```bash
openssl s_client -connect service.example:443 -servername service.example -showcerts -alpn h2
curl -v --http2 https://service.example/
```

Do not use disabled verification (`-k`, trust-all managers) as a production correction. Diagnose chain,
SAN, validity, SNI, trust store, clock and protocol.

## Mutual TLS

mTLS adds client certificate authentication. It proves possession of a private key and chain to accepted
trust, but application authorization must map identity/SAN/SPIFFE-style ID to allowed action. Define issuance,
short lifetime/rotation, revocation, trust-domain federation, private-key protection, audit and behavior during
partial rotation.

## Certificate Rotation

Overlap old/new trust and identities, deploy trust before leaf, observe adoption, rotate endpoints/clients,
then remove old trust after all long-lived connections and rollback windows. Test expired/not-yet-valid, missing
intermediate, wrong SAN and clock skew. Long-lived HTTP/2 connections can keep old certificates until reconnect.

## HTTP/1.1

HTTP messages carry method, target, headers and optional body with defined semantics/caching. Persistent
connections avoid repeated handshakes. Pipelining is rarely broadly used; clients use connection pools for
parallelism. Protect against ambiguous framing/request smuggling across proxies by consistent parsing,
normalization and current implementations.

## HTTP/2 Internals

HTTP/2 multiplexes streams as binary frames over one connection, compresses headers with HPACK and supports
per-stream/connection flow control. Frames include SETTINGS, HEADERS, DATA, WINDOW_UPDATE, RST_STREAM, PING and
GOAWAY. Stream IDs/order and state matter.

Multiplexing removes HTTP/1.1 application-layer request ordering on multiple connections, but TCP packet loss
still stalls all streams on that connection. Flow-control windows, maximum concurrent streams, connection
pools and server queues can limit throughput. One connection can become a concentration/failure domain.

GOAWAY tells peers no newer streams will be processed beyond the last accepted stream; clients should open a
new connection and retry only safe/unprocessed operations. RST_STREAM affects one stream. Connection-level
errors affect all active streams.

## Deadlines, Cancellation, And Retry

Separate connection acquisition, DNS, connect, TLS, request write, response header/read and total deadline.
HTTP/2 stream cancellation does not guarantee downstream side effects stopped. Retry only when method/operation
is idempotent or protected by durable idempotency and when the protocol outcome indicates safety.

## Proxy And Load-Balancer Hops

TLS may terminate and originate at multiple hops. Record client-facing and upstream protocol, SNI, certificate,
header normalization, source identity, timeout, connection reuse and trace propagation. HTTP/2 on the client
side does not imply HTTP/2 upstream. Misaligned idle timeouts cause resets on pooled connections.

## Failure Scenarios

| Symptom | Inspect |
|---|---|
| unknown CA | trust store and complete intermediate chain |
| hostname mismatch | requested host/SNI and SAN, not CN assumptions |
| works with IP but not name | SNI/virtual host/DNS/hostname validation differences |
| HTTP/2 resets | GOAWAY/RST error, stream limits, proxy timeout, deploy/drain |
| large response stalls | HTTP/2 flow control, TCP loss/MTU, application backpressure |
| handshake CPU spike | connection reuse/resumption, synchronized reconnect, cipher/key and DoS |

## Interview Questions

**SNI versus ALPN?** SNI selects server name/virtual identity; ALPN negotiates application protocol.

**Does mTLS replace authorization?** No. It authenticates workload/client identity; policy must authorize actions.

**Does HTTP/2 eliminate head-of-line blocking?** It removes HTTP/1.1 application request serialization, but all
streams share TCP and can stall on packet loss.

## Official References

- [TLS 1.3 — RFC 8446](https://www.rfc-editor.org/rfc/rfc8446)
- [X.509 PKI certificate profile — RFC 5280](https://www.rfc-editor.org/rfc/rfc5280)
- [HTTP semantics — RFC 9110](https://www.rfc-editor.org/rfc/rfc9110)
- [HTTP/2 — RFC 9113](https://www.rfc-editor.org/rfc/rfc9113)

## Recommended Next

Finish with [End-To-End Incidents, Packet Analysis, Labs, Interviews, And Revision](./NETWORK-INCIDENT-LABS-REVISION.md).

