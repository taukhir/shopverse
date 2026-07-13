---
title: "System Context And Service Ownership"
description: "System Context And Service Ownership with Shopverse examples, failure analysis, and production guidance."
sidebar_label: "System Context And Service Ownership"
tags: ["shopverse", "architecture", "production"]
page_type: "Guide"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# System Context And Service Ownership

<DocLabels items={[{label: 'Advanced', tone: 'advanced'}, {label: 'Shopverse', tone: 'shopverse'}, {label: 'Production', tone: 'production'}]} />

## System Context

```mermaid
flowchart LR
    Customer["Customer or administrator"] --> Gateway["Shopverse API Gateway"]
    Gateway --> Platform["Commerce platform"]
    Platform --> Identity["Identity and access"]
    Platform --> Commerce["Order, inventory, and payment"]
    Platform --> Ops["Observability and operations"]
    Commerce --> Provider["Stub third-party payment provider"]
```

The payment provider is deliberately a configurable stub. It models success,
decline, and timeout without requiring external credentials.

## Runtime Architecture

```mermaid
flowchart TB
    Client["Client"]
    Gateway["API Gateway :8080"]
    Auth["Auth Service :8081"]
    User["User Service :8082"]
    Order["Order Service :8083"]
    Payment["Payment Service :8084"]
    Inventory["Inventory Service :8086"]

    Client --> Gateway
    Gateway --> Auth
    Gateway --> User
    Gateway --> Order
    Gateway --> Payment
    Gateway --> Inventory

    Auth -->|"Feign + internal Basic authentication"| User
    Order -->|"Feign catalog lookup"| Inventory

    Order <--> Kafka["Kafka"]
    Inventory <--> Kafka
    Payment <--> Kafka

    User --> UserDB[("user_service")]
    Order --> OrderDB[("order_service")]
    Inventory --> InventoryDB[("inventory_service")]
    Payment --> PaymentDB[("payment_service")]
```

Each stateful service owns a separate MySQL schema. There are no cross-service
foreign keys or cross-schema joins. A service accesses another service's data
through an API or event contract.

## Platform Infrastructure

```mermaid
flowchart LR
    Config["Config Server :8888"] --> Gateway
    Config --> Auth
    Config --> User
    Config --> Order
    Config --> Inventory
    Config --> Payment

    Eureka["Eureka :8761"] <--> Gateway
    Eureka <--> Auth
    Eureka <--> User
    Eureka <--> Order
    Eureka <--> Inventory
    Eureka <--> Payment

    Git["cloud-configs"] --> Config
```

Config Server centralizes runtime properties. Eureka records service instances.
The gateway and Feign clients use logical names such as `ORDER-SERVICE`; Spring
Cloud LoadBalancer selects a registered instance.

## Service Responsibilities

| Component | Responsibility |
|---|---|
| API Gateway | Edge routing, JWT validation, correlation handling, request metrics |
| Auth Service | Authenticate through User Service, sign RSA JWTs, expose JWKS |
| User Service | Users, roles, permissions, internal credential lookup, method security |
| Order Service | Idempotent checkout, ownership, order state, timeline, SAGA outcomes |
| Inventory Service | Stock, optimistic locking, reservation, expiry, compensation |
| Payment Service | Payment state machine, provider simulation, reconciliation, refund |
| Config Server | Centralized configuration backed by local files or Git |
| Discovery Server | Eureka registration and logical service discovery |
| Kafka | Durable asynchronous event transport |
| MySQL | Service-owned schemas and Liquibase metadata |
| Prometheus | Metric scraping, rules, SLO signals, and alert evaluation |
| Loki | Central log storage and LogQL querying |
| Promtail | Log discovery, parsing, positions, labeling, and Loki shipping |
| Zipkin | Distributed trace storage and span visualization |
| Grafana | Dashboards and investigation across metrics, logs, and traces |

## Recommended Next

Return to [Shopverse System Design](./SYSTEM-DESIGN.md) to select the next focused guide.


## Official References

- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)
