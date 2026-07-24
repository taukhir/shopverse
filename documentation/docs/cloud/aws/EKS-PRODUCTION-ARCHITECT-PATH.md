---
title: Amazon EKS Production Architect Path
description: Production EKS architecture covering accounts, VPC and Pod networking, access and workload identity, nodes, add-ons, ingress, storage, autoscaling, upgrades, observability, security, cost, DR, incidents, labs, and interviews.
difficulty: Advanced
page_type: Learning Path
status: Generic
prerequisites: [AWS fundamentals, Kubernetes Architect Path, Terraform]
learning_objectives: [Design secure EKS foundations, Operate networking identity and nodes, Upgrade and recover clusters, Diagnose AWS-specific incidents]
technologies: [Amazon EKS, VPC CNI, EKS Pod Identity, EC2, IAM]
last_reviewed: "2026-07-24"
---

# Amazon EKS Production Architect Path

EKS operates the Kubernetes control plane, while customers still own workload architecture and much of
the data plane, VPC, IAM, add-ons, policy, observability, upgrades and application recovery. Separate AWS
API/IAM, Kubernetes API/RBAC and workload identity when diagnosing access.

## Architecture Decisions

- account/VPC/region and cluster boundary by trust, lifecycle and failure domain;
- public, restricted or private API endpoint with operator connectivity;
- subnets across zones, route/NAT/endpoint design and Pod IP capacity;
- managed node groups, Fargate, Karpenter/Auto Mode or mixed capacity;
- EKS Pod Identity or supported workload IAM mechanism with least privilege;
- managed/self-managed add-ons and explicit version ownership;
- AWS Load Balancer Controller/Gateway, EBS/EFS CSI and DNS integration;
- encryption, secrets, audit/control-plane logs and detective controls.

## VPC CNI And IP Capacity

The VPC CNI assigns VPC addresses to Pods on EC2 nodes and manages ENIs/IP pools. Pod density depends on
instance/network limits and configuration; subnet exhaustion can block new Pods despite idle CPU. Model
node, Pod and load-balancer addresses, warm pools, prefix delegation/IPv6 where selected, security groups,
route/NAT and cross-zone cost. Give the CNI a separate least-privilege workload role instead of inheriting
unnecessary node permissions.

## Nodes And Autoscaling

Use immutable node templates, multiple zones/families, disruption budgets and workload topology. Karpenter
or Cluster Autoscaler converts unschedulable demand into capacity but cannot repair impossible constraints.
Model provisioning plus image/startup/readiness latency. Diversify Spot capacity and keep critical baseline
on appropriate capacity.

## Upgrades And Recovery

Inventory version skew and compatibility of VPC CNI, CoreDNS, kube-proxy, CSI, ingress, metrics, policy,
service mesh and CRDs. Upgrade control plane, add-ons and canary node groups in supported order; scan removed
APIs and validate SLOs. Back up application data and declared configuration; use independent regional/account
recovery when RTO/RPO demand it rather than assuming control-plane durability restores business state.

## Operations And Interviews

The companion workbook covers IP exhaustion, IAM denial, node bootstrap, load balancer, CSI, autoscaling,
upgrade and regional recovery labs.

## Official References

- [Amazon EKS User Guide](https://docs.aws.amazon.com/eks/latest/userguide/what-is-eks.html)
- [Amazon EKS Best Practices](https://docs.aws.amazon.com/eks/latest/best-practices/introduction.html)
- [Amazon VPC CNI](https://docs.aws.amazon.com/eks/latest/userguide/managing-vpc-cni.html)

## Recommended Next

Continue with [EKS Operations, Incidents, Labs, And Interviews](./eks/EKS-OPERATIONS-INTERVIEW.md).

