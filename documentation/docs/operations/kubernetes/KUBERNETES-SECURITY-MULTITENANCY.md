---
title: Kubernetes Security, Admission, Policy, And Multi-Tenancy
description: Secure API access, RBAC, service accounts, Pod Security, admission, secrets, supply chain, network policy, runtime, nodes, audit, and tenant boundaries.
difficulty: Advanced
page_type: Decision Guide
status: Generic
prerequisites: [Kubernetes API and networking]
learning_objectives: [Threat-model a cluster, Apply least privilege and workload hardening, Govern admission and supply chain, Design defensible tenancy boundaries]
technologies: [Kubernetes RBAC, Pod Security Standards, OIDC, NetworkPolicy]
last_reviewed: "2026-07-24"
---

# Kubernetes Security, Admission, Policy, And Multi-Tenancy

## Trust Boundaries

Treat the API endpoint, etcd, nodes, kubelet/runtime, admission webhooks, registries, CI/GitOps,
cloud identity, CNI/CSI and workloads as distinct attack surfaces. A principal that can create a
privileged Pod or mount sensitive host paths can often escalate beyond its apparent namespace.

## API Identity And Authorization

Use managed identity/OIDC for humans and short-lived workload identity where possible. Avoid shared
admin kubeconfigs and long-lived static tokens. RBAC grants verbs on resources within Role/ClusterRole
scope; RoleBindings/ClusterRoleBindings attach subjects. Test impersonated access with `kubectl auth
can-i` and audit effective permissions.

Use [Kubeconfig, Contexts, Authentication, And Cluster Access](./KUBERNETES-KUBECONFIG-ACCESS.md)
for the complete client configuration, certificate, token, exec-plugin, multi-cluster and
TKGI credential flow.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata: {name: order-reader, namespace: shopverse}
rules:
  - apiGroups: [""]
    resources: ["pods", "pods/log"]
    verbs: ["get", "list", "watch"]
```

Avoid wildcard verbs/resources, unnecessary secret read, pod exec, impersonation, RBAC write,
admission/config mutation and node proxy access. Disable automatic service-account token mounting
when unused and assign one purpose-specific service account per workload.

## Pod And Runtime Hardening

Apply the restricted Pod Security Standard or an equivalently justified policy:

- run as non-root with known UID/GID strategy;
- use `RuntimeDefault` seccomp;
- drop all capabilities and add only a demonstrated minimum;
- prevent privilege escalation;
- use read-only root filesystems where compatible;
- prohibit privileged mode, host PID/IPC/network and dangerous host paths;
- constrain volume types, sysctls and runtime classes;
- set resources and PID limits to reduce denial-of-service risk.

Sandboxed runtimes can strengthen isolation for untrusted workloads at compatibility/performance
cost. Containers still share a host kernel unless a stronger runtime boundary is used.

## Admission Control

Built-in admission, Pod Security Admission, validating/mutating policies and policy engines can
enforce standards. Webhooks are on the API write path: define timeout, failure policy, scope,
availability, certificate rotation, version compatibility and emergency bypass governance.

Validate immutable digests, allowed registries, signatures/provenance, resource/probe/security
requirements and forbidden privilege. Mutation can simplify defaults but hidden changes make
debugging and ownership harder; prefer visible generation where practical.

## Secrets And Encryption

Kubernetes Secrets are API objects, not automatically a complete secret-management solution.
Restrict read/list/watch, enable and rotate encryption at rest, protect etcd and backups, avoid
environment exposure where file/workload identity works better, and integrate a managed secret
system through a supported operator or CSI flow. Prevent secret leakage into Git, images, logs,
events, command arguments and support bundles.

## Network And Workload Identity

Use default-deny NetworkPolicy plus explicit flows, while application services still enforce user,
tenant and resource authorization. mTLS/workload identity authenticates connections; it does not
replace business authorization. Restrict egress to metadata endpoints and sensitive control-plane
services.

## Supply Chain

Pin image digests, scan OS/application dependencies, generate SBOMs, sign artifacts and provenance,
separate build/deploy identity, protect registries and reject untrusted images at admission. Minimize
base image packages and keep a patch/rebuild cadence. Never mount the host Docker/container runtime
socket into ordinary workloads.

## Multi-Tenancy

Namespaces provide naming and policy scope, not a hard security boundary by themselves. Combine
namespaces with RBAC, quotas, limits, policy, network isolation, separate service accounts, secret
scope, node isolation where required and tenant-aware observability. Use separate clusters/accounts
when threat, compliance, noisy-neighbor or lifecycle isolation demands a stronger boundary.

## Node And Control-Plane Protection

Restrict API/etcd/kubelet networks, secure bootstrap and certificates, minimize node access, patch
hosts/runtimes, protect cloud metadata, enable audit logging and monitor privileged operations.
Direct etcd read can expose cluster data; write access is effectively control over desired state.

## Security Evidence

Maintain an identity/permission inventory, denied-policy tests, image provenance results, secret
rotation exercise, audit retention/query, network-policy tests, node benchmark evidence, incident
runbooks and remediation SLA. A YAML policy without enforcement and violation telemetry is not proof.

## Interview Scenarios

**Developer needs logs but not exec:** grant `get/list` Pods and `get` `pods/log` in the namespace;
do not grant `pods/exec`, secret access or broad wildcard permissions.

**A namespace is compromised:** contain credentials and network, preserve audit/runtime evidence,
identify service-account and node reach, rotate affected identity, rebuild workloads/nodes as needed
and prove cross-tenant boundaries held.

**Admission webhook is down:** outcome depends on failure policy. Security-critical fail-closed policy
protects enforcement but can block deployments; design HA, narrow scope and governed recovery.

## Official References

- [Kubernetes security](https://kubernetes.io/docs/concepts/security/)
- [Securing a cluster](https://kubernetes.io/docs/tasks/administer-cluster/securing-a-cluster/)
- [RBAC](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)
- [Pod Security Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/)

## Recommended Next

Continue with [Cluster Operations, Capacity, Upgrades, HA, And Recovery](./KUBERNETES-CLUSTER-OPERATIONS.md).
