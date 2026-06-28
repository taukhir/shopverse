# ADR 001: Gateway, Discovery, and Centralized Configuration

## Context

Shopverse has multiple independently deployable services. Each service needs
runtime configuration, health visibility, and a stable way to call other
services without hard-coded hostnames.

## Decision

Use Spring Cloud Gateway as the public entry point, Eureka for service
discovery, and Spring Cloud Config Server for centralized runtime
configuration.

## Consequences

- Client traffic enters through one edge service.
- Service-to-service routing can use logical service names.
- Runtime settings are reviewable in `cloud-configs/`.
- Local development remains close to production topology.
- The stack has more moving parts than a simple monolith, which is acceptable
  because the project is demonstrating microservice operations.
