---
slug: /mycheckout/payment-cdc-sequence-guide/part-2
title: "mycheckout — Checkout Payment and CDC Complete Flow — Part 2"
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

# mycheckout — Checkout Payment and CDC Complete Flow — Part 2

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `PAYMENT-CDC-SEQUENCE-GUIDE.md` |
| Source SHA256 | `b89fb3b9e7baaf4e5fbe4d6a0d4268fb106d7eb4cdbbc562185e60ee9743cd37` |
| Guide part | 2 of 3 |

[Part 1](/mycheckout/payment-cdc-sequence-guide/part-1) · [Part 2](/mycheckout/payment-cdc-sequence-guide/part-2) · [Part 3](/mycheckout/payment-cdc-sequence-guide/part-3)

## 8. Japan placement step by step {#8-japan-placement-step-by-step}

<a id="shared-fc5749faa8f8"></a>

1. Customer submits place-order. App delegates to Biz, which loads checkout and selects Japan processing.
2. Applicable recalculation and validation run.
3. For a fresh normal placement, obtain applicable inventory reservations before payment.
4. Validate the reservation. An invalid result takes the reservation-failure branch; normal payment processing does not proceed through that branch. Configured bypasses and non-inventory cases must be considered before interpreting an empty reservation as failure.
5. Process money payment when required. Loyalty-only and zero-total cases have their own guards.
6. Interpret the payment response: AUTHORIZED, AWAITED or CAPTURED sets ORDER_CREATED; INITIATED sets AWAITING_PAYMENT.
7. Failed/null status or missing payment response takes applicable failure handling. Cleanup and loyalty compensation depend on checkout and reservation context.
8. Failure while awaiting payment executes recovery to CREATED and recalculation through failure handlers.
9. Persist the resulting checkout. The customer receives its current outcome.
10. Only a qualifying transition to ORDER_CREATED starts the order-created CDC handoff. AWAITING_PAYMENT does not qualify.

```mermaid
sequenceDiagram
    autonumber
    actor U as Customer
    participant A as Checkout App
    participant B as Checkout Biz Japan
    participant F as Fulfillment
    participant P as Payment Service
    participant D as Checkout Data
    participant DB as Checkout DynamoDB
    participant C as Checkout CDC
    participant K as Kafka checkout_raw
    U->>A: SYNC Place order
    A->>B: SYNC Place-order request
    B->>D: SYNC Load checkout
    D-->>B: RESPONSE Checkout and version
    B->>B: Recalculate and validate
    B->>F: SYNC Reserve applicable inventory
    F-->>B: RESPONSE Reservation result
    B->>B: Validate reservation
    alt Invalid reservation
        B->>B: Handle reservation failure
        B-->>A: RESPONSE Failure or modifications
        A-->>U: RESPONSE Show outcome
    else Accepted reservation or valid bypass
        B->>P: SYNC Process applicable payment
        P-->>B: RESPONSE Payment result
        alt AUTHORIZED or AWAITED or CAPTURED
            B->>B: Set checkout.status ORDER_CREATED
        else INITIATED
            B->>B: Set checkout.status AWAITING_PAYMENT
        else Failed or missing result
            B->>B: Determine applicable recovery
            opt Reservation cleanup required
                B->>F: SYNC Attempt cleanup
                F-->>B: RESPONSE Cleanup result
            end
            opt Loyalty compensation required
                B->>P: SYNC Attempt loyalty compensation
                P-->>B: RESPONSE Compensation result
            end
            opt Recovering awaiting-payment checkout
                B->>B: Set CREATED and recalculate
            end
        end
        B->>D: SYNC Save resulting checkout
        D->>DB: SYNC Persist status and data
        DB-->>D: RESPONSE Save result
        D-->>B: RESPONSE Updated checkout
        B-->>A: RESPONSE Checkout and payment outcome
        A-->>U: RESPONSE Current outcome
        DB-->>C: ASYNC EVENT Stream modification
        alt Transition to ORDER_CREATED
            C->>K: PUBLISH checkout event
            Note over C,K: commerce_{env}_{tenantCode}_checkout_raw_v1
        else Other transition
            C->>C: Skip order-created publication
        end
    end
```

## 9. Japan asynchronous payment completion {#9-japan-asynchronous-payment-completion}

<a id="shared-6a2736d84531"></a>

1. The initial placement can persist AWAITING_PAYMENT and return to the customer.
2. Adapter consumes a later salesorderpayments_pub event. The exact upstream publishing implementation is outside the inspected scope.
3. It validates the event and extracts salesOrderId, affiliate and country context.
4. It loads checkout by order ID.
5. Only AWAITING_PAYMENT triggers a place-order call using the returned checkout version. Other states are skipped through this consumer path.
6. Applicable Japan processing refreshes the payment response using existing reservation context rather than blindly starting a fresh normal reservation path.
7. Biz interprets the result and sets ORDER_CREATED, retains AWAITING_PAYMENT or executes failure recovery to CREATED.
8. Data persists the outcome. A transition to ORDER_CREATED feeds the normal checkout CDC handoff.

```mermaid
sequenceDiagram
    autonumber
    participant K as Kafka Payment Topic
    participant E as Adapter Payment Consumer
    participant B as Checkout Biz
    participant P as Payment Service
    participant D as Checkout Data
    participant DB as Checkout DynamoDB
    participant C as Checkout CDC
    participant CK as Kafka checkout_raw
    Note over K: commerce_{env}_{tenantCode}_salesorderpayments_pub_v1
    K-->>E: ASYNC EVENT CONSUME payment event
    E->>E: Validate event and extract tenant context
    E->>B: SYNC Find checkout by salesOrderId
    B-->>E: RESPONSE Checkout status and version
    alt AWAITING_PAYMENT
        E->>B: SYNC Resume place order with version
        B->>P: SYNC Refresh payment response
        P-->>B: RESPONSE Current payment status
        alt AUTHORIZED or AWAITED or CAPTURED
            B->>B: Set checkout.status ORDER_CREATED
        else INITIATED
            B->>B: Keep AWAITING_PAYMENT
        else Failure
            B->>B: Applicable compensation and recovery to CREATED
        end
        B->>D: SYNC Save resulting state
        D->>DB: SYNC Persist checkout
        DB-->>D: RESPONSE Save result
        D-->>B: RESPONSE Updated checkout
        B-->>E: RESPONSE Place-order outcome
        DB-->>C: ASYNC EVENT Stream update
        opt Transition to ORDER_CREATED
            C->>CK: PUBLISH checkout event
        end
    else Other status
        E->>E: Skip re-placement
    end
```

## 10. First CDC and EOM adapter step by step {#10-first-cdc-and-eom-adapter-step-by-step}

<a id="shared-ed061cb61ef7"></a>

1. Checkout write commits with status ORDER_CREATED.
2. Checkout table stream exposes old and new images.
3. Configured event source filtering requires new Status ORDER_CREATED and old Status different from ORDER_CREATED. Updates that leave ORDER_CREATED unchanged are not selected by that transition filter.
4. The configured Lambda-based connector publishes Avro to checkout_raw. Shared connector internals are not present in this walkthrough.
5. EOM adapter consumes the CloudEvent, chooses tenant context from the topic and decodes the checkout event.
6. It decodes binary/compressed or JSON checkout payload data as applicable and maps individual checkout data into sales-order entities.
7. It strips the country-code prefix from order IDs and maps orderId to salesOrderId.
8. It validates each sales order. Successful validation sets orderEventStatus PUBLISHED before saving. Binding validation errors set VALIDATION_FAILED, record reasons and attempt sales-order DLQ publication. Other validation-processing exceptions set ERROR.
9. Normal single-order creation uses a conditional DynamoDB save. Multiple orders use a separate transaction path.
10. A successful sales-order write produces its own stream record. This is a second CDC stage, not a direct call from the adapter into the CDC connector.

## 11. Second CDC and sales-order publication {#11-second-cdc-and-sales-order-publication}

<a id="shared-3fd2cbf94cab"></a>

1. Sales-order DynamoDB has its own NEW_AND_OLD_IMAGES stream.
2. Its configured connector filter accepts NewImage.orderEventStatus PUBLISHED or REPUBLISHED. Unlike the checkout filter, it does not check an old-to-new status transition; an update retaining an eligible status may also qualify.
3. The connector publishes to commerce_{env}_{tenantCode}_salesorder_pub_v1 using the configured Avro schema subject.
4. Downstream consumers process the sales-order event independently.
5. This normal path does not establish a later database update confirming broker receipt. PUBLISHED was already stored before publication.

```mermaid
sequenceDiagram
    autonumber
    participant CK as Kafka checkout_raw
    participant E as EOM Adapter
    participant DB as Sales Order DynamoDB
    participant C as Sales Order CDC
    participant SK as Kafka salesorder_pub
    participant O as Downstream Consumers
    participant R as Kafka Checkout RLQ
    participant DLQ as Kafka Sales Order DLQ
    CK-->>E: ASYNC EVENT CONSUME checkout event
    E->>E: Decode and map checkout to sales order
    E->>E: Normalize order ID and validate
    alt Normal validated single sales order
        E->>E: Set orderEventStatus PUBLISHED
        E->>DB: SYNC Conditional create by id and country
        alt First successful creation
            DB-->>E: RESPONSE Save succeeds
            DB-->>C: ASYNC EVENT Sales-order stream record
            C->>C: Filter PUBLISHED or REPUBLISHED
            C->>SK: PUBLISH sales-order Avro event
            Note over C,SK: commerce_{env}_{tenantCode}_salesorder_pub_v1
            SK-->>O: ASYNC EVENT CONSUME sales order
        else Duplicate key
            DB-->>E: RESPONSE Conditional failure
            E->>E: Catch already-exists exception and finish
        else Other processing failure
            E->>R: PUBLISH checkout event for retry
        end
    else Binding validation failure
        E->>E: Set VALIDATION_FAILED and reasons
        E->>DLQ: PUBLISH invalid sales-order event
        E->>DB: SYNC Attempt save of validation-failed record
        Note over DB,C: Does not match normal publication status filter
    end
```

## 12. Failure and retry sequence {#12-failure-and-retry-sequence}

```mermaid
sequenceDiagram
    autonumber
    participant CK as Kafka checkout_raw
    participant E as EOM Adapter
    participant DB as Sales Order DynamoDB
    participant R as Kafka Checkout RLQ
    participant RC as Adapter Retry Consumer
    participant S as Retry Consumer Scheduler
    participant DLQ as Kafka Checkout DLQ
    CK-->>E: ASYNC EVENT CONSUME checkout
    E->>DB: SYNC Attempt sales-order create
    DB-->>E: RESPONSE Non-duplicate failure
    E->>R: PUBLISH checkout with retry count and eligible timestamp
    R-->>RC: ASYNC EVENT CONSUME retry event
    alt Retry time has not arrived
        RC->>RC: Stop retry consumer binding and return
        S->>RC: Periodically restart stopped binding
        Note over RC,S: Binding-level timing gate, not per-message scheduling
    else Eligible to process
        RC->>DB: SYNC Retry creation
        alt Success or already exists
            RC->>RC: Finish
        else Failure below retry limit
            RC->>R: PUBLISH with incremented retry count
        else Retry limit reached
            RC->>DLQ: PUBLISH failed checkout event
            RC->>RC: Increment DLQ failure metric
        end
    end
```

<a id="shared-58772c4cb2c1"></a>

Observed sample configuration uses sales-order retry count 3, eligibility timestamp offset 240 minutes and scheduler delay 300 minutes. These values are configuration examples, not confirmed live settings or an exact per-message retry schedule. Scheduling, stopped bindings and consumer position affect actual timing. Sales-order TTL also differs between base application settings and configmap examples; inspect the resolved deployed configuration.

## 13. Duplicate handling {#13-duplicate-handling}

### Repeated checkout creation {#repeated-checkout-creation}

<a id="shared-819bb11c31e0"></a>

The ID-generation path receives the request idempotency key. Checkout repository conditional creation uses attribute_not_exists(Id) AND attribute_not_exists(ChildId). This prevents overwriting an existing primary-key item. It does not by itself prove exactly-once behavior for all subsequent payment side effects.

### Repeated place order {#repeated-place-order}

<a id="shared-e613ac240ac8"></a>

Applicable strategies choose payment retry when a payment ID already exists. Existing ORDER_CREATED and PAYMENT_REQUIRED states influence outer handler selection. The exact payment-provider idempotency guarantee is outside this trace; do not claim that retry strategy selection alone prevents duplicate charges.

### Repeated payment event {#repeated-payment-event}

<a id="shared-df92eeda788d"></a>

The payment consumer only resumes checkouts currently AWAITING_PAYMENT. A later event after successful transition to ORDER_CREATED is skipped. Two concurrent events can both read AWAITING_PAYMENT, so the status guard is not a distributed lock.

### Repeated checkout Kafka event {#repeated-checkout-kafka-event}

<a id="shared-1eb2c044c7ff"></a>

For a normal single sales order, the adapter uses attribute_not_exists(id) AND attribute_not_exists(countryIsoCode). Two concurrent creates for the same salesOrderId/country cannot both create that item. The loser becomes ResourceAlreadyExistException, which the checkout consumer catches and logs without routing the duplicate through its normal retry branch. No successful duplicate database modification is produced by that rejected write.

<a id="shared-13e688a4316b"></a>

This protection lasts while the item exists. After TTL actually removes it, the same create condition can succeed again. Group-order transaction puts in the inspected code do not carry the same create-only condition, so do not generalize the single-order guarantee.

### Repeated sales-order publication {#repeated-sales-order-publication}

<a id="shared-4d88fd428551"></a>

CDC can repeat processing, and the sales-order filter accepts eligible new status rather than only a status transition. Downstream consumers require their own durable idempotency. Kafka producer idempotence does not deduplicate every new application-level publication across Lambda retries or restarts.

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
