---
title: Linux Filesystems, Disk, And Block I/O Troubleshooting
description: Diagnose capacity, inodes, mounts, permissions, deleted-open files, page cache, writeback, block devices, I/O latency, filesystem errors, and recovery risks.
difficulty: Advanced
page_type: Production Guide
status: Generic
prerequisites: [Linux Processes CPU Memory And OOM]
learning_objectives: [Distinguish filesystem and block symptoms, Diagnose space and latency safely, Protect data during storage incidents]
technologies: [Linux filesystems, block layer, LVM]
last_reviewed: "2026-07-24"
---

# Linux Filesystems, Disk, And Block I/O Troubleshooting

## Storage Path

```text
application syscall
 -> VFS/filesystem
 -> page cache/writeback
 -> block scheduler/device mapper
 -> virtual/physical device
 -> controller/storage network/media
```

Latency at the application may come from locks, fsync, dirty-page throttling, queue depth,
device latency, network storage, filesystem journal, or a full/error-remounted filesystem.

## Capacity And Inodes

```bash
df -hT
df -i
findmnt
lsblk -o NAME,TYPE,SIZE,FSTYPE,MOUNTPOINTS
du -x -h --max-depth=1 /var | sort -h
```

`df` reports filesystem allocation; `du` walks reachable directory entries. They differ when
deleted files remain open, snapshots/reserved blocks exist, mount boundaries hide data, or
filesystem accounting differs. `df -i` exposes inode exhaustion from many small files.

Bound `du`/`find` to an exact filesystem and off-peak when metadata scanning is expensive.
Do not delete unknown large files, database segments, journals or container layers manually.

## Deleted But Open Files

Deleting a pathname removes a directory link, but blocks remain until the last file descriptor
closes. Find the owning process:

```bash
lsof +L1
ls -l /proc/<pid>/fd
```

Prefer application-supported log rotation/reopen or controlled restart after impact analysis.
Truncating through `/proc` is risky and must respect application semantics.

## Permissions And Identity

Diagnose owner/group/mode, path traversal permissions, ACLs, mount flags, user namespaces,
SELinux/AppArmor and service/container identity. `chmod 777` is not diagnosis.

```bash
namei -l /path/to/file
getfacl /path/to/file
id <user>
mount | grep <mountpoint>
```

## I/O Evidence

```bash
iostat -xz 1
pidstat -d 1
vmstat 1
cat /proc/pressure/io
```

Interpret request rate, throughput, average queue, latency and utilization in device context.
100% utilization on a parallel device does not by itself prove saturation; latency, queueing
and workload SLO matter. Identify the processes/files and read/write/fsync pattern.

Page cache can make reads fast until working set exceeds memory. Buffered writes can appear
fast until writeback/`fsync` exposes device durability cost. Track dirty/writeback memory and
application commit latency.

## Filesystem And Kernel Errors

```bash
journalctl -k --since "-1 hour"
dmesg --ctime | tail -n 200
findmnt -o TARGET,SOURCE,FSTYPE,OPTIONS
```

Look for I/O errors, resets, filesystem corruption, read-only remount, multipath/storage network
events and device disappearance. Preserve logs and coordinate storage/vendor recovery. Do not
run `fsck` on a mounted production filesystem or assume repair is lossless; follow filesystem-
specific offline recovery with backups and owners.

## LVM, RAID, And Cloud Volumes

Understand the mapping from filesystem through logical volume, volume group, physical device,
RAID/storage layer. Capacity expansion may require extending volume and filesystem separately.
Snapshots consume copy-on-write capacity and are not independent backups. Cloud volumes have
IOPS/throughput/burst/queue limits and attachment/failure-domain behavior.

## Container Storage

Container writable layers, image layers, logs, volumes, emptyDir/tmpfs and kubelet data can fill
node storage. Kubernetes ephemeral-storage requests/limits and eviction thresholds matter. Find
the exact owning workload and use runtime/kubelet-supported cleanup; do not delete runtime data
directories manually.

## Incident Runbooks

**Filesystem 95% full:** forecast time remaining, identify mount and growth owner, check inodes/
deleted-open/snapshots/logs, contain writes, free only approved recoverable data or expand safely,
then correct retention/rotation/capacity and verify application.

**I/O latency spike:** correlate affected process and device, queue/latency/throughput, read/write/
fsync, kernel/storage events and neighboring workload. Contain high-cost job or traffic, restore
device path/capacity, then tune application layout/batching/caching from evidence.

**Read-only filesystem:** treat as potential integrity/storage failure. Stop unsafe writes, preserve
evidence, check kernel/storage, fail over or unmount through approved recovery, validate data and
restore before returning traffic.

## Interview Questions

**`df` full but `du` small?** Deleted-open files, hidden mounts, snapshots/reserved blocks or
namespace differences. Check `lsof +L1`, mounts and filesystem/storage accounting.

**What does high iowait mean?** CPUs are idle while tasks await I/O, but it does not identify the
device/root cause. Correlate per-device latency/queue and process workload.

**Can a snapshot replace backup?** No. It may share the same failure domain and depends on source/
copy-on-write metadata; use independent, tested restore.

## Official References

- [Linux filesystem documentation](https://docs.kernel.org/filesystems/)
- [Linux block layer](https://docs.kernel.org/block/)
- [Filesystem Hierarchy Standard](https://refspecs.linuxfoundation.org/FHS_3.0/fhs/index.html)

## Recommended Next

Continue with [systemd, Logs, Networking, Security, Containers, And cgroups](./LINUX-SERVICES-NETWORK-CONTAINERS.md).

