---
title: TCP Connections, Congestion, NAT, And Socket Diagnosis
description: Understand TCP state, sequence and acknowledgement, retransmission, flow and congestion control, keepalive, queues, ports, NAT, load balancers, and packet evidence.
difficulty: Advanced
page_type: Deep Dive
status: Generic
prerequisites: [DNS Resolution Diagnosis]
learning_objectives: [Trace TCP connection lifecycle, Explain latency and loss behavior, Diagnose socket and port failures]
technologies: [TCP, Linux sockets, NAT]
last_reviewed: "2026-07-24"
---

# TCP Connections, Congestion, NAT, And Socket Diagnosis

## Connection Lifecycle

TCP provides an ordered reliable byte stream, not messages. A connection is identified by source/
destination address and port plus protocol. The three-way handshake synchronizes sequence state:

```text
client -> SYN(seq=x)
server -> SYN-ACK(seq=y, ack=x+1)
client -> ACK(ack=y+1)
```

TLS and application protocol begin afterward unless reused/combined by newer transport mechanisms.
Connection setup latency includes routing/NAT/LB and possible retransmission.

## Reliability And Ordering

Bytes are sequenced and acknowledged. Lost segments are retransmitted; out-of-order bytes are held until
gaps are filled, creating head-of-line blocking for all application bytes in that TCP connection. RTT,
retransmission timeout and duplicate/selective acknowledgements influence recovery.

An application write can be accepted into a local socket buffer without the peer application processing
it. A TCP ACK confirms receipt by the peer TCP stack, not a database commit or business success.

## Flow Versus Congestion Control

Receiver flow control advertises how much buffer it can accept. Congestion control limits in-flight data
based on inferred network capacity/loss/ECN. Effective sending is bounded by both receive window and
congestion window. Bandwidth-delay product explains why long fat networks require enough window/in-flight
data. Packet loss on high-latency paths can severely reduce throughput.

## Queues And Backlogs

Server listen/SYN/accept queues, socket send/receive buffers, NIC queues, qdisc, load balancer and application
queues all matter. A listening socket does not prove the application accepts fast enough. Connection refused
usually means reachable endpoint has no listener/reject; timeout suggests drop, routing, overloaded handshake,
or unreachable path—but verify packet evidence.

## Close And States

TCP closes each direction with FIN/ACK; RST aborts. `TIME_WAIT` protects against delayed old segments and
normally resides on the active closer. Many TIME_WAIT sockets may be normal for short connections but can
contribute to ephemeral-port pressure when reuse/pooling is poor.

```bash
ss -s
ss -tanp
ss -ti dst <ip>
cat /proc/net/sockstat
```

`CLOSE_WAIT` means the peer closed but local application has not closed its socket—often an application leak.
`SYN_SENT`/`SYN_RECV` concentrations point toward path/server handshake problems.

## Ephemeral Ports And NAT

Outbound connections use ephemeral source ports. Unique destination tuple, TIME_WAIT, connection rate and
local range constrain reuse. NAT/load balancers also maintain connection tracking and port mappings; many
clients behind one translated address can exhaust shared capacity. Prefer connection reuse/pools and scale
NAT addresses/ports from measured flows rather than unsafe TIME_WAIT tuning.

## Keepalive, Idle Timeout, And Pooling

TCP keepalive detects dead idle peers on a long timescale; application heartbeats/HTTP keepalive serve
different semantics. Every intermediary may have an idle timeout. A pool can hand out a half-closed/stale
connection if validation/expiry is misaligned. Set connection lifetime/idle validation below infrastructure
limits with jitter to avoid synchronized reconnects.

## MTU And Path MTU

Oversized packets require fragmentation or Path MTU Discovery. Blocked ICMP can create black holes where
small requests work but large responses stall. Tunnels/service meshes reduce effective MTU. Inspect interface,
route and packet sizes; correct network MTU/ICMP rather than lowering arbitrary application buffers blindly.

## Packet Diagnosis

Capture only with approval, minimal interface/host/port/duration and protected files:

```bash
tcpdump -i any -nn -s 0 -c 500 'host 10.0.0.10 and port 443'
```

Look for handshake timing, retransmissions, duplicate ACK/SACK, zero window, resets, FIN behavior, RTT and which
side stops. Packet payloads may contain credentials/PII even under some internal plaintext traffic.

## Failure Scenarios

**Connect timeout:** verify DNS address, SYN leaving, SYN-ACK returning, route/NAT/firewall/LB and server backlog.

**Fast connect, slow first byte:** TCP/TLS finished; inspect proxy/application queue, downstream work and HTTP
timing/traces rather than TCP tuning first.

**Random reset under reuse:** intermediary/server idle timeout, deploy/drain, protocol error or application abort.
Compare connection age and packet direction; align pool lifecycle and graceful drain.

**Throughput low, CPU idle:** RTT/loss/congestion window, receiver window, serialized application protocol or single
stream. Inspect `ss -ti`, packet retransmission and bandwidth-delay limits.

## Interview Questions

**TCP ACK means request processed?** No. It means bytes reached the peer TCP stack; application/business durability
needs an application response/acknowledgement.

**Flow versus congestion control?** Flow protects receiver buffer; congestion protects network path.

**Why many CLOSE_WAIT?** Remote closed and local process failed to close, usually resource-leak/error-path behavior.

## Official References

- [TCP — RFC 9293](https://www.rfc-editor.org/rfc/rfc9293)
- [TCP congestion control — RFC 5681](https://www.rfc-editor.org/rfc/rfc5681)
- [Linux TCP manual](https://man7.org/linux/man-pages/man7/tcp.7.html)

## Recommended Next

Continue with [TLS Handshakes, Certificates, HTTP/1.1, And HTTP/2](./TLS-HTTP2-DIAGNOSIS.md).

