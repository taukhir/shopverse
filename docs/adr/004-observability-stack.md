# ADR 004: Observability Stack by Default

## Context

Distributed checkout is difficult to debug without shared correlation,
structured logs, metrics, and traces.

## Decision

Include Prometheus, Grafana, Loki, Promtail, Micrometer Tracing, and Zipkin in
the local platform. Propagate correlation IDs through gateway, services, logs,
and asynchronous flows.

## Consequences

- Failures can be inspected across service and message boundaries.
- Runtime behavior is visible during demos and local development.
- The observability stack adds resource cost, so lightweight test Compose
  profiles are still used for CI and smoke gates.
- Operational readiness is treated as part of the system design, not a later
  deployment task.
