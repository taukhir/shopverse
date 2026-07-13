---
title: Spring Kafka Idempotency And Operations Compatibility Route
description: Compatibility route from the former combined idempotency and operations chapter to focused canonical pages.
difficulty: Advanced
page_type: Reference
status: Generic
prerequisites: [Spring Kafka consumers]
learning_objectives: [Locate the canonical idempotency and operations guides]
technologies: [Spring for Apache Kafka 4.x]
last_reviewed: "2026-07-13"
---

# Spring Kafka Idempotency And Operations Compatibility Route

<DocLabels items={[
  {label: 'Compatibility route', tone: 'foundation'},
  {label: 'Advanced', tone: 'advanced'},
]} />

<DocCallout type="tip" title="The former combined page now has two focused homes">

This URL remains available for bookmarks. Consumer effect safety and audited replay
are separate from container monitoring and incident response, so each now has one
canonical page without duplicated prose.

</DocCallout>

<TopicCards items={[
  {title: 'Consumer idempotency and replay', href: '/spring/kafka/SPRING-KAFKA-CONSUMER-IDEMPOTENCY-REPLAY', description: 'Protect database effects, persist terminal identity, and replay through a durable outbox.', icon: 'security', tags: ['Idempotency', 'Replay']},
  {title: 'Operations and incident response', href: '/spring/kafka/SPRING-KAFKA-OPERATIONS-INCIDENT-RESPONSE', description: 'Diagnose lag, poll failures, rebalances, rollouts, security, and recovery evidence.', icon: 'gauge', tags: ['Operations', 'Runbook']},
]} />

## Compatibility Anchors

### Idempotent Consumers

Continue with [Consumer Idempotency And Replay](./SPRING-KAFKA-CONSUMER-IDEMPOTENCY-REPLAY.md).

### Replaying Failed Events

Continue with [Consumer Idempotency And Replay](./SPRING-KAFKA-CONSUMER-IDEMPOTENCY-REPLAY.md).

### Are Messages Being Lost?

Continue with [Operations And Incident Response](./SPRING-KAFKA-OPERATIONS-INCIDENT-RESPONSE.md).

### Consumer Lag

Continue with [Operations And Incident Response](./SPRING-KAFKA-OPERATIONS-INCIDENT-RESPONSE.md).

### Slow Consumer Response

Continue with [Operations And Incident Response](./SPRING-KAFKA-OPERATIONS-INCIDENT-RESPONSE.md).

### Useful Kafka Commands

Use the broker-level [Apache Kafka](../../integration/APACHE-KAFKA.md) guide.

### Observability

Continue with [Operations And Incident Response](./SPRING-KAFKA-OPERATIONS-INCIDENT-RESPONSE.md).

### Event Design Practices

Continue with [Publishing And Event Flow](./SPRING-KAFKA-BASICS.md).

### Production Checklist

Continue with [Operations And Incident Response](./SPRING-KAFKA-OPERATIONS-INCIDENT-RESPONSE.md).

## Official References

- [Spring for Apache Kafka 4.0 reference](https://docs.spring.io/spring-kafka/reference/4.0/)
- [Using Spring for Apache Kafka](https://docs.spring.io/spring-kafka/reference/4.0/kafka.html)
