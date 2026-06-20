---
title: OIDC Fundamentals
---

# OIDC Fundamentals

OpenID Connect adds authentication on top of OAuth2. OAuth2 answers "can this
client access this resource?" OIDC also answers "who is the user?"

## Tokens

| Token | Purpose |
|---|---|
| Access token | authorize API/resource access |
| ID token | authenticate the user to the client |
| Refresh token | obtain new access tokens |

Do not use an access token as a replacement for an ID token in a browser
client. The access token is meant for resource servers.

## Claims

OIDC ID tokens commonly include identity claims such as:

- `sub`
- `name`
- `email`
- `preferred_username`
- `auth_time`

## Related Guides

- [OAuth2 fundamentals](OAUTH2-FUNDAMENTALS.md)
- [Token lifecycle](TOKEN-LIFECYCLE.md)

