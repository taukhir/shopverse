# Shopverse Platform Guidance

- Share infrastructure contracts only; service entities, repositories, event records,
  state transitions, and domain decisions remain in owning services.
- Treat public Java APIs, auto-configuration conditions, property names/defaults,
  authority mapping, error shapes, metrics, and starter ordering as compatibility
  surfaces.
- A breaking change requires semantic versioning, migration/deprecation guidance,
  complete adopter inventory, cross-adopter tests, and rollback.
- Preserve intentional exclusions such as the reactive Gateway and token-issuing Auth
  boundaries.

Build the platform and run tests for every adopter affected by the changed starter.
Include context startup/backoff, configuration binding, representative integration,
and binary/configuration compatibility evidence.
