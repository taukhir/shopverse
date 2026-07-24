---
title: IaC Implementation, Operations, Incidents, Labs, And Interviews
description: Practical HCL, modules, remote state, testing, policy, CI, imports, refactors, drift, partial failure, recovery, production scenarios, and architect questions.
difficulty: Advanced
page_type: Practice
status: Generic
prerequisites: [Terraform And OpenTofu Architect Path]
learning_objectives: [Write governed modules, Build a safe automation pipeline, Diagnose state and provider incidents, Complete architect labs]
technologies: [Terraform, OpenTofu, AWS, Kubernetes]
last_reviewed: "2026-07-24"
---

# IaC Implementation, Operations, Incidents, Labs, And Interviews

## Minimal Governed Module

```hcl
terraform {
  required_version = ">= 1.7"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 6.0" }
  }
}

variable "name" {
  type = string
  validation {
    condition     = length(var.name) >= 3
    error_message = "name must contain at least three characters"
  }
}

resource "aws_s3_bucket" "this" {
  bucket = var.name
  tags   = { ManagedBy = "iac", Owner = "platform" }
  lifecycle { prevent_destroy = true }
}
```

Treat version numbers as repository policy examples and validate compatibility before use. Prefer implicit
graph dependencies through references; use `depends_on` only for real ordering hidden from the graph.

## Refactoring Without Destruction

Changing a resource address normally looks like remove/create unless migration is declared. Use moved blocks
or supported state commands, review the plan and back up state. Import binds existing remote objects; after
import, configuration must describe them accurately. Removed/forget operations do not necessarily delete the
remote object. Preserve the one-address-to-one-object invariant.

## Failure Runbook

| Symptom | Evidence and response |
|---|---|
| lock held | identify active run/owner; never force-unlock while an apply is live |
| partial apply | refresh/read state and remote reality, fix cause, produce a new plan |
| object exists but absent from state | prove ownership, write config, import once |
| state lost/corrupt | stop applies, restore versioned backup, validate bindings and plan |
| unexpected destroy | do not apply; trace address/config/provider/default changes |
| drift | classify approved emergency, external controller or unauthorized change; reconcile/import |
| provider upgrade changes plan | review schema/default/state migrations in an isolated branch |

Never “fix” uncertainty using broad `state rm`, force unlock or targeted apply without an object-level
inventory and recovery plan.

## Testing Pyramid

1. formatting and static validation;
2. lint, security and policy rules;
3. native tests with plan assertions/mocks where supported;
4. ephemeral provider integration for critical modules;
5. post-apply API and workload verification;
6. scheduled drift and recovery exercises.

## Required Labs

1. Configure encrypted remote state, locking, versioning and least-privilege identity.
2. Build versioned VPC and EKS foundation modules with typed inputs and policy tests.
3. Import an existing resource and reach a no-change plan.
4. Rename/move a module resource without replacement.
5. Create drift, detect it and choose revert, accept/import or redesign ownership.
6. Interrupt a safe disposable apply and recover from actual state.
7. Rotate provider/module versions and explain every plan action.
8. Simulate state loss, restore backup and verify bindings.
9. Add CI speculative plan plus protected short-lived-identity apply.
10. Produce a change record with plan, cost/security policy and post-apply evidence.

## Top Interview Questions

**Why is state required?** It binds resource addresses to remote objects, stores metadata and supports
efficient planning. Losing or duplicating bindings can cause destructive ambiguity.

**Can two teams share one state?** Technically yes, but contention, access and blast radius grow. Split by
ownership/change cadence while minimizing fragile cross-state dependencies.

**Plan succeeded; can apply still fail?** Yes—remote state, credentials, quotas, policy, concurrency or provider
behavior can change. Apply and recovery must tolerate partial progress.

**How do you handle an emergency console change?** Record it, contain safely, then reconcile configuration/state
through import or deliberate revert; do not allow permanent invisible ownership.

## Official References

- [Terraform modules](https://developer.hashicorp.com/terraform/language/modules)
- [Terraform testing](https://developer.hashicorp.com/terraform/language/tests)
- [OpenTofu state](https://opentofu.org/docs/language/state/)
- [OpenTofu tests](https://opentofu.org/docs/cli/commands/test/)

## Recommended Next

Return to the [Terraform And OpenTofu Architect Path](../INFRASTRUCTURE-AS-CODE-ARCHITECT-PATH.md) and attach the ten lab artifacts to the production capstone.

