---
title: OAuth2 Fundamentals
status: "maintained"
last_reviewed: "2026-07-13"
---

# OAuth2 Fundamentals

OAuth2 is an authorization framework. It defines how a client obtains an
access token and uses it to call a protected resource.

JWT is a token format. OAuth2 is the authorization protocol. OAuth2 access
tokens may be JWTs or opaque reference tokens.

## Actors

| Actor | Responsibility |
|---|---|
| Resource Owner | user or entity that owns protected data |
| Client | application requesting access |
| Authorization Server | authenticates, grants consent, and issues tokens |
| Resource Server | API that validates tokens and protects resources |

## Flow Shape

```mermaid
sequenceDiagram
    participant Client
    participant AS as Authorization Server
    participant API as Resource Server

    Client->>AS: request access token
    AS-->>Client: access token
    Client->>API: Authorization: Bearer token
    API->>API: validate token and authorize request
```

## Related Guides

- [OAuth2 grant types](OAUTH2-GRANT-TYPES.md)
- [OIDC fundamentals](OIDC-FUNDAMENTALS.md)
- [Spring Security OAuth2 flows](../spring-security/OAUTH2-OIDC-FLOWS.md)

