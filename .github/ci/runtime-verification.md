# Runtime and GitHub protection verification — 2026-11-05

Production readiness remains blocked. Docker startup and the narrow integration
suites are useful evidence, but they do not establish a working checkout SAGA.

## Runtime scope and results

- Built all ten application images from the local working tree.
- Used an isolated Compose project, disposable database volumes, generated test
  credentials/keys, and random loopback ports. Existing ShopVerse containers and
  databases were not used.
- Config, Discovery, User, Auth, Order, Payment, Inventory and Gateway reached
  healthy status. Gateway health and its dependency/readiness endpoint returned UP.
- Rebuilt Web and Docs both reached healthy status and served HTML, JavaScript
  and CSS as UID 101. The final static-container checks ran separately after the
  full-stack failure; they do not imply the SAGA passed. Evidence is recorded in
  the local `static-final-results.json` receipt.
- Order, Inventory and Payment `integrationTest --rerun-tasks --no-daemon
  --no-configuration-cache --max-workers=2` each passed four real Testcontainers
  tests: 12 total, zero failures and zero skipped tests. These suites exercise
  their covered persistence/outbox boundaries; they missed the end-to-end defect.
- The canonical `infra/scripts/Smoke-Test.ps1` was run through the real Gateway
  with a 90-second checkout limit. Inventory reservation and payment completion
  were published, but the order remained ORDER_CREATED instead of CONFIRMED.
  The full smoke test failed; it must not be described as passing.

## Confirmed blockers

1. Checkout constructs an ORDER_CREATED order in
   `services/order-service/src/main/java/io/shopverse/order/entity/OrderEntity.java`.
   The inventory success/rejection guards in `OrderServiceImpl` accept only
   PENDING_INVENTORY, and no implementation moves a newly checked-out order into
   that state. Correct this state mismatch and add regression coverage for the
   actual checkout-to-event path, duplicates and terminal-state handling.
2. Inventory's expiry job reports `Zero date value prohibited`. A read-only query
   against the disposable database confirmed DEMO-ORD-1004 has
   `0000-00-00 00:00:00.000000` in expires_at. The existing
   `003-reservation-expiry.yml` seed supplies 2099 to a TIMESTAMP(6) column;
   this is the suspected source of that invalid value. Repair through a new
   forward-only migration, with fresh-install and existing-data coverage. Do not
   rewrite the applied changelog or hide the error with driver conversion flags.

These business-logic/migration files were not changed by this verification.

An additional Order startup/request log warning reports incompatible Prometheus
tag sets for `http.client.requests.active`; registration of that meter failed.
This observability warning was not investigated or fixed in this verification.

## Runtime configuration fixes

Corrected the Config Server bind mount to `infra/cloud-configs`; gave the Docs
Docker build the canonical README inputs its prebuild requires; fixed non-root
nginx PID handling; aligned container listeners, Compose mappings and healthchecks
on 8080; served Docs assets under `/shopverse/` with a relative root redirect.
The static-image probes use IPv4 explicitly, matching their nginx listeners.

Pipeline/quality policy tests: 29 passed. Actionlint and `git diff --check` passed.
Documentation fast/type checks and language checks passed; the Docs production
build ran as part of the image build.

## GitHub settings: read-only confirmation

Repository: taukhir/shopverse. Default branch: master.

| Control | Observed result |
| --- | --- |
| Branch protection | Absent; master protection endpoint returned "Branch not protected" |
| Rulesets | Empty list |
| CodeQL merge protection | Not enforced; no protecting ruleset |
| Production environment | Absent; only copilot and github-pages exist |
| Production required reviewers | Not configured |
| ENABLE_SSH_DEPLOY repository variable | Unset; optional SSH deploy remains disabled |

Configure required CI checks and CodeQL protection for master, then create a
production environment with designated reviewers, restricted deployment branches
and prevention of self-review. Reviewer identities remain a repository-owner
choice. A workflow's `environment: production` declaration alone does not prove
that these approval rules are configured. See GitHub's
[code scanning merge protection guidance](https://docs.github.com/en/code-security/how-tos/find-and-fix-code-vulnerabilities/manage-your-configuration/set-merge-protection).

No GitHub settings, production deployments, commits or pushes were made during
this verification. Team-memory files were left untouched.
Temporary test containers, project volumes and generated private keys were removed;
locally built images and build caches remain available for review.

Local ignored receipts/logs: `.tmp/runtime-verification/` contains
`integration-summary.json`, `stack-results.json`, `live-startup-results.json`,
`static-final-results.json`, `github-protections.json`, smoke output and failure
logs. They are local evidence, not proposed tracked build artifacts.
