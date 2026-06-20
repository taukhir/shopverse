---
title: Spring REST Testing And Interview Guide
---

# Spring REST Testing And Interview Guide

Controller testing, do and do not rules, interview questions, and related guides.

Back to [Spring REST APIs](../SPRING-REST-APIS.md).

## Controller Testing

Use `@WebMvcTest` for controller mapping, serialization, validation, security,
and exception handling:

```java
@WebMvcTest(ProductController.class)
class ProductControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    ProductService productService;

    @Test
    void rejectsInvalidProduct() throws Exception {
        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "",
                                  "price": -1,
                                  "currency": "USD"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }
}
```

Use full integration tests when database behavior, security filters, message
publication, or real serialization configuration is part of the requirement.


## Do And Do Not

| Do | Do not |
|---|---|
| Use plural resource nouns | Put `get`, `create`, or `delete` in ordinary paths |
| Keep controllers thin | Put transactions and business workflows in controllers |
| Use records or DTOs | Return JPA entities |
| Validate boundary input | Trust client-provided IDs, sizes, or content types |
| Return accurate status codes | Return `200` for every result |
| Centralize error mapping | Repeat try/catch blocks in every controller |
| Cap page and upload sizes | Accept unbounded lists or files |
| Enforce ownership in services | Assume route authentication proves ownership |
| Record correlation and trace context | Log secrets or entire sensitive bodies |
| Test contract behavior | Test only private implementation methods |


## Lead Engineer Interview Questions

### Where Should Transaction Boundaries Be Placed?

Usually on public service methods that own a complete local business operation.
Avoid controller transactions and remote network waits inside database
transactions.

### How Do You Prevent A REST API From Leaking Persistence Details?

Use request and response DTOs, explicit mapping, service-owned fetch plans, and
central error contracts. Do not serialize entities, lazy proxies, internal
columns, or database-generated exception messages.

### How Do You Make A Create API Safe To Retry?

Accept a stable idempotency key, persist it atomically with the result, enforce
database uniqueness, compare request identity on reuse, and return the
original result for a valid duplicate.

### How Do You Design A Long-Running API?

Return `202 Accepted` with a durable operation resource and `Location` header.
Process asynchronously, expose status and failure details, and make submission
idempotent.

### When Would You Use `PUT` Instead Of `PATCH`?

Use `PUT` when the client supplies the complete replacement representation at
a known URI. Use `PATCH` for partial change semantics. Define whether omitted
and null fields differ, and ensure repeated patch operations behave safely.

### How Do You Handle Partial Failure Across Services?

Do not extend one database transaction across independent services. Use local
transactions, durable events through an outbox, idempotent consumers, SAGA
compensation, explicit timeouts, and observable recovery state.

### How Do You Avoid N+1 Queries In An API?

Define the response use case first, then use DTO projections, entity graphs, or
purpose-specific fetch joins. Verify generated SQL and avoid serializing lazy
entity graphs.

### How Do You Protect List APIs Under Heavy Load?

Enforce pagination and page limits, index common filters and sort keys, prefer
keyset pagination for deep traversal, use timeouts and rate limits, return only
required fields, and measure query and endpoint latency.

### How Do You Evolve An API Without Breaking Consumers?

Prefer additive optional changes, maintain field meaning, use consumer
contract tests, publish deprecations, support a migration window, and create a
new major version only for incompatible contracts.

### What Should Be Logged For A Request?

Log method, normalized route, status, duration, service, correlation ID, trace
context, and bounded error code. Avoid credentials, secrets, personal data,
payment data, and unbounded request or response bodies.

### Why Is Returning `Page<Entity>` A Concern?

It exposes persistence entities and couples the public pagination JSON to
framework internals. Prefer a stable response DTO with explicit content and
pagination metadata.

### Should A Controller Catch Every Exception?

No. Controllers should express the HTTP contract. Central exception handling
maps known exceptions consistently, while unexpected failures are logged once
and returned as generic server errors.


## Related Guides

- [REST API Design](../REST-API-GENERIC.md)
- [Spring Boot Internals](../SPRING-BOOT-INTERNALS.md)
- [Spring Ecosystem Interview Questions](../../spring/SPRING-ECOSYSTEM-INTERVIEW.md)
- [Spring AOP](../../spring/SPRING-AOP.md)
- [Spring Cache](../../spring/SPRING-CACHE.md)
- [Spring Transactions](../../spring/SPRING-TRANSACTIONS.md)
- [Spring Security](../../security/SPRING-SECURITY-GENERIC.md)
- [Spring Data JPA](../../spring/SPRING-DATA-JPA.md)
- [Spring Boot Testing](../../spring/SPRING-BOOT-TESTING.md)









