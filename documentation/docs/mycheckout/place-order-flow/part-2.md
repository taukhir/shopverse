---
slug: /mycheckout/place-order-flow/part-2
title: "mycheckout — Place Order — Complete Flow — Part 2"
mdx:
  format: md
difficulty: Advanced
page_type: Reference
status: maintained
scope: generic
owner: docs-mycheckout
reviewer: documentation-maintainers
review_evidence: imported-source-documentation-link-and-build-check
last_reviewed: "2026-11-16"
---

# mycheckout — Place Order — Complete Flow — Part 2

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `PLACE-ORDER-FLOW.md` |
| Source SHA256 | `9ff8dcedefe9ba4f4d4d9170caba8c4e6dadf822f8ca8059a2655ef4f69854ab` |
| Guide part | 2 of 3 |

[Part 1](/mycheckout/place-order-flow/part-1) · [Part 2](/mycheckout/place-order-flow/part-2) · [Part 3](/mycheckout/place-order-flow/part-3)

## 6. Sequence diagrams {#6-sequence-diagrams}

### 6.1 Default legacy normal placement {#61-default-legacy-normal-placement}

```mermaid
sequenceDiagram
    autonumber
    actor U as Caller / SDK
    participant A as Checkout App
    participant B as Checkout Biz
    participant D as Checkout Data
    participant F as Fulfillment
    participant P as Payment
    participant X as Profile / Registration / Account / Contact
    U->>A: POST place-order {version}
    A->>B: placeOrder(checkoutId, mapped request)
    B->>D: GET checkout by ID
    D-->>B: Checkout with status and stored state
    B->>B: Copy request, choose normal country pipeline
    B->>B: Recalculate outer stages, validate PLACE_ORDER
    Note over B: Internal handlers flag OFF, default normal strategy
    par Reservation
        B->>F: Create reservation if applicable
        F-->>B: Reservation result or handled empty result
    and Payment
        B->>P: Initiate / retry transactions if required
        P-->>B: Payment result
    end
    B->>B: Normal emitted result: ORDER_CREATED, populate details / points
    par Post-order persistence and side effects
        B->>D: PUT checkout with version
        D-->>B: Persisted checkout
    and
        B->>X: Applicable profile / registration / lifecycle / address work
        X-->>B: Results
    end
    B->>B: Metrics, schedule eligible cart deletion
    B-->>A: CheckoutResponse
    A-->>U: HTTP 200, inspect checkout/payment state
    Note over D: ORDER_CREATED transition feeds CDC asynchronously
```

<a id="shared-bec79af276f0"></a>

This sequence is an emitted happy path. A swallowed reservation error may appear as an empty result; an unhandled reactive error ends the composed operation. Concurrent external actions have no common transaction. [P07] [P20] [P25]

### 6.2 Japan internal placement with payment branches {#62-japan-internal-placement-with-payment-branches}

```mermaid
sequenceDiagram
    autonumber
    participant B as Checkout Biz
    participant F as Fulfillment
    participant P as Payment / Loyalty
    participant D as Checkout Data
    Note over B: Outer Japan stages completed, internal handlers flag ON
    B->>F: INVENTORY_RESERVATION if applicable
    F-->>B: Reservation / bypass / failed result
    B->>B: Validate inventory, apply blocking modifications
    alt Reservation blocks placement
        B->>B: Payment processing guard skips normal payment
    else Reservation acceptable or permitted bypass
        B->>P: PAYMENT_PROCESSING / loyalty-only capture
        P-->>B: Payment result
        alt AUTHORIZED / AWAITED / CAPTURED
            B->>B: ORDER_CREATED
        else INITIATED
            B->>B: AWAITING_PAYMENT
        else Failure requiring cleanup
            B->>F: Delete applicable reservations
            B->>P: Refund applicable loyalty points
            B->>B: Prepare payment failure modification / recovery
        end
    end
    B->>B: PREORDER_RESERVE when applicable
    B->>B: CALCULATE_EARNED_AMPOINT stage, JP calculation skipped here
    B->>D: POST_PLACE_ORDER persists resulting checkout
    D-->>B: Updated checkout
    B->>B: Applicable side effects / metrics / cart deletion
```

<a id="shared-18c80cec0068"></a>

Only applicable handlers execute. The PREORDER extension and zero-total/loyalty paths have their own guards; this diagram focuses on the principal reservation/payment outcomes. [P18] [P19] [P23] [P26]

## 7. State, persistence, and concurrency {#7-state-persistence-and-concurrency}

### 7.1 State model {#71-state-model}

```mermaid
stateDiagram-v2
    [*] --> CREATED: Create checkout persisted
    CREATED --> CREATED: Blocking modification / applicable failed placement
    CREATED --> ORDER_CREATED: Default emitted result or Japan accepted outcome
    CREATED --> AWAITING_PAYMENT: Japan payment INITIATED
    AWAITING_PAYMENT --> ORDER_CREATED: Final payment accepted
    AWAITING_PAYMENT --> CREATED: Payment failure recovery
    ORDER_CREATED --> ORDER_CREATED: Payment retry / payment update
```

<a id="shared-248c9a448074"></a>

`PAYMENT_REQUIRED` is also recognized as a loaded status by the outer retry selector. This diagram does not assign its origin to a universal branch; POS and specialized payment modes require their own strategy context. Payment status and checkout status must be inspected independently. [P04] [P13]

### 7.2 Post-placement work {#72-post-placement-work}

Legacy `executePlaceOrder` and internal `PostPlaceOrderHandler` implement corresponding post-order work. [P07] [P26]

<a id="shared-a670366a6504"></a>

| Action | Guard / behavior |
|---|---|
| Prepare persisted order | For `ORDER_CREATED`, append selected payment entries to `paymentHistory`, clear selections, clear `fulfillmentOptions`, retain supplied version. |
| Persist checkout | Direct data update for `ORDER_CREATED`; otherwise common-service update with modifications. |
| Checkout profile | Update on applicable first transitions; excludes DIGITAL/BOOKING/POS and configured clients; profile failures are logged/ignored. |
| Registration/account process | Patch applicable process checkout status and update renewal/upgrade/downgrade lifecycle when applicable. |
| Shipping address | Create address for registration when required. |
| Metrics | Initial-placement metrics versus retry count based on previous state. |
| Cart cleanup | Asynchronous and conditional; excludes Japan POS, SYSTEM/auto-SOP, and dummy account-process/registration carts. |

<a id="shared-c4b785223d90"></a>

Persistence and profile/registration/account/address calls are combined with `Mono.zip`. They do not share a database transaction: a later error can coexist with a completed earlier external effect or checkout write. Cart deletion is not awaited as part of durable order creation. For cart-eligibility logic, inspect previous **and** resulting status rather than only the existence of an order ID.

### 7.3 Data-service writes and ID behavior {#73-data-service-writes-and-id-behavior}

<a id="shared-c0ea03fa58fe"></a>

The data service populates missing order/request identifiers, sets order timestamp when entering `ORDER_CREATED` if absent, and populates mycheckout periods. For `AWAITING_PAYMENT` it clears selected payment methods. It builds one or more DynamoDB entities and uses a single-row update or transactional multi-row update. The logical checkout may occupy multiple physical rows. [P15]

<a id="shared-36e2fecf64cb"></a>

`checkoutId` identifies checkout storage; `childId` identifies child context; `orderId` is used in payment/events and can predate placement. A reservation ID, payment ID, and payment reference ID identify different external resources. Never substitute one for another in incident tracing.

### 7.4 Optimistic locking and actual conflict recovery {#74-optimistic-locking-and-actual-conflict-recovery}

<a id="shared-ccf241c0f705"></a>

The request carries a version and the repository enforces versioned updates. The data service catches `ResourceVersionMismatchException`, reloads the stored checkout, and evaluates `forceUpdateCheckout`. Current source allows the following retry-with-current-version cases: [P16]

<a id="shared-44c2c56da8e4"></a>

| Stored state | Incoming state | Conflict recovery |
|---|---|---|
| `CREATED` | `ORDER_CREATED` or `AWAITING_PAYMENT` | Copy DB version to input checkouts and retry update. |
| `AWAITING_PAYMENT` | `ORDER_CREATED`, `AWAITING_PAYMENT`, or `CREATED` | Copy DB version and retry update. |
| Other combinations | Any | Return stored checkout unchanged through this recovery method. |

<a id="shared-3283da8f268c"></a>

This is broader than the older system guide's `CREATED → ORDER_CREATED` description. A stale request is therefore not guaranteed to produce an HTTP conflict. Always inspect the returned status/version and do not assume the incoming state won.

<a id="shared-73f1785d0440"></a>

The create idempotency key is not a blanket exactly-once guarantee for place order. Repeated requests may enter payment retry/finalization logic, and handler timeout skipping is a recalculation control rather than a transactional lock.

## 8. Asynchronous payment completion {#8-asynchronous-payment-completion}

```mermaid
sequenceDiagram
    autonumber
    participant P as External Payment System
    participant K as salesorderpayments_pub_v1
    participant E as Checkout EOM Adaptor
    participant B as Checkout Biz
    participant D as Checkout Data
    participant C as Checkout CDC
    P-->>K: Payment event with salesOrderId and event context
    K->>E: SalesOrderPaymentsEventConsumer
    E->>E: Validate event, extract affiliate / country / order ID
    E->>B: GET checkout by orderId
    B-->>E: Checkout response
    alt Checkout AWAITING_PAYMENT
        E->>B: POST place-order {version}
        B->>B: Awaiting-payment outer list → PLACE_ORDER
        B->>P: Refresh current payment response in applicable strategy
        P-->>B: Current payment result
        alt Accepted final result
            B->>D: Persist ORDER_CREATED
            D-->>C: DynamoDB stream change
        else Failed final result
            B->>B: Applicable cleanup and recovery to CREATED
            B->>D: Persist recovered checkout
        end
    else Other checkout status
        E->>E: Log and ignore payment event for re-placement
    end
```

<a id="shared-69d0b1f8c834"></a>

`SalesOrderPaymentsServiceImpl` validates event/entity/eventInfo/salesOrderId, loads checkout by the event's sales-order ID, and calls biz placement only for `AWAITING_PAYMENT`, with the returned checkout version. It does not itself convert every incoming event directly to `ORDER_CREATED`; placement refreshes/interprets payment through the selected strategy. Missing checkout is logged. [P27] [P28]

<a id="shared-d914be1883a9"></a>

Duplicate payment-event delivery after the checkout has moved out of `AWAITING_PAYMENT` does not initiate placement through this particular consumer path. This state guard is not an exactly-once event-delivery guarantee.

## 9. After the response: sales-order handoff {#9-after-the-response-sales-order-handoff}

### 9.1 Publication boundary {#91-publication-boundary}

```mermaid
flowchart LR
    A[(Checkout DynamoDB)] --> B[Stream / CDC connector]
    B --> C[checkout_raw_v1]
    C --> D[Checkout EOM Adaptor]
    D --> E[Map / enrich / validate sales order]
    E --> F[(Salesorder DynamoDB)]
    F --> G[Salesorder CDC]
    G --> H[salesorder_pub_v1]
    E -.-> I[Large binary order: manual producer path]
    I --> H
    H --> J[External EOM]
    H --> K[Fulfillment event processing]
    H --> L[Order event processing / history projection]
```

<a id="shared-5a9c0437addf"></a>

The checkout request does not synchronously call EOM to submit a sales order. The data-tier connector is configured to match a new image with `Status = ORDER_CREATED` and an old image whose status is not `ORDER_CREATED`. A later write that remains `ORDER_CREATED` does not match that transition filter. Topic names include environment/tenant prefixes. [P29]

<a id="shared-232817a5899e"></a>

This filter expresses the intended transition trigger, **not exactly-once publication or delivery**. Connector retries/replays and direct inserts without an old image need separate operational consideration. No claim about a direct `ORDER_CREATED` insert matching the filter was tested.

### 9.2 Adaptor processing and publication {#92-adaptor-processing-and-publication}

<a id="shared-abb79e8d44cf"></a>

`CheckoutEventConsumer.readCheckoutEvent` delegates checkout processing to the sales-order service, treats `ResourceAlreadyExistException` as an already-processed case, and handles processing errors through its retry/error path. The sales-order service maps/enriches/validates the record and assigns publication or validation-failure state. [P30] [P31]

<a id="shared-0eb77571a9b4"></a>

- Valid normal-sized order: save a sales-order record with `PUBLISHED`; the sales-order connector publishes records with `PUBLISHED` or `REPUBLISHED`.
- Validation failure: preserve `VALIDATION_FAILED` and route through the service's error handling; this is distinct from a successfully published order.
- Large/binary payload: `PUBLISHED_BINARY` storage and explicit producer handling avoid relying on the normal CDC publication path for that binary record. [P31] [P32]

```mermaid
sequenceDiagram
    participant K as checkout_raw_v1
    participant E as EOM Adaptor
    participant S as Salesorder Store
    participant R as Retry / Error Handling
    participant O as salesorder_pub_v1
    K->>E: Checkout event
    E->>E: Map, enrich and validate
    alt Already exists
        E->>E: Treat replay as already processed
    else Processing exception
        E->>R: Retry / error path
    else Validation failure
        E->>S: Save VALIDATION_FAILED
        E->>R: Validation error route
    else Valid standard order
        E->>S: Save PUBLISHED
        S-->>O: CDC publication
    else Valid large binary order
        E->>S: Save PUBLISHED_BINARY
        E-->>O: Explicit producer path
    end
```

### 9.3 Downstream effects and completion levels {#93-downstream-effects-and-completion-levels}

<a id="shared-1a742db2813a"></a>

| Completion point | What it establishes |
|---|---|
| Place-order HTTP response | Checkout state/result returned by checkout services. |
| Checkout saved as `ORDER_CREATED` | Durable checkout transition, subject to the actual write result. |
| Checkout event processed by adaptor | Sales-order mapping/validation/storage outcome. |
| `salesorder_pub_v1` published | Sales-order event available to consumers; not proof of EOM acceptance. |
| EOM / fulfillment / order-history consumers complete | Further external processing and eventually visible order/inventory state. |

<a id="shared-074725a3c491"></a>

The existing [System Guide](/mycheckout/end-to-end-system/part-1) and [Fulfillment End-to-End](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-1) describe downstream fulfillment stock adjustment/release and order-event S3/history processing. Those downstream internals were **not re-traced in full for these two documents**. The arrows to those consumers describe the referenced architecture; EOM's internal acceptance/fulfillment behavior is outside this workspace. Exact retry counts, binding schedules, topic prefixes, and environment settings should be read from the target environment configuration rather than assumed from an example.

See the [shared definition](/mycheckout/place-order-flow/part-1#shared-9a837f8c744e).

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
