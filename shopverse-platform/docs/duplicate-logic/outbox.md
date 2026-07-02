# Outbox Starter

## Problem

Order, Payment, and Inventory repeated outbox polling, stale claim release,
claim/publish/mark-failed logic, Kafka send handling, metrics, and logging.

## Solution

`shopverse-outbox-starter` provides:

- `OutboxMessage`
- `KafkaPublishMetadata`
- `OutboxEventStore`
- `ShopverseOutboxPublisher`
- `ShopverseOutboxPublishWorker`
- `OutboxPublisherProperties`
- outbox auto-configuration

## Used By

- `order-service`
- `payment-service`
- `inventory-service`

## Service-Owned Code

Each service still owns:

- `OutboxEvent`
- `OutboxEventRepository`
- `OutboxStatus`
- Liquibase schema
- domain event creation through local `OutboxService`
- an adapter implementing `OutboxEventStore`
