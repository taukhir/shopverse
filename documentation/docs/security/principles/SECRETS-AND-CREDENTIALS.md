---
title: Secrets And Credentials
status: "maintained"
last_reviewed: "2026-07-13"
---

# Secrets And Credentials

Secrets include passwords, database credentials, private keys, API keys,
OAuth2 client secrets, signing keys, and encryption keys.

## POC Versus Production

| Environment | Acceptable approach |
|---|---|
| local POC | `.env` file ignored by Git, sample `.env.example`, short-lived demo values |
| CI | encrypted repository/environment secrets |
| production | secret manager such as Vault, AWS Secrets Manager, Azure Key Vault, GCP Secret Manager, or Kubernetes Secrets with external encryption |

## Rules

- Never commit real secrets.
- Keep `.env` out of Git.
- Provide `.env.example` with placeholders.
- Rotate secrets after accidental exposure.
- Use different secrets per environment.
- Avoid sharing one credential across all services.
- Prefer short-lived credentials where possible.
- Do not log secrets, tokens, or password hashes.

## Docker And Kubernetes

For Docker Compose POCs, environment variables are simple and transparent.
For production, prefer orchestrator-managed secrets or a secret manager.

```yaml
services:
  user-service:
    environment:
      DB_USERNAME: ${USER_DB_USERNAME}
      DB_PASSWORD: ${USER_DB_PASSWORD}
```

This is acceptable for local development only when the `.env` file is ignored.

## Related Guides

- [Docker guide](../../operations/DOCKER.md)
- [Security principles](SECURITY-PRINCIPLES.md)

