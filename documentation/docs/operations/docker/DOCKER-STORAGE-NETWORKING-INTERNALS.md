---
title: Docker Storage, Volumes, OverlayFS, Networking, And DNS
description: Trace image snapshots and copy-on-write, volumes, bind and tmpfs mounts, backups, bridge and host networking, veth, NAT, port publishing, embedded DNS, IPv6, MTU, and failures.
difficulty: Advanced
page_type: Explanation
status: Generic
prerequisites: [Docker Engine internals]
learning_objectives: [Explain filesystem and packet paths, Select storage and network modes, Back up persistent data, Diagnose disk DNS NAT firewall and MTU failures]
technologies: [Docker, OverlayFS, containerd snapshotter, volumes, bridge networking]
last_reviewed: "2026-07-24"
---

# Docker Storage, Volumes, OverlayFS, Networking, And DNS

## Two Storage Questions

Do not confuse daemon image/snapshot storage with application persistence:

- image store/snapshotter or storage driver holds image content and container writable layers;
- volume, bind, tmpfs and named-pipe mounts expose external storage into a container.

Current Engine installations can use containerd's image store and snapshotters; older/upgraded
installations may use legacy graph-driver behavior such as `overlay2`. Inspect `docker info` rather
than assuming host layout, and never edit `/var/lib/docker` internals directly.

## Copy-On-Write

Overlay-style snapshots combine immutable lower layers with an upper writable layer and merged view.
First modification of a lower file may copy it up. Deleting creates a whiteout/hide operation; bytes
remain in an older image layer. Write-heavy state in the container layer couples data to container
lifecycle and adds CoW overhead.

Page cache may be shared for common read-only content, but process memory and writable changes are
not magically deduplicated. Monitor host filesystem space and inodes as well as Docker's accounting.

## Persistence Choice

| Mount | Best fit | Main concerns |
|---|---|---|
| named volume | daemon-managed persistent application data | backup, ownership, driver and host locality |
| bind mount | explicit host integration or developer source | host coupling, permissions and broad write risk |
| tmpfs | sensitive/temporary memory-backed files | consumes memory and disappears on stop |
| writable layer | disposable logs/temp/runtime changes | lost on removal and poor for durable/write-heavy data |

A mount over a non-empty image directory obscures the image content. UID/GID are numeric across the
boundary; switching to non-root can expose stale root-owned volume data. SELinux labels, read-only
flags and mount propagation may also control behavior.

## Backup And Restore

Back up application-consistent data, not a running container or blind filesystem copy. Quiesce or use
database-native backup, capture configuration/version, encrypt and move backup to another failure
domain. Restore into an isolated container/volume and reconcile checksums/business invariants.

```bash
docker volume inspect orders-data
docker run --rm -v orders-data:/data:ro -v "$PWD":/backup \
  alpine tar -C /data -czf /backup/orders-data.tgz .
```

The example is crash-consistent only if the application is safely stopped/quiesced. Use an explicit,
validated path on the daemon host and protect the backup.

## Bridge Packet Path

For a user-defined bridge, a container typically gets one end of a veth pair in its network namespace;
the host end connects to a software bridge. Routes and firewall/NAT rules provide same-host traffic,
outbound masquerading and published-port DNAT/filtering.

```text
external client -> host NIC -> firewall/NAT -> bridge -> veth -> container socket
container -> veth -> bridge -> routing/NAT -> external destination
```

Docker can manage iptables or nftables rules depending on Engine configuration. Disabling rule
management without a complete replacement can break connectivity or expose ports. Published ports
can bypass assumptions made from a host firewall frontend; inspect the actual packet-filter path.

## Network Drivers

| Mode | Meaning | Trade-off |
|---|---|---|
| user-defined bridge | isolated same-host network with embedded DNS | NAT/firewall and one-host scope |
| host | shares host network namespace | performance/simplicity but weak isolation and port conflicts |
| none | only loopback/no normal network | strongest network isolation for offline work |
| macvlan/ipvlan | addresses integrated with external L2/L3 design | network-team, host-connectivity and switch constraints |
| overlay | multi-host network in swarm mode | encapsulation/control-plane/MTU complexity |

Prefer user-defined bridges over the default bridge for scoped isolation and automatic name
resolution. Compose normally creates a project-scoped network.

## DNS And Service Discovery

Default-bridge containers typically receive host resolver settings; custom networks use Docker's
embedded DNS and service/container aliases, forwarding external queries upstream. Diagnose from
inside the exact network namespace. Container IPs change; use service names, not fixed addresses.

Compose `depends_on` controls lifecycle ordering under configured semantics but does not make a
dependency continuously available. Health checks can gate startup; applications still need bounded
retry/reconnect after later failure.

## Port Publishing

`EXPOSE` documents intent; `-p host:container` publishes. Bind explicitly to loopback when access
should remain local:

```bash
docker run --rm -p 127.0.0.1:8080:8080 orders:sha
```

Check IPv4/IPv6 binding, source-IP behavior, hairpin access and daemon/firewall implementation.
Publishing to all interfaces can expose services beyond expectation.

## Network Diagnosis

```bash
docker network inspect <network>
docker inspect <container>
docker exec <container> cat /etc/resolv.conf
docker exec <container> ip address
docker exec <container> ip route
ss -lntp
```

Trace name resolution, route, connection, firewall/NAT, listener and return path. Packet capture on
container veth, bridge and host interface can locate loss. MTU mismatch often appears as small traffic
working while large/TLS traffic stalls.

## Failure Matrix

| Symptom | First evidence |
|---|---|
| volume permission denied | numeric UID/GID, mount flags, host ownership, SELinux denial |
| disk full after image deletion | shared references, build cache, logs, volumes, inodes, GC |
| name resolves nowhere | network membership, aliases, embedded DNS and resolver config |
| host reaches port but peer cannot | bind address, host/cloud firewall, published mapping |
| outbound fails | route, IP forwarding, NAT/firewall and upstream DNS/proxy |
| intermittent TLS/large request | MTU/fragmentation, packet loss, conntrack or proxy |

## Official References

- [Docker storage](https://docs.docker.com/engine/storage/)
- [containerd image store](https://docs.docker.com/engine/storage/containerd/)
- [Docker networking](https://docs.docker.com/engine/network/)
- [Packet filtering and firewalls](https://docs.docker.com/engine/network/packet-filtering-firewalls/)

## Recommended Next

Continue with [Security, Compose, Resources, Logging, And Production Operations](./DOCKER-SECURITY-PRODUCTION-OPERATIONS.md).

