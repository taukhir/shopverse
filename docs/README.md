# Shopverse Docs

Shopverse-specific documentation that lives with the platform code: what was
decided, why, and what the running system actually does. For the generic
backend-engineering knowledge base (Java, Spring, Kafka, databases, security,
AI, interview prep, and so on, with Shopverse used as a case study throughout),
see the separate [shopverse-docs](https://github.com/taukhir/shopverse-docs)
repository, published at
[taukhir.github.io/shopverse-docs](https://taukhir.github.io/shopverse-docs/).

## Documentation Rules

- [Documentation Maintenance Rules](DOCUMENTATION-MAINTENANCE.md) defines the
  required documentation updates for code, API, feature, event, configuration,
  security, and operational changes.
- For agent navigation, see
  [Agent Documentation Index](../dev-tools/teams/AGENT-DOCS-INDEX.md).

## Case Study

Start here to see the platform end to end.

- [Shopverse Case Study](case-study/SHOPVERSE.md) — overview and recommended reading order
- [Checkout: Evolution And Fixes](case-study/CHECKOUT-EVOLUTION-AND-FIXES.md) — how the checkout contract evolved and what was fixed
- [Complete Demo](case-study/COMPLETE-DEMO.md) — run the whole POC
  - [Setup And Checkout](case-study/COMPLETE-DEMO-SETUP-CHECKOUT.md)
  - [Recovery And Observability](case-study/COMPLETE-DEMO-RECOVERY-OBSERVABILITY.md)
- [Seed A Checkout Saga](case-study/DEMO-SEED-CHECKOUT-SAGA.md)
- [Platform Authentication Demo](case-study/DEMO-PLATFORM-AUTHENTICATION.md)
- [Idempotency And Outbox Recovery Demo](case-study/DEMO-IDEMPOTENCY-OUTBOX-RECOVERY.md)
- [Observability Automation Demo](case-study/DEMO-OBSERVABILITY-AUTOMATION.md)
- [Current Architecture State](case-study/SHOPVERSE-ARCHITECTURE-CURRENT-STATE.md) — confirmed-fixed defects and what the real code does today
- [Architecture Refactoring Readiness](case-study/SHOPVERSE-ARCHITECTURE-REFACTORING-READINESS.md)
- [Architecture Revision](case-study/SHOPVERSE-ARCHITECTURE-REVISION.md)
- [Onboarding Architecture Audit](case-study/SHOPVERSE-ONBOARDING-ARCHITECTURE-AUDIT.md)
- [Production Capstone Path](case-study/PRODUCTION-CAPSTONE-PATH.md)
  - [Capstone Implementation Evidence](case-study/production-capstone/CAPSTONE-IMPLEMENTATION-EVIDENCE.md)

## Architecture Decisions

- [ADR 001: API Gateway, Service Discovery, And Centralized Configuration](architecture/adr/001-gateway-discovery-config.md)
- [ADR 002: Kafka Choreography SAGA For Checkout](architecture/adr/002-kafka-choreography-saga.md)
- [ADR 003: JWT And JWKS Authentication](architecture/adr/003-jwt-jwks-security.md)
- [ADR 004: Observability Stack](architecture/adr/004-observability-stack.md)
- [ADR 005: Multi-Item Checkout Event Contract](architecture/adr/005-multi-item-checkout-event-contract.md)
- [ADR 006: Order-Gated Payment Request In Checkout Choreography](architecture/adr/006-order-gated-payment-request-saga.md) - proposed

## System Design

- [Shopverse System Design](architecture/SYSTEM-DESIGN.md) — index
  - [System Context And Service Ownership](architecture/SYSTEM-CONTEXT-SERVICE-OWNERSHIP.md)
  - [Checkout, Security, And Event Flows](architecture/CHECKOUT-SECURITY-EVENT-FLOWS.md)
  - [State, Data, Deployment, And Failure Boundaries](architecture/STATE-DATA-DEPLOYMENT-BOUNDARIES.md)

## Reference

- [Features And Demonstrations](reference/FEATURES-AND-DEMOS.md) — the canonical Implemented/Partial/Planned status matrix
- [Shopverse API Guide](development/API-GUIDE.md)
- [Shopverse Observability Operations](observability/SHOPVERSE-OBSERVABILITY-OPERATIONS.md)
- [Service README And AI Capability Gap Matrix](services/SERVICE-README-AI-CAPABILITY-GAP-MATRIX.md)
- [Docker And Local Compose Runbook](../infra/docker/README.md) - local stack, verification modes, deployment override, and Compose troubleshooting

The feature page above is an index to the separately published capability
pages; it is not a local Implemented/Partial/Planned matrix. Verify current
behavior against service code and the canonical published pages before using
status claims.

Service-specific APIs, configuration, and operational detail stay in each
service's own README (`services/<name>/README.md`), not duplicated here.


## Architecture Review

- [Overall system design review](../dev-tools/teams/docs/architecture-system-design-review-2026-11-26.md) - current-source assessment and target-design recommendation.
