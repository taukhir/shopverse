---
title: Linux Services, Logs, Networking, Security, And Containers
description: Diagnose systemd units, journald, sockets, namespaces, firewall and routing, security denials, cgroups, containers, and Kubernetes node symptoms.
difficulty: Advanced
page_type: Production Guide
status: Generic
prerequisites: [Linux Filesystems And Storage]
learning_objectives: [Diagnose service lifecycle and logs, Inspect sockets and namespaces, Connect container symptoms to host cgroups and kernel]
technologies: [systemd, journald, iproute2, nftables, namespaces, cgroups]
last_reviewed: "2026-07-24"
---

# Linux Services, Logs, Networking, Security, And Containers

## systemd Unit Lifecycle

systemd manages dependency-ordered units, process supervision, restart policy, environment,
resource controls, sockets/timers and logs. A shell command that works interactively can fail as
a service because user, working directory, environment, permissions, limits and namespace differ.

```bash
systemctl status <unit> --no-pager
systemctl cat <unit>
systemctl show <unit>
systemctl list-dependencies <unit>
journalctl -u <unit> --since "-30 min" --no-pager
systemd-analyze critical-chain
```

After editing unit files, `daemon-reload` updates manager configuration; restarting is a separate
impactful action. Prevent infinite restart loops with bounded policies and actionable readiness.

## Journald And Logs

Query by unit, boot, priority, PID and time. Ensure clock/time zone context. Logs need rotation,
disk limits, persistence requirements, forwarding, structured identifiers and sensitive-data
redaction. During high-volume incidents, broad `journalctl` queries can be expensive; bound them.

```bash
journalctl -b -1 -p warning..alert
journalctl _PID=<pid> --since "2026-07-24 10:00:00"
journalctl -k --since "-15 min"
```

## Socket And Route Diagnosis

```bash
ss -lntup
ss -s
ip addr
ip route
ip rule
ip neigh
```

Confirm listening address/port, namespace, protocol, owning process, connection states, routing
table/policy, neighbor resolution and firewall. Binding only to loopback makes a service unreachable
externally; binding all interfaces increases exposure and requires firewall/authentication.

Connection states reveal backlog/SYN problems, many `TIME_WAIT`, failed peer close, or application
leaks. Do not tune TCP parameters before determining request behavior and port/connection ownership.

## DNS And Connectivity Tools

```bash
resolvectl status
getent hosts service.example
dig service.example A +trace
curl --connect-timeout 2 --max-time 5 -v https://service.example/health
```

`getent` follows system name-service configuration, while `dig` queries DNS directly; differences
matter. Capture packets only with authorization, exact filters/duration and secure handling because
traffic may contain sensitive data.

## Firewall And Security Controls

Modern systems may use nftables, iptables compatibility, cloud firewall/security groups, Kubernetes
NetworkPolicy and service-mesh policy simultaneously. Trace policy ownership at every layer.

SELinux/AppArmor denials appear in audit/kernel logs. Correct labels/profiles and least privilege;
do not disable mandatory access control globally as a shortcut. Check capabilities, seccomp, no-new-
privileges, user identity, sudo audit and file/socket permissions.

## Namespaces And cgroups

Namespaces isolate PID, network, mount, user, IPC, UTS and cgroup views. cgroups account/limit CPU,
memory, PIDs and I/O. A process can see different interfaces, mounts and PIDs than the host.

```bash
cat /proc/<pid>/cgroup
lsns
nsenter -t <pid> -n ip addr
systemd-cgls
systemd-cgtop
```

Enter namespaces only with authorization; it can bypass expected container isolation.

## Container Diagnosis

Map application symptom -> pod/container -> container PID/cgroup -> host/node. Check configured
requests/limits, throttling/OOM events, writable/volume storage, DNS, sockets, probe execution,
security context and node pressure. Minimal images may lack tools; use approved ephemeral debug
containers or host tooling without mutating the workload image.

For Kubernetes, correlate `kubectl describe`, events, previous logs, pod status, endpoints,
node conditions and host journal/runtime/kubelet evidence. A restart may erase the most useful state.

## Time And Certificates

Clock skew breaks TLS, tokens, distributed tracing, leases and logs. Check synchronized time and
timezone. Certificate failures require chain, hostname/SAN, validity, trust store, SNI and client-
certificate investigation—never `-k` as a production fix.

## Production Scenarios

**Service starts manually but not via systemd:** compare unit user, environment, working directory,
paths, permissions, limits, sandboxing, dependencies and journal.

**Port is open locally but remote cannot connect:** confirm listen address and namespace, route,
firewalls/security group/NetworkPolicy, proxy/LB target, TLS and return path.

**Container CPU is slow on idle host:** inspect cgroup quota/throttling, CPU request/limit, noisy
neighbors, affinity and thread pool; host aggregate idle does not remove local quota.

## Official References

- [systemd service manual](https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html)
- [iproute2 documentation](https://wiki.linuxfoundation.org/networking/iproute2)
- [Linux namespaces](https://man7.org/linux/man-pages/man7/namespaces.7.html)
- [Linux security modules](https://docs.kernel.org/admin-guide/LSM/)

## Recommended Next

Finish with [Incident Runbooks, Labs, Interview Questions, And Revision](./LINUX-INCIDENT-LABS-REVISION.md).

