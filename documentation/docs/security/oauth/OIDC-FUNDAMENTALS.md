---
title: OIDC Fundamentals
status: "maintained"
last_reviewed: "2026-07-13"
---

# OIDC Fundamentals

OpenID Connect adds authentication on top of OAuth2. OAuth2 answers "can this
client access this resource?" OIDC also answers "who is the user?"

For the full login flow, SSO model, token validation, session design, and threat
controls, read [SSO And OpenID Connect](./SSO-AND-OPENID-CONNECT.md).

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
- [SSO and OpenID Connect](SSO-AND-OPENID-CONNECT.md)
- [Google authentication with Spring Boot](GOOGLE-AUTHENTICATION-SPRING.md)
- [Token lifecycle](TOKEN-LIFECYCLE.md)
