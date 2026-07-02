# Kafka Event Parsing

## Problem

Saga listeners repeated `ObjectMapper.readValue` and `JsonProcessingException`
wrapping for every event payload.

## Solution

`shopverse-kafka-starter` provides:

- `KafkaEventParser`
- `KafkaEventParseException`
- parser auto-configuration

## Used By

- `order-service`
- `payment-service`
- `inventory-service`

## Service-Owned Code

Event payload records and listener business handling remain service-owned.
