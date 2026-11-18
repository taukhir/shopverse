---
slug: /mycheckout/guest-checkout-flow/part-4
title: "mycheckout — Guest checkout: end-to-end flow — Part 4"
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

# mycheckout — Guest checkout: end-to-end flow — Part 4

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `guest-checkout-flow.md` |
| Source SHA256 | `6b8a6caf945ae7c3e81033809ca5bb26bff4624bba366a221eeefb191ddc345a` |
| Guide part | 4 of 6 |

[Part 1](/mycheckout/guest-checkout-flow/part-1) · [Part 2](/mycheckout/guest-checkout-flow/part-2) · [Part 3](/mycheckout/guest-checkout-flow/part-3) · [Part 4](/mycheckout/guest-checkout-flow/part-4) · [Part 5](/mycheckout/guest-checkout-flow/part-5) · [Part 6](/mycheckout/guest-checkout-flow/part-6)

## 8. Place order and state transitions {#8-place-order-and-state-transitions}

The app maps the place-order request, adds origin IP and calls biz. Biz loads saved checkout, maps request changes, selects the country strategy, and routes by status/client:

<a id="shared-962dc4f8c33c"></a>

| Condition | Pipeline |
|---|---|
| POS client | POS place order |
| `ORDER_CREATED` or `PAYMENT_REQUIRED` | Retry-payment flow |
| `AWAITING_PAYMENT` | Awaiting-payment flow |
| Otherwise | Normal place order |

<a id="shared-e6f5a1d34e41"></a>

Before execution, the place-order handler checks modifications, rejects nonzero `NO_CHARGE` totals, and conditionally runs field validation when country `preSalesOrderValidationEnable` and `CHECKOUT_FIELDS_VALIDATION_SUPPORT_ENABLE` are both enabled. Resulting errors/modifications return a saved checkout instead of proceeding as a clean order.

`CHECKOUT_PLACE_ORDER_INTERNAL_HANDLERS_SUPPORT` selects the implementation:

<a id="shared-e7992d06f964"></a>

- Enabled: country internal handler strategy. Default runs reservation and payment as a combined parallel stage, then earned AmPoints, then post-place-order persistence.
- Disabled: select existing country/status place-order strategy, then persist its result.

<a id="shared-99ccaa1b110f"></a>

Source: commerce-checkout-bizservice/source/app/src/main/java/com/mycheckout/commerce/checkoutbizservice/app/service/placeorder/internal/impl/DefaultInternalPlaceOrderStrategy.java:17 (local reference: `/D:/BE Projects/checkout/checkout/commerce-checkout-bizservice/source/app/src/main/java/com/mycheckout/commerce/checkoutbizservice/app/service/placeorder/internal/impl/DefaultInternalPlaceOrderStrategy.java:17`)

```java
  @Override
  public List<String> getHandlers() {
    return new ArrayList<>(List.of(
        CheckoutHandlerEnum.CHECKOUT_INVENTORY_RESERVATION_HANDLER_KEY.key()
            + CheckoutConstant.COLON_SEPARATOR
            + CheckoutHandlerEnum.CHECKOUT_PAYMENT_PROCESSING_HANDLER_KEY.key(),
        CheckoutHandlerEnum.CHECKOUT_CALCULATE_EARNED_AMPOINT_HANDLER_KEY.key(),
        CheckoutHandlerEnum.CHECKOUT_POST_PLACE_ORDER_HANDLER_KEY.key()
    ));
  }
```

In the default normal legacy strategy, reservation and payment results are zipped, and the checkout is explicitly advanced using a fix-forward `ORDER_CREATED` approach:

<a id="shared-668b9dc3d778"></a>

Source: commerce-checkout-bizservice/source/app/src/main/java/com/mycheckout/commerce/checkoutbizservice/app/service/checkout/impl/DefaultNormalPlaceOrderStrategy.java:74 (local reference: `/D:/BE Projects/checkout/checkout/commerce-checkout-bizservice/source/app/src/main/java/com/mycheckout/commerce/checkoutbizservice/app/service/checkout/impl/DefaultNormalPlaceOrderStrategy.java:74`)

```java
  public Mono<CheckoutBizDto> placeOrder(CheckoutBizDto checkoutBizDto) {

    Mono<Map<String, InventoryReservationDataDto>> reservationMap =
        getInventoryReservation(checkoutBizDto);
    Mono<Optional<PaymentBizDto>> paymentData = getPayment(checkoutBizDto);

    return Mono.zip(reservationMap, paymentData)
        .map(tuple -> {
          LoggerUtil.logInfo(log, CH_BIZ_NORMAL_PLACE_ORDER_INFO, checkoutBizDto.getCheckoutId(),
              checkoutBizDto.getOrderId());
          Optional<PaymentBizDto> payment = tuple.getT2();
          Map<String, InventoryReservationDataDto> reservationEntityMap = tuple.getT1();
          //Fix Forward Always ORDER_CREATED
          payment.ifPresent(checkoutBizDto::setPayment);
          checkoutBizDto.setStatus(CheckoutStatusBizDto.ORDER_CREATED);
          placeOrderHelper.populateCheckoutDetails(checkoutBizDto, reservationEntityMap);
```

<a id="shared-a53e87435007"></a>

This is not equivalent to "payment definitely captured". Payment outcome and recovery depend on the selected payment/country strategy. Avoid assuming rollback semantics across external payment, reservation and database writes; no single distributed transaction is shown.

<a id="shared-0334e37ba83c"></a>

Post-order saving carries version, payment/reservation and status. When status is `ORDER_CREATED`, selected payment entries are moved to history where applicable, selected methods are cleared, and fulfillment options are cleared. Cart/profile/account-process side effects have their own applicability rules. Guest ordering does not mean every registered-profile or registration side effect runs.

## 9. Data service and asynchronous event boundary {#9-data-service-and-asynchronous-event-boundary}

<a id="shared-a9c57bf07084"></a>

Biz's `CheckoutCreateDbStepHandler` calls `CheckoutCommonService.createCheckout()`, which maps a data request and invokes `CheckoutDataTierClient.createCheckout()`. Data `CheckoutServiceImpl.createCheckout()` maps parent/children and saves through the checkout repository; identifier generation includes order and subresource IDs. Save operations use a single-entity write or a transaction for multiple entities.

<a id="shared-5ff8748eaa8c"></a>

Updates use version protection. The repository maps conditional failures to version-mismatch errors. `CheckoutServiceImpl.handleVersionMismatch()` can reload and retry for selected lifecycle transitions (for example database CREATED/AWAITING_PAYMENT with input ORDER_CREATED/AWAITING_PAYMENT); otherwise it returns the database checkout. This behaviour is not a blanket retry policy for every stale write.

<a id="shared-89f7b16165ac"></a>

The main completion handoff is change capture, not a synchronous call from data service to EOM. The configured DynamoDB connector publishes the checkout raw event for a transition from non-ORDER_CREATED to ORDER_CREATED:

<a id="shared-69bca2755baf"></a>

Source: commerce-checkout-dataservice/infra-as-code/cdk/app-infra/configs/tenants-common.yaml:75 (local reference: `/D:/BE Projects/checkout/checkout/commerce-checkout-dataservice/infra-as-code/cdk/app-infra/configs/tenants-common.yaml:75`)

```yaml
  allconnectors:
    - lambdaNameSuffix: checkout
      namePrefix:
      pluginType: DYNAMODB
      clientId: checkout-dataservice
      keyConverter: STRING
      valueConverter: AVRO
      topicName: commerce_{tenantEnv}_{tenantCode}_checkout_raw_v1
      schemaSubject: commerce_checkout-event_raw_v1-record
      excludeList: []
      cdcType: COMPLETE
      dynamodbSuffix: checkout
      errorMode: FAILED_TO_DLQ
      kafkaDLQTopic: commerce_{tenantEnv}_{tenantCode}_checkout-comcheckoutds-dlq_error_v1
      dynamodbEventSourceDetails:
        dynamoEventSourceProps:
          enabled: true
          batchSize: 60
          startingPosition: LATEST
          parallelizationFactor: 3
          filters:
            - pattern: '{"dynamodb":{"NewImage":{"Status":{"S":["ORDER_CREATED"]}},"OldImage":{"Status":{"S":[{"anything-but":["ORDER_CREATED"]}]}}}}'
```

<a id="shared-4d992c8e43b9"></a>

Topic: `commerce_{tenantEnv}_{tenantCode}_checkout_raw_v1`; schema subject: `commerce_checkout-event_raw_v1-record`. Environment config may override shared values. An update whose old and new status are both ORDER_CREATED does not match this configured transition filter. Runtime connector health was not checked.

## 10. EOM adapter mapping, storage and failures {#10-eom-adapter-mapping-storage-and-failures}

<a id="shared-ca80f7c216f3"></a>

`CheckoutEventConsumer.readCheckoutEvent()` extracts tenant context, decodes the CloudEvent and invokes `SalesOrderServiceImpl.createSalesOrder(CheckoutEvent)`. That method decodes JSON or binary/compressed checkout payload, maps each checkout, validates sales-order entities and persists them.

The adapter guest predicate is stricter than biz:

<a id="shared-670a4239146f"></a>

Source: commerce-checkout-eomadaptorservice/source/app/src/main/java/com/mycheckout/commerce/checkoutadaptorservice/service/impl/SalesOrderServiceImpl.java:517 (local reference: `/D:/BE Projects/checkout/checkout/commerce-checkout-eomadaptorservice/source/app/src/main/java/com/mycheckout/commerce/checkoutadaptorservice/service/impl/SalesOrderServiceImpl.java:517`)

```java
  private boolean isGuestOrder(CheckoutDataDto checkout, Metadata metadata) {

    try {
      Config config = salesOrderEntityUtil.getConfig(metadata.getXmycheckoutCountry());

      boolean isNonRegistrationOrder =
          Objects.nonNull(checkout)
              && !CollectionUtils.isEmpty(checkout.getClassifications())
              && checkout.getClassifications().stream()
              .noneMatch(ClassificationDataDto.REGISTRATION::equals);

      return isNonRegistrationOrder
          && Objects.nonNull(config)
          && Boolean.TRUE.equals(config.getEnableGuestCheckout())
          && Objects.nonNull(config.getDefaultAccount())
          && Objects.nonNull(checkout.getUser())
          && Objects.nonNull(checkout.getUser().getGuid());

    } catch (Exception ex) {
      log.error("Error while determining guest order", ex);
      return false;
    }
```

<a id="shared-eb4fb20c1c4d"></a>

| Input | Biz guest helper | Adapter guest predicate |
|---|---|---|
| Enabled flag, GUID, non-registration classifications, configured default account | true | true |
| Same, but empty classifications | true | false |
| Same, but REGISTRATION classification | true | false |
| Same, but default account absent | true | false |
| Guest flag false | false | false |
| User/GUID absent | false | false |

<a id="shared-46cbf043eb64"></a>

For adapter guests, default account population fills ordering/account/ship-to when the account object or account ID is null; existing non-null IDs are preserved. It uses `lastName firstName` as configured default-account name when non-blank. The sales-order entity gets `isGuestOrder=true` and guest price list.

<a id="shared-48f3a38433e5"></a>

Source: commerce-checkout-eomadaptorservice/source/app/src/main/java/com/mycheckout/commerce/checkoutadaptorservice/service/impl/SalesOrderServiceImpl.java:486 (local reference: `/D:/BE Projects/checkout/checkout/commerce-checkout-eomadaptorservice/source/app/src/main/java/com/mycheckout/commerce/checkoutadaptorservice/service/impl/SalesOrderServiceImpl.java:486`)

```java
  public SalesOrderEntity mapToSalesOrderEntity(CheckoutDataDto checkoutDataDto,
                                                Metadata metaData) {
    //Updating IDs by removing the "countryCode#" prefix.
    updateCheckoutIds(checkoutDataDto);
    Boolean isGuestOrder = isGuestOrder(checkoutDataDto, metaData);
    if (isGuestOrder) {
      populateDefaultAccountForGuest(checkoutDataDto, metaData);
    }
    Entity entity =
        salesOrderEntityMapper.map(checkoutDataDto, SalesOrderConstants.EOM_VERSION,
            metaData);
    if (isGuestOrder) {
      entity.setIsGuestOrder(Boolean.TRUE);
      entity.setOrderPriceList(OrderPrices.getValue(GUEST));
    }
```

Illustrative mapped fragment (not the complete EOM contract):

```json
{
  "entity": {
    "isGuestOrder": true,
    "orderPriceList": "mycheckoutDefaultGuestPriceGroup"
  }
}
```

<a id="shared-5323cc2afdeb"></a>

| Failure | Handling visible in source |
|---|---|
| Guest predicate throws | Log and return false, then continue mapping without guest classification. |
| Default guest-account population throws | Log and continue mapping; later entity validation may expose missing fields. |
| Entity validation fails | Mark error handling state in sales-order processing rather than assuming a successfully published order. |
| Consumer receives duplicate sales order | Catch `ResourceAlreadyExistException` and do not retry. |
| Other checkout-event processing failure | Publish to retry queue. |
| Retry limit reached | Publish to DLQ and record failure metric. |

<a id="shared-20c5fbe1b1d3"></a>

The adapter saves a normal sales order or a transaction for several entities. Large orders have a separate manual publishing path. Saving/marking an event in adapter code is not proof that the downstream enterprise consumer completed processing.

## 11. Worked scenarios {#11-worked-scenarios}

<a id="shared-027c48f35fc4"></a>

These are illustrative state fragments, not executable complete API payloads. Real requests must satisfy the current OpenAPI contract, request validators, headers, country configuration and provider-specific payment payloads.

### A. New guest with available stock {#a-new-guest-with-available-stock}

<a id="shared-000fdb2567f3"></a>

1. Anonymous session profile `anon-demo-123`; guest enabled; no account process.
2. App maps GUID and clears registered user ID.
3. Biz enriches product details, evaluates guest promotions and applicable inventory. Segment/rationing/account-credit handlers skip.
4. Contact search finds no existing account, records validation success where applicable.
5. Data saves checkout; client supplies shipping/contact and an eligible selected payment method.
6. Place order runs its country's validation/reservation/payment pipeline and saves the resulting state.
7. Once saved as ORDER_CREATED, change capture emits the event. Adapter detects guest and fills missing default accounts before validating and saving the sales order.

```json
{
  "user": {"id": null, "guid": "anon-demo-123", "email": "maya@example.test", "mobileNo": "+810000000000"},
  "accountProcess": null,
  "status": "CREATED"
}
```

### B. Contact already belongs to an active account {#b-contact-already-belongs-to-an-active-account}

<a id="shared-735ecc964cf3"></a>

Account search/identity returns a match → create existing-user modification with matching-field errors → return checkout for client handling. A successful lookup can set `isExistingUserValidated=true` even when a match is found; the flag means lookup completed, not that the person is eligible to place an order.

### C. Search service unavailable {#c-search-service-unavailable}

<a id="shared-5f10295f64b7"></a>

During checkout: validation false, checkout continues. During Japan normal place order: the configured search handler retries strictly if not validated, and failure propagates. The default normal pipeline does not contain this search handler, so do not assume the Japan retry occurs everywhere.

### D. Backorder item {#d-backorder-item}

<a id="shared-d88e5ac875f1"></a>

Allocation reports BO → guest option becomes TNA, backorder quantity zero, ETA removed → applicable inventory/modification handling asks the client to resolve availability. This transformation alone is not a substitute for tracing all fulfillment modifications.

### E. Guest disabled or registration requested {#e-guest-disabled-or-registration-requested}

<a id="shared-a4a2ff3b5e9e"></a>

Anonymous + no account process + explicit false guest flag → app GuestCheckoutException. Anonymous + account process → that gate is bypassed, and registration enrichment can run. A registration classification is excluded by the adapter guest predicate even though the biz helper can still classify the anonymous GUID as guest when enabled.

## 12. Source map and verification {#12-source-map-and-verification}

<a id="shared-3ad4a2330fbc"></a>

All snippets above are copied from the local source identified beside each excerpt. The local sibling repositories are required to follow those links; they are not bundled into the documentation site.

Additional source locations (repository-relative):

<a id="shared-754530587000"></a>

- App: `controllers/CheckoutController.java`, `controllers/PlaceOrderController.java`, `service/impl/PlaceOrderServiceImpl.java`.
- Biz: `handler/impl/checkout/CheckoutCreateDbStepHandler.java`, `service/checkout/impl/CheckoutCommonServiceImpl.java`, `service/user/UserStrategyFactory.java`.
- Biz conditions: `handler/impl/checkout/CheckoutAccountSearchStepHandler.java`, `service/validation/strategy/impl/DefaultValidationStrategy.java`, `validator/PaymentValidator.java`, `validator/PaymentMethodsValidator.java`.
- Data: `app/service/impl/CheckoutServiceImpl.java`, `app/repositories/dynamo/CheckoutRepository.java` beneath `com/mycheckout/commerce/checkoutdataservice`.
- Adapter: `consumer/CheckoutEventConsumer.java`, `service/impl/SalesOrderServiceImpl.java` beneath `com/mycheckout/commerce/checkoutadaptorservice`.
- Contract: `source/checkout-app-rest/v1/openapi-rest.yml` in this API repository.

<a id="shared-cbb67bc88ee1"></a>

Validation performed: static inspection of frontend/backend call sites, country handler lists, mapping predicates, database/event configuration and adapter consumer, plus bytecode inspection of the local built auth SNAPSHOT dependency. Backend account-number classification and anonymous header-to-profile mapping are verified for that artifact. No payment, order placement, deployment or live transaction was executed. Runtime values, upstream anonymous-ID creation/header injection, token issuance/signature validation, payment eligibility, storefront OTP/payment policy and final enterprise/warehouse processing remain open boundaries.

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
