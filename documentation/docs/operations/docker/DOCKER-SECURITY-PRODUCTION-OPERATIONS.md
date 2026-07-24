---
title: Docker Security, Compose, Resources, Logging, And Production Operations
description: Harden Docker daemon and containers, use rootless and user namespaces, secure secrets and sockets, operate Compose, resources, health, logging, upgrades, cleanup, and recovery.
difficulty: Advanced
page_type: Decision Guide
status: Generic
prerequisites: [Docker storage and networking internals]
learning_objectives: [Threat-model Docker, Harden daemon images and containers, Operate Compose and resources safely, Govern logs upgrades cleanup and recovery]
technologies: [Docker Engine, Docker Compose, rootless mode, seccomp]
last_reviewed: "2026-07-24"
---

# Docker Security, Compose, Resources, Logging, And Production Operations

## Threat Model

Protect the daemon API/socket, host kernel, runtime, registry, build system/cache, image content,
credentials, host mounts/devices and inter-container network. A container escape is not the only
risk: a workload with the daemon socket can ask the daemon to mount host files or start privileged
containers.

## Daemon Security

- expose the API only through authenticated, authorized, encrypted channels;
- restrict membership in the Docker-management group and audit access;
- patch Engine, containerd, runtime, host kernel and plugins;
- use rootless mode where its limitations fit, or user namespace remapping where appropriate;
- isolate untrusted build workloads from production daemons/caches/credentials;
- avoid daemon socket mounts and broad TCP listeners;
- constrain registry mirrors/proxies and trust configuration.

Rootless mode runs daemon and containers inside a user namespace, reducing host-root exposure, but
has networking, storage, cgroup and privileged-feature considerations. It does not make malicious
images safe or remove application vulnerabilities.

## Container Hardening

```yaml
services:
  orders:
    image: registry.example/orders@sha256:REPLACE
    user: "10001:10001"
    read_only: true
    init: true
    cap_drop: [ALL]
    security_opt:
      - no-new-privileges:true
    tmpfs:
      - /tmp:size=64m,mode=1777
    pids_limit: 256
    mem_limit: 1g
    cpus: 1.5
```

Also minimize packages, scan and sign images, avoid secrets in layers/environment where possible,
use read-only mounts, restrict networks/ports/devices and keep the default seccomp profile unless a
reviewed requirement proves a narrower/custom change. Privileged mode is not a normal fix for
permission errors.

## Compose Production Boundaries

Compose is excellent for local development, integration environments and bounded single-host
deployments. It offers declarative services, networks, volumes, health checks, profiles and restart
policy, but it is not a multi-node HA scheduler. Choose orchestration when requirements include node
failover, rolling placement, multi-host scheduling, strong multi-tenancy or large fleet governance.

Merge and render configuration before deployment:

```bash
docker compose config --quiet
docker compose config --images
docker compose pull
docker compose up -d --wait
docker compose ps
```

Pin project name/files/profiles, environment sources and image digests. Avoid silently interpolating
missing variables. `depends_on` is not a runtime dependency manager.

## Health, Restart And Shutdown

Health checks should be cheap, bounded and local enough to avoid restart cascades. Docker records
health but restart behavior depends on tooling/policy; Compose dependency health primarily assists
startup. Applications must handle dependency loss later.

Set a stop grace period matching measured shutdown. Use exec-form PID 1, drain ingress/proxy first
where needed and make workers idempotent. Restart policies can improve recovery from transient
process exit but can also hide deterministic crash loops.

## Resources And Capacity

Set memory, CPU and PID controls based on measurement. Monitor throttling, cgroup memory events,
host pressure, filesystem/inodes and network. The daemon itself, logging and build cache need capacity.
A single host remains a failure domain; reserve restart/surge headroom and avoid overcommitting stateful
services without a recovery design.

## Logging

Containers normally write structured logs to stdout/stderr; a logging driver stores/forwards them.
The default local configuration can consume disk if unbounded. Configure rotation or a suitable
driver, centralize important logs and preserve daemon/kernel audit evidence. Avoid logging secrets.

Do not use the container filesystem as the durable log archive. Driver backpressure and remote
collector failure can affect applications differently; test the chosen mode.

## Secrets And Configuration

Do not bake secrets into Dockerfiles, image layers, Git or Compose files. Use a governed secret store
and inject short-lived credentials through supported runtime mechanisms. Environment variables are
easy but may appear in inspections, crashes or support tooling; mounted files with permissions or
workload identity may be safer.

## Upgrades And Recovery

Read release/deprecation notes, back up volume/application data and daemon configuration, test image/
network/storage compatibility and canary non-critical hosts. Existing containers may continue through
some daemon operations, but do not assume every upgrade is live or reversible. Recreate from declared
configuration and immutable images rather than relying on modified containers.

## Cleanup And Retention

Inventory first:

```bash
docker system df -v
docker image ls --digests
docker volume ls
docker builder prune --filter 'until=168h'
```

Prune commands can delete warm cache, stopped containers and unreferenced images; volume-inclusive
pruning can destroy data. Automate scoped retention with ownership and protected-volume rules. Registry
garbage collection is separate from host cleanup.

## Production Evidence

Maintain daemon configuration, access audit, hardened Compose policy, image provenance/SBOM/scan,
resource test, graceful-stop test, volume restore, log-loss/backpressure test, upgrade record and
incident runbook. “The container started” is not production readiness.

## Official References

- [Docker Engine security](https://docs.docker.com/engine/security/)
- [Rootless mode](https://docs.docker.com/engine/security/rootless/)
- [Seccomp profiles](https://docs.docker.com/engine/security/seccomp/)
- [Docker Compose](https://docs.docker.com/compose/)

## Recommended Next

Finish with [Troubleshooting, Incident Labs, Interviews, And Revision](./DOCKER-TROUBLESHOOTING-INTERVIEW-REVISION.md).

