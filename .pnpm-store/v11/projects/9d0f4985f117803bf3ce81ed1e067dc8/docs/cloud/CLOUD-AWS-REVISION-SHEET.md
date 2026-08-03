---
title: Cloud And AWS Revision Sheet
description: Rapid revision of cloud responsibility, networking, compute, storage, databases, events, high availability, security, and cost.
difficulty: Advanced
page_type: Interview
status: maintained
prerequisites: [Cloud Computing]
learning_objectives: [Recall cloud architecture concepts quickly, Map requirements to AWS services, Review availability security and cost trade-offs]
technologies: [AWS, VPC, EC2, ECS, Lambda, S3, RDS, DynamoDB]
last_reviewed: "2026-07-30"
scope: generic
owner: docs-cloud
reviewer: documentation-maintainers
review_evidence: repository-content-audit
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

## Core Cloud Interview Questions

### What does the shared-responsibility model change for managed services?

The provider operates more infrastructure as the service level rises, but the customer still owns
architecture, identities, configuration, data classification, encryption choices, network exposure,
application correctness, monitoring, backup/restore requirements and cost. “Managed” changes the control
surface; it does not transfer accountability for the workload outcome.

### Public subnet versus private subnet?

A subnet is public when its route table provides a path to an internet gateway and the resource has
appropriate addressing; private workloads lack direct inbound internet routing. A public IP alone or a
name containing “private” is not the definition. Private egress through NAT still needs least privilege,
inspection, availability and cost analysis.

### Security group versus network ACL?

Security groups are stateful resource-level virtual firewalls; return traffic for an allowed flow is
tracked. Network ACLs are stateless subnet-level allow/deny rules whose return-path ports must also be
allowed. Use security groups as the primary precise control and NACLs as coarse defense in depth, while
remembering identity/application authorization remains necessary.

### Load balancer versus API gateway?

A load balancer distributes network/application traffic and performs health-aware routing/TLS features.
An API gateway adds API-specific concerns such as authentication integration, quotas, request transforms,
usage plans and managed routing. Either can be combined; neither owns service object-level authorization
or fixes an unhealthy downstream.

### Multi-AZ versus multi-region?

Multi-AZ addresses selected zonal failures with regional control/data services and is normally the first
resilience step. Multi-region addresses regional failure but adds asynchronous replication, write
authority, global routing, consistency, residency, RPO/RTO, failback and significantly higher cost. Choose
from business impact and tested recovery, not a diagram.

### Why can autoscaling make an outage worse?

Scaling reacts after a measured signal and new capacity has startup/warm-up delay. It can multiply
connections, retries and cold caches against a saturated database or quota. Bound maximums, maintain warm
headroom, choose causal metrics, protect downstream capacity, stabilize scale-in and test overload before
depending on scaling for resilience.

### IAM role, resource policy, permission boundary, and SCP?

Identity policies grant to principals; resource policies grant at the resource boundary; permission
boundaries cap an identity's maximum permissions; organization SCPs cap permissions available to member
accounts but do not grant them. Effective access also depends on explicit denies, session policies and
service-specific evaluation. Prefer short-lived workload roles over static keys.

### How should cloud cost be discussed in an architecture interview?

Attribute cost to workload/owner and measure cost per useful business unit while protecting SLOs. Model
compute shape and utilization, managed premiums, storage class/lifecycle, requests, logs/metrics, backup,
replication, idle capacity, licenses and especially NAT/AZ/region egress. Add budgets/anomaly alerts and
review commitments only after understanding stable demand.

## Final Checklist

- responsibilities and trust boundaries are explicit;
- network paths and egress are understood;
- compute matches workload and startup/scaling behavior;
- data service matches consistency/access patterns;
- multi-AZ/region design proves RPO and RTO;
- identities, secrets, encryption, audit, and backups are operated;
- cost is attributed and balanced against SLOs.

## Official References

- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- [AWS Architecture Center](https://aws.amazon.com/architecture/)
- [AWS shared responsibility model](https://aws.amazon.com/compliance/shared-responsibility-model/)
- [AWS Cost Optimization Pillar](https://docs.aws.amazon.com/wellarchitected/latest/cost-optimization-pillar/welcome.html)
