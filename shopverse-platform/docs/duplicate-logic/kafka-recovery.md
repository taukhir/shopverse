# Kafka Recovery Starter

## Problem

Order, Payment, and Inventory repeated failed Kafka event persistence,
deduplication, listing, replay payload parsing, replay outbox enqueueing, replay
marking, and DLT metrics.

## Solution

`shopverse-kafka-recovery-starter` provides:

- `FailedKafkaEventRecord`
- `FailedKafkaEventStore`
- `KafkaReplayOutbox`
- `KafkaRecoveryService`
- `KafkaRecoveryProperties`
- recovery auto-configuration

## Used By

- `order-service`
- `payment-service`
- `inventory-service`

## Service-Owned Code

Each service still owns:

- failed-event JPA entity
- failed-event repository
- failed-event response DTO
- recovery controller endpoint
- local adapters for `FailedKafkaEventStore` and `KafkaReplayOutbox`
