---
slug: /mycheckout/aws-interview-prep/part-2
title: "mycheckout — AWS Interview Preparation for Checkout — Part 2"
mdx:
  format: md
difficulty: Advanced
page_type: Reference
status: maintained
scope: generic
owner: docs-mycheckout
reviewer: documentation-maintainers
review_evidence: imported-source-documentation-link-and-build-check
last_reviewed: "2026-11-16"
---

# mycheckout — AWS Interview Preparation for Checkout — Part 2

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `AWS-INTERVIEW-PREP.md` |
| Source SHA256 | `2427ac2266ecbe745ffbd89995f547102e6aff811d209b44ac70c8b050664310` |
| Guide part | 2 of 2 |

[Part 1](/mycheckout/aws-interview-prep/part-1) · [Part 2](/mycheckout/aws-interview-prep/part-2)

## 7. S3 lifecycle {#7-s3-lifecycle}

Lifecycle rules automate object transitions, expiration, noncurrent-version management and cleanup of incomplete multipart uploads.

<a id="shared-093c3166547f"></a>

The order infrastructure builds an expiration rule from `retentionPeriod` and accepts additional lifecycle rules. This establishes infrastructure support, not a specific deployed retention value.

### Illustrative retention plan {#illustrative-retention-plan}

<a id="shared-0ba04a5087c6"></a>

| Object age | Possible action |
| --- | --- |
| First 30 days | Standard for frequent access |
| After 30 days | Suitable infrequent-access class |
| After 180 days | Archive if retrieval requirements permit |
| After required retention | Expire |

<a id="shared-da825b67d24a"></a>

Choose actual thresholds from access patterns, recovery needs, retention obligations, object size and retrieval costs. Transitions can incur request costs and minimum-duration charges.

### Important traps {#important-traps}

<a id="shared-d47e98416e3e"></a>

- In a versioned bucket, expiration of the current object can create a delete marker while retaining older versions. Configure noncurrent-version expiration for permanent cleanup where appropriate.
- Current default lifecycle transition behavior generally prevents transitions of objects smaller than 128 KB unless configured otherwise. Older configurations can behave differently.
- Lifecycle is asynchronous retention automation, not an exact-time business scheduler.
- Do not expire event payloads earlier than the supported retry and replay window.
- Intelligent-Tiering and explicit lifecycle transitions are different mechanisms; choose according to access predictability and cost.

## 8. CodePipeline {#8-codepipeline}

<a id="shared-a575bd3d2406"></a>

| Component | Responsibility |
| --- | --- |
| CodePipeline | Orchestrates release stages and actions |
| CodeBuild | Runs build, test and packaging commands |
| ECR | Stores container images |
| CDK and CloudFormation | Define and provision infrastructure |
| Helm | Packages Kubernetes configuration |
| Argo CD | Reconciles Kubernetes state with Git |
| EKS | Runs application workloads |

```text
Commit -> Source -> Build and test -> Container image -> ECR
       -> Deployment configuration -> EKS rollout -> Verification
```

<a id="shared-b043b57cd54c"></a>

Checkout pipeline configuration includes source-path filters, notification settings and a pipeline mutation path. Existing project notes describe the wider CodeBuild, Helm and Argo CD release flow; shared constructs determine exact behavior.

CodePipeline passes outputs between actions as artifacts. The pipeline orchestrator, build runner, image registry and deployment controller have different responsibilities.

### Release design questions {#release-design-questions}

<a id="shared-48d9e568f9ab"></a>

- What triggers the pipeline, and which paths are watched?
- Which test or security failure blocks promotion?
- Is the same immutable image promoted across environments?
- How are build and deployment permissions separated?
- How are secrets provided without embedding them in images?
- How are approval gates and environment-specific configuration handled?
- What detects an unhealthy rollout?
- Can the previous application version work with the new database schema?

Rollback needs application, configuration and schema compatibility. Reverting an image alone may not reverse a data migration.

## 9. EKS {#9-eks}

EKS provides a managed Kubernetes control plane. Application teams still need reliable workload configuration, capacity, networking, security and operations.

<a id="shared-2fac1634c815"></a>

| Object or mechanism | Purpose |
| --- | --- |
| Pod | Runs application containers |
| Deployment | Maintains replicas and manages rollout |
| Service | Provides a stable network destination for selected pods |
| Ingress or gateway | Routes incoming traffic |
| ConfigMap | Supplies non-secret configuration |
| ServiceAccount | Identifies the workload |
| HPA | Adjusts pod replicas using configured metrics |
| Node capacity management | Supplies compute for scheduled pods |

### Pod access to AWS {#pod-access-to-aws}

The project IAM configuration uses an OIDC trust relationship scoped to a Kubernetes service account, following the IAM Roles for Service Accounts pattern.

```text
Pod service-account token
  -> AWS STS validates configured trust
  -> Temporary credentials for the IAM role
  -> AWS SDK accesses permitted resources
```

<a id="shared-b823ea06bb3d"></a>

This gives workloads separate permissions without embedding long-lived access keys. Understand the trust policy as well as the permissions policy: one controls who can assume the role, the other controls what the role can do.

### Scaling and resources {#scaling-and-resources}

Pod scaling and compute scaling are separate. Extra replicas cannot help if pods remain pending for lack of capacity or a downstream database is already saturated.

<a id="shared-f9e6db030ba7"></a>

Resource requests influence scheduling. Limits constrain usage: CPU limits can cause throttling, and exceeding a memory limit can lead to termination. Set values using observed demand and leave realistic headroom.

### Health checks {#health-checks}

<a id="shared-480f6038e8f4"></a>

- Readiness determines whether a pod should receive traffic.
- Liveness determines whether the container should restart.
- Startup probes accommodate initialization before other probes take effect.

A shared downstream outage should not automatically trigger restart loops across all pods. Choose probe dependencies carefully.

### Reliable deployments {#reliable-deployments}

<a id="shared-854fbf2f887b"></a>

Understand rolling updates, readiness gates, graceful shutdown, termination grace periods, disruption budgets and replica placement across failure domains. Disruption budgets govern supported voluntary disruptions; they are not a guarantee against every outage.

### Troubleshooting checkout latency {#troubleshooting-checkout-latency}

<a id="shared-649c582056f1"></a>

1. Identify affected endpoints, tenants, time periods and release versions.
2. Inspect request latency, errors and distributed traces.
3. Check pod restarts, memory pressure, CPU throttling and pending pods.
4. Check connection pools and downstream latency.
5. Check database capacity, contention and event backlog.
6. Mitigate the measured bottleneck and verify recovery.

<a id="shared-964bdb8845d9"></a>

**Why did more pods not improve latency?** A saturated database, downstream rate limit, insufficient nodes, connection limits or a serialized operation can prevent extra replicas from increasing throughput.

## 10. Interview preparation plan {#10-interview-preparation-plan}

<a id="shared-4c9f1a45ffeb"></a>

| Session | Focus | Explain aloud |
| --- | --- | --- |
| 1 | Project architecture | Where AWS fits into checkout |
| 2 | IAM and networking | How an EKS pod accesses DynamoDB securely |
| 3 | Lambda | Invocation models, cold starts, concurrency and retries |
| 4 | S3 and lifecycle | Payload storage, permissions, versions and retention |
| 5 | SNS and SQS | Fan-out, buffering, ordering and idempotency |
| 6 | CodePipeline | Commit-to-release flow and rollback |
| 7 | EKS architecture | Pods, services, routing and identity |
| 8 | EKS operations | Scaling, probes and rollout failures |
| 9 | System design | Order processing and recovery from partial failure |
| 10 | Mock interview | Decisions and failure scenarios without notes |

For every service, answer six questions: What does it do? Where did we use it? Why did we choose it? What happens on failure? How does it scale? How do we secure and monitor it?

### Mock interview questions {#mock-interview-questions}

<a id="shared-5748710e3eef"></a>

1. Explain the checkout DynamoDB-to-Kafka handoff.
2. Why does a persisted stream source not guarantee exactly-once business processing?
3. How is an asynchronous SDK call different from asynchronous Lambda invocation?
4. How would you prevent duplicate order creation during retries?
5. What happens when a consumer processes a message but fails to acknowledge it?
6. Why use SNS with separate SQS queues?
7. How would you choose an SQS visibility timeout?
8. What changes when a Lambda batch partially fails?
9. Why can deleting or expiring an S3 object leave storage behind?
10. How would you align S3 retention with event replay?
11. What is the difference between CodePipeline, CodeBuild, ECR and Argo CD?
12. How does a pod obtain temporary AWS credentials?
13. How do readiness, liveness and startup probes differ?
14. Why can scaling pods overload a database?
15. How would you recover from a failed release with a schema change?

## 11. AWS documentation {#11-aws-documentation}

<a id="shared-e3b0c44298fc"></a>

- [Lambda invocation methods](https://docs.aws.amazon.com/lambda/latest/dg/lambda-invocation.html)
- [Lambda with SQS](https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html)
- [SQS event source configuration](https://docs.aws.amazon.com/lambda/latest/dg/services-sqs-configure.html)
- [SQS partial batch failure handling](https://docs.aws.amazon.com/lambda/latest/dg/services-sqs-errorhandling.html)
- [SNS FIFO delivery behavior](https://docs.aws.amazon.com/us_en/sns/latest/dg/fifo-message-delivery.html)
- [S3 lifecycle transitions](https://docs.aws.amazon.com/AmazonS3/latest/userguide/lifecycle-transition-general-considerations.html)
- [S3 object version deletion](https://docs.aws.amazon.com/AmazonS3/latest/userguide/DeletingObjectVersions.html)
- [CodePipeline concepts](https://docs.aws.amazon.com/codepipeline/latest/userguide/concepts.html)
- [EKS reliability guidance](https://docs.aws.amazon.com/eks/latest/best-practices/reliability.html)

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
