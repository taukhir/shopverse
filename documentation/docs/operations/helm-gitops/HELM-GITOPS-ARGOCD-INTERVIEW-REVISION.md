---
title: Helm, GitOps, And Argo CD Interview, Labs, And Revision
description: Practise architect scenarios, hands-on labs, troubleshooting, design trade-offs, and rapid revision for Helm, GitOps, and Argo CD.
difficulty: Advanced
page_type: Interview Guide
status: Generic
prerequisites: [Argo CD Production Operations]
learning_objectives: [Answer platform delivery interviews, Complete failure labs, Revise Helm and Argo CD production decisions]
technologies: [Helm, GitOps, Argo CD, Kubernetes]
last_reviewed: "2026-07-24"
---

# Helm, GitOps, And Argo CD Interview, Labs, And Revision

## Top Interview Questions

**Helm versus GitOps versus Argo CD?** Helm renders/packages manifests, GitOps is the desired-
state/reconciliation operating model, and Argo CD is one controller implementing that model.

**How do you promote without rebuilding?** CI publishes a tested immutable image digest and
provenance. Environment PRs promote the same digest with reviewed configuration changes.

**How do you avoid values-file sprawl?** Stable schema/defaults, bounded environment overlays,
shared policy/library primitives, rendered-diff tests, and ownership; do not clone full files.

**What should Argo CD not prune automatically?** Resources whose deletion is destructive or
externally owned unless explicitly protected, backed up, reviewed and recoverable—such as PVCs,
namespaces, CRDs or shared infrastructure.

**How do database migrations fit GitOps?** As compatible, idempotent, observable jobs/workflows
with expand-contract and backup/reconciliation. Git revert cannot undo destructive data change.

**How do you secure multi-tenant Argo CD?** OIDC, least-privilege RBAC, AppProject source/destination/
kind restrictions, scoped repo and cluster credentials, namespace isolation, policy, audit, plugin
containment, network controls and separate admin/deployer roles.

## Architect Scenarios

**A chart upgrade changes an immutable selector.** Detect in rendered/server-side validation,
preserve stable selector or perform controlled resource replacement with traffic/data safety;
do not rely on force deletion blindly.

**Manual production change keeps returning.** Argo self-heal is restoring desired state. Use
break-glass process, pause reconciliation if justified, commit the corrected desired state, verify,
and close/audit the exception.

**Argo CD is lost with the management cluster.** Rebuild from infrastructure automation, restore
Argo configuration/credentials/keys, register clusters, initially disable destructive automation,
diff and reconcile in waves, validate apps and control-plane audit.

**Canary passes technical metrics but checkout failures rise.** Business/correctness signal was
missing. Abort, reconcile data/workflows, add a guarded business SLI and compatibility test,
then repeat with representative traffic.

## Hands-On Labs

1. Create a service chart with schema, helpers, Deployment, Service, HPA, PDB, security context,
   NetworkPolicy and immutable image digest.
2. Render three environments and test invalid values, disabled features and supported upgrades.
3. Install an Argo CD lab, define restrictive AppProject and generate apps with ApplicationSet.
4. Enable drift self-heal, perform a break-glass edit, and execute the proper Git back-port flow.
5. Run canary steps with an analysis metric and intentional failure/abort.
6. Simulate bad migration alongside chart rollback; demonstrate why data reconciliation is separate.
7. Back up and rebuild the Argo CD control plane without unintended prune.

## One-Page Revision

- Chart is package; release is installed instance; values are a versioned API.
- Render, schema-check, policy-check, install/upgrade-test and verify application behavior.
- GitOps = declarative, versioned, pulled, continuously reconciled desired state.
- Build once and promote immutable digest; Git tracks desired deployment revision.
- Drift needs one owner, bounded ignore rules and audited break-glass.
- Secrets need external/encrypted lifecycle, scoped decrypt rights and rotation proof.
- Argo Application declares source/destination; AppProject constrains tenancy and privilege.
- Automated prune/self-heal are risk decisions, not blanket defaults.
- Rollouts need technical and business analysis plus mixed-version compatibility.
- Git/Helm rollback cannot undo data or external side effects.

## Evidence Checklist

- rendered diff and policy result;
- artifact digest, signature, SBOM and source revision;
- desired-state commit and approval;
- sync/health/rollout timeline;
- application SLO and correctness signal;
- drift and break-glass audit;
- rollback/forward-fix and reconciliation result;
- Argo backup/restore drill and recovery time.

## Official References

- [Helm best practices](https://helm.sh/docs/chart_best_practices/)
- [Argo CD user guide](https://argo-cd.readthedocs.io/en/stable/user-guide/)
- [Argo Rollouts concepts](https://argo-rollouts.readthedocs.io/en/stable/concepts/)

## Recommended Next

Return to the [Helm, GitOps, And Argo CD Architect Path](../HELM-GITOPS-ARGOCD-PATH.md) and complete the labs with deployment evidence.
