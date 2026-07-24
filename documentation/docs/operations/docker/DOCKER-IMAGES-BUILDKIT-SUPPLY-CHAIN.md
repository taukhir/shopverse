---
title: Docker OCI Images, Dockerfiles, BuildKit, Cache, And Registries
description: Understand OCI manifests, indexes, config, layers, content addressing, Dockerfile execution, BuildKit graphs and caches, multi-platform builds, reproducibility, SBOMs, provenance, signing, and registry lifecycle.
difficulty: Advanced
page_type: Tutorial
status: Generic
prerequisites: [Docker runtime internals]
learning_objectives: [Inspect OCI image structure, Engineer fast reproducible builds, Build multi-platform safely, Govern the image supply chain]
technologies: [Docker, OCI Image, BuildKit, buildx, Registry]
last_reviewed: "2026-07-24"
---

# Docker OCI Images, Dockerfiles, BuildKit, Cache, And Registries

## OCI Image Model

```text
tag -> manifest (one platform) -> config JSON + ordered compressed layer blobs
tag -> image index/manifest list -> per-platform manifests
```

Registry tags are mutable names; digests identify content. The image config carries default command,
entrypoint, environment, user, working directory, labels and rootfs layer diff IDs. Layers are tar-like
filesystem changes. Pulling verifies content digests, then a snapshotter/storage backend prepares the
runtime filesystem.

A multi-platform tag resolves according to OS/architecture/variant. Digest-pin deployments for
immutability while keeping an automated rebuild process for base-image security updates.

## Build Execution And Cache

BuildKit interprets the Dockerfile/frontend into a dependency graph and can execute independent
vertices concurrently. Cache identity depends on operation and inputs, not simply line number.
A changed input invalidates dependent vertices. Order stable dependency metadata before volatile source.

```dockerfile
# syntax=docker/dockerfile:1
FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace
COPY gradlew settings.gradle build.gradle ./
COPY gradle ./gradle
RUN --mount=type=cache,target=/root/.gradle ./gradlew dependencies --no-daemon
COPY src ./src
RUN --mount=type=cache,target=/root/.gradle ./gradlew bootJar --no-daemon

FROM eclipse-temurin:21-jre
RUN useradd --system --uid 10001 app
WORKDIR /app
COPY --from=build --chown=10001:10001 /workspace/build/libs/*.jar app.jar
USER 10001
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
```

Use `.dockerignore` to remove Git history, outputs, credentials and irrelevant inputs from context.
Multi-stage builds keep compilers and source out of runtime images. `COPY --chown` avoids a large
ownership-only layer.

## Cache Mounts, Secrets And SSH

Cache mounts accelerate package managers without copying cache into the final image. Secret and SSH
mounts expose sensitive material to one build operation without intentionally persisting it. Do not
use `ARG`, `ENV`, copied credential files or echoed commands for secrets: image history/cache/logs
can preserve them.

```dockerfile
RUN --mount=type=secret,id=maven_settings,target=/root/.m2/settings.xml \
    ./mvnw -B package
```

CI builders can import/export registry-backed cache. Separate trusted and untrusted branches so an
attacker cannot poison or read privileged cache.

## Reproducibility

Pin dependency locks and base-image digest where policy requires, control timestamps/locale/build
metadata, isolate network downloads, verify checksums and rebuild from clean infrastructure. Perfect
byte reproducibility is toolchain-specific; at minimum prove traceability from source revision and
builder to digest using provenance.

Avoid `latest`, unbounded package upgrades and remote scripts without integrity checks. A pinned old
digest is immutable but may be vulnerable; automation should propose reviewed digest updates.

## Multi-Platform Builds

`buildx` can use native nodes, emulation or cross-compilation. Emulation is convenient but slower and
can hide architecture-specific behavior. Run tests on the target architecture for native libraries,
JIT/runtime behavior and performance.

```bash
docker buildx build --platform linux/amd64,linux/arm64 \
  --tag registry.example/orders:1.0 --push .
docker buildx imagetools inspect registry.example/orders:1.0
```

## Image Size And Runtime Quality

Optimize pull/start/attack surface without sacrificing supportability. Compare JRE bases, distroless,
Alpine/musl and `jlink` using compatibility, CVE/patch process, certificates/time zones, native libs,
debuggability and measured size/start/memory. Deleting a file in a later layer does not remove earlier
bytes; clean in the same step or use a discarded build stage.

## Supply Chain

Generate an SBOM, scan OS and application dependencies, produce provenance, sign/attest the digest,
store in a protected registry and enforce trusted artifacts at deployment. Define severity/exploitability
policy, exception expiry and rebuild SLA. Scanning source but not the final image misses installed OS
content; scanning only once misses newly disclosed vulnerabilities.

## Registry Operations

Plan authentication/authorization, TLS, immutable tags, retention, garbage collection, replication,
rate limits, quota and disaster recovery. Deleting a tag may not immediately delete shared blobs.
Mirror or pre-pull critical bases where external availability or rate limits threaten builds.

## Debugging Builds

```bash
docker buildx build --progress=plain --no-cache .
docker history --no-trunc <image>
docker image inspect <image>
docker buildx du
docker buildx imagetools inspect <image>
```

Diagnose context transfer, DNS/TLS/proxy, package source, permissions, architecture, cache source and
disk/inode pressure separately. A no-cache build is a diagnostic comparison, not a permanent fix.

## Official References

- [Docker Build](https://docs.docker.com/build/)
- [Build cache optimization](https://docs.docker.com/build/cache/optimize/)
- [Multi-platform builds](https://docs.docker.com/build/building/multi-platform/)
- [OCI image specification](https://github.com/opencontainers/image-spec)

## Recommended Next

Continue with [Storage, Volumes, OverlayFS, Networking, And DNS](./DOCKER-STORAGE-NETWORKING-INTERNALS.md).

