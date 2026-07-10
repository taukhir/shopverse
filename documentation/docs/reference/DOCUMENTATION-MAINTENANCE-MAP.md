---
title: Documentation Maintenance Map
sidebar_position: 3
---

# Documentation Maintenance Map

Use this page when adding, moving, or consolidating documentation.

For interactive tabs, comparisons, API panels, answers, and standardized
callouts, use the [reusable documentation components](./DOCUMENTATION-COMPONENTS.mdx).

The goal is to keep two tracks clear:

- learning/reference material
- Shopverse implementation material

## Canonical Pages

| Topic | Canonical Concept Page | Shopverse Implementation Page |
|---|---|---|
| Platform duplicate logic | [Documentation Structure](./DOCUMENTATION-STRUCTURE.md) | [Platform Infrastructure](../platform/README.md) |
| Outbox pattern | [Transactional Outbox Pattern](../reliability/OUTBOX-PATTERN.md) | [Outbox Starter](../platform/OUTBOX-STARTER.md) |
| Kafka recovery | [Spring Kafka Retry, DLT, Recovery](../spring/kafka/SPRING-KAFKA-RETRY-DLT-RECOVERY.md) | [Kafka Recovery Starter](../platform/KAFKA-RECOVERY-STARTER.md) |
| Kafka parsing | [Spring Kafka Consumers](../spring/kafka/SPRING-KAFKA-CONSUMERS.md) | [Kafka Event Parsing](../platform/KAFKA-PARSING.md) |
| Security resource server | [JWT JWKS Resource Server](../security/spring-security/JWT-JWKS-RESOURCE-SERVER.md) | [Security Starter](../platform/SECURITY-STARTER.md) |
| API errors and pagination | [Spring REST APIs](../development/SPRING-REST-APIS.md) | [Common Error](../platform/COMMON-ERROR.md) and [Web Pagination](../platform/WEB-PAGINATION.md) |
| Docker operations | [Docker](../operations/DOCKER.md) | [Shopverse Docker](../operations/SHOPVERSE-DOCKER.md) |
| Build/runtime optimization | [Operations](../operations/README.md) | [Optimization Solutions](../reliability/problems/OPTIMIZATION-SOLUTIONS.md) |
| Runtime reliability | [Distributed Systems](../architecture/DISTRIBUTED-SYSTEMS.md) | [Problems And Solutions Index](../reliability/problems/README.md) |

## Consolidation Rules

When two pages overlap, do not immediately delete one. First decide which page
is canonical for the reader goal.

| If the content is... | Put the detail here | Put only a link here |
|---|---|---|
| Generic concept explanation | Generic learning section | Shopverse page |
| Shopverse code/config path | Shopverse case study, platform, or problems section | Generic concept page |
| Command output and measurements | Problem/solution page | Generic operations page |
| Starter dependency and properties | Platform starter page | Service-specific page |
| Interview-style explanation | Generic learning or reference page | Shopverse implementation page |
| Runbook command for this repository | Shopverse operations or problem page | Generic operations page |

## Required Sections For New Pages

New generic learning page:

- when to read this page
- core concept
- tradeoffs
- production practices
- common mistakes
- Shopverse links if implemented

New Shopverse implementation page:

- status
- purpose
- owning service or module
- files/classes/configuration
- how to run or verify
- related generic concept page
- known gaps

New problem/solution page:

- problem
- impact
- how we identified it
- command or evidence
- solution
- files changed
- before/after result
- residual risk

## Sidebar Rules

- Every `.md` and `.mdx` doc must be reachable from `sidebars.ts`.
- Prefer index pages before long page lists.
- Keep deep nesting only where the reader naturally follows a topic sequence.
- Add new Shopverse-specific pages under `9. Shopverse Implementation`.
- Add generic concept pages under their topic section, not under the case study.

## Validation Commands

Run these after any documentation structure change:

```powershell
cd documentation
npm.cmd run build
```

Check sidebar coverage:

```powershell
node -e "const fs=require('fs'),p=require('path');function w(d){return fs.readdirSync(d,{withFileTypes:true}).flatMap(x=>x.isDirectory()?w(p.join(d,x.name)):[p.join(d,x.name)]);}const custom=new Set(['architecture/adr/001-gateway-discovery-config','architecture/adr/002-kafka-choreography-saga','architecture/adr/003-jwt-jwks-security','architecture/adr/004-observability-stack']);const docs=w('docs').filter(f=>/\.(md|mdx)$/.test(f)).map(f=>f.replace(/\\\\/g,'/').replace(/^docs\//,'').replace(/\.(md|mdx)$/,''));const s=fs.readFileSync('sidebars.ts','utf8');const ids=new Set([...s.matchAll(/'([^']+)'/g)].map(m=>m[1]));const missing=docs.filter(d=>!ids.has(d)&&!custom.has(d));console.log(missing.sort().join('\\n')||'all non-custom-id docs are in the sidebar');"
```
