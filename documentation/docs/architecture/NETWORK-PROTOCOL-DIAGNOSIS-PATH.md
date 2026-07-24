---
title: DNS, TCP, TLS, And HTTP/2 Diagnosis Path
description: Complete network path from name resolution through TCP, TLS, HTTP/1.1, HTTP/2, proxies, load balancers, packet evidence, incidents, labs, and interviews.
difficulty: Advanced
page_type: Learning Path
status: Generic
prerequisites: [HTTP fundamentals, Linux command-line fundamentals]
learning_objectives: [Trace an application request through network layers, Diagnose protocol failures from evidence, Design deadlines pools and secure connectivity]
technologies: [DNS, TCP, TLS, HTTP/1.1, HTTP/2]
last_reviewed: "2026-07-24"
---

# DNS, TCP, TLS, And HTTP/2 Diagnosis Path

“The network is slow” is not a diagnosis. A request can wait in name resolution,
connection acquisition, TCP handshake/retransmission, TLS negotiation, proxy queues,
HTTP stream limits, application queues or downstream processing.

```mermaid
flowchart LR
  URL["URL/service name"] --> DNS["DNS resolution and cache"]
  DNS --> Route["Route, NAT, load balancer"]
  Route --> TCP["TCP connect, congestion, retransmit"]
  TCP --> TLS["TLS identity and keys"]
  TLS --> HTTP["HTTP/1.1 or HTTP/2"]
  HTTP --> Proxy["Proxy/service/application"]
  Proxy --> Evidence["Timing, sockets, traces, packets"]
```

## Complete Route

1. [DNS Resolution, Caching, Discovery, And Failures](./networking/DNS-RESOLUTION-DIAGNOSIS.md)
2. [TCP Connections, Reliability, Congestion, NAT, And Sockets](./networking/TCP-CONNECTION-DIAGNOSIS.md)
3. [TLS Handshakes, Certificates, HTTP/1.1, And HTTP/2](./networking/TLS-HTTP2-DIAGNOSIS.md)
4. [End-To-End Incidents, Packet Analysis, Labs, Interviews, And Revision](./networking/NETWORK-INCIDENT-LABS-REVISION.md)

## Timing Vocabulary

Track separately: DNS, connection-pool acquisition, TCP connect, TLS handshake, request
write/upload, time to first byte, response download, application/dependency spans and total
deadline. A single “request latency” hides the failing layer.

## Completion Standard

You can explain recursive DNS and TTL, TCP state/retransmission/congestion and ephemeral ports,
TLS chain/SNI/ALPN/mTLS/rotation, HTTP connection reuse and HTTP/2 streams/flow control, then use
system/application/packet evidence to diagnose failures without disabling certificate checks or
randomly tuning the kernel.

## Official References

- [IETF DNS terminology — RFC 8499](https://www.rfc-editor.org/rfc/rfc8499)
- [TCP specification — RFC 9293](https://www.rfc-editor.org/rfc/rfc9293)
- [TLS 1.3 — RFC 8446](https://www.rfc-editor.org/rfc/rfc8446)
- [HTTP/2 — RFC 9113](https://www.rfc-editor.org/rfc/rfc9113)

## Recommended Next

Begin with [DNS Resolution, Caching, Discovery, And Failures](./networking/DNS-RESOLUTION-DIAGNOSIS.md).

