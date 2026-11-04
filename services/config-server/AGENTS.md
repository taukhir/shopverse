# Config Server Guidance

- Preserve the native `cloud-configs/` source boundary and bootstrap compatibility.
- Do not expose repository contents, environment values, or unrestricted refresh.
- Treat property precedence, profiles, refresh scope, encryption/secrets, and
  multi-replica consistency as operational contracts.
- Route, JWT/JWKS, datasource, Kafka identity, timeout/retry, and actuator changes need
  owner review, rollback, and service-level evidence.

Run `./gradlew test`, then run
`node ../documentation/scripts/check-cloud-configs.mjs`. Verify health and representative
application/profile lookups without printing sensitive effective values.
