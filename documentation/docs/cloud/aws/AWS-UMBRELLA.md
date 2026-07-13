---
title: AWS Umbrella
status: "maintained"
last_reviewed: "2026-07-13"
---

# AWS Umbrella

AWS offers services across IaaS, PaaS, serverless, managed data, integration,
security, and operations. AWS itself is not SaaS; it is a cloud provider with
services at several abstraction levels.

## AWS By Service Model

| Model | AWS examples | You still own |
|---|---|---|
| IaaS | EC2, EBS, VPC | Guest OS, patches, application, data, capacity policies |
| PaaS | Elastic Beanstalk, App Runner, managed container and database platforms | Application, data, configuration, access, service-specific tuning |
| FaaS/serverless | Lambda | Function code, permissions, event contracts, limits, observability |
| SaaS | Amazon QuickSight and other complete managed applications | Users, tenant configuration, access, and data governance |

Managed services are a spectrum. For example, RDS removes database host and
engine maintenance work, but schema design, query performance, connection
management, access, backup policy, and recovery objectives remain customer
responsibilities.

## Service Map

| Need | Primary services | Guide |
|---|---|---|
| Network isolation and routing | VPC, subnets, route tables, internet/NAT gateways, security groups | [VPC And Networking](./AWS-VPC-NETWORKING.md) |
| Compute and scaling | EC2, Auto Scaling, Availability Zones | [Compute, EBS, Scaling And Entry Points](./AWS-COMPUTE-EBS-SCALING.md) |
| Block storage | EBS snapshots, volume types, encryption | [Compute, EBS, Scaling And Entry Points](./AWS-COMPUTE-EBS-SCALING.md) |
| HTTP APIs and traffic distribution | Elastic Load Balancing, API Gateway | [Compute, EBS, Scaling And Entry Points](./AWS-COMPUTE-EBS-SCALING.md) |
| Relational data | RDS, Multi-AZ, read replicas | [RDS And DynamoDB](./AWS-DATABASES.md) |
| Key-value/document data | DynamoDB, indexes, streams, capacity modes | [RDS And DynamoDB](./AWS-DATABASES.md) |
| Object storage | S3 events, lifecycle, versioning, access logging | [Events And Storage](./AWS-EVENTS-STORAGE.md) |
| Event routing | EventBridge | [Events And Storage](./AWS-EVENTS-STORAGE.md) |
| Queues and pub/sub | SQS, SNS | [Events And Storage](./AWS-EVENTS-STORAGE.md) |
| Event-driven compute | Lambda | [Lambda And Serverless](./AWS-LAMBDA-SERVERLESS.md) |
| Operations | CloudWatch metrics, logs, dashboards, alarms | [CloudWatch Monitoring](./AWS-CLOUDWATCH.md) |

## Selection Heuristics

- Choose **EC2** when the workload needs host-level control, long-running
  processes, special networking, or a runtime that does not fit a managed option.
- Choose **Lambda** for event-driven, bursty, bounded work where per-request
  execution and automatic scaling are valuable.
- Choose **RDS** for relational constraints, SQL joins, and transactional models;
  choose **DynamoDB** for predictable key-based access at elastic scale.
- Choose **SQS** when work must wait safely for one processing path; choose
  **SNS** to fan out notifications; choose **EventBridge** to route business and
  system events by rules across multiple producers and consumers.
- Choose **S3** for durable object storage, not as a mounted block disk or a
  relational database.

## Cross-Cutting Production Concerns

Every AWS design should explicitly cover IAM least privilege, KMS encryption,
Secrets Manager or Parameter Store, multi-AZ failure, backup and restore,
CloudTrail auditing, tagging, budgets, quotas, infrastructure as code, and
CloudWatch alarms. Avoid long-lived access keys and public resources by default.
