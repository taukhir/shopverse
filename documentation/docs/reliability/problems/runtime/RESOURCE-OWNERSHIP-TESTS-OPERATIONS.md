---
title: "Resource Ownership Tests And Operations"
description: "Resource Ownership Tests And Operations with Shopverse examples, failure analysis, and production guidance."
sidebar_label: "Resource Ownership Tests And Operations"
tags: ["shopverse", "architecture", "production"]
page_type: "Guide"
difficulty: "Advanced"
status: "maintained"
last_reviewed: "2026-07-13"
---

# Resource Ownership Tests And Operations

<DocLabels items={[{label: 'Advanced', tone: 'advanced'}, {label: 'Shopverse', tone: 'shopverse'}, {label: 'Production', tone: 'production'}]} />

## Ownership Components

Order Service uses a small authorization component rather than loading the
complete order aggregate:

```java
@Component("orderAuthorization")
@RequiredArgsConstructor
public class OrderAuthorization {

    private final OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public boolean isOwner(Long orderId, String username) {
        return username != null
                && orderRepository.existsByIdAndCustomerUsername(
                        orderId, username);
    }
}
```

Payment Service applies the same pattern with its own database:

```java
@Component("paymentAuthorization")
@RequiredArgsConstructor
public class PaymentAuthorization {

    private final PaymentRepository paymentRepository;

    @Transactional(readOnly = true)
    public boolean isOwner(String orderNumber, String username) {
        return username != null
                && paymentRepository.existsByOrderNumberAndCustomerUsername(
                        orderNumber, username);
    }
}
```

Spring Data derives efficient existence queries from the repository methods:

```java
boolean existsByIdAndCustomerUsername(Long id, String customerUsername);

boolean existsByOrderNumberAndCustomerUsername(
        String orderNumber,
        String customerUsername
);
```

Important properties of this implementation:

- each service authorizes against the database it owns;
- the query returns a boolean and does not hydrate an entity graph;
- parameters are bound by Spring Data rather than concatenated into SQL;
- `readOnly = true` describes the transaction intent;
- a null principal fails closed;
- customers receive `403` for both another customer's identifier and an
  unknown identifier, avoiding unnecessary existence disclosure;
- an administrator can pass authorization and may then receive `404` from the
  service when the resource does not exist.

## Example Outcomes

Assume order `42` and payment `ORD-42` belong to `alice`:

| Caller | Authorities | Requested resource | Result |
|---|---|---|---|
| Alice | `ROLE_CUSTOMER` | Alice's timeline/payment | `200 OK` |
| Bob | `ROLE_CUSTOMER` | Alice's timeline/payment | `403 Forbidden` |
| Admin | `ROLE_ADMIN` | Alice's timeline/payment | `200 OK` |
| Anonymous | none | either protected API | `401 Unauthorized` |

`401` means authentication is absent or invalid. `403` means authentication
succeeded but the authorization policy rejected access.

## Method-Security Tests

The Order and Payment test suites prove all three policy branches through the
proxied controller bean:

```java
@Test
@WithMockUser(username = "alice", roles = "CUSTOMER")
void ownerCanReadTimeline() {
    assertThatNoException()
            .isThrownBy(() -> controller.getTimeline(orderId));
}

@Test
@WithMockUser(username = "bob", roles = "CUSTOMER")
void anotherCustomerCannotReadTimeline() {
    assertThatThrownBy(() -> controller.getTimeline(orderId))
            .isInstanceOf(AccessDeniedException.class);
}

@Test
@WithMockUser(username = "admin", roles = "ADMIN")
void administratorCanReadAnyTimeline() {
    assertThatNoException()
            .isThrownBy(() -> controller.getTimeline(orderId));
}
```

Payment has equivalent tests for `getByOrderNumber`. `@WithMockUser` creates
the `Authentication` used by the SpEL expression; the database rows created in
`@BeforeEach` make the ownership query real. Autowiring the controller is
important because directly constructing it would bypass Spring's
method-security proxy.

## Demo Procedure

1. Log in as `customer1` and create an order with that customer's bearer token.
2. Read its timeline and Payment record with the same token; both should return
   `200`.
3. Log in as `customer2` and repeat those reads with the first customer's order
   ID and order number; both should return `403`.
4. Log in as `admin` and repeat the reads; both should return `200`.

The complete commands are maintained in the
[Shopverse complete demo](../../../case-study/COMPLETE-DEMO.mdx).

## Production Guidance

- Keep ownership enforcement in the service that owns the data. Do not trust
  a gateway-supplied customer ID as authorization proof.
- Derive identity from validated authentication, not a request-body username.
- Apply authorization before returning cached or persisted business data.
- Test owner, non-owner, administrator, anonymous, malformed-token, and
  deleted-resource behavior.
- Audit denied access without logging bearer tokens or sensitive records.
- Prefer repository predicates or scoped queries over loading a resource and
  comparing it later.
- For lists, query by owner in the repository; do not fetch every row and then
  filter in memory.

## Related Documentation

- [Spring Expression Language](../../../spring/SPRING-SPEL.md)
- [Spring Security authorization and method security](../../../security/spring-security/AUTHORIZATION-METHOD-SECURITY.md)
- [Shopverse JWT and Spring Security implementation](../../../security/JWT-OAUTH2-SPRING-SECURITY.md)
- [Queryable Order timeline](QUERYABLE-ORDER-TIMELINE.md)
- [Shopverse case study](../../../case-study/SHOPVERSE.mdx)
- [Spring Security method security reference](https://docs.spring.io/spring-security/reference/servlet/authorization/method-security.html)
- [Spring Security JWT resource-server reference](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html)
- [JwtAuthenticationToken API](https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/oauth2/server/resource/authentication/JwtAuthenticationToken.html)
- [JwtAuthenticationConverter API](https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/oauth2/server/resource/authentication/JwtAuthenticationConverter.html)

## Official References

- [Spring transaction management](https://docs.spring.io/spring-framework/reference/data-access/transaction.html)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [PostgreSQL explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html)

## Recommended Next

Return to [Resource Ownership Authorization](./RESOURCE-OWNERSHIP-AUTHORIZATION.md) to select the next focused guide.
