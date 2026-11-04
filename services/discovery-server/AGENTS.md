# Discovery Server Guidance

- Preserve Eureka registration/discovery ownership; registration is not readiness or
  authorization evidence.
- Lease, eviction, self-preservation, peer, and dashboard-exposure changes require an
  explicit failure model and production topology decision.
- Diagnose churn and stale instances with lease, network, client refresh, gateway
  readiness, and real routing evidence before tuning intervals.
- Do not add application-domain behavior to the registry.

Run `./gradlew test`; verify `/api/health`, actuator health/metrics, registration,
eviction/staleness behavior, and at least one client lookup/routing path.
