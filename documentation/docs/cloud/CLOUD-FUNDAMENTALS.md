---
title: Cloud Fundamentals
status: "maintained"
last_reviewed: "2026-07-13"
---

# Cloud Fundamentals

## Essential Characteristics

- **On-demand self-service:** provision resources without waiting for manual hardware setup.
- **Broad network access:** reach services through standard network interfaces and APIs.
- **Resource pooling:** providers share physical capacity while isolating customers logically.
- **Rapid elasticity:** add or remove capacity as demand changes.
- **Measured service:** observe and pay for consumption, reservations, or subscriptions.

Cloud does not automatically make a system highly available, secure, or cheap.
Architecture, configuration, operations, and cost controls still matter.

## IaaS, PaaS, SaaS, And Serverless

| Model | Consumer manages | Provider manages | Typical use |
|---|---|---|---|
| On premises | Everything from facilities to application | Nothing | Maximum control or regulatory constraints |
| IaaS | OS, runtime, application, data, most scaling decisions | Facilities, hardware, virtualization | Custom workloads and lift-and-shift migrations |
| PaaS | Application, data, configuration | Infrastructure, OS, runtime platform, much of deployment | Faster application delivery with less platform work |
| FaaS/serverless | Function code, data, permissions, triggers | Servers, runtime fleet, automatic instance scaling | Event-driven and short-lived processing |
| SaaS | Tenant configuration, users, and governed data usage | Complete application and underlying platform | Consume business capability instead of building it |

Examples include virtual machines for **IaaS**, managed application platforms
for **PaaS**, function execution for **FaaS**, and hosted email or CRM for
**SaaS**. A provider can offer all of these; the category describes the division
of responsibility, not the vendor.

## Other Common Cloud Service Categories

| Category | Capability |
|---|---|
| CaaS | Managed container orchestration and execution |
| DBaaS | Managed relational, document, key-value, or analytical databases |
| Storage as a service | Object, block, file, archive, backup, and disaster recovery storage |
| Integration as a service | Queues, event buses, workflows, API management, and data integration |
| Security as a service | Identity, key management, secrets, threat detection, and web protection |
| Observability as a service | Logs, metrics, traces, dashboards, alerts, and incident integrations |
| CDN/edge services | Cache and execute closer to users; protect public endpoints |
| AI/ML as a service | Managed training, inference, foundation models, and AI APIs |

## Deployment Models

- **Public cloud:** provider-operated shared infrastructure with tenant isolation.
- **Private cloud:** cloud-style automation dedicated to one organization.
- **Hybrid cloud:** coordinated private/on-premises and public-cloud systems.
- **Multi-cloud:** workloads or capabilities span multiple cloud providers.

Hybrid and multi-cloud add portability options but also increase networking,
identity, data-consistency, observability, and skills complexity.

## Shared Responsibility

The provider secures the cloud's facilities and managed service foundations.
The customer remains responsible for data classification, identity and access,
network exposure, application security, configuration, backups, recovery tests,
and cost governance. The exact boundary moves upward from IaaS to SaaS.

## Architecture Checklist

1. Define recovery-time and recovery-point objectives before selecting services.
2. Design across failure domains and remove single points of failure.
3. Apply least privilege, encryption, secret rotation, and auditable access.
4. Prefer private connectivity; expose only intentional public entry points.
5. Automate infrastructure, deployment, backup, restore, and policy checks.
6. Monitor user outcomes, saturation, errors, latency, cost, and security signals.
7. Tag resources and assign owners, environments, data classes, and cost centers.
8. Test scaling, dependency failure, restore, and regional recovery procedures.
