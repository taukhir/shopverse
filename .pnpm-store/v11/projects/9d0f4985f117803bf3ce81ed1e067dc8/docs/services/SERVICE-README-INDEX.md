---
title: Shopverse Service README Index
description: Searchable documentation-site access to every canonical Shopverse service, platform, web, and shared configuration README.
sidebar_label: Service README Index
difficulty: Beginner
page_type: Reference
status: maintained
technologies: [Shopverse, Microservices, Docusaurus, AI-Assisted Development]
last_reviewed: "2026-07-29"
scope: shopverse
owner: docs-services
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Shopverse Service README Index

The pages below are generated from the canonical repository READMEs during docs
startup and production builds. Edit the source README beside each component; do
not edit its generated mirror. The drift check prevents committed mirrors from
silently falling behind.

## Business And Edge Services

| Component | Site README | Primary ownership |
|---|---|---|
| API Gateway | [API Gateway README](./readmes/API-GATEWAY-README.md) | public routing, edge JWT checks, correlation, and request signals |
| Auth Service | [Auth Service README](./readmes/AUTH-SERVICE-README.md) | login, JWT signing, and JWKS publication |
| User Service | [User Service README](./readmes/USER-SERVICE-README.md) | users, roles, permissions, and identity lookup |
| Order Service | [Order Service README](./readmes/ORDER-SERVICE-README.md) | checkout, orders, timeline, idempotency, and saga observation |
| Inventory Service | [Inventory Service README](./readmes/INVENTORY-SERVICE-README.md) | catalog, stock, reservation, expiry, and release |
| Payment Service | [Payment Service README](./readmes/PAYMENT-SERVICE-README.md) | payment lifecycle, failure, reconciliation, and refund |

## Platform And Experience Components

| Component | Site README | Primary ownership |
|---|---|---|
| Config Server | [Config Server README](./readmes/CONFIG-SERVER-README.md) | centralized runtime configuration delivery |
| Cloud Configs | [Cloud Configuration README](./readmes/CLOUD-CONFIGS-README.md) | shared and service-specific configuration source |
| Discovery Server | [Discovery Server README](./readmes/DISCOVERY-SERVER-README.md) | Eureka registration and discovery |
| Shopverse Platform | [Platform README](./readmes/SHOPVERSE-PLATFORM-README.md) | reusable service starters and cross-cutting infrastructure |
| Shopverse Web | [Web README](./readmes/SHOPVERSE-WEB-README.md) | Angular storefront, customer journeys, and admin experience |

## Maintenance Commands

Run from `documentation/`:

```powershell
npm run sync:service-readmes
npm run check:service-readmes
```

Production `npm run build` synchronizes first. The content-quality check verifies
that generated pages match the canonical sources.

## AI Capability Coverage

Every source README distinguishes developer AI assistance from runtime product
features and links to the appropriate workflows. Review the
[Service README And AI Capability Gap Matrix](./SERVICE-README-AI-CAPABILITY-GAP-MATRIX.md)
for scoped guidance, evaluation coverage, and remaining work.
