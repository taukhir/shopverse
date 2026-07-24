---
title: Network Diagnosis Incidents, Labs, Interviews, And Revision
description: Diagnose end-to-end DNS, TCP, TLS, HTTP/2, proxy, load-balancer and Kubernetes failures using timing, sockets, packet capture, labs, and a revision sheet.
difficulty: Advanced
page_type: Interview Guide
status: Generic
prerequisites: [TLS And HTTP2 Diagnosis]
learning_objectives: [Run evidence-led network triage, Complete safe protocol labs, Answer production networking interviews]
technologies: [DNS, TCP, TLS, HTTP/2, Wireshark, tcpdump]
last_reviewed: "2026-07-24"
---

# Network Diagnosis Incidents, Labs, Interviews, And Revision

## End-To-End Diagnostic Sequence

1. Capture exact client, destination name/URL, time, network/namespace and error.
2. Separate DNS, pool wait, connect, TLS, write, first-byte, download and server spans.
3. Resolve using application/OS path and direct resolver; record returned addresses/TTL.
4. Confirm route, selected load-balancer/backend, socket state and listener.
5. Inspect TLS SNI/ALPN/chain/hostname/time and negotiated protocol.
6. Correlate client, proxy and server logs/traces with connection/stream identifiers.
7. Use bounded packet capture only when higher-level evidence cannot decide.
8. Contain, correct the owning layer, then verify existing and new connections.

## Timing Command Example

```bash
curl --silent --show-error --output /dev/null \
  --connect-timeout 2 --max-time 10 \
  --write-out 'dns=%{time_namelookup} connect=%{time_connect} tls=%{time_appconnect} first=%{time_starttransfer} total=%{time_total}\n' \
  https://service.example/health
```

The client tool itself has DNS/cache/proxy/protocol behavior; correlate with application metrics.

## Production Scenarios

**Only one region fails hostname resolution.** Compare resolver/forwarder/authoritative reachability,
split-horizon view, DNSSEC, cache status, network policy and recent zone change from that region.

**Connection timeouts rise during deployment.** Inspect readiness/endpoints, LB drain, SYN/SYN-ACK,
server backlog, CPU/throttling and connection storm. Stop rollout, restore capacity/drain and align
pool/lifecycle.

**TLS fails after rotation for some clients.** Compare trust stores, intermediate chain, SNI, SAN,
clock, protocol and existing connection reuse. Restore overlap/chain, then update and measure adoption.

**HTTP/2 works directly but not through proxy.** Verify ALPN and protocol on each hop, proxy support,
header/framing/stream limits, idle timeout and whether upstream was downgraded.

**Small calls work, large responses hang.** Investigate MTU/PMTUD, flow-control windows, TCP loss,
proxy/body limits and application backpressure using filtered packet and HTTP/2 evidence.

**Latency spikes but no packet loss.** Check DNS/cache misses, pool acquisition, TLS reconnects,
proxy queues, server first byte, HTTP/2 stream limits/flow control and downstream spans.

## Packet-Analysis Questions

- Did client send SYN and receive SYN-ACK? Which direction loses packets?
- Was handshake retransmitted and what is RTT?
- Did TLS alert occur, and from which peer?
- Which certificate/SNI/ALPN was negotiated?
- Are TCP retransmissions, duplicate ACK/SACK or zero windows present?
- Did server send FIN/RST/GOAWAY, and were requests accepted before it?
- Are captures taken on both sides of NAT/proxy showing address translation?

Packet timestamps can be affected by capture point/offload/clock. Encrypted payload limits application
inspection; use TLS key logging only in authorized isolated labs.

## Hands-On Labs

1. Build authoritative and caching DNS containers; change TTL and observe positive/negative cache.
2. Introduce wrong search suffix, stale runtime cache and split-horizon response; diagnose each.
3. Capture a TCP handshake, intentional packet loss/retransmission, graceful FIN and RST.
4. Exhaust a small local ephemeral-port/NAT test range safely and prove connection reuse correction.
5. Create a CA/intermediate/server certificate; test missing chain, wrong SAN, expiry and mTLS.
6. Run HTTP/1.1 and HTTP/2 servers; measure multiplexing, stream limits, GOAWAY and connection drain.
7. Create an MTU black-hole lab in isolated namespaces and diagnose small-versus-large behavior.
8. Trace one request through client, proxy and server with DNS/TCP/TLS/HTTP/application timings.

## Top Interview Questions

**Timeout versus connection refused?** Timeout often means drop/unreachable/overloaded handshake; refusal
usually means reachable host/port actively rejects or lacks listener. Verify packets and LB/proxy behavior.

**Why can retry worsen a network incident?** It multiplies connection/DNS/TLS/server load, especially across
layers. Use bounded jitter, deadlines, idempotency, admission and one retry owner.

**How do you rotate certificates without downtime?** Deploy overlapping trust, issue/deploy new leafs,
refresh long-lived connections/clients, observe adoption, then revoke/remove old trust with rollback window.

## One-Page Revision

- DNS answers are cached at multiple layers; TTL does not close existing connections.
- TCP is ordered bytes; ACK is transport receipt, not business completion.
- Flow control protects receiver; congestion control protects network.
- `TIME_WAIT` is normal correctness state; `CLOSE_WAIT` often signals local close leak.
- NAT/LB connection tracking and ephemeral ports are shared finite resources.
- TLS validates chain, time, SAN/hostname, usage and trust; SNI selects name, ALPN protocol.
- mTLS authenticates identity; authorization remains separate.
- HTTP/2 multiplexes streams but shares TCP loss and connection/flow-control limits.
- Diagnose layer timings and both sides before tuning.
- Packet captures are sensitive, scoped evidence—not a default production action.

## Official References

- [Wireshark User's Guide](https://www.wireshark.org/docs/wsug_html_chunked/)
- [curl timing variables](https://curl.se/docs/manpage.html)
- [Kubernetes Services and networking](https://kubernetes.io/docs/concepts/services-networking/)

## Recommended Next

Return to the [DNS, TCP, TLS, And HTTP/2 Diagnosis Path](../NETWORK-PROTOCOL-DIAGNOSIS-PATH.md) and complete an end-to-end timed trace.
