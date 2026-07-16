---
title: OAuth2 Grant Types
status: "maintained"
last_reviewed: "2026-07-13"
---

# OAuth2 Grant Types

Grant types define how a client obtains a token.

| Grant type | Use case | Current recommendation |
|---|---|---|
| Authorization Code + PKCE | browser/mobile user login | preferred for user-facing apps |
| Client Credentials | service-to-service | preferred for machine-to-machine |
| Device Authorization | devices with limited input | useful for TVs/CLI/devices |
| Refresh Token | renew access without full login | use rotation and reuse detection |
| Resource Owner Password | legacy direct password collection | avoid for new systems |
| Token Exchange | issue a narrower or audience-specific delegated token | use only with explicit delegation policy |
| JWT Bearer Assertion | exchange a trusted signed assertion for a token | enterprise federation or workload identity |
| Implicit | legacy browser token response | do not use for new systems |

## Client Credentials

Use this when no user is involved:

```text
service -> authorization server -> access token -> protected API
```

The token should have narrow scopes and an audience for the target API.

## Context And Examples

The complete decision matrix, protocol examples, threat notes, and Shopverse
scenarios are maintained in [OAuth2 OIDC And Token Flows](../spring-security/OAUTH2-OIDC-FLOWS.md).

Remember that OIDC is an identity layer, not another grant. It normally uses
Authorization Code with PKCE and adds an ID Token. Refresh Token continues an
existing authorization, while Token Exchange creates a separately governed
delegation for another audience.

## Related Guides

- [Service-to-service security](../principles/SERVICE-TO-SERVICE-SECURITY.md)
- [OAuth2 fundamentals](OAUTH2-FUNDAMENTALS.md)
