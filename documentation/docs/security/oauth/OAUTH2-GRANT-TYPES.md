---
title: OAuth2 Grant Types
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

## Client Credentials

Use this when no user is involved:

```text
service -> authorization server -> access token -> protected API
```

The token should have narrow scopes and an audience for the target API.

## Related Guides

- [Service-to-service security](../principles/SERVICE-TO-SERVICE-SECURITY.md)
- [OAuth2 fundamentals](OAUTH2-FUNDAMENTALS.md)

