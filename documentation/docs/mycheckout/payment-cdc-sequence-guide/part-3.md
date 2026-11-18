---
slug: /mycheckout/payment-cdc-sequence-guide/part-3
title: "mycheckout — Checkout Payment and CDC Complete Flow — Part 3"
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

# mycheckout — Checkout Payment and CDC Complete Flow — Part 3

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `PAYMENT-CDC-SEQUENCE-GUIDE.md` |
| Source SHA256 | `b89fb3b9e7baaf4e5fbe4d6a0d4268fb106d7eb4cdbbc562185e60ee9743cd37` |
| Guide part | 3 of 3 |

[Part 1](/mycheckout/payment-cdc-sequence-guide/part-1) · [Part 2](/mycheckout/payment-cdc-sequence-guide/part-2) · [Part 3](/mycheckout/payment-cdc-sequence-guide/part-3)

## 14. Checkout status transitions {#14-checkout-status-transitions}

```mermaid
stateDiagram-v2
    [*] --> CREATED: Biz initializes normal checkout
    CREATED --> ORDER_CREATED: Default normal result or Japan accepted outcome
    CREATED --> AWAITING_PAYMENT: Japan payment INITIATED
    AWAITING_PAYMENT --> AWAITING_PAYMENT: Payment remains INITIATED
    AWAITING_PAYMENT --> ORDER_CREATED: Japan accepts refreshed payment outcome
    AWAITING_PAYMENT --> CREATED: Applicable Japan failure recovery
    ORDER_CREATED --> ORDER_CREATED: Applicable payment retry or update
    state PAYMENT_REQUIRED
    note right of PAYMENT_REQUIRED
        Supported specialized state
        Recognized by outer retry selection
        Not a mandatory intermediate step
    end note
    note right of ORDER_CREATED
        Biz assigns the state
        Data persists it
        CDC observes the saved transition
        Does not prove payment capture or EOM acceptance
    end note
```

## 15. Risk register and operational limits {#15-risk-register-and-operational-limits}

<a id="shared-1e05ec27f400"></a>

| Risk | Existing behavior | Limit or follow-up |
| --- | --- | --- |
| Default parallel partial failure | Reservation and payment overlap | One side can succeed while the other fails; reconciliation is needed. |
| Japan longer critical path | Reservation validated before payment | Sequential dependency latency; pending payment introduces delayed completion. |
| Payment succeeds but response/save fails | Existing payment and retry/finalization paths | Must inspect payment state and provider idempotency rather than assume a timeout means no charge. |
| Cleanup fails | Applicable compensation calls exist | Not an atomic rollback; reservation client can log and suppress cleanup errors. |
| Concurrent stale checkout updates | Versioned writes and conflict recovery | Some conflicts reload the current version and retry; not every stale request is rejected. |
| Kafka outage | Connector failure-topic configuration and adapter retry routing | Error topics on the same cluster can also fail. Independent full-payload recovery was not established. |
| Long CDC outage | Stream records retained for 24 hours | Retry/age limits can discard sooner; expired records cannot be replayed from the original stream. |
| Retry publication returns false | Producer returns a boolean | Checkout consumer call sites do not check every returned boolean; failure can lack explicit escalation there. |
| Large binary order publish fails after save | PUBLISHED_BINARY plus manual publication | Retry can hit already-exists before republishing; potential recovery gap. |
| Group-order duplicate | Transactional multi-order save | Inspected puts lack the single-order create-only condition. |
| TTL and delayed duplicate | Temporary retained sales-order item rejects duplicate create | Protection is lost after actual deletion; retention must match replay needs. |
| Multi-item checkout | Split/compressed representation supported | A simplistic one-stream-record-to-one-order transformation may be insufficient. |
| Eligible-status updates | Sales-order CDC filters new status | Updates retaining PUBLISHED can qualify again; downstream idempotency is required. |
| Malformed event before decoding | Consumer error handling exists | Exception handlers dereference checkoutEvent in some paths; malformed-input recovery needs separate validation. |

<a id="shared-79d7225c9810"></a>

These are code-based limitations or potential risks, not claims of observed production incidents. PUBLISHED is a routing convention, not an audit trail proving end-to-end completion.

## 16. Persistence concurrency and post-order work {#16-persistence-concurrency-and-post-order-work}

<a id="shared-22affed59350"></a>

The data service uses versioned updates and catches version mismatches. The documented recovery allows stored CREATED with incoming ORDER_CREATED or AWAITING_PAYMENT, and stored AWAITING_PAYMENT with incoming ORDER_CREATED, AWAITING_PAYMENT or CREATED, to retry using the current database version. Other combinations can return the stored checkout unchanged through that recovery method. Inspect the returned state; do not assume a stale request always fails or always wins.

<a id="shared-a70b7baa6328"></a>

Post-order work also includes applicable profile, registration/account lifecycle and address updates, metrics and conditional cart cleanup. Persistence and several external calls are combined without a shared transaction. Profile failures can be logged/ignored. Cart cleanup is asynchronous and not awaited as part of durable order creation. An HTTP error can therefore coexist with an earlier completed external effect or database write.

## 17. Monitoring and recovery checklist {#17-monitoring-and-recovery-checklist}

<a id="shared-44517931dac0"></a>

1. Correlate checkoutId, orderId, salesOrderId, childId, tenant/country, version, payment references and reservation IDs.
2. Inspect checkout business status and payment status separately.
3. Inspect each CDC stage independently: stream iterator age, Lambda errors/throttles, publication errors and recovery destination delivery.
4. Inspect adapter consumer lag, RLQ age/count, retry headers and DLQ metrics.
5. Inspect the saved sales-order key and orderEventStatus. Do not treat PUBLISHED as a broker receipt.
6. Check actual resolved configuration: feature flag, retry policy, stream starting position, retention, TTL and topic destinations.
7. Fix the cause before replay. Define replay identity and duplicate protection, particularly after TTL deletion and for large/group orders.
8. Reconcile saved ORDER_CREATED checkouts against created sales orders and downstream acceptance using authoritative records. A scan of current checkout state is not the original event history.

This checklist is guidance; it does not assert that every listed alert or reconciliation job already exists.

## 18. Verification of missing payment event recovery {#18-verification-of-missing-payment-event-recovery}

<a id="shared-90a1acb0f1e6"></a>

Additional inspection on 16 November 2026 did not find a scheduled checkout-payment reconciliation worker in the available checkout source. The checkout jobservice Java source contains an application entry point but no payment polling implementation. The adapter scheduler restarts the checkout RLQ consumer; it does not scan AWAITING_PAYMENT checkouts or query payment outcomes on a schedule.

<a id="shared-746f99dac277"></a>

The verified payment completion path consumes salesorderpayments_pub events and resumes placement only for AWAITING_PAYMENT. The payment consumer rethrows general processing failures, allowing configured framework error handling to act, but exact deployed retry/DLQ behavior is not established here. Retrying an existing event is different from discovering an event that never arrived.

<a id="shared-642b24ab6488"></a>

The order domain has scheduled cancellation jobs named cancelweborderpaymentretry and cancelweborderpaymentawaited in Thailand configuration. These call Order Data, load cancellation search properties, search the order index and enqueue cancellation records. This is unpaid-order cleanup, not demonstrated polling of the authoritative Payment Service to finalize pending checkout. A checkout that has not emitted an order-created event is not proven to exist in that order index. Therefore these jobs do not establish recovery for every checkout stuck in AWAITING_PAYMENT. The older END-TO-END-SYSTEM section 23.5 statement that they answer all stuck-checkout cases is broader than the verified implementation supports.

<a id="shared-8436cf8cbee0"></a>

Payment lookup by paymentId or order reference exists for invoked checkout processing. A caller can resume processing through the existing placement path, but no automatic schedule for finding every stuck checkout was found. Payment/provider-side reconciliation or external infrastructure may exist outside the supplied repositories; its absence is not proven globally.

<a id="shared-4d24fa8cf630"></a>

Evidence: orderjobservice CronServiceImpl, orderdataservice JobOrderServiceImpl, adapter CheckoutConsumerScheduler, SalesOrderPaymentsEventConsumer and SalesOrderPaymentsServiceImpl. Distinguish framework retries, RLQ restart, unpaid-order cancellation and authoritative-payment reconciliation in interview explanations.

## 19. Interview explanation {#19-interview-explanation}

<a id="shared-d351ef6442fb"></a>

We allocate checkout identity and normally an order number during checkout creation. Placement loads the checkout and chooses country-specific reservation and payment processing. Default normal processing overlaps reservation and payment and uses fix-forward ORDER_CREATED on a normal result. Japan validates reservation first and interprets payment outcomes, potentially persisting AWAITING_PAYMENT and resuming later through payment events. Checkout Data saves the resulting state. A transition to ORDER_CREATED drives checkout CDC into Kafka. The EOM adapter consumes that event, maps and validates a sales order, and conditionally saves it. Sales-order CDC publishes the normal event to salesorder_pub. Delivery is at least once: state guards and conditional writes provide specific duplicate protections, while retries, DLQs and reconciliation handle separate failure boundaries.

## 20. Source references {#20-source-references}

<a id="shared-40f60a1bd0da"></a>

- [Detailed existing place-order guide](/mycheckout/place-order-flow/part-1)
- [Create checkout guide](/mycheckout/create-checkout-flow/part-1)
- [AWS interview preparation](/mycheckout/aws-interview-prep/part-1)
- Checkout ID and order allocation (local reference: `../checkout/commerce-checkout-dataservice/source/app/src/main/java/com/mycheckout/commerce/checkoutdataservice/app/service/impl/CheckoutServiceImpl.java`)
- Country order sequence service (local reference: `../checkout/commerce-checkout-dataservice/source/app/src/main/java/com/mycheckout/commerce/checkoutdataservice/app/service/impl/OrderSequenceServiceImpl.java`)
- Atomic counter entity (local reference: `../checkout/commerce-checkout-dataservice/source/app/src/main/java/com/mycheckout/commerce/checkoutdataservice/domain/entities/OrderSequenceEntity.java`)
- Default normal placement (local reference: `../checkout/commerce-checkout-bizservice/source/app/src/main/java/com/mycheckout/commerce/checkoutbizservice/app/service/checkout/impl/DefaultNormalPlaceOrderStrategy.java`)
- Japan normal placement (local reference: `../checkout/commerce-checkout-bizservice/source/app/src/main/java/com/mycheckout/commerce/checkoutbizservice/app/service/checkout/impl/JapanNormalPlaceOrderStrategy.java`)
- Payment outcome mapping and recovery (local reference: `../checkout/commerce-checkout-bizservice/source/app/src/main/java/com/mycheckout/commerce/checkoutbizservice/app/service/payment/impl/PaymentServiceImpl.java`)
- Checkout CDC configuration (local reference: `../checkout/commerce-checkout-dataservice/infra-as-code/cdk/app-infra/configs/tenants-common.yaml`)
- Adapter payment-event service (local reference: `../checkout/commerce-checkout-eomadaptorservice/source/app/src/main/java/com/mycheckout/commerce/checkoutadaptorservice/service/impl/SalesOrderPaymentsServiceImpl.java`)
- Adapter checkout consumer and retry handling (local reference: `../checkout/commerce-checkout-eomadaptorservice/source/app/src/main/java/com/mycheckout/commerce/checkoutadaptorservice/consumer/CheckoutEventConsumer.java`)
- Retry consumer scheduler (local reference: `../checkout/commerce-checkout-eomadaptorservice/source/app/src/main/java/com/mycheckout/commerce/checkoutadaptorservice/consumer/CheckoutConsumerScheduler.java`)
- Adapter mapping and publication branches (local reference: `../checkout/commerce-checkout-eomadaptorservice/source/app/src/main/java/com/mycheckout/commerce/checkoutadaptorservice/service/impl/SalesOrderServiceImpl.java`)
- Sales-order repository (local reference: `../checkout/commerce-checkout-eomadaptorservice/source/app/src/main/java/com/mycheckout/commerce/checkoutadaptorservice/repository/SalesOrderRepository.java`)
- Sales-order CDC configuration (local reference: `../checkout/commerce-checkout-eomadaptorservice/infra-as-code/cdk/app-infra/configs/tenants-common.yaml`)
- [AWS DynamoDB Streams](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html)
- [AWS Lambda stream processing](https://docs.aws.amazon.com/lambda/latest/dg/with-ddb.html)
- [AWS stream failure destinations](https://docs.aws.amazon.com/lambda/latest/dg/services-dynamodb-errors.html)

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
