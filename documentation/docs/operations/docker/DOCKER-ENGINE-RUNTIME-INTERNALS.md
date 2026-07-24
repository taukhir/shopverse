---
title: Docker Engine, containerd, OCI Runtime, And Linux Isolation
description: Trace Docker client requests through dockerd, containerd, shims and OCI runtimes into namespaces, cgroups, mounts, capabilities, seccomp, lifecycle, signals, and exit status.
difficulty: Advanced
page_type: Explanation
status: Generic
prerequisites: [Linux process fundamentals, Docker basics]
learning_objectives: [Trace docker run internally, Explain kernel isolation and limits, Diagnose runtime lifecycle and signal failures]
technologies: [Docker Engine, containerd, runc, OCI, Linux]
last_reviewed: "2026-07-24"
---

# Docker Engine, containerd, OCI Runtime, And Linux Isolation

## Client-To-Process Path

```text
docker CLI -> selected context/DOCKER_HOST -> Engine HTTP API -> dockerd
           -> image/network/volume setup -> containerd task
           -> shim -> OCI runtime create/start -> Linux process
```

The CLI can control a remote daemon; paths, mounts, credentials and privileges belong to the daemon
host, not necessarily the CLI machine. Protect the Unix socket/TCP API: control of the daemon can
commonly become control of the host.

`dockerd` manages Docker objects and policy. containerd manages image content/snapshots and container
tasks. An OCI runtime such as runc creates the process according to an OCI runtime specification.
A shim lets containerd restart independently while supervising I/O and exit status for running tasks.
Exact packaging and image-store details vary by supported Engine version—inspect `docker info`.

## `docker run` Lifecycle

1. parse CLI and merge image config with runtime overrides;
2. resolve/pull manifest or image index and content blobs;
3. prepare a root filesystem snapshot/writable layer;
4. create namespaces, cgroup configuration, mounts and security policy;
5. connect networks and allocate addresses;
6. create and start PID 1 with environment, user, cwd and command;
7. attach/log or detach; track health, state and exit;
8. stop by signal plus timeout; delete process/snapshot metadata when removed.

`docker create` stops before start. `docker exec` creates another process in an existing container's
namespaces/cgroup; it is not a new container and disappears with the target container.

## Namespaces

| Namespace | Isolated view |
|---|---|
| PID | process identifiers and hierarchy |
| mount | filesystem mount tree |
| network | interfaces, routes, sockets, firewall namespace |
| UTS | hostname/domain name |
| IPC | shared memory, semaphores and message queues |
| user | UID/GID mappings and capabilities |
| cgroup/time | cgroup namespace and optionally clocks |

Namespaces isolate visibility, not resource consumption. Containers on one host still share the
kernel, so kernel vulnerabilities and excessive privilege matter.

## Cgroups And Resources

Cgroups account and constrain CPU, memory, PIDs and I/O. On cgroup v2, a unified hierarchy exposes
controls such as CPU quota/weight, memory limits/events and PID maximum. Docker flags translate into
runtime/cgroup configuration.

```bash
docker run --rm --cpus=1.5 --memory=768m --pids-limit=256 app:sha
docker stats --no-stream
docker inspect <container> --format '{{json .HostConfig}}'
```

CPU exhaustion normally causes throttling/queueing; memory limit breach can invoke cgroup OOM and
kill a process. The container exit code or `OOMKilled` state must be correlated with kernel/cgroup
events. Host memory, page cache, native memory and other containers remain part of the model.

## Root Filesystem And Mounts

The runtime assembles the image root filesystem plus writable snapshot, mounts `/proc`, devices,
binds/volumes and pivots/chroots into that view. A mount can obscure image files at the same path.
Mount namespaces do not make a writable host bind safe; permissions, SELinux/AppArmor labels and
read-only flags still govern access.

## Capabilities, Seccomp And Security Modules

Capabilities split root powers; Docker drops some by default, but least privilege usually starts
with dropping all and adding a measured minimum. Seccomp filters syscalls. AppArmor/SELinux can
restrict filesystem/process behavior. `--privileged`, host namespaces, device access and daemon
socket mounts sharply weaken isolation.

Root inside a container can map to host root unless user namespaces/rootless mode change the trust
model. Running the application as non-root is necessary but not sufficient.

## PID 1, Signals And Zombies

PID 1 has special signal and orphan-reaping behavior. Shell-form commands can make a shell PID 1
and prevent signals reaching the application. Prefer exec form:

```dockerfile
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
```

Use an init process only when the application cannot reap children. On stop, Docker sends the
configured stop signal, waits the timeout, then force-kills. The application must handle termination,
stop accepting work, finish bounded operations and exit.

## Container State And Exit Codes

Inspect `State.Status`, `ExitCode`, `Error`, `OOMKilled`, timestamps, restart count and health. Exit
137 often reflects SIGKILL but does not alone prove OOM; exit 143 commonly reflects SIGTERM. Determine
who sent the signal and why from daemon, kernel and application evidence.

Restart policies can mask a crash loop. Preserve previous logs/exit state and fix the cause rather
than raising restart speed.

## Diagnostic Toolkit

```bash
docker version
docker info
docker inspect <container>
docker events --since 30m
docker top <container>
docker diff <container>
docker stats --no-stream
nsenter -t <host-pid> -m -n -p -u -i
```

Use `nsenter`, runtime CLI and host cgroup files only with appropriate privilege and understanding.
Docker Desktop adds a Linux VM boundary; diagnose which host/VM owns the daemon and filesystem.

## Interview Questions

**Is a container a process?** The running workload is one or more host-kernel processes placed in
namespaces/cgroups with a constructed root filesystem and security policy; the container also has
runtime metadata and lifecycle managed by the daemon/runtime.

**Why containerd plus runc?** containerd provides long-lived lifecycle/content/task management;
runc performs OCI runtime creation/start. The separation supports standard interfaces and supervision.

**Why can root in a container be dangerous?** Shared kernel, capabilities, host mounts/devices/socket
and namespace configuration can provide escalation paths; root is not automatically harmless.

## Official References

- [Docker Engine overview](https://docs.docker.com/engine/)
- [Docker security](https://docs.docker.com/engine/security/)
- [OCI runtime specification](https://github.com/opencontainers/runtime-spec)
- [Linux cgroup v2](https://docs.kernel.org/admin-guide/cgroup-v2.html)

## Recommended Next

Continue with [OCI Images, Dockerfiles, BuildKit, Cache, And Registries](./DOCKER-IMAGES-BUILDKIT-SUPPLY-CHAIN.md).

