---
title: Spring REST Request Mapping Validation And Errors
description: Compatibility route to canonical request mapping, Bean Validation, and REST error-contract guides.
difficulty: Intermediate
page_type: Reference
status: Compatibility route
learning_objectives:
  - Select the focused guide for request mapping, validation, or errors
  - Preserve links to the former combined REST page
technologies: [Spring MVC, Jakarta Validation, ProblemDetail]
last_reviewed: "2026-07-13"
---

# Spring REST Request Mapping Validation And Errors

<DocLabels items={[
  {label: 'Compatibility route', tone: 'intermediate'},
  {label: 'HTTP boundaries', tone: 'production'},
]} />

Request mapping, validation mechanics, and public error policy now have separate
canonical owners.

Use this route to decide whether the missing evidence is request binding, constraint
evaluation, or stable exception translation before changing controller code.

<TopicCards items={[
  {title: 'Controller and request mapping', href: '/development/spring-rest/REST-CONTROLLER-REQUEST-MAPPING', description: 'Path, query, headers, bodies, forms, ResponseEntity, limits, and trust boundaries.', icon: 'route', tags: ['Controllers', 'HTTP']},
  {title: 'Bean Validation learning path', href: '/spring/SPRING-VALIDATION', description: 'Constraints, cascading, method and custom validation, errors, tests, and production behavior.', icon: 'layers', tags: ['Valid', 'Validated']},
  {title: 'REST error contracts', href: '/development/spring-rest/REST-ERROR-CONTRACTS', description: 'Security, conversion, validation, domain, resilience, and database error ownership.', icon: 'security', tags: ['ProblemDetail', 'ApiErrorResponse']},
]} />

<DocCallout type="tip" title="Follow the runtime owner">
Use request mapping for where values come from, validation for whether a bound
value satisfies structural rules, and the error guide for how each failure becomes
a stable public response.
</DocCallout>

## Compatibility Topic Map

| Former topic | Canonical page |
|---|---|
| path, query, headers, body, forms and `ResponseEntity` | [Controller And Request Mapping](./REST-CONTROLLER-REQUEST-MAPPING.md) |
| body, nested, method and custom validation | [Spring Bean Validation](../../spring/SPRING-VALIDATION.md) |
| controller advice, public errors and ownership | [REST Error Contracts](./REST-ERROR-CONTRACTS.md) |

## Recommended Next

Start with [Controller And Request Mapping](./REST-CONTROLLER-REQUEST-MAPPING.md).
