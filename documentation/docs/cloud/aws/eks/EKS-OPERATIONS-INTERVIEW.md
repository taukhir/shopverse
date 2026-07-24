---
title: EKS Operations, Incidents, Labs, And Interviews
description: Implement and diagnose EKS identity, VPC CNI, nodes, add-ons, ingress, CSI, autoscaling, upgrades, security, cost, and disaster recovery with practical labs and interview questions.
difficulty: Advanced
page_type: Practice
status: Generic
prerequisites: [Amazon EKS Production Architect Path]
learning_objectives: [Diagnose AWS-specific failures, Operate upgrades and capacity, Secure workload identity, Complete production labs]
technologies: [EKS, IAM, VPC CNI, Karpenter, EBS CSI]
last_reviewed: "2026-07-24"
---

# EKS Operations, Incidents, Labs, And Interviews

## Failure Matrix

| Symptom | Trace |
|---|---|
| user cannot call Kubernetes API | AWS identity -> EKS access mapping -> Kubernetes RBAC -> endpoint network |
| Pod cannot call AWS API | service account -> Pod Identity association/agent/SDK -> IAM trust/policy -> service endpoint |
| Pods stuck creating | subnet IP/ENI, VPC CNI/ipamd, node limits, CNI IAM and security/network |
| node never joins | launch template/AMI, bootstrap, IAM, endpoint/DNS/routes and kubelet |
| LoadBalancer pending/unhealthy | controller IAM, subnet tags, quota, target mode, security groups and health |
| PVC fails | EBS CSI identity, zone/topology, attachment limit and provider state |
| autoscaler does nothing | unschedulable reason, provisioner/node group limits, IAM/quota and instance availability |

## Required Labs

1. Provision VPC/EKS using versioned IaC and encrypted remote state.
2. Configure restricted API access and least-privilege operator roles.
3. Grant one Pod access to one AWS resource using workload identity; prove denial elsewhere.
4. Calculate subnet/Pod IP capacity and intentionally exhaust a disposable subnet.
5. Deploy ingress/load balancer and trace health from AWS target to EndpointSlice and Pod.
6. Provision EBS CSI storage, test zone scheduling, snapshot and restore.
7. Scale with Karpenter or Cluster Autoscaler under load and measure usable-capacity delay.
8. Rotate a node group through cordon/drain with PDB/topology evidence.
9. Upgrade control plane/add-ons/canary nodes after API compatibility scan.
10. Design and rehearse regional rebuild plus application data reconciliation.

## Interview Questions

**Why can EKS run out of Pod capacity with idle nodes?** VPC CNI address/ENI and subnet capacity can be the
constraint; inspect per-node networking limits and available subnet IPs.

**IAM versus RBAC?** IAM controls AWS API identity/permissions and entry mapping; Kubernetes RBAC controls
verbs/resources inside the cluster. Workload AWS access uses a mapped workload identity path.

**Managed control plane means no DR?** No. It improves control-plane operation, but application data,
configuration, regional dependencies, DNS and recovery reconciliation remain customer concerns.

## Official References

- [EKS IAM](https://docs.aws.amazon.com/eks/latest/userguide/security-iam.html)
- [EKS networking best practices](https://docs.aws.amazon.com/eks/latest/best-practices/networking.html)
- [EKS add-on IAM](https://docs.aws.amazon.com/eks/latest/userguide/add-ons-iam.html)

## Recommended Next

Return to the [Amazon EKS Production Architect Path](../EKS-PRODUCTION-ARCHITECT-PATH.md) and add all ten lab artifacts to the capstone.

