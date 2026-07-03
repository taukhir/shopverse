---
title: Reduce Docker Image Size
---

# Reduce Docker Image Size

Back to [Optimization Solutions](../OPTIMIZATION-SOLUTIONS.md).

## Status

Implemented.

Changed all service Dockerfiles:

- `config-server/Dockerfile`
- `discovery-server/Dockerfile`
- `auth-service/Dockerfile`
- `user-service/Dockerfile`
- `order-service/Dockerfile`
- `payment-service/Dockerfile`
- `inventory-service/Dockerfile`
- `api-gateway/Dockerfile`

Runtime base changed from:

```dockerfile
FROM eclipse-temurin:21-jre-jammy AS runtime
```

to:

```dockerfile
FROM eclipse-temurin:21-jre-alpine AS runtime
```

The runtime package/user setup changed from Ubuntu commands:

```dockerfile
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system shopverse \
    && useradd --system --gid shopverse --home-dir ${APP_HOME} --shell /usr/sbin/nologin shopverse
```

to Alpine commands:

```dockerfile
RUN apk add --no-cache curl \
    && addgroup -S shopverse \
    && adduser -S -G shopverse -h ${APP_HOME} -s /sbin/nologin shopverse
```

Verification:

```powershell
docker compose build config-server discovery-server user-service auth-service order-service payment-service inventory-service api-gateway
docker images --format "{{.Repository}},{{.Tag}},{{.Size}}" | Select-String "shopverse/"
docker run --rm --entrypoint java shopverse/order-service:local -version
docker run --rm --entrypoint java shopverse/api-gateway:local -version
```

Result:

| Image | Before | After | Saved |
|---|---:|---:|---:|
| `shopverse/order-service:local` | 643 MB | 527 MB | 116 MB |
| `shopverse/payment-service:local` | 642 MB | 526 MB | 116 MB |
| `shopverse/inventory-service:local` | 642 MB | 526 MB | 116 MB |
| `shopverse/user-service:local` | 599 MB | 483 MB | 116 MB |
| `shopverse/api-gateway:local` | 546 MB | 430 MB | 116 MB |
| `shopverse/discovery-server:local` | 528 MB | 412 MB | 116 MB |
| `shopverse/auth-service:local` | 518 MB | 402 MB | 116 MB |
| `shopverse/config-server:local` | 493 MB | 377 MB | 116 MB |

The Java runtime smoke check passed on representative servlet and reactive
images:

```text
openjdk version "21.0.11" 2026-04-21 LTS
OpenJDK Runtime Environment Temurin-21.0.11+10
OpenJDK 64-Bit Server VM Temurin-21.0.11+10
```

## Problem

Shopverse service images are large.

Measured command:

```powershell
docker images --format "{{.Repository}},{{.Tag}},{{.Size}}"
```

Measured result:

| Image | Size |
|---|---:|
| `shopverse/order-service:local` | 643 MB |
| `shopverse/payment-service:local` | 642 MB |
| `shopverse/inventory-service:local` | 642 MB |
| `shopverse/user-service:local` | 599 MB |
| `shopverse/api-gateway:local` | 546 MB |
| `shopverse/discovery-server:local` | 528 MB |
| `shopverse/auth-service:local` | 518 MB |
| `shopverse/config-server:local` | 493 MB |

Layer inspection showed the application JAR is only part of the image.

Command:

```powershell
docker history shopverse/order-service:local --no-trunc
```

Relevant result:

```text
COPY app.jar: about 125 MB
Temurin Jammy runtime base layers: much larger
```

## Implemented Solution

Optimize in this order:

1. Fix Docker build context first.
2. Keep multi-stage builds.
3. Keep `COPY --chown`.
4. Switch runtime stage to a smaller Java runtime base.
5. Consider `jlink` later only if more image reduction is needed.

## Step 1: Keep Current Good Practices

The current Dockerfiles already use good basics:

```dockerfile
FROM eclipse-temurin:21-jdk-jammy AS build
...
FROM eclipse-temurin:21-jre-jammy AS runtime
...
COPY --chown=shopverse:shopverse --from=build /workspace/build/libs/*.jar app.jar
USER shopverse
```

Keep:

- multi-stage build
- non-root runtime user
- `COPY --chown` to avoid duplicate ownership layers
- `rm -rf /var/lib/apt/lists/*` after package install

## Step 2: Compare Runtime Base Images

The original runtime base was:

```dockerfile
FROM eclipse-temurin:21-jre-jammy AS runtime
```

The implemented runtime base is:

```dockerfile
FROM eclipse-temurin:21-jre-alpine AS runtime
```

The build stage still uses the JDK image:

```dockerfile
FROM eclipse-temurin:21-jdk-jammy AS build
```

This keeps Gradle builds unchanged and reduces only the runtime image.

Risks with Alpine that still need full-stack runtime observation:

- native DNS differences
- musl libc compatibility
- shell/package differences
- operational debugging differences

Verification:

```powershell
docker compose build order-service
docker images shopverse/order-service:local
docker compose up order-service
```

Check:

- app starts
- actuator health is `UP`
- TLS/JWKS calls work
- Kafka client starts
- MySQL driver works
- logs are readable

## Step 3: Consider A Custom Runtime With `jlink`

Not implemented yet. If Alpine is not acceptable or more reduction is needed,
evaluate a `jlink` runtime image.

High-level flow:

```dockerfile
FROM eclipse-temurin:21-jdk-jammy AS jre-build
RUN jlink \
    --add-modules java.base,java.logging,java.naming,java.management,java.security.jgss,java.instrument,jdk.crypto.ec \
    --strip-debug \
    --no-man-pages \
    --no-header-files \
    --compress=2 \
    --output /custom-jre

FROM ubuntu:24.04 AS runtime
ENV JAVA_HOME=/opt/java/openjdk
COPY --from=jre-build /custom-jre $JAVA_HOME
ENV PATH="$JAVA_HOME/bin:$PATH"
```

This requires careful module testing because Spring Boot, TLS, Kafka, JDBC, and
observability may need additional JDK modules.

## Step 4: Measure Again

After each image change:

```powershell
docker compose build order-service
docker images --format "{{.Repository}},{{.Tag}},{{.Size}}" |
  Select-String "shopverse/order-service"
```

Also verify runtime:

```powershell
docker compose up order-service
docker compose ps
docker logs shopverse-order-service --tail 100
```

## Risk

Base image changes can reduce size but introduce runtime differences. Change
one service first, verify, then roll the pattern across services.
