---
slug: /mycheckout/aws-interview-prep/part-1
title: "mycheckout — AWS Interview Preparation for Checkout — Part 1"
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

# mycheckout — AWS Interview Preparation for Checkout — Part 1

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `AWS-INTERVIEW-PREP.md` |
| Source SHA256 | `2427ac2266ecbe745ffbd89995f547102e6aff811d209b44ac70c8b050664310` |
| Guide part | 1 of 2 |

[Part 1](/mycheckout/aws-interview-prep/part-1) · [Part 2](/mycheckout/aws-interview-prep/part-2)

## AWS Interview Preparation for Checkout {#aws-interview-preparation-for-checkout}

Prepared on 16 November 2026.

<a id="shared-a840e046e967"></a>

This guide connects AWS concepts to the checkout and related commerce projects. Use it to explain what each service does, where the project uses it, why it fits, and how to handle failures, scaling, security, and monitoring.

<a id="shared-ecc714d8f4fe"></a>

Project examples below come from local source and infrastructure configuration. They establish implementation intent, not the current state of a deployed AWS account. Practice architectures are explicitly identified.

## 1. AWS services in the projects {#1-aws-services-in-the-projects}

<a id="shared-91449472f790"></a>

| Service | Project evidence and purpose |
| --- | --- |
| EKS | Services use Kubernetes service accounts with AWS IAM trust relationships to access AWS resources. |
| DynamoDB and Streams | Checkout records, profiles, and order sequences. Stream configuration feeds a Lambda-based Kafka connector. |
| Lambda | Checkout stream connector configuration and direct invocation code in the order event service. |
| S3 | Order event service reads event payloads. Checkout roles also have access to S3 policy objects. |
| S3 lifecycle | Order infrastructure supports expiration using a retention period and additional lifecycle rules. |
| SNS | Checkout test-suite infrastructure references a test-result notification topic. |
| SQS | Product ingest contains queue and client configuration, controlled by a feature setting. |
| CodePipeline and ECR | Checkout contains pipeline infrastructure and container repository configuration. |
| IAM, SSM and Secrets Manager | Workload roles grant access to configuration, secrets and application resources. |

<a id="shared-825cc7d638f2"></a>

Interview distinction: the checkout connector inspected here publishes to Kafka and has a Kafka DLQ topic. Do not describe that path as SNS or SQS. SQS is an example from the broader commerce platform.

### Source locations {#source-locations}

Paths below are relative to `D:\BE Projects\checkout`.

<a id="shared-28424e6265be"></a>

- Checkout tables and stream connector: `checkout/commerce-checkout-dataservice/infra-as-code/cdk/app-infra/configs/tenants-common.yaml`
- Connector mapping: `checkout/commerce-checkout-dataservice/infra-as-code/cdk/app-infra/src/modules/kafka-all-connector.ts`
- Pod IAM role: `checkout/commerce-checkout-dataservice/infra-as-code/cdk/app-infra/src/modules/serviceAccountIAMRole.ts`
- Pipeline settings: `checkout/commerce-checkout-appservice/infra-as-code/cdk/app-pipeline/configs/pipeline.yaml`
- SNS test-result topic: `checkout/commerce-checkout-appservice/infra-as-code/cdk/test-suite/src/ams-nextgen-commerce-test-suite.ts`
- S3 lifecycle: `order/commerce-order-eventservice-main/infra-as-code/cdk/app-infra/src/modules/s3bucket.ts`
- S3 reads and Lambda invocation: `order/commerce-order-eventservice-main/source/app/src/main/java/com/mycheckout/commerce/ordereventservice/app/service/S3EventService.java` and `LambdaService.java`
- SQS client: `product/commerce-product-ingestservice-main/source/app/src/main/java/com/mycheckout/commerce/productingestservice/app/config/Config.java`

## 2. Checkout event flow {#2-checkout-event-flow}

```text
Checkout state saved in DynamoDB
  -> DynamoDB Stream with new and old images
  -> Filter for transition to ORDER_CREATED
  -> Configured Lambda connector
  -> Kafka checkout topic
  -> Downstream consumers

Configured connector error route -> Kafka DLQ topic
```

<a id="shared-de7fbbeedfa2"></a>

The common configuration includes `NEW_AND_OLD_IMAGES`, batch size 60, parallelization factor 3, and a filter requiring the new status to be `ORDER_CREATED` while the old status differs. These are project configuration values, not general recommendations. The shared connector library owns internal processing behavior.

Suggested interview answer:

<a id="shared-4811477f8a5d"></a>

> Our checkout data service stores checkout state in DynamoDB. We configure a stream-based connector to identify transitions to ORDER_CREATED and publish checkout events to Kafka. This connects event generation to persisted state. Downstream processing is asynchronous, so retries, duplicate handling and recovery are important.

<a id="shared-ae0a30b742a9"></a>

Saving checkout state and finishing downstream order processing are separate milestones. A persisted event source reduces the application-level save-then-publish gap; it does not create exactly-once processing across all consumers.

## 3. Lambda {#3-lambda}

### How execution works {#how-execution-works}

Lambda runs a handler when invoked. AWS manages execution infrastructure. The application team manages code, dependencies, permissions, configuration and failure handling.

<a id="shared-6969050cd61c"></a>

1. An invocation or event arrives.
2. Lambda obtains an execution environment.
3. Initialization runs when required.
4. The handler processes the event.
5. A result is returned or source-specific failure handling applies.

<a id="shared-0cc266edc91a"></a>

Execution environments can be reused. Initialize reusable SDK clients outside the handler, but store durable business state externally. Never assume a warm environment will survive.

### Invocation models {#invocation-models}

<a id="shared-9fcb8580851b"></a>

| Model | Example | Failure ownership |
| --- | --- | --- |
| Synchronous | Application calls Lambda and waits for its result | Caller checks function errors and decides whether to retry |
| Asynchronous | Invocation type Event submits work to Lambda | Lambda queues the event and applies asynchronous retry and destination settings |
| Event source mapping | Lambda polls SQS or DynamoDB Streams | Source and mapping settings control processing and retries |

<a id="shared-22677ef5fd35"></a>

Project detail: `LambdaService.java` uses `LambdaAsyncClient` and returns a `CompletableFuture`, but does not set invocation type `Event`. The Java SDK call is nonblocking; the Lambda invocation uses default request-response behavior. Async SDK execution and asynchronous Lambda invocation are different concepts.

### Cold starts and concurrency {#cold-starts-and-concurrency}

<a id="shared-f4a212ba7d09"></a>

A cold start includes execution-environment initialization. Runtime startup, dependency loading and initialization code affect latency. Reuse clients and avoid unnecessary startup work. Provisioned concurrency prepares environments; reserved concurrency reserves capacity and caps the function's concurrency.

<a id="shared-9ed96446a11a"></a>

Estimate average concurrency as requests per second multiplied by average execution duration in seconds. At 100 requests per second and 0.5 seconds per invocation, average concurrency is about 50. Bursts and retries require separate capacity planning.

Higher concurrency can overload databases and downstream APIs. Set limits using dependency capacity, rather than increasing concurrency without a bound.

### Reliability and security {#reliability-and-security}

<a id="shared-020a0f438c9a"></a>

- Make business operations idempotent using a stable event or operation identifier.
- Store the idempotency decision durably and coordinate it with the business update. An in-memory set is insufficient.
- Set timeouts from realistic downstream latency and leave time to return a controlled failure.
- Understand which retry mechanism applies to the invocation source.
- Give the execution role only required permissions.
- Configure private-resource networking and valid egress where necessary.
- Monitor errors, duration, throttles, concurrency and source backlog.

### Interview questions {#interview-questions}

<a id="shared-520b87e9f741"></a>

**Why Lambda instead of EKS?** Lambda suits bounded event processing with a suitable invocation model. EKS suits long-running processes and workloads needing Kubernetes controls. Compare duration, latency, traffic, operations and cost.

**Can Lambda process an event twice?** Design for repeated processing. Use idempotency so a retry cannot create a duplicate order or repeat an irreversible side effect.

<a id="shared-b09310df3517"></a>

**Does a successful invoke API response mean business processing succeeded?** Check the invocation model. Asynchronous acceptance does not mean completion. For request-response invocation, inspect function errors and the returned business result.

## 4. S3 {#4-s3}

S3 stores objects in buckets. An object has a key, content and metadata. A key such as `thailand/2026/11/order-123/event.json` uses prefixes that resemble folders.

The order event service reads objects with `S3AsyncClient`. Explain bucket and key selection, permissions, retrieval failure and replay behavior when discussing this example.

### Concepts to understand {#concepts-to-understand}

<a id="shared-12ad202f6338"></a>

| Concept | Interview explanation |
| --- | --- |
| IAM and bucket policies | Control which principals can perform which operations on the bucket or objects |
| Block Public Access | Helps prevent unintended public access |
| Encryption | Protect data at rest; SSE-KMS also requires appropriate KMS access |
| Presigned URLs | Temporary access authorized using the signer's credentials and permissions |
| Versioning | Retains versions to support recovery from overwrites and deletion |
| Multipart upload | Uploads parts independently; plan retries and cleanup of unfinished uploads |
| Storage class | Select using access frequency, retrieval latency and total cost |

### Practice design using object references {#practice-design-using-object-references}

Store a large payload in S3, then publish a smaller event containing the bucket and key. A consumer retrieves and processes the payload.

<a id="shared-43d3bc89fa47"></a>

Discuss the failure cases: object saved but reference not published; reference received but access denied; duplicate event after successful processing; object expired before replay. Address publication recovery, permissions, idempotency and compatible retention periods.

<a id="shared-30f835ebb75b"></a>

**Why not store every payload in DynamoDB?** Choose storage by access pattern. Object storage is suitable for file-like payloads, while a database supports application queries and state updates. Account for the extra object retrieval and cross-service failure cases.

## 5. SNS {#5-sns}

SNS provides publish-subscribe messaging. A publisher sends to a topic, and SNS delivers to subscriptions. Filters can route relevant subsets of messages to subscribers.

The verified project example is a test-result notification topic in checkout test-suite infrastructure.

### Practice fan-out architecture {#practice-fan-out-architecture}

```text
Order event -> SNS topic
                -> Fulfillment SQS queue -> Fulfillment worker
                -> Email SQS queue       -> Email worker
                -> Analytics SQS queue   -> Analytics worker
```

Each independent subscriber has its own queue and backlog. Multiple workers reading a single queue compete for work; they do not each receive an independent copy of every event.

<a id="shared-fa4ea1a691e5"></a>

Prepare to explain topic and subscription permissions, filtering, subscriber delivery failures, subscription DLQs, and Standard versus FIFO requirements. An SNS delivery DLQ and an SQS consumer-processing DLQ address different failure stages.

**Why SNS with SQS?** SNS distributes an event to multiple subscribers. SQS gives each subscriber durable buffering and independent processing capacity.

## 6. SQS {#6-sqs}

SQS decouples producers and consumers using a managed queue.

<a id="shared-4ec7d64110ee"></a>

1. Producer sends a message.
2. Consumer receives it.
3. SQS hides it for the visibility timeout.
4. Consumer performs the work.
5. Consumer deletes the message after success.
6. Without successful deletion, the message can become available again.

Visibility timeout is a temporary processing lease, not a deletion timer.

<a id="shared-69e249a04a09"></a>

| Concept | Meaning |
| --- | --- |
| Visibility timeout | How long a received message is temporarily hidden |
| Retention | How long the service retains a message |
| Long polling | Waits for available messages and reduces empty receives |
| DLQ and redrive policy | Moves messages after repeated failed receives according to policy |
| Idempotency | Prevents duplicate delivery from repeating business effects |

### Standard and FIFO {#standard-and-fifo}

<a id="shared-277dc6e8c386"></a>

Standard queues require consumers to handle duplicate delivery and possible reordering. FIFO queues order messages within a message group. Separate groups provide independent processing lanes; one group can serialize the workload.

<a id="shared-d34951fa7a79"></a>

FIFO deduplication does not make a database update or external payment exactly once. A worker can apply an effect and fail before acknowledging completion. The business operation still needs idempotency.

### Lambda with SQS {#lambda-with-sqs}

<a id="shared-ddf262324e47"></a>

Lambda polls SQS through an event source mapping and invokes the function with batches. By default, a failed batch can cause successfully processed messages to be retried too. Configure and implement partial batch responses to report individual failures.

<a id="shared-973fb07b4136"></a>

AWS recommends visibility timeout of at least six times the function timeout, with additional allowance for the configured batching window. A 30-second function suggests at least 180 seconds before adding the batch-window allowance. For FIFO partial failures, preserve ordering by stopping after the first failure and reporting failed and unprocessed records.

<a id="shared-ea348b10d1eb"></a>

Monitor oldest-message age, available backlog, in-flight messages, processing errors and DLQ depth. Replay DLQ messages after understanding and fixing the failure; uncontrolled replay can repeat the incident.

Suggested interview answer:

<a id="shared-82029b2337b2"></a>

> I acknowledge after successful processing, make business updates idempotent, configure visibility for processing and retry behavior, and use a DLQ for repeated failures. With Lambda batches, I return individual failures so successful records are not unnecessarily retried.

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
