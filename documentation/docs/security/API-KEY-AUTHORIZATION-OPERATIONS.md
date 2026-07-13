---
title: "API Key Authorization And Operations"
description: "API Key Authorization And Operations with Shopverse examples, failure analysis, and production guidance."
sidebar_label: "API Key Authorization And Operations"
tags: ["shopverse", "architecture", "production"]
page_type: "Guide"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# API Key Authorization And Operations

<DocLabels items={[{label: 'Advanced', tone: 'advanced'}, {label: 'Shopverse', tone: 'shopverse'}, {label: 'Production', tone: 'production'}]} />

## Step 8: Add API Key Data Model

API keys should represent machine clients such as CI jobs, partner integrations,
internal scripts, webhook senders, or admin automation.

Create an API key table:

```sql
CREATE TABLE api_keys (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    key_id VARCHAR(64) NOT NULL UNIQUE,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    owner_type VARCHAR(40) NOT NULL,
    owner_id VARCHAR(80) NULL,
    scopes VARCHAR(1000) NOT NULL,
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NULL,
    last_used_at TIMESTAMP NULL,
    revoked_at TIMESTAMP NULL
);

CREATE INDEX idx_api_keys_key_id ON api_keys(key_id);
CREATE INDEX idx_api_keys_status ON api_keys(status);
```

Use a split key format:

```text
sv_live_<key_id>_<secret>
```

Example:

```text
sv_live_8f2a9d1c4b7e4a01_nGzKJx...longRandomSecret
```

Store:

- `key_id` in plain text for lookup;
- hash of the full raw key or secret part for verification;
- scopes for authorization;
- status and expiry for lifecycle control.

Show the raw API key only once at creation time.

## Step 9: Implement API Key Issuance

Add admin-only endpoints:

```http
POST /api/v1/api-keys
GET /api/v1/api-keys
DELETE /api/v1/api-keys/{keyId}
POST /api/v1/api-keys/{keyId}/rotate
```

Create request:

```json
{
  "name": "Inventory import job",
  "ownerType": "INTERNAL_JOB",
  "scopes": ["inventory:read", "inventory:write"],
  "expiresAt": "2026-12-31T23:59:59Z"
}
```

Create response:

```json
{
  "keyId": "8f2a9d1c4b7e4a01",
  "apiKey": "sv_live_8f2a9d1c4b7e4a01_nGzKJx...",
  "name": "Inventory import job",
  "scopes": ["inventory:read", "inventory:write"],
  "expiresAt": "2026-12-31T23:59:59Z"
}
```

Never return `apiKey` from list or detail endpoints after creation.

## Step 10: Validate API Keys At The Gateway

API keys should usually be validated at API Gateway because they are a public
edge concern. Resource services can receive a derived identity header after the
Gateway validates the key.

Request:

```http
X-API-Key: <redacted-api-key>
```

Gateway validation steps:

1. Extract `X-API-Key`.
2. Parse the `key_id`.
3. Look up active key metadata.
4. Hash the presented key and compare with constant-time comparison.
5. Verify status, expiry, and required scopes.
6. Add internal headers for downstream services:

```http
X-Shopverse-Client-Id: 8f2a9d1c4b7e4a01
X-Shopverse-Client-Type: API_KEY
X-Shopverse-Scopes: inventory:read inventory:write
```

7. Strip the original `X-API-Key` before forwarding.

Downstream services must trust those internal headers only from Gateway traffic.
Do not expose direct service ports publicly.

## Step 11: Decide When To Use Bearer JWT Vs API Key

| Scenario | Use |
|---|---|
| Customer browsing catalog, checkout, orders | Access token + refresh token |
| Admin operating users, inventory, recovery | Access token + refresh token |
| CI smoke test calling internal admin endpoint | API key with narrow scopes |
| Partner reading order status | API key or OAuth client credentials, depending on partner maturity |
| Webhook receiver validating provider callback | Provider signature, not Shopverse user JWT |
| Service-to-service internal call | mTLS/service identity or internal credentials; avoid customer token forwarding unless delegation is intended. |

Use user JWTs when the action belongs to a human user. Use API keys when the
action belongs to a machine client.

## Step 12: Authorization Rules

Access-token authorization:

```java
@PreAuthorize("hasAuthority('ORDER_CREATE')")
```

API-key authorization should use scopes:

```text
inventory:read
inventory:write
orders:read
orders:write
recovery:replay
```

Do not map API key scopes to human roles such as `ROLE_ADMIN`. Keep human
authorization and machine-client authorization separate.

## Step 13: Observability And Auditing

Log security events without leaking secrets:

| Event | Log fields |
|---|---|
| Login success/failure | username, result, reason category, correlation ID |
| Refresh success/failure | user ID, token family ID, result, reason category |
| Refresh token reuse | user ID, family ID, source IP, user agent |
| API key used | key ID, owner type, scopes, route, result |
| API key revoked/rotated | key ID, actor, reason |

Never log:

- raw access tokens;
- raw refresh tokens;
- raw API keys;
- passwords;
- RSA private keys.

Useful metrics:

```text
auth_login_total{result="success|failure"}
auth_refresh_total{result="success|failure|reuse_detected"}
api_key_requests_total{key_id, result}
api_key_validation_duration_seconds
```

## Step 14: Configuration Checklist

Auth Service:

```yaml
security:
  jwt:
    issuer: shopverse-auth-service
    access-token-ttl: PT15M
  refresh-token:
    ttl: P30D
    rotation-enabled: true
    cookie-name: shopverse_refresh
```

API Gateway:

```yaml
security:
  api-keys:
    enabled: true
    header-name: X-API-Key
```

Resource services:

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          jwk-set-uri: http://auth-service:8081/auth/.well-known/jwks.json
security:
  jwt:
    issuer: shopverse-auth-service
```

## Step 15: Testing Plan

Access token tests:

1. Login returns an access token.
2. JWT has expected issuer, subject, roles, permissions, issued-at, and expiry.
3. Gateway accepts valid token.
4. Gateway rejects expired, malformed, unsigned, or wrong-issuer tokens.
5. Resource service rejects direct calls with invalid tokens.

Refresh token tests:

1. Login creates a database refresh-token hash.
2. Refresh returns a new access token and rotates the refresh token.
3. Old refresh token cannot be reused.
4. Reuse detection revokes the token family.
5. Logout revokes the current refresh token.
6. Logout-all revokes every user session.
7. Expired refresh token is rejected.

API key tests:

1. Admin can create an API key and sees the raw value once.
2. Server stores only the hash.
3. Gateway accepts a valid API key with required scope.
4. Gateway rejects missing, malformed, expired, revoked, or wrong-scope keys.
5. Gateway strips `X-API-Key` before forwarding.
6. Resource services reject forged internal identity headers when requests do
   not come through Gateway.

## Step 16: Implementation Order For Shopverse

Recommended order:

1. Refactor Auth Service response from `token` to `accessToken`.
2. Make access-token TTL configurable.
3. Add refresh-token Liquibase changelog, entity, repository, and service.
4. Add `/auth/refresh`, `/auth/logout`, and `/auth/logout-all`.
5. Update Angular session and interceptor refresh behavior.
6. Add integration tests for token rotation and reuse detection.
7. Add API key persistence and admin issuance endpoints.
8. Add Gateway API key validation filter.
9. Add scope-based authorization and downstream identity propagation.
10. Add audit logs, metrics, dashboards, and alerts.

This order keeps the current JWT flow working while adding refresh-token
session continuity first, then machine-client access.

## Production Rules

- Use HTTPS everywhere.
- Keep RSA private keys and API-key hashing secrets out of Git.
- Rotate signing keys with overlapping JWKS publication.
- Keep access tokens short-lived.
- Rotate refresh tokens on every use.
- Store refresh tokens and API keys only as hashes.
- Use constant-time comparison for secrets.
- Rate-limit login, refresh, and API-key validation failures.
- Alert on refresh-token reuse and unusual API-key failure spikes.
- Separate human roles from machine scopes.

## Related Guides

- [Security Implementation Guide](SECURITY-IMPLEMENTATION-GUIDE.md)
- [JWT, OAuth2, and Spring Security](JWT-OAUTH2-SPRING-SECURITY.md)
- [Token lifecycle](oauth/TOKEN-LIFECYCLE.md)
- [JWT best practices](jwt/JWT-BEST-PRACTICES.md)
- [JWKS asymmetric JWT](jwt/JWKS-ASYMMETRIC-JWT.md)
- [API security principles](principles/API-SECURITY-PRINCIPLES.md)
- [Secrets and credentials](principles/SECRETS-AND-CREDENTIALS.md)

## Official References

- [OAuth 2.0 Security Best Current Practice — RFC 9700](https://www.rfc-editor.org/rfc/rfc9700)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

## Recommended Next

Return to [Access, Refresh Token, And API Key Design](./ACCESS-REFRESH-API-KEY-IMPLEMENTATION-GUIDE.md) to select the next focused guide.
