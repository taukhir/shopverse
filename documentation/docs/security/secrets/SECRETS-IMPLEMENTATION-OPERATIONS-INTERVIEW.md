---
title: Secrets Implementation, Rotation, Incidents, Labs, And Interviews
description: Implement Vault policy and Kubernetes auth, dynamic credentials, PKI, External Secrets and CSI, then practise rotation, outages, compromise, backup, recovery, labs, and interview scenarios.
difficulty: Advanced
page_type: Practice
status: Generic
prerequisites: [Vault And Kubernetes Secrets Architect Path]
learning_objectives: [Implement least privilege, Design reload-safe rotation, Diagnose secret-delivery failures, Complete recovery and interview labs]
technologies: [Vault, Kubernetes, External Secrets, CSI]
last_reviewed: "2026-07-24"
---

# Secrets Implementation, Rotation, Incidents, Labs, And Interviews

## Policy And Authentication

```hcl
path "database/creds/orders-readonly" {
  capabilities = ["read"]
}
```

Bind a Kubernetes service account/namespace/audience to a narrow Vault role and policy. Validate token
reviewer/trust configuration, issuer/audience, projected short-lived service-account token and namespace
boundaries. The workload's initial Kubernetes identity is the bootstrap credential; protect its ability to
impersonate or create tokens.

## Dynamic Credentials And Rotation

Vault creates a credential with a lease. The application must renew or acquire replacement before expiry,
swap connection pools safely and revoke the old credential after overlap. Test long transactions, cached
connections, clock skew, Vault outage and database revocation latency. Dynamic secrets reduce standing
privilege but add a live control dependency.

For static rotation, use expand/switch/contract: create new credential, distribute, confirm adoption, disable
old, then delete. Never overwrite the only working credential before consumers reload.

## Failure Matrix

| Symptom | Evidence |
|---|---|
| authentication denied | service account token claims, role binding, issuer/audience and Vault audit |
| secret never refreshes | controller/agent lease, sync/reload semantics and provider API |
| mass credential expiry | lease renewal latency, Vault availability and client cache behavior |
| Vault sealed | seal status, KMS/unseal dependency, quorum and audit timeline |
| policy unexpectedly broad | effective token policies, identity aliases/groups and path capabilities |
| restored Vault but apps fail | storage snapshot, seal keys, auth config, certificates and downstream leases |

## Required Labs

1. Initialize a disposable Vault, configure auto-unseal model and protect recovery material.
2. Enable Kubernetes auth and prove allowed/denied workload identities.
3. Issue dynamic database credentials; renew, expire and revoke while observing pools.
4. Issue a service certificate from Vault PKI and rotate it with overlap.
5. Compare Agent, CSI and External Secrets delivery/reload behavior.
6. Rotate a static secret without restart or authentication outage.
7. Break Vault connectivity and prove bounded cache/fail behavior.
8. Capture audit evidence without secret values.
9. Snapshot/restore into isolation and validate policies/auth/engines.
10. Respond to a leaked credential: revoke, rotate, scope impact and prove recovery.

## Interview Questions

**How does a Pod authenticate without a stored Vault password?** It presents a projected Kubernetes identity
token; Vault validates it and maps claims to a role/policy, returning a scoped Vault token.

**External Secrets versus CSI?** External Secrets commonly synchronizes provider data into Kubernetes Secret;
CSI mounts through a driver/provider. Compare etcd exposure, refresh, app reload and availability.

**What if Vault is unavailable?** Define fail-open/closed by operation, bounded cached credential validity,
renewal margins, HA/recovery and user-impact SLO. Never invent infinite stale validity silently.

## Official References

- [Vault leases](https://developer.hashicorp.com/vault/docs/concepts/lease)
- [Vault Kubernetes auth](https://developer.hashicorp.com/vault/docs/auth/kubernetes)
- [External Secrets documentation](https://external-secrets.io/)
- [Secrets Store CSI Driver](https://secrets-store-csi-driver.sigs.k8s.io/)

## Recommended Next

Return to the [Vault And Kubernetes Secrets Architect Path](../VAULT-KUBERNETES-SECRETS-PATH.md) and integrate rotation plus outage evidence into the production capstone.

