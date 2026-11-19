---
slug: /mycheckout/fulfillment-docs/fulfillment-api-catalog/part-3
title: "mycheckout — Fulfillment API catalog — Part 3"
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

# mycheckout — Fulfillment API catalog — Part 3

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `fulfillment docs/FULFILLMENT-API-CATALOG.md` |
| Source SHA256 | `eb6a6fc456ee5016287ab2005921f7dd0b8d21560544141a64b0e088bfeebfcb` |
| Guide part | 3 of 5 |

[Part 1](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1) · [Part 2](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-2) · [Part 3](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-3) · [Part 4](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-4) · [Part 5](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-5)

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-55de17bbbbf9).

Request body: none declared. Required: False.

| Declared response | Body schema |
|---|---|
| 200 | PostLocationCollection |
| 401 | Error |
| 500 | Error |

### POST /post-locations {#post-post-locations}

Create a PostLocation

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-55de17bbbbf9).

Request body: application/json: `PostLocation`. Required: True.

| Declared response | Body schema |
|---|---|
| 201 | PostLocation |
| 401 | Error |
| 500 | Error |

### GET /post-locations/{postLocationId} {#get-post-locationspostlocationid}

Get a PostLocation

<a id="shared-fc177bab2a6d"></a>

| Input | Location | Required | Type |
|---|---|---|---|
| postLocationId | path | True | string |
| Accept-Language | header | True | string |
| X-mycheckout-Country | header | True | string |
| X-mycheckout-Tenant | header | True | string |
| X-mycheckout-Vertical | header | False | string |
| X-mycheckout-Channel | header | True | string |

Request body: none declared. Required: False.

| Declared response | Body schema |
|---|---|
| 200 | PostLocation |
| 401 | Error |
| 404 | Error |
| 500 | Error |

### PUT /post-locations/{postLocationId} {#put-post-locationspostlocationid}

Update a PostLocation

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-3#shared-fc177bab2a6d).

Request body: application/json: `PostLocation`. Required: True.

| Declared response | Body schema |
|---|---|
| 202 | PostLocation |
| 401 | Error |
| 404 | Error |
| 500 | Error |

### DELETE /post-locations/{postLocationId} {#delete-post-locationspostlocationid}

Delete a PostLocation

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-3#shared-fc177bab2a6d).

Request body: none declared. Required: False.

| Declared response | Body schema |
|---|---|
| 204 | Successful response. |
| 401 | Error |
| 404 | Error |
| 500 | Error |

### POST /allocations {#post-allocations}

Evaluate Allocations

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-55de17bbbbf9).

Request body: application/json: `array<Allocation>`. Required: True.

| Declared response | Body schema |
|---|---|
| 200 | array<AllocationOption> |
| 401 | Error |
| 500 | Error |

### POST /delivery-fees {#post-delivery-fees-1}

List all DeliveryFees

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-55de17bbbbf9).

Request body: application/json: `array<DeliveryFeeCalculationRequest>`. Required: True.

| Declared response | Body schema |
|---|---|
| 200 | ShippingFeeDetails |
| 401 | Error |
| 500 | Error |

### POST /service-locations/{serviceLocationId}/pickup-availability {#post-service-locationsservicelocationidpickup-availability}

Evaluate and Book space temporarily if available

<a id="shared-63c132a9e52e"></a>

| Input | Location | Required | Type |
|---|---|---|---|
| serviceLocationId | path | True | string |
| Accept-Language | header | True | string |
| X-mycheckout-Country | header | True | string |
| X-mycheckout-Tenant | header | True | string |
| X-mycheckout-Vertical | header | False | string |
| X-mycheckout-Channel | header | True | string |

Request body: application/json: `array<PickupLocationAvailabilityRequest>`. Required: True.

| Declared response | Body schema |
|---|---|
| 200 | PickupLocationAvailabilityResponse |
| 401 | Error |
| 500 | Error |

### POST /service-locations/{serviceLocationId}/pickup-reservations {#post-service-locationsservicelocationidpickup-reservations}

Reserves space

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-3#shared-63c132a9e52e).

Request body: application/json: `PickupLocationReservationRequest`. Required: True.

| Declared response | Body schema |
|---|---|
| 204 | Successful response. |
| 401 | Error |
| 500 | Error |

### POST /reservations {#post-reservations}

Create a Reservation

Request body: application/json: `Reservation`. Required: True.

| Declared response | Body schema |
|---|---|
| 201 | Reservation |
| 401 | Error |
| 500 | Error |

### DELETE /reservations/{reservationId} {#delete-reservationsreservationid}

Delete a Reservation

<a id="shared-8cce29b65246"></a>

| Input | Location | Required | Type |
|---|---|---|---|
| reservationId | path | True | string |
| Accept-Language | header | True | string |
| X-mycheckout-Country | header | True | string |
| X-mycheckout-Tenant | header | True | string |
| X-mycheckout-Vertical | header | False | string |
| X-mycheckout-Channel | header | True | string |

Request body: none declared. Required: False.

| Declared response | Body schema |
|---|---|
| 204 | Successful response. |
| 401 | Error |
| 404 | Error |
| 500 | Error |

### GET /service-locations {#get-service-locations-1}

List All servicelocations

<a id="shared-5df2e62d9de1"></a>

| Input | Location | Required | Type |
|---|---|---|---|
| Accept-Language | header | True | string |
| X-mycheckout-Country | header | True | string |
| X-mycheckout-Tenant | header | True | string |
| X-mycheckout-Vertical | header | False | string |
| X-mycheckout-Channel | header | True | string |
| lastEvaluatedKey | query | False | string |
| limit | query | False | integer |
| fulfillmentType | query | False | string |
| postCode | query | False | string |
| latitude | query | False | string |
| longitude | query | False | string |
| radiusInMiles | query | False | string |
| searchText | query | False | string |

Request body: none declared. Required: False.

| Declared response | Body schema |
|---|---|
| 200 | ServiceLocationCollection |
| 401 | Error |
| 500 | Error |

### POST /service-locations {#post-service-locations}

Create a ServiceLocation

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-55de17bbbbf9).

Request body: application/json: `ServiceLocation`. Required: True.

| Declared response | Body schema |
|---|---|
| 201 | ServiceLocation |
| 401 | Error |
| 500 | Error |

### DELETE /service-locations {#delete-service-locations}

delete All servicelocations

<a id="shared-47f17e2b67f6"></a>

| Input | Location | Required | Type |
|---|---|---|---|
| Accept-Language | header | True | string |
| X-mycheckout-Country | header | True | string |
| X-mycheckout-Tenant | header | True | string |
| X-mycheckout-Vertical | header | False | string |
| X-mycheckout-Channel | header | True | string |
| fulfillmentType | query | True | string |
| postCode | query | False | string |

Request body: none declared. Required: False.

| Declared response | Body schema |
|---|---|
| 204 | Successful response. |
| 401 | Error |
| 404 | Error |
| 500 | Error |

### GET /service-locations/{serviceLocationId} {#get-service-locationsservicelocationid-1}

Get a ServiceLocation

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-8897073cc828).

Request body: none declared. Required: False.

| Declared response | Body schema |
|---|---|
| 200 | ServiceLocation |
| 401 | Error |
| 404 | Error |
| 500 | Error |

### PUT /service-locations/{serviceLocationId} {#put-service-locationsservicelocationid}

Update a ServiceLocation

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-8897073cc828).

Request body: application/json: `ServiceLocation`. Required: True.

| Declared response | Body schema |
|---|---|
| 202 | ServiceLocation |
| 401 | Error |
| 404 | Error |
| 500 | Error |

### DELETE /service-locations/{serviceLocationId} {#delete-service-locationsservicelocationid}

Delete a ServiceLocation

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-8897073cc828).

Request body: none declared. Required: False.

| Declared response | Body schema |
|---|---|
| 204 | Successful response. |
| 401 | Error |
| 404 | Error |
| 500 | Error |

### GET /warehouses {#get-warehouses-1}

List All warehouses

| Input | Location | Required | Type |
|---|---|---|---|
| defaultWarehouse | query | False | boolean |
| postCode | query | False | string |

Request body: none declared. Required: False.

| Declared response | Body schema |
|---|---|
| 200 | WarehouseCollection |
| 401 | Error |
| 500 | Error |

### GET /commands {#get-commands}

getCommands

<a id="shared-3fdf47b89560"></a>

| Input | Location | Required | Type |
|---|---|---|---|
| Accept-Language | header | True | string |
| X-mycheckout-Country | header | True | string |
| X-mycheckout-Tenant | header | True | string |
| X-mycheckout-Vertical | header | False | string |
| X-mycheckout-Channel | header | True | string |
| limit | query | False | integer |

Request body: none declared. Required: False.

| Declared response | Body schema |
|---|---|
| 202 | CommandCollection |
| 401 | Error |
| 404 | Error |
| 500 | Error |

### POST /commands {#post-commands}

Creates and Executes a command

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-55de17bbbbf9).

Request body: application/json: `CommandRequest`. Required: True.

| Declared response | Body schema |
|---|---|
| 202 | Command |
| 401 | Error |
| 404 | Error |
| 500 | Error |

### GET /commands/{commandId} {#get-commandscommandid}

Get a Command

<a id="shared-4fd8028d3bba"></a>

| Input | Location | Required | Type |
|---|---|---|---|
| commandId | path | True | string |
| Accept-Language | header | True | string |
| X-mycheckout-Country | header | True | string |
| X-mycheckout-Tenant | header | True | string |
| X-mycheckout-Vertical | header | False | string |
| X-mycheckout-Channel | header | True | string |

Request body: none declared. Required: False.

| Declared response | Body schema |
|---|---|
| 200 | Command |
| 401 | Error |
| 404 | Error |
| 500 | Error |

### POST /shipping-addresses {#post-shipping-addresses-1}

create a new ShippingAddress

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-5c6c92c10fa1).

Request body: application/json: `CreateShippingAddressRequest`. Required: True.

<a id="shared-82f9ba5b1b5c"></a>

| Declared response | Body schema |
|---|---|
| 201 | ShippingAddressResponse |
| 400 | ErrorResponse |
| 401 | ErrorResponse |
| 403 | ErrorResponse |
| 500 | Error |
| 409 | ErrorResponse |
| 422 | UnprocessableErrorResponse |

### GET /shipping-addresses {#get-shipping-addresses-1}

search Shipping Addresses based on query string parameters - ownerId, phone, email, address type

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-744c2f6db5e4).

Request body: none declared. Required: False.

<a id="shared-976e81da4164"></a>

| Declared response | Body schema |
|---|---|
| 200 | ShippingAddressesResponse |
| 400 | ErrorResponse |
| 401 | ErrorResponse |
| 403 | ErrorResponse |
| 404 | Error |
| 500 | Error |

### PUT /shipping-addresses/{id} {#put-shipping-addressesid-1}

update ShippingAddress details based on id

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-818b2d9729b3).

Request body: application/json: `UpdateShippingAddressRequest`. Required: True.

<a id="shared-f29621e36f5d"></a>

| Declared response | Body schema |
|---|---|
| 200 | ShippingAddressResponse |
| 400 | ErrorResponse |
| 401 | ErrorResponse |
| 403 | ErrorResponse |
| 404 | Error |
| 500 | Error |
| 409 | ErrorResponse |

### DELETE /shipping-addresses/{id} {#delete-shipping-addressesid-1}

delete ShippingAddress based on id

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-3f2fa192a8eb).

Request body: none declared. Required: False.

<a id="shared-0bf0d606bcda"></a>

| Declared response | Body schema |
|---|---|
| 200 | ShippingAddressDeleteResponse |
| 400 | ErrorResponse |
| 401 | ErrorResponse |
| 403 | ErrorResponse |
| 404 | Error |
| 500 | Error |

### GET /shipping-addresses/{id} {#get-shipping-addressesid-1}

get ShippingAddress details based on id

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-818b2d9729b3).

Request body: none declared. Required: False.

<a id="shared-6143852e7474"></a>

| Declared response | Body schema |
|---|---|
| 200 | ShippingAddressResponse |
| 400 | ErrorResponse |
| 401 | ErrorResponse |
| 403 | ErrorResponse |
| 404 | Error |
| 500 | Error |

### PUT /pickup-location-checks/{checkKey} {#put-pickup-location-checkscheckkey}

update PickupLocationCheck for key

<a id="shared-d78f4d591367"></a>

| Input | Location | Required | Type |
|---|---|---|---|
| checkKey | path | True | string |
| Accept-Language | header | True | string |
| X-mycheckout-Country | header | True | string |
| X-mycheckout-Tenant | header | True | string |
| X-mycheckout-Channel | header | True | string |
| X-mycheckout-Vertical | header | False | string |

Request body: application/json: `PickupLocationCheckRequest`. Required: True.

<a id="shared-d6514f771281"></a>

| Declared response | Body schema |
|---|---|
| 200 | PickupLocationCheck |
| 400 | ErrorResponse |
| 401 | ErrorResponse |
| 403 | ErrorResponse |
| 404 | Error |
| 500 | Error |
| 409 | ErrorResponse |

### GET /pickup-location-checks/{checkKey} {#get-pickup-location-checkscheckkey}

get PickupLocationCheck based on key

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-3#shared-d78f4d591367).

Request body: none declared. Required: False.

| Declared response | Body schema |
|---|---|
| 200 | PickupLocationCheck |
| 400 | ErrorResponse |
| 401 | ErrorResponse |
| 403 | ErrorResponse |
| 404 | Error |
| 500 | Error |

### GET /delivery-slots/availability {#get-delivery-slotsavailability-1}

search Delivery Dates on the basis of postalCode

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-95ee2e1c063c).

Request body: none declared. Required: False.

<a id="shared-5b5300f3c039"></a>

| Declared response | Body schema |
|---|---|
| 200 | DeliverySlotResponse |
| 400 | ErrorResponse |
| 401 | ErrorResponse |
| 403 | ErrorResponse |
| 404 | Error |
| 500 | Error |

### GET /delivery-dates/{id} {#get-delivery-datesid-1}

search Delivery Date on the basis of id

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-81454d48f1c8).

Request body: none declared. Required: False.

<a id="shared-7dc778b0430e"></a>

| Declared response | Body schema |
|---|---|
| 200 | DeliveryDateResponse |
| 400 | ErrorResponse |
| 401 | ErrorResponse |
| 403 | ErrorResponse |
| 404 | Error |
| 500 | Error |

### DELETE /delivery-dates/{id} {#delete-delivery-datesid-1}

delete Delivery Date on the basis of id

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-81454d48f1c8).

Request body: none declared. Required: False.

<a id="shared-817d3c147273"></a>

| Declared response | Body schema |
|---|---|
| 204 | Successful response. |
| 400 | ErrorResponse |
| 401 | ErrorResponse |
| 403 | ErrorResponse |
| 404 | Error |
| 500 | Error |

### PUT /delivery-dates/{id} {#put-delivery-datesid-1}

update Delivery Date on the basis of id

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-81454d48f1c8).

Request body: application/json: `UpdateDeliveryDateRequest`. Required: True.

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-3#shared-7dc778b0430e).

### POST /delivery-dates {#post-delivery-dates-1}

create Delivery Date on the basis of id

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-5c6c92c10fa1).

Request body: application/json: `DeliveryDateRequest`. Required: True.

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-3#shared-7dc778b0430e).

### GET /postalcode-serviceabilities/{id} {#get-postalcode-serviceabilitiesid-1}

search PostalCode Serviceability on the basis of id

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-81454d48f1c8).

Request body: none declared. Required: False.

<a id="shared-ddda293cab69"></a>

| Declared response | Body schema |
|---|---|
| 200 | PostalCodeServiceabilityResponse |
| 400 | ErrorResponse |
| 401 | ErrorResponse |
| 403 | ErrorResponse |
| 404 | Error |
| 500 | Error |

### DELETE /postalcode-serviceabilities/{id} {#delete-postalcode-serviceabilitiesid-1}

delete PostalCode Serviceability on the basis of id

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-81454d48f1c8).

Request body: none declared. Required: False.

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-3#shared-817d3c147273).

### PUT /postalcode-serviceabilities/{id} {#put-postalcode-serviceabilitiesid-1}

search PostalCode Serviceability on the basis of id

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-81454d48f1c8).

Request body: application/json: `UpdatePostalCodeServiceabilityRequest`. Required: True.

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-3#shared-ddda293cab69).

### POST /postalcode-serviceabilities {#post-postalcode-serviceabilities-1}

create PostalCode Serviceability on the basis of id

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-5c6c92c10fa1).

Request body: application/json: `PostalCodeServiceabilityRequest`. Required: True.

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-3#shared-ddda293cab69).

### GET /postalcode-serviceabilities {#get-postalcode-serviceabilities-1}

search PostalCode Serviceability on the basis of postalCode

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-665ed498b5c8).

Request body: none declared. Required: False.

<a id="shared-7fbe698b9892"></a>

| Declared response | Body schema |
|---|---|
| 200 | PostalCodeServiceabilityListResponse |
| 400 | ErrorResponse |
| 401 | ErrorResponse |
| 403 | ErrorResponse |
| 404 | Error |
| 500 | Error |

### POST /stock-levels {#post-stock-levels-1}

create Stock Level

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-625914900a47).

Request body: application/json: `StockLevelTransactionRequest`. Required: True.

<a id="shared-64faa5b368e0"></a>

| Declared response | Body schema |
|---|---|
| 200 | StockLevelTransactionResponse |
| 400 | ErrorResponse |
| 401 | ErrorResponse |
| 403 | ErrorResponse |
| 500 | Error |
| 409 | ErrorResponse |

### GET /stock-levels {#get-stock-levels-1}

get Stock Level

<a id="shared-f64a29e19d90"></a>

| Input | Location | Required | Type |
|---|---|---|---|
| itemCode | query | False | string |
| warehouseCode | query | False | string |
| stockLevelStatus | query | False | string |
| page | query | False | integer |
| size | query | False | integer |
| Accept-Language | header | True | string |
| X-mycheckout-Country | header | True | string |
| X-mycheckout-Tenant | header | True | string |
| X-mycheckout-Channel | header | True | string |
| X-mycheckout-Vertical | header | False | string |

Request body: none declared. Required: False.

<a id="shared-46666ab3d33c"></a>

| Declared response | Body schema |
|---|---|
| 200 | StockLevelsListingResponse |
| 400 | ErrorResponse |
| 401 | ErrorResponse |
| 403 | ErrorResponse |
| 404 | Error |
| 500 | Error |
| 409 | ErrorResponse |

### GET /stock-levels/detail {#get-stock-levelsdetail-1}

get Stock Level detail

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-2#shared-566e88ffef31).

Request body: none declared. Required: False.

<a id="shared-683f9caf573d"></a>

| Declared response | Body schema |
|---|---|
| 200 | StockLevelsDetailResponse |
| 400 | ErrorResponse |
| 401 | ErrorResponse |
| 403 | ErrorResponse |
| 404 | Error |
| 500 | Error |
| 409 | ErrorResponse |

### POST /stock-levels/batch {#post-stock-levelsbatch-1}

batch create Stock Level

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-625914900a47).

Request body: application/json: `StockLevelsBatchTransactionRequest`. Required: True.

<a id="shared-91ae1c5a832f"></a>

| Declared response | Body schema |
|---|---|
| 200 | StockLevelsBatchTransactionResponse |
| 400 | ErrorResponse |
| 401 | ErrorResponse |
| 403 | ErrorResponse |
| 500 | Error |
| 409 | ErrorResponse |

### GET /stock-levels/audit {#get-stock-levelsaudit-1}

get Stock Level audit

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-2#shared-a03b231f9ccd).

Request body: none declared. Required: False.

<a id="shared-5d1b2b57ea83"></a>

| Declared response | Body schema |
|---|---|
| 200 | StockLevelTransactionsAuditResponse |
| 400 | ErrorResponse |
| 401 | ErrorResponse |
| 403 | ErrorResponse |
| 404 | Error |
| 500 | Error |
| 409 | ErrorResponse |

### Schema inventory {#schema-inventory-1}

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-2#shared-76d33ab49807).

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
