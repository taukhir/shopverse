---
title: AWS Lambda And Serverless
status: "maintained"
last_reviewed: "2026-07-13"
---

# AWS Lambda And Serverless

## What Serverless Means

Serverless does not mean that servers disappear. It means the provider operates
the execution fleet and the consumer deploys code or configuration, scales by
demand, and is billed using a service-specific consumption model. The team still
owns architecture, code, data, IAM, event contracts, observability, limits, and
cost behavior.

## Why And Where We Use Lambda

Lambda is useful for:

- API handlers behind API Gateway or a load balancer.
- SQS message processing and EventBridge event handlers.
- S3 upload validation, transformation, and metadata extraction.
- Scheduled automation and operational remediation.
- DynamoDB Streams processing and asynchronous integration.
- Bursty workloads that would otherwise leave servers idle.

Its advantages are no server patching, automatic concurrency scaling, native
event-source integrations, failure isolation per invocation, and consumption-
oriented pricing. It is less suitable for long-running processes, stable
high-utilization services that are cheaper on reserved capacity, host-specific
software, very large local state, or workloads that cannot tolerate startup and
downstream-connection behavior.

## Lambda Versus EC2 And Elastic Beanstalk

| Concern | Lambda | EC2 application | Elastic Beanstalk application |
|---|---|---|---|
| Unit of deployment | Function/package or container image | Service on a VM/image | Application version on a managed environment |
| Server management | AWS operates execution fleet | Team owns guest OS and instance lifecycle | Platform manages much of environment orchestration; team still configures it |
| Scaling | Invocation concurrency | Auto Scaling policies and load balancer | Environment scaling policies |
| Lifetime | Bounded invocation | Long-running process | Usually long-running process |
| Local state | Ephemeral; externalize durable state | Instance/EBS possible, but stateless is preferred | Instance storage should not be treated as durable application state |
| Cost shape | Requests, duration, and related resources | Provisioned instance capacity | Underlying provisioned AWS resources |
| Control | Lowest host control | Highest host control | Middle ground |

EBS does not deploy applications; it supplies block storage to EC2 and certain
managed services. If “app deployed in EBS” means Elastic Beanstalk, use the
Elastic Beanstalk column above.

## Execution And Reliability

Lambda may create multiple concurrent execution environments. Code must not
assume singleton execution or durable local state. Reuse SDK clients and
connections across warm invocations when safe, but treat every invocation as
independently restartable. Make event handlers idempotent because asynchronous
and stream/queue integrations can deliver again.

Set timeouts, memory, ephemeral storage, reserved concurrency, retry and
dead-letter/destination behavior intentionally. Protect databases with bounded
concurrency and connection pooling or RDS Proxy. For stream and queue sources,
understand batch size, partial batch failures, visibility timeout, ordering, and
poison-message behavior.

## Security And Observability Checklist

- Give each function a least-privilege execution role.
- Keep secrets out of environment-variable source control; use a managed secret store.
- Validate every external event even when it comes through an AWS integration.
- Monitor invocations, errors, duration percentiles, throttles, concurrency, iterator age, queue age, and destination failures.
- Emit structured logs and correlation IDs; use tracing selectively.
- Alarm on user impact and exhausted concurrency, not on every isolated error.
- Load-test scaling and downstream capacity together.
