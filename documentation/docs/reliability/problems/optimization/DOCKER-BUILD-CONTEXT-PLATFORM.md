---
title: Fix Docker Build Context For Platform Modules
status: "maintained"
last_reviewed: "2026-07-13"
---

# Fix Docker Build Context For Platform Modules

Back to [Optimization Solutions](../OPTIMIZATION-SOLUTIONS.md).

## Status

Implemented.

Changed files:

- root `.dockerignore`
- `docker-compose.yml`
- `config-server/Dockerfile`
- `discovery-server/Dockerfile`
- `user-service/Dockerfile`
- `auth-service/Dockerfile`
- `order-service/Dockerfile`
- `payment-service/Dockerfile`
- `inventory-service/Dockerfile`
- `api-gateway/Dockerfile`

Verified with:

```powershell
docker compose config --quiet
docker build -f order-service/Dockerfile .
docker compose build order-service
docker build -f api-gateway/Dockerfile .
```

Result:

- Compose config resolved successfully.
- `order-service` Docker build no longer fails with missing `shopverse-platform`.
- `docker compose build order-service` produced `shopverse/order-service:local`.
- `api-gateway` also builds with the root-context Dockerfile layout.
- Docker root build context stayed small because of `.dockerignore`; the first `order-service` build transferred about `242 KB`.

## Problem

After extracting shared infrastructure into `shopverse-platform`, each service
uses a Gradle composite build:

```groovy
includeBuild('../shopverse-platform')
```

Local Gradle builds work because the service directory and `shopverse-platform`
are siblings. Docker builds fail because each Compose service currently uses a
service-only context:

```yaml
order-service:
  build:
    context: ./order-service
```

Inside that Docker build context, `../shopverse-platform` is not available.

Observed failure:

```text
Included build '/shopverse-platform' does not exist.
```

Command that exposed the problem:

```powershell
docker build order-service
```

## Target Solution

Use the repository root as the Docker build context and point each service to
its own Dockerfile.

```yaml
order-service:
  build:
    context: .
    dockerfile: order-service/Dockerfile
```

Then update the service Dockerfile so it copies both:

- the service source/build files
- `shopverse-platform`

## Step 1: Add A Root `.dockerignore`

The root context is larger than a service-only context. Add a strict root
`.dockerignore` so Docker does not send unnecessary files.

Implemented root ignore:

```dockerignore
.git
.gitignore
.gitattributes
.gradle
**/.gradle
**/build
**/logs
**/*.log
.idea
.vscode
**/*.iml
**/node_modules
documentation/.docusaurus
documentation/build
shopverse-web/.angular
shopverse-web/dist
shopverse-web/coverage
assets/**/*.psd
assets/**/*.tmp
```

Keep files needed by Docker builds:

- service `gradlew`
- service `gradle/`
- service `settings.gradle`
- service `build.gradle`
- service `src/`
- `shopverse-platform/`

## Step 2: Change Compose Build Contexts

Change each app service from:

```yaml
build:
  context: ./order-service
```

to:

```yaml
build:
  context: .
  dockerfile: order-service/Dockerfile
```

Apply the same pattern to:

- `config-server`
- `discovery-server`
- `user-service`
- `auth-service`
- `order-service`
- `payment-service`
- `inventory-service`
- `api-gateway`

Only services that use `includeBuild('../shopverse-platform')` need this for
platform access. Using one consistent pattern across app services keeps Compose
predictable.

Implemented shape:

```yaml
order-service:
  build:
    context: .
    dockerfile: order-service/Dockerfile
```

## Step 3: Update Dockerfile Copy Paths

For `order-service`, change Dockerfile paths from service-context paths:

```dockerfile
COPY gradlew gradlew.bat settings.gradle build.gradle ./
COPY gradle ./gradle
COPY src ./src
```

to root-context paths:

```dockerfile
COPY order-service/gradlew order-service/gradlew.bat order-service/settings.gradle order-service/build.gradle ./
COPY order-service/gradle ./gradle
COPY shopverse-platform ../shopverse-platform
COPY order-service/src ./src
```

The important part is preserving this layout inside the build container:

```text
/workspace/order-service
/workspace/shopverse-platform
```

Implemented build stage shape:

```dockerfile
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /workspace/order-service

COPY order-service/gradlew order-service/gradlew.bat order-service/settings.gradle order-service/build.gradle ./
COPY order-service/gradle ./gradle
COPY shopverse-platform ../shopverse-platform
RUN chmod +x ./gradlew

COPY order-service/src ./src
RUN --mount=type=cache,id=shopverse-order-service-gradle,target=/root/.gradle ./gradlew bootJar --no-daemon --max-workers=2
```

The relative path in `settings.gradle` resolves because
`../shopverse-platform` points to `/workspace/shopverse-platform`.

## Step 4: Preserve Docker Cache Layers

Copy Gradle wrapper and build files before source:

```dockerfile
COPY order-service/gradlew order-service/gradlew.bat order-service/settings.gradle order-service/build.gradle ./
COPY order-service/gradle ./gradle
COPY shopverse-platform ../shopverse-platform
RUN chmod +x ./gradlew

COPY order-service/src ./src
RUN --mount=type=cache,id=shopverse-order-service-gradle,target=/root/.gradle \
    ./gradlew bootJar --no-daemon --max-workers=2
```

This keeps dependency and platform build cache reuse better than copying the
whole repository at once.

## Step 5: Verify

```powershell
docker build -f order-service/Dockerfile .
```

Then verify Compose resolves:

```powershell
docker compose config
```

Then rebuild one service:

```powershell
docker compose build order-service
```

Expected result:

- Docker build no longer fails with missing `shopverse-platform`
- Build context remains controlled by root `.dockerignore`
- service images continue to use platform modules during `bootJar`

## Risk

The main risk is accidentally sending too much of the repository as Docker
context. The root `.dockerignore` is mandatory for this solution.
