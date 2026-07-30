# Auth Service Guidance

## Scope And Invariants

- This service validates credentials through User Service, issues RSA-signed access
  tokens, and publishes public JWKS. It is not a complete OAuth2 authorization server.
- Never expose private keys, credentials, bearer tokens, hashes, or sensitive headers.
- Preserve issuer, time, role, and permission claims and compatible JWKS behavior.
- Key rotation must overlap old/new public keys for the supported token lifetime.
- Login failure must not reveal account existence, and dependency/signing failure must
  never issue a token.
- Keep internal authentication off public gateway routes; prefer workload identity or
  mTLS over expanding Basic authentication.

## Verification

Run `./gradlew test`. Cover valid/invalid credentials, unavailable User Service,
issuer/expiry, malformed tokens, JWKS publication/rotation, sensitive logging, and
public error behavior. Use synthetic credentials only.
