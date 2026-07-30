# API Gateway Guidance

## Scope And Invariants

- Keep external HTTP routing, edge JWT validation, correlation, reactive request
  signals, resilience, and dependency readiness in this module.
- Never expose `/api/v1/internal/**`. Route additions require an owning service,
  public/security classification, configuration update, README update, and tests.
- Gateway authentication does not replace downstream authority and object-ownership
  checks. Preserve signature, issuer, and time validation.
- Keep filters non-blocking. Retry only demonstrably safe/idempotent operations; the
  shared default is `GET` only.
- Readiness must distinguish process health from route, discovery, catalog, and asset
  dependency readiness without leaking internal details.

## Verification

Run `./gradlew test` from this directory. For route/configuration work also run
`node ../documentation/scripts/check-cloud-configs.mjs` and verify
`GET /actuator/shopverse-readiness`. Review correlation, timeout, circuit-breaker,
JWT/JWKS, public/internal route, and fallback evidence.
