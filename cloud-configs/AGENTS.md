# Cloud Configuration Guidance

- `application.yml` owns shared defaults; each uppercase service file owns overrides.
- Keep secrets as environment placeholders. Never commit credentials, private keys,
  tokens, or production endpoints.
- Keep `/api/v1/internal/**` outside gateway routes. Route, actuator, JWT/JWKS,
  datasource, Kafka, retry, timeout, and consumer-group changes are contract changes.
- Every change needs an affected-service list, effective-value verification, rollout or
  refresh plan, rollback commit, and representative service tests.

Run `node ../documentation/scripts/check-cloud-configs.mjs` and the affected service
tests. Do not treat valid YAML as proof of safe production semantics.
