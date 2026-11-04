# ShopVerse Project Overview

A human-facing companion to [`AGENTS.md`](AGENTS.md) (which is scoped
deliberately to coding-agent behavior rules) and [`README.md`](README.md)
(the full portfolio-facing writeup). This file exists to answer three
questions quickly: what is this, what is it built with, and how do I run it.

For implemented-vs-pending feature status, see [`PROGRESS.md`](Team/PROGRESS.md).

## What This Is

ShopVerse is a local-first, Docker-Compose-run microservices commerce
**proof-of-concept**. It demonstrates independently owned services
(Order, Inventory, Payment, User, Auth) coordinating checkout through Kafka
choreography instead of a shared database or synchronous call chain, with
an outbox pattern for atomic state+event writes, DLT-based recovery, and a
full observability stack. It is not a production SaaS and does not process
real payments (see [`PROGRESS.md`](Team/PROGRESS.md) for what is stubbed).

## Repository Map

| Path | Role |
|---|---|
| `api-gateway/` | Edge routing, correlation IDs, request-level auth |
| `auth-service/` | Login, RSA-signed JWT issuance, JWKS endpoint |
| `user-service/` | Users, roles/permissions, addresses, persisted cart, internal auth support |
| `order-service/` | Checkout orchestration (SAGA), order timeline, cancellation, fulfillment, returns |
| `inventory-service/` | Public catalog, stock, reservations, reservation expiry |
| `payment-service/` | Payment intent/retry/refund, webhook baseline, **stub** payment provider |
| `discovery-server/` | Eureka service registry |
| `config-server/` + `infra/cloud-configs/` | Centralized Spring Cloud Config |
| `shopverse-platform/` | Shared starters: outbox, Kafka, Kafka recovery/DLT, security, observability, common errors |
| `shopverse-web/` | Angular 22 storefront + admin UI |
| `documentation/` | Docusaurus site — architecture, ADRs, case studies, reliability/security guides |
| `ai-workflows/` | Reusable prompts/templates for AI-assisted development, plus eval scenarios |
| `infra/observability/`, `infra/docker/`, `dev-tools/jenkins/`, `.github/workflows/` | Deployment and CI plumbing |
| `dev-tools/postman/`, `dev-tools/testing/`, `infra/scripts/` | API collections, cross-cutting test suites, local data/reset scripts |

## Tech Stack

| Layer | Technology |
|---|---|
| Language / runtime | Java 21, Node.js 20+ |
| Backend framework | Spring Boot 3.x (Spring Cloud Gateway, LoadBalancer, Config, Eureka) |
| Persistence | MySQL (one schema per service), Spring Data JPA, Liquibase migrations |
| Messaging | Apache Kafka (choreography SAGA), transactional outbox, DLT + replay |
| Security | RSA-signed JWT, JWKS, role/permission + ownership authorization |
| Resilience | Resilience4j (RateLimiter, Bulkhead, Retry, CircuitBreaker) |
| Observability | Micrometer, Prometheus, Grafana, Loki + Promtail, Zipkin tracing |
| Frontend | Angular 22 (standalone components), nginx-served in Docker |
| Object storage | MinIO (product image assets) |
| Testing | JUnit, Mockito, Spring test slices, Testcontainers; Playwright (web e2e/a11y/visual), axe, Lighthouse |
| Infra / CI | Docker Compose (profiles: apps/assets/observability), GitHub Actions, Jenkins |
| Docs | Docusaurus |

## Getting Started

Prerequisites: Docker Desktop (Compose v2), Git, ~8 GB RAM for Docker; Java 21
and Node 20+ only if running outside Docker.

```powershell
Copy-Item .env.example .env
docker compose --profile apps --profile assets config --quiet
docker compose --profile apps --profile assets up --build -d
docker compose ps
```

All application traffic goes through the gateway at `http://localhost:8080`.
Full command variants (full-stack with Angular/docs, plus observability
profile, plus data-seeding scripts) are documented in the
[README Quick Start](README.md#quick-start) — this file intentionally does
not duplicate that content.

## Where To Go Next

| Need | Read |
|---|---|
| Full capability writeup, checkout example, troubleshooting | [`README.md`](README.md) |
| Coding-agent rules (architecture invariants, security, verification commands) | [`AGENTS.md`](AGENTS.md) |
| What's implemented vs pending, by area | [`PROGRESS.md`](Team/PROGRESS.md) |
| Architecture decisions | `documentation/docs/architecture/adr/` |
| Feature-by-feature implementation matrix | `documentation/docs/reference/FEATURES-SECURITY-CHECKOUT.md` and `FEATURES-RELIABILITY-OBSERVABILITY.md` |
| Per-service API/config details | each service's own `README.md` and `AGENTS.md` |
