---
title: API Security Principles
status: maintained
last_reviewed: "2026-07-30"
page_type: Guide
difficulty: Intermediate
scope: generic
owner: docs-security
reviewer: documentation-maintainers
review_evidence: repository-content-audit
---

# API Security Principles

API security protects the request boundary: identity, authorization, input,
error handling, rate limits, and data exposure.

## API Controls

| Control | Purpose |
|---|---|
| Authentication | prove who or what is calling |
| Authorization | decide whether the caller can do this action |
| Validation | reject malformed, unsafe, or unexpected input |
| Rate limiting | reduce brute force, abuse, and overload |
| Idempotency | make retries safe for commands such as checkout |
| Safe errors | avoid leaking stack traces, SQL, keys, and internal topology |
| Audit logs | preserve evidence of sensitive operations |
| Transport security | use HTTPS/TLS for external traffic |

## Injection And Script Risks

- SQL injection: use parameter binding, JPA repositories, prepared statements,
  and avoid string-built SQL.
- XSS: escape untrusted HTML, use content security policy, and never reflect
  untrusted scripts.
- Deserialization attacks: avoid accepting arbitrary object graphs.
- Path traversal: normalize and validate file paths before file access.

## Object And Function Authorization

An authenticated caller allowed to use an endpoint may still be forbidden from a
particular object or operation. For every path, query, header, or payload identifier:

- query or mutate within the caller's authoritative tenant/owner scope;
- enforce function-level privileges on the server even when the UI hides controls;
- cover bulk, nested, export, search, indirect-reference, and alternate routes;
- avoid trusting a caller-supplied tenant, role, price, owner, or protected state;
- test horizontal access, vertical privilege escalation, and stale permissions.

Random identifiers reduce guessing but do not replace object-level authorization.
Prefer scoped repository queries that cannot return another tenant's row over
fetch-then-check code that can accidentally expose existence or data.

## SSRF And Outbound Request Safety

Server-side request forgery occurs when untrusted input controls a server's outbound
destination. The server may reach internal services, cloud metadata, loopback, or
private networks unavailable to the attacker directly. Defend in layers:

- allowlist required schemes, hosts, ports, and destination classes;
- resolve DNS and validate every resulting address, including IPv4/IPv6 variants;
- block loopback, link-local, private, metadata, and internal control-plane ranges;
- restrict or revalidate redirects and prevent DNS rebinding gaps;
- bound connection/read time, redirects, response bytes, and content types;
- isolate egress with network policy/proxy controls and least-privilege identity;
- never attach ambient service credentials to an arbitrary destination.

URL parsing is subtle; use well-tested URI/network libraries and verify the actual
connected address, not only the original string.

## Unsafe Deserialization And Mass Assignment

Accept explicit request DTOs with bounded depth, collection size, and content type.
Do not deserialize arbitrary types or enable polymorphic type selection from
untrusted payloads. Map only fields that callers may change; protected fields such
as owner, tenant, role, price, status, or approval must come from trusted policy and
domain transitions, not automatic entity binding.

## Status Codes

| Case | Code |
|---|---|
| unauthenticated | `401 Unauthorized` |
| authenticated but not allowed | `403 Forbidden` |
| invalid request body | `400 Bad Request` |
| validation failure | `400` or `422`, depending on API convention |
| duplicate idempotency conflict | `409 Conflict` |
| dependency temporarily unavailable | `503 Service Unavailable` |

## Related Guides

- [Spring REST APIs](../../development/SPRING-REST-APIS.md)
- [Spring Security servlet filter chain](../spring-security/SERVLET-FILTER-CHAIN.md)
- [Secrets and credentials](SECRETS-AND-CREDENTIALS.md)

## Official References

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [OWASP SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)

## Recommended Next

Apply these controls in the [Threat Modeling Interview Lab](../spring-security/THREAT-MODELING-INTERVIEW-LAB.md).
