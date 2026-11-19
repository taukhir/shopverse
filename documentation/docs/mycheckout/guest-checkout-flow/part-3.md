---
slug: /mycheckout/guest-checkout-flow/part-3
title: "mycheckout — Guest checkout: end-to-end flow — Part 3"
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

# mycheckout — Guest checkout: end-to-end flow — Part 3

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `guest-checkout-flow.md` |
| Source SHA256 | `6b8a6caf945ae7c3e81033809ca5bb26bff4624bba366a221eeefb191ddc345a` |
| Guide part | 3 of 6 |

[Part 1](/mycheckout/guest-checkout-flow/part-1) · [Part 2](/mycheckout/guest-checkout-flow/part-2) · [Part 3](/mycheckout/guest-checkout-flow/part-3) · [Part 4](/mycheckout/guest-checkout-flow/part-4) · [Part 5](/mycheckout/guest-checkout-flow/part-5) · [Part 6](/mycheckout/guest-checkout-flow/part-6)

## 4. Biz orchestration and guest detection {#4-biz-orchestration-and-guest-detection}

`CheckoutServiceImpl.createCheckout()` maps the request into a checkout, sets source `CREATE_CHECKOUT`, gets a country strategy and executes its handler list.

<a id="shared-234a32ddf430"></a>

Source: commerce-checkout-bizservice/source/app/src/main/java/com/mycheckout/commerce/checkoutbizservice/app/service/checkout/impl/CheckoutServiceImpl.java:214 (local reference: `/D:/BE Projects/checkout/checkout/commerce-checkout-bizservice/source/app/src/main/java/com/mycheckout/commerce/checkoutbizservice/app/service/checkout/impl/CheckoutServiceImpl.java:214`)

```java
  public Mono<CheckoutResponseBizDto> createCheckout(CreateCheckoutRequestBizDto checkoutRequest) {
    LoggerUtil.logDebug(log, CH_BIZ_CREATE_CHECKOUT_DEBUG, checkoutRequest);
    CheckoutBizDto checkout = checkoutRequestMapper.map(checkoutRequest);
    CheckoutCommonRequest request =
        CheckoutCommonRequest.builder().fulfillment(checkoutRequest.getFulfillmentDetail())
            .checkout(checkout).source(Source.CREATE_CHECKOUT)
            .paymentDetails(checkoutRequest.getPaymentDetails())
                .loyaltyPointsApplicationRequestBizDto(
                        getLoyaltyPointsApplicationRequestBizDto(checkoutRequest))
                .build();
    CheckoutStepHandlerStrategy strategy = stepHandlerStrategyFactoryProvider
        .forCheckout().getStrategy(TupleService.getTuples().getmycheckoutCountry());
    Mono<CheckoutCommonResponse> response = executor.buildAndExecute(
        strategy.getHandlers(CheckoutFlow.CREATE_CHECKOUT, request), request);

    return prepareResponse(response);
```

The shared guest predicate checks for a non-null GUID, not a non-blank string, and does not exclude registration:

<a id="shared-13dce4f8ca6d"></a>

Source: commerce-checkout-bizservice/source/app/src/main/java/com/mycheckout/commerce/checkoutbizservice/app/util/CheckoutUtil.java:653 (local reference: `/D:/BE Projects/checkout/checkout/commerce-checkout-bizservice/source/app/src/main/java/com/mycheckout/commerce/checkoutbizservice/app/util/CheckoutUtil.java:653`)

```java
  public boolean isGuestCheckout(CheckoutBizDto checkout) {
    if (Objects.isNull(checkout) || Objects.isNull(checkout.getUser())) {
      return false;
    }

    Config config = getMasterConfig();
    return Boolean.TRUE.equals(config.getEnableGuestCheckout())
        && isAnonymousUser(checkout.getUser());
  }
```

<a id="shared-633b2b66bd09"></a>

The default create pipeline orders these stages: user enrichment → product/segment stage → existing-account search → promotion preparation/rationing stage → fulfillment/account balance/delivery fee and SOP stages → modifications → tax → adjustments → database create. Handlers still apply their own applicability rules; listing a handler does not mean every request executes it. Japan additionally includes profile/sharebar, delivery-slot, AmPoints and handling-fee stages in its configured sequence.

Source: `DefaultCheckoutStepHandlerStrategy.getHandlersForCreateCheckout()` and `JapanCheckoutStepHandlerStrategy.getHandlers()`.

### Anonymous account enrichment {#anonymous-account-enrichment}

<a id="shared-cb5f5b6e247e"></a>

`CheckoutEnrichUsersStepHandler` resolves `UserStrategyFactory`, which selects a country-specific anonymous or logged-in strategy. Anonymous selection also considers SYSTEM/POS channel rules; GUID alone does not choose every strategy.

In `DefaultAnonymousUserServiceStrategy`:

<a id="shared-7df502cc8deb"></a>

1. If `accountProcess` exists, fetch and validate registration details and populate its user/account/address data.
2. Otherwise use anonymous enrichment.
3. If `enableDefaultAccountForGuest` is true, map the configured default account to ordering account, account and ship-to account, and set user account type.
4. For guest place-order/create-order or POS create-checkout, fetch default volume account if absent.

<a id="shared-9e399c53ff80"></a>

Source: commerce-checkout-bizservice/source/app/src/main/java/com/mycheckout/commerce/checkoutbizservice/app/service/user/impl/tenant/DefaultAnonymousUserServiceStrategy.java:210 (local reference: `/D:/BE Projects/checkout/checkout/commerce-checkout-bizservice/source/app/src/main/java/com/mycheckout/commerce/checkoutbizservice/app/service/user/impl/tenant/DefaultAnonymousUserServiceStrategy.java:210`)

```java
    if (Boolean.TRUE.equals(config.getEnableDefaultAccountForGuest())) {
      Account defaultAccount = config.getDefaultAccount();
      AccountBizDto account = accountMapper.map(defaultAccount);
      checkoutBizDto.getUser().setAccountType(AccountTypeBizDto.valueOf(
          defaultAccount.getBusinessNature()));
      checkoutBizDto.setOrderingAccount(accountMapper.mapToAccountFull(account));
      checkoutBizDto.setAccount(accountMapper.mapToAccountFull(account));
      checkoutBizDto.setShipToSalesAccount(account);
    }

    // Setting volume account for anonymous user, at time of Place-Order.
    if ((Source.PLACE_ORDER.equals(source)
            || Source.CREATE_ORDER.equals(source)
            || isPosCreateCheckout(source))
        && checkoutUtil.isGuestCheckout(checkoutBizDto)
        && Objects.isNull(checkoutBizDto.getVolumeAccount())) {
```

<a id="shared-85db143e2f07"></a>

The default-volume-account lookup catches errors with `Mono.empty()`. Its subsequent `.map(...)` therefore emits no checkout when that fallback is empty; it is not a guaranteed successful continuation with a null volume account. Actual impact depends on the surrounding pipeline and runtime failure.

## 5. Existing-email/mobile checks {#5-existing-emailmobile-checks}

<a id="shared-276ac2be1299"></a>

`CheckoutAccountSearchStepHandler.isApplicable()` first requires the shared guest predicate. Without an update-user payload, both saved email and mobile must be non-blank and the base applicability check must pass. With an update-user payload, the actual condition accepts either non-blank contact or a difference from the saved values; it is broader than a strict "only when changed" test.

<a id="shared-4e551e575153"></a>

The handler searches ACTIVE, non-EMPLOYEE accounts using email/phone. It separately looks up identity by email when non-blank and not an internal `@mycheckout.com` email. The internal-domain exclusion applies to identity lookup, not all account searches.

<a id="shared-39caf8eae6d5"></a>

Source: commerce-checkout-bizservice/source/app/src/main/java/com/mycheckout/commerce/checkoutbizservice/app/service/accountsearch/client/AccountSearchDataClient.java:124 (local reference: `/D:/BE Projects/checkout/checkout/commerce-checkout-bizservice/source/app/src/main/java/com/mycheckout/commerce/checkoutbizservice/app/service/accountsearch/client/AccountSearchDataClient.java:124`)

```java
    if (StringUtils.isNotBlank(email)) {
      filter.append("emails.email=re='").append(email).append("'");
      LoggerUtil.logDebug(log, CH_BIZ_ACCOUNT_SEARCH_CLIENT_EMAIL_FILTER_DEBUG);
    }

    if (StringUtils.isNotBlank(phone)) {
      if (filter.length() > 0) {
        filter.append(", ");
      }
      filter.append("profile.phone==").append(phone);
      LoggerUtil.logDebug(log, CH_BIZ_ACCOUNT_SEARCH_CLIENT_PHONE_FILTER_DEBUG);
    }

    if (filter.length() > 0) {
      filter.insert(0, "accountType=out=(EMPLOYEE); status==ACTIVE; (");
      filter.append(")");
```

<a id="shared-ff1f518d0acd"></a>

| Stage/result | Behaviour |
|---|---|
| Checkout search succeeds | Set `isExistingUserValidated=true`; matched existing users create a modification. |
| Email match | Add `ERROR_EMAIL_EXISTS`. |
| Phone match | Add `ERROR_CONTACT_EXISTS`. |
| Checkout search throws | Set validation flag false and continue with checkout. |
| Place-order handler runs and validation flag is true | Skip repeated search. |
| Place-order handler runs and validation flag is false | Use strict operations; propagate errors on failure. |

<a id="shared-655c19002356"></a>

An account-search result containing values counts as an existing user even if the helper does not identify an exact matching field for its error-code list. Identity presence also counts as an existing user.

<a id="shared-115db2df4d0c"></a>

Country qualification matters: Japan's normal place-order strategy includes account search; the default normal place-order strategy does not. Japan also includes it in GET and UPDATE checkout. The default create pipeline includes it. Do not generalize one country's sequence to all countries.

<a id="shared-f821c5c1edb5"></a>

Source: commerce-checkout-bizservice/source/app/src/main/java/com/mycheckout/commerce/checkoutbizservice/app/handler/impl/checkout/CheckoutAccountSearchStepHandler.java:90 (local reference: `/D:/BE Projects/checkout/checkout/commerce-checkout-bizservice/source/app/src/main/java/com/mycheckout/commerce/checkoutbizservice/app/handler/impl/checkout/CheckoutAccountSearchStepHandler.java:90`)

```java
    boolean isPlaceOrder =
        Source.PLACE_ORDER.equals(request.getSource());

    // Checkout flow -> always validate
    if (!isPlaceOrder) {
      LoggerUtil.logInfo(log, CH_BIZ_ACCOUNT_SEARCH_VALIDATION_START_INFO,
          checkout.getCheckoutId());
      return performValidation(checkout, false);
    }

    // Place order -> skip only if validation already completed
    if (Boolean.TRUE.equals(user.getIsExistingUserValidated())) {
      LoggerUtil.logInfo(log, CH_BIZ_ACCOUNT_SEARCH_VALIDATION_SKIPPED_INFO);
      return Mono.just(
          CheckoutCommonResponse.builder()
              .checkout(checkout)
              .build());
    }

    // Retry validation
    LoggerUtil.logInfo(log, CH_BIZ_ACCOUNT_SEARCH_VALIDATION_RETRY_INFO,
        checkout.getCheckoutId());
    return performValidation(checkout, true);
```

## 6. Products, promotions, inventory and fulfillment {#6-products-promotions-inventory-and-fulfillment}

<a id="shared-f848f1371922"></a>

Product enrichment remains in both create and normal place order. Promotion preparation also remains: segment skipping does not disable promotions. The promotion request populator sets `GUEST` for an anonymous user in its anonymous branch when `accountProcess` is null.

<a id="shared-0fbbf7ee4295"></a>

Source: commerce-checkout-bizservice/source/app/src/main/java/com/mycheckout/commerce/checkoutbizservice/app/service/promotion/populator/impl/DefaultPromotionRequestBasicPopulator.java:106 (local reference: `/D:/BE Projects/checkout/checkout/commerce-checkout-bizservice/source/app/src/main/java/com/mycheckout/commerce/checkoutbizservice/app/service/promotion/populator/impl/DefaultPromotionRequestBasicPopulator.java:106`)

```java
    } else {
      // Populating GUEST for anonymous user,
      // where user.id is null, but user.guid is present.
      // Removing GUEST userType for a Registration Order.
      if (Objects.nonNull(user.getGuid())
              && Objects.isNull(checkout.getAccountProcess())) {
        target.setUserType(GUEST.getValue());
      }
    }
```

Promotion result application also selects `GUEST` master data for guest checkouts:

<a id="shared-54dde684ff22"></a>

Source: commerce-checkout-bizservice/source/app/src/main/java/com/mycheckout/commerce/checkoutbizservice/app/service/promotion/service/impl/DefaultPromotionEvaluationServiceImpl.java:301 (local reference: `/D:/BE Projects/checkout/checkout/commerce-checkout-bizservice/source/app/src/main/java/com/mycheckout/commerce/checkoutbizservice/app/service/promotion/service/impl/DefaultPromotionEvaluationServiceImpl.java:301`)

```java
      String loggedInUserType = checkoutUtil.isGuestCheckout(checkoutBizDto)
          ? GUEST_ACCOUNT_TYPE : checkoutBizDto.getUser().getAccountType().getValue();
      MasterDataDto masterDataDto = getMasterData(checkoutBizDto.getCurrencyIsoCode(),
          loggedInUserType);
      promotionResultService.applyPromotionResults(promotionResponseDto, abstractOrderDto,
          masterDataDto);
```

Guest-specific handler changes:

<a id="shared-2bed694f7606"></a>

| Handler/check | Condition and effect |
|---|---|
| Segment population | Guest → skip. |
| Rationing | Guest → skip; JP booking is another skip condition. |
| Credit/voucher account balance | Guest → skip; other independent config/auto-renewal conditions exist. |
| AmPoints population | Guest AND restricted Japan client → skip; not a blanket prohibition on every AmPoints calculation. |
| Account field validation | Guest skips ordering party/account and order-for account requirements; volume account remains required and validated. |
| Guest fulfillment address update | If address exists and contact ID is blank, generate contact UUID. |

`InventoryServiceImpl` calls fulfillment data service for fulfillment options and maps allocation groups. Guest options are then adjusted:

<a id="shared-bea0f93d6c05"></a>

Source: commerce-checkout-bizservice/source/app/src/main/java/com/mycheckout/commerce/checkoutbizservice/app/service/fulfillment/impl/InventoryServiceImpl.java:185 (local reference: `/D:/BE Projects/checkout/checkout/commerce-checkout-bizservice/source/app/src/main/java/com/mycheckout/commerce/checkoutbizservice/app/service/fulfillment/impl/InventoryServiceImpl.java:185`)

```java
  private void handleGuestCheckoutBackorder(CheckoutBizDto checkout,
                                            FulfillmentOptionBizDto fulfillmentOption) {
    // Check if it's a guest checkout
    if (!checkoutUtil.isGuestCheckout(checkout)) {
      return;
    }

    // Process all allocation groups and their entries
    if (Objects.nonNull(fulfillmentOption)
        && !CollectionUtils.isEmpty(fulfillmentOption.getAllocationGroups())) {
      fulfillmentOption.getAllocationGroups().forEach(allocationGroup -> {
        if (!CollectionUtils.isEmpty(allocationGroup.getEntries())) {
          allocationGroup.getEntries().forEach(entry -> {
            if (DispositionStatusDataDto.BO.name().equalsIgnoreCase(entry.getDispositionStatus())) {
              entry.setDispositionStatus(DispositionStatusDataDto.TNA.name());
              entry.setBackorderableQuantity(0);
              entry.setBackorderEta(null);
            }
          });
        }
      });
    }
  }
```

Example allocation entry:

```json
{
  "before": {"dispositionStatus": "BO", "backorderableQuantity": 2, "backorderEta": "example ETA"},
  "after": {"dispositionStatus": "TNA", "backorderableQuantity": 0, "backorderEta": null}
}
```

<a id="shared-1ee0efe95bb6"></a>

ATS/allocation is conditional. `InventoryConfigDecisionService` delegates to a strategy using inventory configuration and channel. When bypassed, fulfillment gets default details and inventory validation returns early. Allocation also needs applicable fulfillment/address information. Availability checking and inventory reservation are separate steps; this checkout trace reaches the fulfillment-service contract, not its internal stock calculations.

<a id="shared-f0c7460bfa5e"></a>

Source: commerce-checkout-bizservice/source/app/src/main/java/com/mycheckout/commerce/checkoutbizservice/app/service/fulfillment/impl/InventoryServiceImpl.java:305 (local reference: `/D:/BE Projects/checkout/checkout/commerce-checkout-bizservice/source/app/src/main/java/com/mycheckout/commerce/checkoutbizservice/app/service/fulfillment/impl/InventoryServiceImpl.java:305`)

```java
  @Override
  public Mono<CheckoutBizDto> populateFulfillment(CheckoutBizDto checkout,
                                                  Boolean isAllocationRequired, Source source) {
    // Check if ATS validation should be bypassed
    if (inventoryConfigDecisionService.shouldBypassInventoryCheck(checkout)) {
      log.info("ATS allocation bypassed for checkout: {}", checkout.getCheckoutId());
      metricsUtil.recordCount(ATS_VALIDATION_SKIPPED);
      populateDefaultDetailsForFulfillment(checkout);
      return Mono.just(checkout);
    }
```

## 7. Updates, payment selection and OTP {#7-updates-payment-selection-and-otp}

Relevant app routes, before any deployment-specific gateway prefix:

<a id="shared-e44cea175ff3"></a>

| Operation | Route |
|---|---|
| Create checkout | `POST /v1/checkouts` |
| Read/update checkout | `/v1/checkouts/{checkoutId}` |
| Add/update fulfillment | `/v1/checkouts/{checkoutId}/fulfillments[/{fulfillmentId}]` |
| Add selected payment | `POST /v1/checkouts/{checkoutId}/payments` |
| Place order | `POST /v1/checkouts/{checkoutId}/place-order` |
| Create/reuse guest challenge | `/v1/checkouts/challenges` |

<a id="shared-b4adce673437"></a>

Checkout changes are mapped in app, processed through applicable biz logic and persisted through data clients. Place order reads saved checkout again, so contact/payment/fulfillment changes must be represented in saved checkout or mapped from the supported place-order request.

<a id="shared-057e7b5e9f5d"></a>

The app's guest challenge endpoint generates context `guest-checkout-{anonymousId}`. With no challenge ID, create a challenge. With an ID, fetch it and reuse only if context and mode value match case-insensitively; otherwise create a new challenge. This is creation/reuse logic, not proof that OTP is verified before ordering. The inspected create/place-order path did not demonstrate mandatory guest OTP verification. Address OTP verification exists separately.

<a id="shared-45059c636d27"></a>

Source: commerce-checkout-appservice/source/app/src/main/java/com/mycheckout/commerce/checkoutservice/app/service/impl/CheckoutServiceImpl.java:240 (local reference: `/D:/BE Projects/checkout/checkout/commerce-checkout-appservice/source/app/src/main/java/com/mycheckout/commerce/checkoutservice/app/service/impl/CheckoutServiceImpl.java:240`)

```java
    if (StringUtils.isBlank(challengeId)) {
      return createNewChallenge(createChallengeRequestAppDto, contextValue);
    }

    return identityOtpDataClient.getChallenge(challengeId)
        .flatMap(existingChallenge -> {
          boolean isContextMatched = contextValue.equalsIgnoreCase(existingChallenge.getContext());
          boolean isModeMatched = modeValueToMatch != null
              && modeValueToMatch.equalsIgnoreCase(existingChallenge.getModeValue());

          if (isContextMatched && isModeMatched) {
            return Uni.createFrom().item(checkoutMapper.map(existingChallenge));
          }

          return createNewChallenge(createChallengeRequestAppDto, contextValue);
        });
```

### COD and online-only payment {#cod-and-online-only-payment}

<a id="shared-2f1fb2d8e959"></a>

The inspected checkout `PaymentValidator` validates payment request presence/version. `PaymentMethodsValidator` checks configured restrictions for shipping-address type and backorder and converts recognized payment-service errors into modifications. Neither demonstrates an explicit `isGuestCheckout && COD` rejection. `PaymentMethodEnum` includes COD, which establishes a known code, not guest eligibility.

<a id="shared-d5da3483bcf7"></a>

Therefore: **do not document "guest must pay online" as an enforced checkout rule from this evidence.** Whether COD is offered or accepted still needs the consuming storefront, payment-service rules and deployed country configuration. The available webcomponents guest helper identifies an anonymous session; its presence does not prove the hosting storefront's payment-selection policy.

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
