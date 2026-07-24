---
title: Cloud And AWS Revision Sheet
description: Rapid revision of cloud responsibility, networking, compute, storage, databases, events, high availability, security, and cost.
difficulty: Advanced
page_type: Interview
status: Generic
prerequisites: [Cloud Computing]
learning_objectives: [Recall cloud architecture concepts quickly, Map requirements to AWS services, Review availability security and cost trade-offs]
technologies: [AWS, VPC, EC2, ECS, Lambda, S3, RDS, DynamoDB]
last_reviewed: "2026-07-23"
---

# Cloud And AWS Revision Sheet

## Service Models

| Model | Provider manages | Customer still owns |
|---|---|---|
| IaaS | physical infrastructure and virtualization | OS, runtime, application, identity, data |
| PaaS | infrastructure, OS, and managed runtime | application, configuration, identity, data |
| SaaS | complete application platform | users, configuration, access, and data governance |

Managed does not mean fully operated: customers retain architecture, access,
configuration, data, monitoring, resilience, and cost responsibility.

## AWS Map

| Need | Common services | Architect question |
|---|---|---|
| network isolation | VPC, subnet, route table, security group, NACL | Which traffic crosses each trust boundary? |
| compute | EC2, ECS/EKS, Lambda | What are startup, scaling, state, and operational needs? |
| object storage | S3 | What lifecycle, encryption, access, versioning, and replication apply? |
| relational data | RDS/Aurora | What transaction, HA, backup, connection, and failover requirements exist? |
| key-value scale | DynamoDB | What partition key, access pattern, consistency, and hot-key risk exist? |
| messaging/events | SQS, SNS, EventBridge, MSK | Queue, fan-out, routing, replay, or event-log semantics? |
| observability | CloudWatch and tracing integrations | Which SLOs, logs, metrics, traces, and audit evidence matter? |

## Availability Recall

An Availability Zone is a failure-isolated location within a region. Multi-AZ
design protects selected zonal failures; multi-region design addresses regional
failure but adds replication, consistency, cutover, residency, and cost complexity.

Autoscaling needs a meaningful demand signal, startup time, warm capacity, maximum
limits, downstream protection, and scale-in safety. It cannot fix a database or
single hot partition bottleneck automatically.

## Security Recall

- workload roles instead of static access keys;
- least-privilege IAM and separation of duties;
- private networking and explicit ingress/egress;
- encryption and key ownership;
- secret rotation and audit trails;
- backup/restore and immutable recovery where required;
- organization/account boundaries and policy guardrails.

## Cost Recall

Cost follows provisioned/runtime compute, storage capacity/class, requests,
replication, managed-service premiums, observability, licenses, and especially data
transfer. Optimize after attribution and SLO protection, not by removing safety
margin blindly.

## Scenario Prompts

- one AZ fails during peak traffic;
- Lambda retries a non-idempotent handler;
- NAT or cross-region transfer dominates cost;
- database connections exhaust before compute scales;
- public object access is enabled accidentally;
- backup exists but restoration exceeds RTO;
- one DynamoDB partition key becomes hot.

## Final Checklist

- responsibilities and trust boundaries are explicit;
- network paths and egress are understood;
- compute matches workload and startup/scaling behavior;
- data service matches consistency/access patterns;
- multi-AZ/region design proves RPO and RTO;
- identities, secrets, encryption, audit, and backups are operated;
- cost is attributed and balanced against SLOs.
