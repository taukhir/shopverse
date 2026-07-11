---
title: Cloud Computing
---

# Cloud Computing

Cloud computing provides infrastructure, platforms, and complete applications
over a network with on-demand capacity, metered cost, and automation. This
section starts with the provider-neutral service models and then maps them to
AWS.

## Read In This Order

| Goal | Page |
|---|---|
| Understand cloud concepts and responsibility models | [Cloud Fundamentals](./CLOUD-FUNDAMENTALS.md) |
| See the complete AWS service map | [AWS Umbrella](./aws/AWS-UMBRELLA.md) |
| Learn AWS networking | [VPC And Networking](./aws/AWS-VPC-NETWORKING.md) |
| Learn compute, scaling, storage, and API entry points | [Compute, EBS, Load Balancing And API Gateway](./aws/AWS-COMPUTE-EBS-SCALING.md) |
| Learn relational and NoSQL databases | [RDS And DynamoDB](./aws/AWS-DATABASES.md) |
| Learn events, queues, topics, and object storage | [EventBridge, SQS, SNS And S3](./aws/AWS-EVENTS-STORAGE.md) |
| Learn serverless and Lambda trade-offs | [Lambda And Serverless](./aws/AWS-LAMBDA-SERVERLESS.md) |
| Learn metrics, dashboards, alarms, and logs | [CloudWatch Monitoring](./aws/AWS-CLOUDWATCH.md) |

## A Typical AWS Request And Event Flow

```mermaid
flowchart LR
    User["Client"] --> APIGW["API Gateway or Load Balancer"]
    APIGW --> Compute["EC2, containers, or Lambda"]
    Compute --> Data["RDS or DynamoDB"]
    Compute --> S3["S3 objects"]
    Compute --> Bus["EventBridge or SNS"]
    Bus --> Queue["SQS queue"]
    Queue --> Worker["Lambda or application worker"]
    CW["CloudWatch"] -. metrics, logs, alarms .-> APIGW
    CW -. monitoring .-> Compute
    CW -. monitoring .-> Data
```

These are generic reference designs, not claims about the current Shopverse
deployment.
