---
title: TKGI Production Platform Operations Path
description: Production TKGI learning path covering installation foundations, plans and sizing, networking and load balancers, upgrades, backup and disaster recovery, telemetry and sinks, incidents, commands, and interview revision.
difficulty: Advanced
page_type: Learning Path
status: Generic
prerequisites: [TKGI control-plane architecture, Kubernetes operations, BOSH fundamentals]
learning_objectives: [Design a production TKGI foundation, Size and network clusters, Upgrade and recover safely, Build evidence-driven operations, Answer platform interview scenarios]
technologies: [TKGI 1.25, Operations Manager, BOSH, vSphere, NSX, Antrea, BBR, Velero, Fluent Bit, Telegraf]
last_reviewed: "2026-07-28"
---

# TKGI Production Platform Operations Path

This track continues after [TKGI Control Plane Architecture](./TKGI-CONTROL-PLANE-ARCHITECTURE.md).
It covers the production lifecycle around that architecture: prerequisites, deployment,
capacity, networking, upgrades, recovery, observability and incident response.

## Production Lifecycle

```mermaid
flowchart LR
  Design["Design prerequisites and failure domains"] --> Install["Install Ops Manager, BOSH and TKGI"]
  Install --> Plan["Define plans, profiles and capacity"]
  Plan --> Network["Expose APIs and workload traffic"]
  Network --> Operate["Monitor, patch and support clusters"]
  Operate --> Upgrade["Upgrade control plane and clusters"]
  Operate --> Backup["Back up and test restoration"]
  Upgrade --> Operate
  Backup --> Recover["Recover component, cluster or site"]
  Recover --> Operate
```

## Read In Order

1. [Installation Foundations And Platform Topology](./TKGI-INSTALLATION-FOUNDATION.md)
2. [Plans, Profiles, VM Sizing And Capacity](./TKGI-PLANS-SIZING-CAPACITY.md)
3. [Networking, NSX, Antrea And Load Balancers](./TKGI-NETWORKING-LOAD-BALANCERS.md)
4. [Upgrade Architecture And Lifecycle](./TKGI-UPGRADE-LIFECYCLE.md)
5. [Backup, Restore And Disaster Recovery](./TKGI-BACKUP-RESTORE-DR.md)
6. [Telemetry, Sinks And Observability](./TKGI-TELEMETRY-SINKS-OBSERVABILITY.md)
7. [Production Incidents, CLI And Interview Revision](./TKGI-PRODUCTION-INCIDENT-REVISION.md)

## Ownership Map

| Concern | Authoritative workflow/evidence |
|---|---|
| product configuration | Management Console or Operations Manager plus applied product config |
| infrastructure mappings | BOSH global/named cloud config and CPI/IaaS evidence |
| cluster lifecycle | TKGI API/broker state and BOSH deployment tasks |
| Kubernetes workloads | workload-cluster API, controllers and application SLIs |
| NSX networking | TKGI network profile, NSX Proxy Broker and NSX realization state |
| backups | supported BBR/Velero workflow plus independently verified restore artifacts |
| logs and metrics | configured sink resources, agents, destination and end-to-end delivery |

## Completion Standard

You should be able to design prerequisites; calculate node and IP capacity; explain every
load-balancer path; choose full versus staged upgrades; recover management, cluster and
workload layers; prove telemetry delivery; and diagnose a failed lifecycle operation using
correlated TKGI, BOSH, NSX, IaaS and Kubernetes evidence.

## Version Boundary

Concrete values and product behavior are anchored to TKGI 1.25 documentation. Validate
the exact release notes, compatibility matrix and installed tile before changing a real
environment.

