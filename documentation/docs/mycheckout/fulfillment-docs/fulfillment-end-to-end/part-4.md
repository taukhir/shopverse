---
slug: /mycheckout/fulfillment-docs/fulfillment-end-to-end/part-4
title: "mycheckout — Fulfillment: End-to-End Guide — Part 4"
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

# mycheckout — Fulfillment: End-to-End Guide — Part 4

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `fulfillment docs/FULFILLMENT-END-TO-END.md` |
| Source SHA256 | `5c0985b97fc0201d78f7a2cbf248cb7b16dba20c5e63a9f422c6568376b97eed` |
| Guide part | 4 of 6 |

[Part 1](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-1) · [Part 2](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-2) · [Part 3](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-3) · [Part 4](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-4) · [Part 5](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-5) · [Part 6](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-6)

## 14. The connected fulfillment lifecycle, including checkout {#14-the-connected-fulfillment-lifecycle-including-checkout}

### 14.1 Before an order: master data and supply {#141-before-an-order-master-data-and-supply}

<a id="shared-8612fa0bf54c"></a>

Two independently refreshed data sets are required. Location commands load partner/Manhattan/Hybris locations into DynamoDB, and selected country command lists build the Redis geo index. Fulfillment types and their service levels describe delivery methods, evaluation flags, views and fee rules. Postal-code serviceability and delivery dates live in PostgreSQL; delivery-slot definitions and country time zones come from master data. A location refresh is not an inventory refresh.

<a id="shared-519fbdf646aa"></a>

On NEXTGEN, AS400 inventory events create/update the versioned `stock_level` ledger (§4). An EOD can bootstrap a missing stock key; a REL/DSP requires an existing key. On Manhattan, cart ATP and promising query Manhattan; these repositories contain the consumer-facing contract, not Manhattan's upstream warehouse/supply ingestion. Changing `config.ats-service` selects allocation/reservation implementations; it does not migrate stock or disable unrelated endpoints/consumers automatically.

### 14.2 Customer selection and checkout enrichment {#142-customer-selection-and-checkout-enrichment}

<a id="shared-8b910c7fd709"></a>

1. A storefront can request fulfillment types, locations, cart pickup locations, serviceability, dates and fees through fulfillment appservice. Location strategy selection, restrictions and BOPIS stock checks are in §6.4.
2. Checkout business service has its own `FulfillmentDataClient`. It calls dataservice directly using generated `AllocationsApi`, `ReservationsApi`, `DeliveryFeesApi` and `ServiceLocationsApi`; appservice is not an obligatory hop.
3. `InventoryServiceImpl.getFulfillmentOptions` gathers parent and child checkouts, checks eligibility, filters Japan non-inventory items, maps them with `AllocationMapper`, and calls `getFulfillmentOptions` → `generateAllocations` → `POST /allocations`. Home delivery without a valid address can skip this call. Japan also processes guest backorder behavior in this service.
4. Dataservice `AllocationsServiceImpl` handles request merge/split and delegates to the selected helper. NEXTGEN reads latest warehouse stock and selects a view; Manhattan evaluates shipping/pickup ATP. Returned options are planning results, not a hold.
5. Checkout calculates shipping fees separately using `DeliveryFeeCalculationServiceImpl` → `getDeliveryFee` → `POST /delivery-fees`. It can then apply shipping promotions and update checkout/payment totals. It has exemptions such as BOPIS/walk-in and eligible group/SOP cases, so the fee returned by fulfillment need not equal the final checkout shipping charge.
6. Japan normal place-order handler configuration groups fulfillment enrichment, balance calculation, delivery-fee calculation and SOP work in the same colon-separated handler stage. Do not infer a serial allocation-then-fee chain from the list of their names. Later stages validate slots, calculate taxes/adjustments and process modifications before the place-order handler. Exact frontend call ordering is outside these backend repositories.

<a id="shared-e817942b4214"></a>

If the delivery-fee call returns empty, checkout can use its default fulfillment configuration for service level/fee and preserve an existing fee. Another path reads fee data from fulfillment options when recalculation is not required. Since dataservice's allocation-fee helper has no production caller, do not assume allocation alone supplies a usable fee in every path.

### 14.3 Reserve on place order: Japan normal flow {#143-reserve-on-place-order-japan-normal-flow}

<a id="shared-7631db197a84"></a>

`PlaceOrderController.placeOrder` delegates to `PlaceOrderServiceImpl`, which selects country/status-specific handlers. `CheckoutPlaceOrderStepHandler` branches on `CHECKOUT_PLACE_ORDER_INTERNAL_HANDLERS_SUPPORT`:

<a id="shared-87190548b7ce"></a>

| Flag | Japan normal path |
|---|---|
| Off | `JapanNormalPlaceOrderStrategy.placeOrder`: create reservation → validate reservation → payment/loyalty/zero-total decision → checkout update |
| On | `JapanInternalPlaceOrderStrategy`: inventory-reservation handler → payment-processing handler → preorder-reserve handler → earned-points handler → post-place-order handler. `JapanInventoryReservationStrategy` creates and validates the inventory reservation. |

<a id="shared-9a184adec7cd"></a>

The flag's deployed value was not established. These are two reachable implementations, not two steps executed for the same request. POS, payment retry, preorder and subscription flows have separate policies; a statement about normal Japan orders must not be generalized to all of them.

<a id="shared-b4eb88655f85"></a>

`InventoryReservationServiceImpl` builds a reservation from the **selected fulfillment type's allocation group**. It requires allocation options, warehouse information and `inventoryAllocationEvaluated=true`; AUTO_SOP reservation is additionally controlled by `checkout.subscription.reservation.enable`. Inventory decision strategies can bypass reservation for configured cases. Japan filters non-inventory and `FORCE_IN_STOCK` entries. An all-exempt checkout can legitimately have an empty reservation map.

Dataservice then executes:

<a id="shared-44beeff9c9b0"></a>

1. `ReservationsController` selects `ReservationsService` through CDI/property lookup.
2. NEXTGEN `StockLevelReservationService` maps each line to a `RESERVE` stock transaction. It uses the entry warehouse, falling back to address/postcode evaluation, and sets `atsType=REGULAR_VIEW` even if allocation selected SOP_VIEW.
3. Batch preprocessing handles bundles and duplicate checks. The transaction helper sorts by `(itemCode, warehouseCode)`, takes per-stock-key PostgreSQL advisory locks **before reading**, processes sequentially and writes new versions. Response ordering is restored to input order.
4. The reserve strategy re-evaluates the **current entity**; it accepts the selected sourced or backorder quantity only when fully fulfillable. A stale allocation can therefore fail. Insufficient stock returns HTTP **409** from the reservation controller. Delete returns **204**.
5. Responses carry actual sourced/backorder quantities and `reservedQuantity=sourced+backorder`. Checkout maps the reservation into its stored checkout/order data, validates line quantities and can return fulfillment modifications to the caller.

<a id="shared-3a02e45ecc62"></a>

The stock batch is transactional: an error propagated from any line rolls back that batch's writes. Checkout/payment/Manhattan/Kafka are outside that PostgreSQL transaction. There is no distributed atomic commit demonstrated across these systems.

### 14.4 Other markets and Manhattan reservation {#144-other-markets-and-manhattan-reservation}

<a id="shared-98ed6a028cbb"></a>

The default normal strategy creates reservation and payment publishers and subscribes to them using `Mono.zip`. It sets `ORDER_CREATED` and populates checkout details after both complete, with a fix-forward comment. Therefore **"reservation always succeeds before payment begins" is false for this default path**.

<a id="shared-bece22af2dfc"></a>

Manhattan allocation loads applicable fulfillment types and evaluates shipping and pickup groups, combining them into an allocation option. Strategies call `evaluateAtpForCart` plus shipping restrictions. The client splits large ATP requests according to `numberOfEntriesPerAtpRequest`. Reservation is a different request: `ReservationsServiceImpl` requires exactly one allocation group, builds a confirmed `RESERVATION` promising request and selects a promising config from fulfillment type, medical/nonmedical status and channel. Missing mappings fail configuration validation. Pickup requests omit the destination address; shipping requests map it.

<a id="shared-ce6b8b9e285f"></a>

The response maps allocation quantities into reserved quantity, `BACKORDER` supplies into backorderable quantity, `PICKLINE` supplies into sourced quantity, and maps warehouse/estimated dates. The implementation chooses the earliest group date among mapped line dates; do not infer a latest-line delivery guarantee. Delete calls Manhattan inventory's `deleteInventoryReservationByBKUsingPOST` with `requestId`. These calls do not insert NGC `RESERVE` rows through the NEXTGEN reservation implementation.

### 14.5 Pickup validation is a separate hold/confirmation {#145-pickup-validation-is-a-separate-holdconfirmation}

<a id="shared-4150f40e107e"></a>

For Mexico `easyDeliveryPoint`, `CheckoutValidatePickupLocationAvailabilityHandler` calls the availability service; it sends grouped requests to dataservice, which validates with Estafeta and stores the check id in Redis. `CheckoutReservePickupLocationStepHandler` later confirms the selected location using `availabilityCheckKey=checkoutId`. Mexico's normal handler list places confirmation before modification preparation and the place-order handler.

<a id="shared-7494c95ee57d"></a>

This is **pickup-point confirmation**, not inventory reservation. The Redis token's 360-second TTL does not establish a TTL for NEXTGEN stock reservations. Checkout client methods preserve HTTP 410 as an error so the availability service can add a pickup-not-available modification; other failures can be converted to empty results. An empty client result is not proof of a successful carrier confirmation.

### 14.6 After placement: stock consumption and cancellation {#146-after-placement-stock-consumption-and-cancellation}

<a id="shared-8903cf23cc60"></a>

Stock is not necessarily decremented at the moment checkout returns `ORDER_CREATED`. In the NEXTGEN event flow, sales-order `ORDER_READY_FOR_FULFILLMENT`, or POS `ORDER_COMPLETE`, is the trigger for `ON_HAND_ADJUSTMENT`. This is a software event boundary; it should not be described as proof the parcel was physically shipped. Eligible quantities reduce both `onHand` and `reserved`. Backordered lines and dependent bundle minor lines can be skipped as described in §4.3.

<a id="shared-1d2e7d52a504"></a>

`ORDER_CANCELLED` produces `RELEASE` from cancelled quantities. The event contains inventory reservation identifiers; it does not reconstruct the reservation by calling checkout. Releasing reserved stock does not add physical supply back to on-hand, because reservation did not remove it in the first place. For already consumed/shipped stock, returns/restocking require a separate upstream transaction; no universal returns/restocking flow was verified here.

<a id="shared-33be985d3193"></a>

Each ledger insert can travel through CDC and the availability publisher. This asynchronous display path does not control whether the next direct allocation sees the committed stock. Delivery by a carrier, OMS state management and the downstream Product/Search handlers are external boundaries.

### 14.7 Identifiers across the lifecycle {#147-identifiers-across-the-lifecycle}

<a id="shared-e33ae9f248dc"></a>

| Identifier | How it is carried |
|---|---|
| Country / affiliate | REST tuple headers supply country; AS400 affiliate selects tenant context; CDC country/master data selects context and affiliate. Country is part of the ledger key. |
| Allocation request/line | Non-GO merge prefixes line ids with `<requestId>_`; responses are split back. Parent/child checkout ids remain important to correlation. |
| Reservation id | Checkout constructs the reservation id; dataservice stores it as stock transaction `referenceId`. It is also the id used for DELETE. |
| Reservation line | NEXTGEN prefixes the input line id as `<reservationId>_<lineId>` and uses it as `transactionId` and response entry id. Checkout maps these identifiers into reservation/order details. |
| Sales-order line | Fulfillment event populator uses `inventoryReservationLineId` as stock transaction id and `inventoryReservationId` as reference id. Missing line ids cause fulfillment lines to be skipped. |
| AS400 event id | Mapped to both transaction id and reference id; this mapping alone does not implement deduplication. |
| Location command | Job sends a random UUID idempotency header; dataservice derives a command UUID from it and stores command status. |

### 14.8 Complete Japan normal-order sequence {#148-complete-japan-normal-order-sequence}

```mermaid
sequenceDiagram
    participant C as Checkout bizservice
    participant D as Fulfillment dataservice
    participant P as PostgreSQL ledger
    participant PAY as Payment service
    participant SO as Sales-order event source
    participant E as Fulfillment eventservice
    participant K as Availability topic
    C->>D: POST allocations (planning)
    D->>P: latest stock for warehouse
    D-->>C: quantities and dispositions
    C->>D: POST delivery-fees (separate calculation)
    D-->>C: shipment fees and threshold
    Note over C: Place order; select configured Japan implementation
    C->>D: POST reservations (selected group)
    D->>P: lock, revalidate, write RESERVE batch
    alt insufficient stock
        D-->>C: 409
        Note over C: client maps empty; validation adds modification
    else reserved
        D-->>C: reservation and line ids
        C->>C: validate reservation
        C->>PAY: initiate payment if required
        alt handled payment failure with reservations
            C->>D: DELETE reservation
            D->>P: RELEASE batch
        else accepted or payment pending
            C->>C: persist checkout state and reservation details
        end
    end
    Note over SO,E: Later asynchronous lifecycle event
    SO->>E: READY_FOR_FULFILLMENT or CANCELLED
    E->>D: stock-levels/batch (adjust or release)
    D->>P: transactional version inserts
    P-->>E: CDC via stocklevel_raw topic
    E->>D: read versions N and N-1
    opt disposition/date/status changed
        E->>K: availability event per view
    end
```

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
