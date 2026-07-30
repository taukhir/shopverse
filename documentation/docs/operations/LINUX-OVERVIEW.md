---
title: Linux Overview - Kernel, Processes, Filesystems, Permissions, And Networking
description: Beginner introduction to Linux, distributions, shells, processes, users, permissions, filesystems, services, packages, networking, logs, resources, and essential commands.
sidebar_label: Linux Overview
difficulty: Beginner
page_type: Concept
status: maintained
prerequisites: [Basic command-line familiarity]
learning_objectives: [Explain the Linux kernel and user space, Inspect processes files services and networking, Understand users permissions and packages, Follow a safe diagnostic workflow]
technologies: [Linux, systemd, procfs]
last_reviewed: "2026-07-24"
scope: generic
owner: docs-operations
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# Linux Overview: Kernel, Processes, Filesystems, Permissions, And Networking

Linux is an operating-system kernel. A Linux **distribution** combines that kernel with system
libraries, command-line tools, a package manager, service management, defaults, and supported
software repositories. Ubuntu, Debian, Red Hat Enterprise Linux, Fedora, and Alpine are different
distributions built around the Linux kernel.

## Core Mental Model

```text
Hardware
└── Linux kernel: CPU scheduling, memory, devices, filesystems, networking, security
    └── User space: system services, shells, tools, runtimes, and applications
        └── Processes: running program instances with identities and resources
```

The kernel controls hardware and provides system calls. User-space programs request kernel work
through those interfaces. A shell such as Bash is a command interpreter; it is not the kernel.

| Term | Meaning |
|---|---|
| kernel | privileged core managing CPU, memory, devices, filesystems, and networking |
| distribution | kernel plus user-space software, packaging, and support policy |
| shell | program that parses commands and launches other programs |
| process | running program instance with a process ID and resource context |
| service | long-running background capability, often managed by systemd |
| filesystem | hierarchical organization of files and directories |
| package | installable software plus metadata managed by a distribution tool |

## Filesystem Basics

Linux exposes one directory tree rooted at `/`. Mounted filesystems appear at directories within
that tree.

| Path | Typical purpose |
|---|---|
| `/etc` | host-level configuration |
| `/var` | changing application data, logs, caches, queues, and state |
| `/home` | normal user home directories |
| `/root` | root user's home directory |
| `/tmp` | temporary files with environment-specific cleanup |
| `/usr` | installed user-space programs and libraries |
| `/proc` | virtual view of process and kernel state |
| `/sys` | virtual view/configuration of devices and kernel subsystems |
| `/dev` | device nodes |

Absolute paths begin with `/`; relative paths are resolved from the current directory. Hidden
names begin with `.`. A symbolic link references another path, while a hard link references the
same filesystem inode.

## Users, Groups, And Permissions

Every process runs with user and group identities. Traditional file permissions specify read,
write, and execute access for owner, group, and others.

```text
-rwxr-x--- 1 app shopverse 2048 Jul 24 service.sh
 ||| ||| |||
 owner group others
```

For a directory, execute permission means traversal rather than executing the directory. The
root account has extensive authority; use least privilege and narrowly scoped `sudo` rather than
running applications as root.

```bash
id
ls -la
stat application.yaml
chmod 750 service.sh
chown app:shopverse service.sh
```

Access can also be affected by ACLs, SELinux/AppArmor policy, mount options, capabilities, and
container namespaces. Mode bits are only the first layer to inspect.

## Processes And Signals

A process has a PID, parent PID, executable, arguments, environment, open file descriptors,
memory mappings, credentials, and scheduling state. Threads are scheduled execution units within
a process and share much of its address space.

```bash
ps -ef
ps -eo pid,ppid,user,stat,%cpu,%mem,cmd
top
cat /proc/<pid>/status
ls -l /proc/<pid>/fd
kill -TERM <pid>
```

`SIGTERM` requests graceful termination; `SIGKILL` stops a process immediately and cannot be
handled. Start with bounded evidence and graceful control. `kill -9` can interrupt writes or hide
the failure evidence needed for diagnosis.

## Services And systemd

Many distributions use systemd as the service manager. A unit describes how a service starts,
stops, restarts, depends on other units, and runs under a selected identity.

```bash
systemctl status orders.service
systemctl start orders.service
systemctl stop orders.service
systemctl restart orders.service
systemctl cat orders.service
journalctl -u orders.service --since "30 minutes ago"
```

“Active” means the service manager considers the unit started; it does not prove the application
is ready, reachable, or correct.

## Packages And Software Installation

Use the distribution package manager so versions, signatures, dependencies, upgrades, and removal
remain trackable.

```bash
# Debian/Ubuntu
apt update
apt install <package>

# Fedora/RHEL family
dnf install <package>

# Alpine
apk add <package>
```

Do not paste installation scripts into a privileged shell without reviewing their source,
transport, version, and effects.

## Networking Basics

A process listens on an IP address and port through a socket. Interfaces have addresses; routing
selects the next hop; DNS maps names; firewalls and security policy decide which traffic is allowed.

```bash
ip address
ip route
ss -lntp
getent hosts example.com
curl -v http://127.0.0.1:8080/health
```

Binding to `127.0.0.1` allows only local clients. Binding to `0.0.0.0` listens on all eligible IPv4
interfaces but does not by itself open a firewall or cloud security rule.

## CPU, Memory, And Storage

| Symptom | First evidence |
|---|---|
| high CPU | load, per-process CPU, runnable tasks, throttling, hot threads |
| memory pressure | available memory, process working set, swap, cgroup limits, OOM events |
| disk full | filesystem capacity, inode use, largest growth, deleted-open files |
| slow storage | latency, queueing, throughput, filesystem/kernel errors |
| service unreachable | listener, local request, route, DNS, firewall, remote dependency |

Capacity and performance are different. A filesystem can have free bytes but no free inodes; a
disk can have capacity but unacceptable latency; a host can have CPU headroom while a container
is throttled by its cgroup.

<ExpandableAnswer title="Dry run: application is not reachable">

1. Confirm the exact URL, time, client location, and error.
2. Check service state and recent logs without restarting it.
3. Verify whether the process exists and which address/port it listens on.
4. Request the endpoint locally to separate application failure from network-path failure.
5. Inspect DNS, route, firewall, proxy/load balancer, and remote path as evidence requires.
6. Correlate with recent changes and resource pressure.
7. Apply the smallest safe correction, then verify both technical health and the original user flow.

</ExpandableAnswer>

## Essential Commands

```bash
pwd                 # current directory
ls -la              # directory contents
cd /path            # change directory
cp / mv / mkdir     # copy, move, create directory
less file.log       # bounded file viewing
grep -n pattern file
find /path -name '*.log'
df -h               # filesystem capacity
du -sh /path        # path usage
free -h             # memory summary
uptime              # load and uptime
uname -a             # kernel/system summary
```

Treat broad deletion, recursive permission changes, firewall updates, filesystem repair, and
process termination as potentially destructive operations. Resolve exact targets first.

## Linux, Containers, And Virtual Machines

A virtual machine includes a guest kernel. A Linux container normally shares the host kernel and
uses namespaces, cgroups, mounts, capabilities, and security policy to isolate and constrain
processes. Containers do not remove the need to understand Linux process, memory, filesystem, and
network behavior.

## Official References

- [Linux kernel documentation](https://docs.kernel.org/)
- [proc filesystem](https://docs.kernel.org/filesystems/proc.html)
- [systemd manuals](https://www.freedesktop.org/software/systemd/man/latest/)

## Recommended Next

Continue with the [Linux Production Troubleshooting Path](./LINUX-PRODUCTION-TROUBLESHOOTING-PATH.md).

