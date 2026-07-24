---
title: RabbitMQ Production Operations, Labs, And Interviews
description: Operate RabbitMQ clusters and Spring AMQP applications through capacity, quorum, upgrades, security, observability, flow control, retries, incidents, recovery, labs, and interview questions.
difficulty: Advanced
page_type: Practice
status: Generic
prerequisites: [RabbitMQ And Spring AMQP Architect Path]
learning_objectives: [Diagnose broker and consumer incidents, Build reliable Spring AMQP flows, Recover queues and clusters, Answer architect scenarios]
technologies: [RabbitMQ, Quorum Queues, Spring AMQP]
last_reviewed: "2026-07-24"
---

# RabbitMQ Production Operations, Labs, And Interviews

## Failure Matrix

| Symptom | Evidence |
|---|---|
| publish succeeded but no consumer data | confirm versus return, exchange/binding/routing key and target queue |
| queue grows | publish/deliver/ack rates, unacked/prefetch, consumer latency/errors and downstream |
| redelivery storm | nack/reconnect/crash, poison message and retry topology |
| publisher blocked | memory/disk alarm, flow control, connection/channel and confirm latency |
| quorum queue unavailable | member/leader placement and majority reachability |
| duplicates | lost ack/connection ambiguity/retry; verify message ID and idempotent business result |

## Required Labs

1. Build direct/topic/fanout routing and prove unroutable mandatory returns.
2. Enable confirms and simulate lost connection/ambiguous outcome.
3. Tune prefetch/concurrency for slow consumers while measuring queue age/unacked count.
4. Implement bounded retry, DLX, metadata, alert and controlled replay.
5. Prove idempotency when processing succeeds but ack is lost.
6. Run a three-node quorum queue and lose one node, then majority.
7. Trigger memory/disk alarm and observe publisher flow control safely.
8. Configure TLS, least-privilege virtual host/user permissions and rotate credentials.
9. Perform supported rolling upgrade/backup-definition recovery in a disposable environment.
10. Compare the same workflow on RabbitMQ and Kafka with written selection evidence.

## Interview Questions

**Confirm versus consumer ack?** Confirm tells publisher the broker accepted responsibility according to queue
semantics; consumer ack tells broker a delivery can be removed. They protect different failure windows.

**How do you preserve ordering?** One queue provides enqueue order, but multiple consumers, redelivery, retry
and asynchronous work can reorder completion. Reduce parallelism or add per-key sequencing when required.

**Why is a queue growing?** Arrival exceeds completed acknowledgements. Find whether consumer capacity,
prefetch/unacked work, retry, downstream or broker resource alarms are limiting.

**DLQ replay safety?** Fix/classify cause, preserve identity/headers, rate-limit replay, make consumer idempotent,
monitor outcome and avoid replay into the same unresolved failure loop.

## Official References

- [RabbitMQ quorum queues](https://www.rabbitmq.com/docs/quorum-queues)
- [RabbitMQ monitoring](https://www.rabbitmq.com/docs/monitoring)
- [Spring AMQP resilience](https://docs.spring.io/spring-amqp/reference/amqp/resilience-recovering-from-errors-and-broker-failures.html)

## Recommended Next

Return to the [RabbitMQ And Spring AMQP Architect Path](../RABBITMQ-SPRING-AMQP-ARCHITECT-PATH.md) and complete the ten labs if a target role requires RabbitMQ.

