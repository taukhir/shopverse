---
title: DNS Resolution, Caching, Discovery, And Diagnosis
description: Trace stub, recursive and authoritative DNS, records, TTL, negative caching, split horizon, DNSSEC, Kubernetes DNS, failures, and safe diagnostics.
difficulty: Advanced
page_type: Deep Dive
status: Generic
prerequisites: [Network Protocol Diagnosis Path]
learning_objectives: [Explain DNS resolution and caching, Design resilient service naming, Diagnose DNS failures precisely]
technologies: [DNS, CoreDNS, Kubernetes]
last_reviewed: "2026-07-24"
---

# DNS Resolution, Caching, Discovery, And Diagnosis

## Resolution Path

An application may use a language/runtime cache and OS name-service switch. A stub resolver asks
a recursive resolver; on cache miss it follows root, TLD and authoritative delegation. Each layer
can cache positive or negative results.

```text
application/runtime cache
 -> libc/system resolver and hosts/NSS
 -> local/network recursive resolver
 -> root -> TLD -> authoritative server
 -> answer + TTL -> caches -> application
```

`getent hosts` follows system name-service configuration; `dig` directly queries DNS. If they
differ, inspect `/etc/nsswitch.conf`, resolver service, search domains, runtime cache and hosts file.

## Records

| Record | Purpose and caution |
|---|---|
| A / AAAA | IPv4/IPv6 address; dual-stack fallback behavior matters |
| CNAME | alias to another name; cannot coexist with certain data at same owner |
| NS / SOA | zone authority and operational metadata |
| MX | mail routing |
| TXT | verification/policy; large sets affect responses |
| SRV | service target/port/priority/weight |
| PTR | reverse mapping |
| CAA | restrict certificate-authority issuance policy |

## TTL, Staleness, And Failover

TTL controls cache lifetime, not guaranteed instant expiration across every runtime/proxy. Very low
TTL increases authoritative/recursive load and still cannot ensure zero-downtime failover; very high
TTL extends stale routing. Pre-lower TTL before a planned migration, monitor adoption, keep old targets
available for the compatibility window and validate recursive resolver behavior.

Negative answers can be cached. A record created after an `NXDOMAIN` may remain unavailable until
negative TTL expires. SERVFAIL, timeout and NXDOMAIN have different causes and cache behavior.

## Recursion, Delegation, And Glue

Authoritative servers answer for zones; recursive resolvers perform client recursion and caching.
Delegation uses NS records in the parent. Glue addresses break circular dependency when nameserver
names are inside the delegated zone. Diagnose lame delegation, missing glue, inconsistent serials,
DNSSEC validation and reachability across multiple authoritative servers.

## UDP, TCP, EDNS, And DNSSEC

DNS commonly uses UDP but can retry over TCP when truncated; zone transfers use TCP. EDNS permits
larger messages and options, but fragmentation/firewall behavior can cause intermittent failures.
DNSSEC provides origin authentication/integrity through a chain of trust; expired signatures,
bad delegation records or clock errors can turn valid-looking records into validation failure.

## Split-Horizon And Search Domains

Internal and external clients may receive different answers. VPN, resolver order, cache and forwarding
rules matter. Search suffixes and `ndots` can create multiple queries and latency. Always test the exact
fully qualified name and from the affected network/namespace.

## Kubernetes DNS

Pods normally query cluster DNS such as CoreDNS. Service names map to ClusterIP or headless endpoints.
Understand namespace search paths, headless records, EndpointSlice updates, NodeLocal DNSCache, CoreDNS
forwarders, autoscaling and network policy. High query amplification or overloaded upstream can affect
the whole cluster.

## Diagnostic Workflow

```bash
getent ahosts service.example
resolvectl query service.example
dig service.example A
dig @<resolver> service.example A +noall +answer +authority
dig service.example A +trace
dig service.example A +dnssec
```

1. Record exact name, type, client location/namespace, time and error.
2. Compare runtime/OS resolution with direct configured resolver query.
3. Inspect answer, status, TTL, authoritative/recursive flags and latency.
4. Compare multiple resolvers and authoritative servers.
5. Check delegation, DNSSEC, packet size/truncation/TCP and recent record change.
6. Correlate resolved addresses with route/load balancer/service endpoints.

Do not use public resolvers for private names or leak sensitive query names without approval.

## Failure Scenarios

**Some pods fail after service replacement:** runtime/CoreDNS caches, EndpointSlice propagation or stale
connection pools. Compare DNS answer/TTL and actual connection target per pod.

**Works with `dig`, fails in application:** application JVM cache, NSS/search domain, IPv6 preference,
proxy, container namespace or different resolver. Reproduce with application resolution path.

**Intermittent large DNS failures:** EDNS/UDP fragmentation or firewall; inspect truncation, retries and
packet evidence, then correct MTU/firewall/resolver behavior rather than forcing a universal workaround.

## Interview Questions

**Recursive versus authoritative DNS?** Recursive resolves on behalf of clients and caches; authoritative
serves the source records for its zones.

**Why does a DNS change not take effect immediately?** Positive/negative caches across resolver/runtime
retain previous result until policy/TTL, and existing connections may continue to old targets.

## Official References

- [DNS concepts — RFC 1034](https://www.rfc-editor.org/rfc/rfc1034)
- [DNS implementation — RFC 1035](https://www.rfc-editor.org/rfc/rfc1035)
- [Kubernetes DNS](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/)
- [CoreDNS manual](https://coredns.io/manual/toc/)

## Recommended Next

Continue with [TCP Connections, Reliability, Congestion, NAT, And Sockets](./TCP-CONNECTION-DIAGNOSIS.md).

