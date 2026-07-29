---
title: Spring MVC REST Binding Validation And Error Annotations
description: Detailed Spring MVC annotation guide covering controllers, mappings, arguments, binding, conversion, validation, response status, advice, exceptions, CORS, and safe API contracts.
difficulty: Intermediate
page_type: Deep Dive
status: Generic
prerequisites: [HTTP, Spring MVC request lifecycle]
learning_objectives: [Map requests precisely, Distinguish binding sources, Validate request and method contracts, Centralize errors, Avoid mass-assignment and ambiguity]
technologies: [Spring Framework 7, Spring Boot 4, Jakarta Validation]
last_reviewed: "2026-07-29"
---

# Spring MVC REST Binding Validation And Error Annotations

## Controller And Mapping Annotations

| Annotation | Runtime role |
|---|---|
| `@Controller` | MVC handler component, commonly participates in view resolution |
| `@RestController` | controller whose handler return values are written to the response body |
| `@RequestMapping` | class/method mapping by path, method, parameters, headers, consumes and produces |
| `@GetMapping`, `@PostMapping`, `@PutMapping`, `@PatchMapping`, `@DeleteMapping` | HTTP-method-specific composed mappings |
| `@ResponseBody` | serialize/write return value using message converters rather than resolve a view |
| `@ResponseStatus` | static response status; less expressive than `ResponseEntity` for dynamic contracts |
| `@CrossOrigin` | controller-level CORS metadata; security/gateway CORS ownership must remain consistent |

Always constrain the HTTP method. Two mappings whose effective conditions overlap create
ambiguous startup/runtime behavior.

## Argument Sources

| Annotation | Source and caution |
|---|---|
| `@PathVariable` | URI template segment; use for resource identity |
| `@RequestParam` | query/form/multipart parameter; conversion applies |
| `@RequestHeader` | header value; do not trust identity headers from untrusted hops |
| `@CookieValue` | cookie value, still requires security validation |
| `@RequestBody` | body converted by an `HttpMessageConverter`; normally one body object |
| `@RequestPart` | multipart part with message conversion |
| `@ModelAttribute` | model/form binding; restrict allowed fields to prevent mass assignment |
| `@AuthenticationPrincipal` | authenticated principal resolved by Spring Security integration |

```java
@PostMapping(path = "/orders", consumes = MediaType.APPLICATION_JSON_VALUE)
ResponseEntity<OrderResponse> create(
        @Valid @RequestBody CreateOrderRequest request,
        @RequestHeader("Idempotency-Key") String idempotencyKey) {
    return ResponseEntity.accepted().body(service.create(request, idempotencyKey));
}
```

## Validation

Jakarta constraints include `@NotNull`, `@NotBlank`, `@Size`, `@Min`, `@Max`, `@Positive`,
`@Pattern`, `@Email`, `@Past` and `@Future`. Their meaning depends on supported value type;
for example, `@NotNull` does not reject an empty string.

- `@Valid` cascades validation into the annotated argument/property.
- `@Validated` supports groups and enables Spring method-validation semantics where the
  corresponding infrastructure is active.
- container element constraints validate values such as `List<@Valid LineItem>`.
- custom constraint annotations need `@Constraint`, suitable target/retention, validator
  implementation and tests for null/group semantics.

Do not use validation groups to hide unrelated command models inside one huge DTO. Separate
request types are often clearer.

## Binding Control

`@InitBinder` customizes a controller's binding/formatting rules. Treat broad object binding
as a security boundary: explicitly allow intended fields or use narrow immutable request
records. Never bind an external request directly into a persistence entity.

## Error Handling

| Annotation | Purpose |
|---|---|
| `@ExceptionHandler` | maps exceptions for one controller/advice scope |
| `@ControllerAdvice` | cross-controller MVC advice including model/binding/error concerns |
| `@RestControllerAdvice` | composed advice whose handlers write response bodies |

Return a stable problem-detail/error contract with code, safe message, correlation ID and
field errors. Do not expose stack traces, SQL or tokens. Resolve the most specific domain
error before generic fallback.

## Common Failures

- `@RequestBody` receives `null` fields: inspect content type, converter/Jackson model and
  constructor/property names before blaming validation.
- validation does not cascade: add `@Valid` at the containing boundary/property.
- method validation does not run: confirm the method is on a managed/proxied bean and the
  validation post-processor is active.
- advice not selected: inspect controller/advice scope and exception cause/type.
- 415 versus 406: 415 concerns request `Content-Type`; 406 concerns acceptable response media.

## Interview Questions

**`@RequestParam` versus `@PathVariable`?** Path variables identify resources within the URI
structure; query parameters normally filter, page or modify representation/processing.

**`@Valid` versus `@Validated`?** `@Valid` is Jakarta cascade validation; Spring's
`@Validated` supports groups and method-validation use cases.

**Why use `@RestControllerAdvice`?** It centralizes consistent exception-to-HTTP mapping,
but business failures should still be modeled independently from HTTP.

## Official References

- [Spring MVC request mappings](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-requestmapping.html)
- [Spring MVC handler arguments](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods.html)
- [Spring validation](https://docs.spring.io/spring-framework/reference/core/validation/beanvalidation.html)

