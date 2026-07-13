---
title: AWS EventBridge, SQS, SNS And S3
status: "maintained"
last_reviewed: "2026-07-13"
---

# AWS EventBridge, SQS, SNS And S3

## EventBridge

EventBridge routes events from AWS services, SaaS sources, and applications to
targets using rules. Use it when consumers should subscribe by event shape or
source without producers knowing their destinations. Schema evolution,
idempotent consumers, retries, dead-letter handling, event archives/replay where
needed, and traceable correlation IDs remain application design concerns.

EventBridge is a router, not a durable work queue for consumers that must pull at
their own pace. Route to SQS when buffering and backpressure are required.

## SQS: Events As Durable Work

SQS decouples a producer from asynchronous consumers. Standard queues favor
scale and at-least-once delivery; consumers must be idempotent and must not rely
on strict ordering. FIFO queues add ordering within message groups and
deduplication behavior with throughput trade-offs.

The consumer receives a message, completes the side effect, and deletes it. If
processing exceeds the visibility timeout, the message can become visible again.
Configure long polling, visibility timeout, bounded retries, a dead-letter queue,
and alarms on age and backlog. A redrive policy is not complete until the team
has a safe replay procedure.

## SNS: Fan-Out Notifications

SNS publishes a message to multiple subscriptions such as SQS queues, Lambda,
HTTP endpoints, email, or mobile delivery. A common reliable pattern is
`producer -> SNS topic -> one SQS queue per consumer`, giving each consumer its
own backlog and failure isolation. Use subscription filter policies carefully;
event contract changes can silently change routing.

## S3 Object Storage

S3 stores objects in buckets. It is suitable for assets, documents, logs,
backups, data lakes, and static content—not as an EC2 block disk.

### Events

S3 can notify SQS, SNS, Lambda, or EventBridge about object operations. Design
consumers for duplicate or out-of-order observations, validate bucket/key and
object version, and avoid loops where a consumer writes back into the same
trigger pattern.

### Lifecycle

Lifecycle rules transition objects to lower-cost storage classes or expire
current/noncurrent versions and incomplete multipart uploads. Validate minimum
storage-duration and retrieval charges, access frequency, legal retention, and
recovery time before transitioning data.

### Versioning And Deletion

Versioning retains object versions and protects against simple overwrites or
deletes, but it increases cost. Lifecycle noncurrent versions deliberately.
Versioning is not a complete backup strategy because permissions or lifecycle
misconfiguration can still affect data; use separation and retention controls
for stronger recovery guarantees.

### Access And Logs

Block public access by default, use least-privilege bucket policies and IAM
roles, encrypt data, and prefer temporary signed access where appropriate.
CloudTrail data events provide object-level API audit records when enabled.
S3 server access logging provides detailed access records but is best-effort and
should write to a separate destination with a controlled prefix. Monitor public
exposure findings, denied requests, replication, lifecycle behavior, and cost.

## Choosing The Integration Service

| Requirement | Prefer |
|---|---|
| One worker pool processes buffered work | SQS |
| One publication fans out to known subscribers | SNS, often with SQS per subscriber |
| Rules route events from many sources to many targets | EventBridge |
| Object creation or deletion starts a workflow | S3 event notification or EventBridge |
