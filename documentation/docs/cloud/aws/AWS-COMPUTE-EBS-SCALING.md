---
title: AWS Compute, EBS, Scaling And Entry Points
status: "maintained"
last_reviewed: "2026-07-13"
---

# AWS Compute, EBS, Scaling And Entry Points

## EC2 And Availability Zones

EC2 provides virtual machines. Select an instance family for CPU, memory,
network, storage, or accelerator needs; build immutable images where practical;
and use instance roles instead of embedded credentials. An EC2 instance runs in
one AZ, so resilience requires replacement capacity in other AZs.

## EBS Block Storage

Elastic Block Store (EBS) volumes are AZ-scoped block devices commonly attached
to EC2. They persist independently when configured to survive instance
termination. EBS is **storage**, not an application deployment platform.
Elastic Beanstalk is the AWS PaaS-like deployment service sometimes confused
with it.

Important EBS decisions include:

- Choose general-purpose SSD, provisioned-IOPS SSD, or throughput-oriented HDD based on latency, IOPS, throughput, and access pattern.
- Size and provision performance together; monitor whether the workload reaches volume or instance limits.
- Encrypt volumes and snapshots, control KMS permissions, and test snapshot restore.
- Create application-consistent snapshots when write ordering matters.
- A snapshot is a backup primitive, not proof that recovery works.
- Use EFS or S3 when multiple hosts need shared file or object access; do not assume a normal EBS volume is a multi-host filesystem.

## Auto Scaling

An Auto Scaling group maintains desired EC2 capacity across configured AZs and
replaces unhealthy instances. Target tracking can scale on signals such as CPU,
load-balancer request count per target, or a custom backlog metric.

Good scaling requires stateless instances, health checks that represent ability
to serve, graceful connection draining, startup time accounted for in policies,
and tested minimum/maximum capacity. CPU is often a poor signal for queue
workers; queue depth divided by processing capacity is usually more meaningful.

## Load Balancer Versus API Gateway

| Capability | Elastic Load Balancing | API Gateway |
|---|---|---|
| Main role | Distribute network or HTTP traffic across healthy targets | Publish, secure, throttle, transform, and observe APIs |
| Common targets | EC2, containers, IPs, and in some modes Lambda | Lambda or HTTP/AWS service integrations |
| Best fit | Application ingress and service traffic | Managed public/private API front door |
| Key controls | Listener rules, target groups, health checks, TLS | Routes, stages, authorization, quotas, usage plans, request validation |

They can be combined. Avoid duplicating authorization, routing, and throttling
without a clear ownership boundary.

## Monitoring And Alerts

Monitor EC2 CPU, status checks, network, memory/disk through the CloudWatch
agent, and application golden signals. For EBS monitor read/write latency and
operations, throughput, queueing, burst balance where applicable, and impaired
volume status. For Auto Scaling alarm on failed launches, unhealthy capacity,
capacity near maximum, and sustained scaling churn. For load balancers monitor
healthy hosts, target response time, rejected connections, and load-balancer and
target 4xx/5xx errors.
