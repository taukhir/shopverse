---
title: Non Functional Requirements
---

# Non Functional Requirements

Availability, scalability, reliability, security, operability, and related non-functional requirements.

Back to [HLD And LLD](../HLD-LLD.md).

## Non-Functional Requirements

| Requirement | Example |
|---|---|
| Availability | 99.9% monthly checkout API |
| Latency | p95 checkout acceptance under 500 ms |
| Throughput | 500 peak checkout requests/second |
| Durability | confirmed orders survive instance loss |
| Consistency | no overselling for one inventory item |
| Security | owner-only order access; admin override |
| Recovery | RPO 5 minutes, RTO 30 minutes |
| Observability | trace checkout by correlation ID |

NFRs drive architecture more strongly than service count.





