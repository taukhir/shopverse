---
title: MCP Primitives, Transports, And Sessions
difficulty: Advanced
page_type: Concept
status: Generic
keywords: [MCP tools, MCP resources, MCP prompts, STDIO, Streamable HTTP]
learning_objectives: [Choose tools resources or prompts, Operate STDIO and HTTP transports, Bound sessions pagination subscriptions and results]
technologies: [MCP, Streamable HTTP]
last_reviewed: "2026-07-12"
---

# MCP Primitives, Transports, And Sessions

| Primitive | Purpose | Trust characteristic |
|---|---|---|
| tool | computed lookup or action from typed arguments | executes code or downstream operation |
| resource | readable content addressed by URI/template | can contain sensitive or injected content |
| prompt | reusable message/workflow template | instructions that host/user chooses to apply |

## Tools

Publish stable names, descriptions and strict input schemas. Validate arguments,
identity, tenant, ownership, range and state on the server. Return structured content
and explicit error categories. Mutations need idempotency, approval where appropriate,
auditing and reconciliation after timeouts. Progress does not imply commit.

## Resources And Templates

Resource URIs identify readable content; templates describe parameterized address
spaces. Enforce authorization before existence/detail disclosure, validate template
variables and prevent path traversal/SSRF. Paginate lists, bound resource size,
declare media type and support subscriptions/change notifications only when the
negotiated capability and freshness model justify them.

## Prompts

Prompts package reusable messages and arguments; they are not hidden policy. Version
ownership and expected model/tool assumptions. A server-supplied prompt remains
untrusted relative to host policy and user approval.

## Transports

STDIO uses a process boundary and disciplined standard streams; logs must not corrupt
protocol framing. Control executable provenance, environment, working directory,
filesystem and process lifetime.

Streamable HTTP supports remote independent deployment. Use TLS, authentication,
origin/network controls, session rules, request/result limits, timeouts, connection
reuse and load-balancer behavior. Prefer stateless authorization; if session state
is necessary, define persistence, expiry, affinity/reconnection and horizontal scale.

## Official References

- [MCP tools](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)
- [MCP resources](https://modelcontextprotocol.io/specification/2025-11-25/server/resources)
- [MCP prompts](https://modelcontextprotocol.io/specification/2025-11-25/server/prompts)
- [MCP transports](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)

## Recommended Next Page

Continue with [MCP Security And Production Operations](./MCP-SECURITY-OPERATIONS.md).
