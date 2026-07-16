---
title: "Distributed Authorization At Permission Scale"
description: "Design large role and permission models without oversized JWTs, stale access, role explosion, unsafe caches, or a fragile central policy dependency."
sidebar_label: "Authorization At Permission Scale"
tags: ["authorization", "rbac", "abac", "jwt", "microservices"]
page_type: "Architecture Guide"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# Distributed Authorization At Permission Scale

A system with hundreds of permissions should not solve the problem by placing
every permission in every access token. The durable model separates assignment,
protocol-level delegation, domain enforcement, and rapidly changing policy.

```text
User -> tenant/group membership -> role binding -> permission/policy
Client -> OAuth2 scopes and audience
Resource service -> authority mapping + ownership/ABAC decision
```

## Why Permission Models Become Difficult

| Failure mode | Consequence |
|---|---|
| Hundreds of permissions in JWT | large headers on every hop, proxy rejection, disclosure, and slow change propagation |
| One role per department/region/action combination | role explosion and duplicated administration |
| Hardcoded role checks in every service | inconsistent meaning and synchronized deployments |
| Permission database lookup on every request | authorization-store latency becomes API latency |
| Long cache TTL without invalidation | revoked access remains usable |
| One remote policy decision for every method | a central outage or latency spike becomes a platform outage |
| Gateway-only authorization | direct/internal paths and resource ownership remain unprotected |

HTTP servers, gateways, and proxies have finite header limits that vary by
product and configuration. Do not design tokens near a particular maximum;
measure encoded token size and retain margin for tracing, cookies, and other
headers.

## Separate Four Kinds Of Authority

| Layer | Example | Owner |
|---|---|---|
| OAuth2 scope | `orders.read` | authorization server/API contract |
| Role | `SUPPORT_AGENT` | IAM/business administration |
| Permission | `ORDER_CANCEL` | owning domain/service catalog |
| Contextual policy | owner matches caller and order is cancellable | resource service or policy decision point |

Scopes should remain client-facing and coarse enough to be stable. Roles reduce
assignment effort. Permissions name domain capabilities. ABAC and ownership
rules evaluate facts that do not belong in a long-lived token.

## Recommended Data Model

```text
users
groups
roles
permissions
user_group_memberships
group_role_bindings
user_role_bindings
role_permissions
tenant_role_bindings
authorization_versions
```

Bindings should include their scope, such as tenant, organization, store, or
region, rather than manufacturing roles like `ADMIN_INDIA_STORE_42`.

Example conceptual binding:

```text
principal=u123
role=ORDER_MANAGER
tenant=tenant-a
resource_scope=region-west
valid_until=2026-12-31T00:00:00Z
```

Use database uniqueness constraints to prevent duplicate bindings and audit who
created, changed, or revoked each assignment.

## What Belongs In The Access Token

Use the smallest claim set that lets the resource server establish a trustworthy
principal and perform common decisions:

```json
{
  "iss": "https://identity.example.com/realms/shopverse",
  "sub": "u123",
  "aud": ["order-api"],
  "scope": "orders.read orders.write",
  "roles": ["ORDER_MANAGER"],
  "tenant": "tenant-a",
  "authz_ver": 42,
  "exp": 1780000000
}
```

This is an example contract, not a requirement to emit every claim. Do not add:

- hundreds of permissions;
- confidential profile or organization data;
- mutable resource state;
- wildcard strings whose semantics differ between services;
- authorization facts the resource service cannot validate or interpret.

JWT payloads are encoded, not encrypted by default. Anyone holding a token can
read its claims.

## Three Resolution Strategies

### 1. Compact Token And Local Role Mapping

Each service owns a versioned mapping from relevant roles to its permissions.

```text
ORDER_MANAGER -> ORDER_READ, ORDER_UPDATE, ORDER_CANCEL
```

This is fast and resilient, but role meaning changes require controlled rollout.
It works best for stable, service-local permissions.

### 2. Compact Token And Cached Authorization Snapshot

The service resolves a principal/tenant authorization snapshot from an
authoritative store and caches it:

```text
cache key = issuer + subject + tenant + authz_ver + policy_version
```

Including versions prevents an old cache entry from being reused under a new
policy. Publish invalidation events after committed role changes, but retain a
bounded TTL and reconciliation because messages can be delayed or lost.

Avoid cache keys based only on username. They can collide across issuers or
tenants and cannot distinguish changed authorization state.

### 3. External Policy Decision Point

A policy engine evaluates principal, action, resource, and context:

```text
Order Service -> PDP: subject, tenant, ORDER_CANCEL, order facts
PDP -> Order Service: allow/deny + policy version/reason
```

This suits cross-language and highly dynamic policies, but requires strict
timeouts, availability design, decision logging, policy testing/versioning, and
careful caching. Send only the attributes needed for the decision.

Most platforms use a hybrid: local checks for stable permissions and ownership,
with a PDP for a smaller set of complex policies.

## Versioning And Fast Revocation

Short access-token lifetime is the base bound for stale JWT authorization. For
high-risk changes, add an authorization/security version:

1. store the current version with the principal or tenant binding;
2. place the version in newly issued tokens;
3. compare it through a local/cached lookup for protected high-risk operations;
4. increment it when roles, password, compromise state, or tenant access changes;
5. reject older versions and require re-authentication/token renewal.

This adds a lookup or cache dependency, so use it where immediate revocation is
worth the cost. A deny list keyed by `jti` handles individual tokens but needs
expiry-based cleanup and shared consistency.

## Cache Safety And Failure Policy

Authorization caches need a documented contract:

| Decision | Required policy |
|---|---|
| TTL | bounded by risk and change-propagation SLO |
| Invalidation | event plus version/TTL fallback |
| Negative decisions | short cache or no cache when policy changes frequently |
| Store outage with cached entry | accept only if entry is unexpired and policy permits |
| Store outage without entry | fail closed for protected actions |
| Administrative revocation | version bump/invalidation with measurable propagation |

Never silently convert a timeout into “allow.” For low-risk read-only experiences,
the product may choose a deliberately bounded stale policy; high-risk writes,
refunds, and administration normally fail closed.

Protect against cache stampedes with request coalescing and bounded concurrency.
Measure hit rate, lookup latency, invalidation delay, stale-version rejection,
and decision errors without using user IDs as metric labels.

## Tenant And Resource Authorization

A role without scope is often too broad. Validate tenant context from a trusted
claim or resolved membership and compare it to the resource being accessed.

```java
@PreAuthorize("hasAuthority('ORDER_CANCEL') and " +
              "@orderAuthorization.canCancel(#orderId, authentication)")
public void cancelOrder(UUID orderId) {
    // domain transition remains transactional inside the service
}
```

`canCancel` must use trusted identity, tenant binding, ownership/delegation, and
current order state. Never authorize from a client-supplied tenant header alone.

## Avoiding Role Explosion

- Assign roles to groups rather than copying permissions user by user.
- Scope a reusable role through a tenant/resource binding.
- Keep job responsibility separate from geography, tenant, and resource scope.
- Use ABAC for combinations such as amount, time, device trust, or ownership.
- Treat wildcard permissions as compiled policy with tested semantics, not simple
  unchecked prefix matching.
- Give each permission one owning domain and maintain a catalog with description,
  risk, deprecation status, and enforcing endpoints.
- Detect unused, duplicate, and never-enforced permissions through periodic audit.

## Service Ownership And Deployment

The identity platform owns subjects, clients, authentication, groups, and role
bindings. Each domain service owns the meaning and enforcement of its actions.
A shared security library may normalize claims and provide safe primitives, but
must not hide business policy inside a generic gateway filter.

Permission changes should use expand-and-contract deployment:

1. deploy services that understand both old and new permission contracts;
2. update IAM/policy mappings;
3. observe denials and stale versions;
4. remove the old permission after token/cache lifetime and rollback windows.

## Verification Matrix

| Scenario | Expected outcome |
|---|---|
| Same role in two tenants | access is limited to the bound tenant |
| Permission removed while JWT remains valid | bounded by token lifetime or rejected by version policy |
| Authorization cache misses during store outage | protected operation fails closed |
| Invalidation event is lost | version/TTL eventually removes stale decision |
| Token approaches header budget | issuance rejects or alerts before downstream proxies fail |
| Gateway allows but service ownership fails | service returns `403` |
| Policy rollout is incompatible | canary/contract tests catch it before old mapping removal |
| Client Credentials token calls user-only action | denied because workload is not an end user |

Test allow and deny cases at URL, method, tenant, ownership, and policy boundaries.
Audit decisions with subject/client, action, resource reference, policy version,
outcome, and correlation ID—without logging bearer tokens or sensitive data.

## Shopverse Decision

Shopverse currently maps role and permission claims from its custom JWT. As the
catalog grows, migrate toward compact audience/scopes/roles, service-owned
permission enforcement, tenant/resource bindings, and a versioned cached
snapshot only where dynamic resolution is required. Do not introduce a remote
PDP until policy complexity justifies its availability and operational cost.

## Official References

- [NIST RBAC](https://csrc.nist.gov/projects/role-based-access-control)
- [NIST ABAC Guide](https://csrc.nist.gov/pubs/sp/800/162/upd2/final)
- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [Spring Security method authorization](https://docs.spring.io/spring-security/reference/servlet/authorization/method-security.html)
- [OAuth 2.0 Security Best Current Practice](https://www.rfc-editor.org/rfc/rfc9700)

