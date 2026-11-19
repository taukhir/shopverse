---
slug: /mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1
title: "mycheckout — Fulfillment API catalog — Part 1"
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

# mycheckout — Fulfillment API catalog — Part 1

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `fulfillment docs/FULFILLMENT-API-CATALOG.md` |
| Source SHA256 | `eb6a6fc456ee5016287ab2005921f7dd0b8d21560544141a64b0e088bfeebfcb` |
| Guide part | 1 of 5 |

[Part 1](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1) · [Part 2](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-2) · [Part 3](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-3) · [Part 4](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-4) · [Part 5](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-5)

## Fulfillment API catalog {#fulfillment-api-catalog}

<a id="shared-94efaab7e416"></a>

Generated from local contracts and concrete controller signatures on 2026-10-26. Run `docs/tools/build_fulfillment_catalog.py` to rebuild. Controller matching uses case-insensitive operationId/method names; an unmatched operation is a contract/implementation review item, not proof a deployed route is absent. Inherited/generated interfaces and gateway policy must be inspected separately. Response codes below are declared contract codes, not observed runtime outcomes.

Base paths: appservice `/comfulfillmentas/v1`, dataservice `/comfulfillmentds/v1` (HTTP root + controller version path). Contract paths below omit these prefixes.

## appservice: 37 operations {#appservice-37-operations}

<a id="shared-b1209f69d198"></a>

Contract: openapi-rest.yml (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-api/source/fulfillment-app-rest/v1/openapi-rest.yml:1`). 82 component schemas.

<a id="shared-e6842663c285"></a>

| Method/path | Operation | Controller match |
|---|---|---|
| `POST /cart-pickup-locations` | `evaluateCartPickupLocations` | CartPickupLocationsController.evaluateCartPickupLocations (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-appservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentappservice/app/controllers/CartPickupLocationsController.java:32`) |
| `GET /fulfillment-types` | `getfulfillmenttypes` | FulfillmentTypesController.getfulfillmenttypes (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-appservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentappservice/app/controllers/FulfillmentTypesController.java:29`) |
| `GET /service-fees` | `getservicefees` | ServiceFeesController.getservicefees (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-appservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentappservice/app/controllers/ServiceFeesController.java:34`) |
| `POST /service-fees` | `createServiceFee` | ServiceFeesController.createServiceFee (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-appservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentappservice/app/controllers/ServiceFeesController.java:48`) |
| `GET /service-fees/{serviceFeeId}` | `getServiceFee` | ServiceFeesController.getServiceFee (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-appservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentappservice/app/controllers/ServiceFeesController.java:42`) |
| `PUT /service-fees/{serviceFeeId}` | `updateServiceFee` | ServiceFeesController.updateServiceFee (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-appservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentappservice/app/controllers/ServiceFeesController.java:54`) |
| `DELETE /service-fees/{serviceFeeId}` | `deleteServiceFee` | ServiceFeesController.deleteServiceFee (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-appservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentappservice/app/controllers/ServiceFeesController.java:62`) |
| `GET /warehouses` | `getwarehouses` | WarehousesController.getwarehouses (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-appservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentappservice/app/controllers/WarehousesController.java:31`) |
| `GET /service-locations` | `getservicelocations` | ServiceLocationsController.getservicelocations (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-appservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentappservice/app/controllers/ServiceLocationsController.java:27`) |
| `GET /service-locations/{serviceLocationId}` | `getServiceLocation` | ServiceLocationsController.getServiceLocation (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-appservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentappservice/app/controllers/ServiceLocationsController.java:39`) |
| `POST /shipping-addresses` | `createShippingAddress` | ShippingAddressController.createShippingAddress (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-appservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentappservice/app/controllers/ShippingAddressController.java:51`) |
| `GET /shipping-addresses` | `searchShippingAddress` | ShippingAddressController.searchShippingAddress (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-appservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentappservice/app/controllers/ShippingAddressController.java:67`) |
| `PUT /shipping-addresses/{id}` | `updateShippingAddress` | ShippingAddressController.updateShippingAddress (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-appservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentappservice/app/controllers/ShippingAddressController.java:43`) |
| `DELETE /shipping-addresses/{id}` | `deleteShippingAddress` | ShippingAddressController.deleteShippingAddress (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-appservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentappservice/app/controllers/ShippingAddressController.java:78`) |
| `GET /shipping-addresses/{id}` | `getShippingAddress` | ShippingAddressController.getShippingAddress (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-appservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentappservice/app/controllers/ShippingAddressController.java:61`) |
| `POST /challenges` | `createChallenge` | ChallengeController.createChallenge (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-appservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentappservice/app/controllers/ChallengeController.java:39`) |
| `GET /districts` | `getDistrictsByStateAndLanguage` | **No concrete name match** |
| `GET /postalcodes` | `getPostalCodeBySubDistrictAndLanguage` | **No concrete name match** |
| `GET /states` | `getStateList` | **No concrete name match** |
| `GET /subdistricts` | `getSubDistrictByDistrictAndLanguage` | **No concrete name match** |
| `GET /daneCodes` | `getDaneCodeByCityAndState` | **No concrete name match** |
| `GET /delivery-slots/availability` | `getAvailableDeliverySlots` | DeliveryAvailabilitySlotController.getAvailableDeliverySlots (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-appservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentappservice/app/controllers/DeliveryAvailabilitySlotController.java:37`) |
| `GET /delivery-dates/{id}` | `getDeliveryDate` | **No concrete name match** |
| `DELETE /delivery-dates/{id}` | `deleteDeliveryDate` | **No concrete name match** |
| `PUT /delivery-dates/{id}` | `updateDeliveryDate` | **No concrete name match** |
| `POST /delivery-dates` | `createDeliveryDate` | **No concrete name match** |
| `GET /postalcode-serviceabilities/{id}` | `getPostalCodeServiceability` | **No concrete name match** |
| `DELETE /postalcode-serviceabilities/{id}` | `deletePostalCodeServiceability` | **No concrete name match** |
| `PUT /postalcode-serviceabilities/{id}` | `updatePostalCodeServiceability` | **No concrete name match** |
| `POST /postalcode-serviceabilities` | `createPostalCodeServiceability` | **No concrete name match** |
| `GET /postalcode-serviceabilities` | `getPostalCodeServiceabilityForPostalCode` | **No concrete name match** |
| `POST /stock-levels` | `createStockLevel` | StockLevelController.createStockLevel (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-appservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentappservice/app/controllers/StockLevelController.java:42`) |
| `GET /stock-levels` | `getStockLevel` | StockLevelController.getStockLevel (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-appservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentappservice/app/controllers/StockLevelController.java:51`) |
| `GET /stock-levels/detail` | `getStockLevelDetail` | StockLevelController.getStockLevelDetail (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-appservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentappservice/app/controllers/StockLevelController.java:63`) |
| `POST /stock-levels/batch` | `batchCreateStockLevels` | StockLevelController.batchCreateStockLevels (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-appservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentappservice/app/controllers/StockLevelController.java:34`) |
| `GET /stock-levels/audit` | `getStockLevelAudit` | StockLevelController.getStockLevelAudit (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-appservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentappservice/app/controllers/StockLevelController.java:78`) |
| `POST /delivery-fees` | `createDeliveryFee` | DeliveryFeesController.createDeliveryFee (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-appservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentappservice/app/controllers/DeliveryFeesController.java:30`) |

### POST /cart-pickup-locations {#post-cart-pickup-locations}

Evaluate pickup locations for cart

Request body: application/json: `CartPickupLocationRequest`. Required: True.

| Declared response | Body schema |
|---|---|
| 200 | CartPickupLocationResponse |
| 401 | ErrorResponse |
| 500 | ErrorResponse |

### GET /fulfillment-types {#get-fulfillment-types}

List All fulfillmenttypes

<a id="shared-08d32b2c4040"></a>

| Input | Location | Required | Type |
|---|---|---|---|
| fulfillmentTypeIds | query | False | array<string> |
| userType | query | False | UserType |
| orderType | query | False | OrderType |

Request body: none declared. Required: False.

| Declared response | Body schema |
|---|---|
| 200 | FulfillmentTypeCollection |
| 401 | ErrorResponse |
| 500 | ErrorResponse |

### GET /service-fees {#get-service-fees}

List All servicefees

<a id="shared-f238a6115070"></a>

| Input | Location | Required | Type |
|---|---|---|---|
| Accept-Language | header | True | string |
| X-mycheckout-Country | header | True | string |
| X-mycheckout-Tenant | header | True | string |
| X-mycheckout-Vertical | header | False | string |
| X-mycheckout-Channel | header | True | string |
| fulfillmentType | query | True | string |
| serviceLevel | query | True | string |

Request body: none declared. Required: False.

| Declared response | Body schema |
|---|---|
| 200 | ServiceFeeCollection |
| 401 | ErrorResponse |
| 500 | ErrorResponse |

### POST /service-fees {#post-service-fees}

Create a ServiceFee

<a id="shared-55de17bbbbf9"></a>

| Input | Location | Required | Type |
|---|---|---|---|
| Accept-Language | header | True | string |
| X-mycheckout-Country | header | True | string |
| X-mycheckout-Tenant | header | True | string |
| X-mycheckout-Vertical | header | False | string |
| X-mycheckout-Channel | header | True | string |

Request body: application/json: `ServiceFee`. Required: True.

| Declared response | Body schema |
|---|---|
| 201 | ServiceFee |
| 401 | ErrorResponse |
| 500 | ErrorResponse |

### GET /service-fees/{serviceFeeId} {#get-service-feesservicefeeid}

Get a ServiceFee

<a id="shared-1a0230e9a8df"></a>

| Input | Location | Required | Type |
|---|---|---|---|
| serviceFeeId | path | True | string |
| Accept-Language | header | True | string |
| X-mycheckout-Country | header | True | string |
| X-mycheckout-Tenant | header | True | string |
| X-mycheckout-Vertical | header | False | string |
| X-mycheckout-Channel | header | True | string |

Request body: none declared. Required: False.

| Declared response | Body schema |
|---|---|
| 200 | ServiceFee |
| 401 | ErrorResponse |
| 404 | ErrorResponse |
| 500 | ErrorResponse |

### PUT /service-fees/{serviceFeeId} {#put-service-feesservicefeeid}

Update a ServiceFee

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-1a0230e9a8df).

Request body: application/json: `ServiceFee`. Required: True.

| Declared response | Body schema |
|---|---|
| 202 | ServiceFee |
| 401 | ErrorResponse |
| 404 | ErrorResponse |
| 500 | ErrorResponse |

### DELETE /service-fees/{serviceFeeId} {#delete-service-feesservicefeeid}

Delete a ServiceFee

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-1a0230e9a8df).

Request body: none declared. Required: False.

| Declared response | Body schema |
|---|---|
| 204 | Successful response. |
| 401 | ErrorResponse |
| 404 | ErrorResponse |
| 500 | ErrorResponse |

### GET /warehouses {#get-warehouses}

List All warehouses

| Input | Location | Required | Type |
|---|---|---|---|
| defaultWarehouse | query | False | boolean |
| postCode | query | False | string |

Request body: none declared. Required: False.

| Declared response | Body schema |
|---|---|
| 200 | WarehouseCollection |
| 401 | ErrorResponse |
| 500 | ErrorResponse |

### GET /service-locations {#get-service-locations}

List All servicelocations

<a id="shared-b1f112a7bce8"></a>

| Input | Location | Required | Type |
|---|---|---|---|
| lastEvaluatedKey | query | False | string |
| searchText | query | False | string |
| limit | query | False | integer |
| fulfillmentType | query | False | string |
| postCode | query | False | string |
| latitude | query | False | string |
| longitude | query | False | string |
| radiusInMiles | query | False | number |

Request body: none declared. Required: False.

| Declared response | Body schema |
|---|---|
| 200 | ServiceLocationCollection |
| 401 | ErrorResponse |
| 500 | ErrorResponse |

### GET /service-locations/{serviceLocationId} {#get-service-locationsservicelocationid}

Get a ServiceLocation

<a id="shared-8897073cc828"></a>

| Input | Location | Required | Type |
|---|---|---|---|
| serviceLocationId | path | True | string |
| fulfillmentType | query | False | string |
| Accept-Language | header | True | string |
| X-mycheckout-Country | header | True | string |
| X-mycheckout-Tenant | header | True | string |
| X-mycheckout-Vertical | header | False | string |
| X-mycheckout-Channel | header | True | string |

Request body: none declared. Required: False.

| Declared response | Body schema |
|---|---|
| 200 | ServiceLocation |
| 401 | ErrorResponse |
| 404 | ErrorResponse |
| 500 | ErrorResponse |

### POST /shipping-addresses {#post-shipping-addresses}

create a new ShippingAddress

<a id="shared-5c6c92c10fa1"></a>

| Input | Location | Required | Type |
|---|---|---|---|
| Accept-Language | header | True | string |
| X-mycheckout-Country | header | True | string |
| X-mycheckout-Tenant | header | True | string |
| X-mycheckout-Channel | header | True | string |
| X-mycheckout-Vertical | header | False | string |
| X-Idempotency-Key | header | True | string |

Request body: application/json: `CreateShippingAddress`. Required: True.

<a id="shared-e6d328ada0f7"></a>

| Declared response | Body schema |
|---|---|
| 201 | ShippingAddressResponse |
| 400 | ErrorResponse |
| 401 | ErrorResponse |
| 403 | ErrorResponse |
| 500 | ErrorResponse |
| 409 | ErrorResponse |
| 422 | UnprocessableErrorResponse |

### GET /shipping-addresses {#get-shipping-addresses}

search Shipping Addresses based on query string parameters - ownerId, phone, email, address type

<a id="shared-744c2f6db5e4"></a>

| Input | Location | Required | Type |
|---|---|---|---|
| Accept-Language | header | True | string |
| X-mycheckout-Country | header | True | string |
| X-mycheckout-Tenant | header | True | string |
| X-mycheckout-Channel | header | True | string |
| X-mycheckout-Vertical | header | False | string |
| ownerId | query | True | string |
| accountNumber | query | False | integer |
| phone | query | False | string |
| email | query | False | string |
| contactType | query | False | AddressType |
| isDefault | query | False | boolean |
| country | query | False | string |

Request body: none declared. Required: False.

<a id="shared-78db6916a465"></a>

| Declared response | Body schema |
|---|---|
| 200 | ShippingAddressesResponse |
| 400 | ErrorResponse |
| 401 | ErrorResponse |
| 403 | ErrorResponse |
| 404 | ErrorResponse |
| 500 | ErrorResponse |

### PUT /shipping-addresses/{id} {#put-shipping-addressesid}

update ShippingAddress details based on id

<a id="shared-818b2d9729b3"></a>

| Input | Location | Required | Type |
|---|---|---|---|
| id | path | True | string |
| Accept-Language | header | True | string |
| X-mycheckout-Country | header | True | string |
| X-mycheckout-Tenant | header | True | string |
| X-mycheckout-Channel | header | True | string |
| X-mycheckout-Vertical | header | False | string |

Request body: application/json: `UpdateShippingAddressRequest`. Required: True.

<a id="shared-18e182154b11"></a>

| Declared response | Body schema |
|---|---|
| 200 | ShippingAddressResponse |
| 400 | ErrorResponse |
| 401 | ErrorResponse |
| 403 | ErrorResponse |
| 404 | ErrorResponse |
| 500 | ErrorResponse |
| 409 | ErrorResponse |

### DELETE /shipping-addresses/{id} {#delete-shipping-addressesid}

delete ShippingAddress based on id

<a id="shared-3f2fa192a8eb"></a>

| Input | Location | Required | Type |
|---|---|---|---|
| id | path | True | string |
| Accept-Language | header | True | string |
| X-mycheckout-Country | header | True | string |
| X-mycheckout-Tenant | header | True | string |
| X-mycheckout-Channel | header | True | string |
| X-mycheckout-Vertical | header | False | string |
| sourceApplication | query | False | string |

Request body: none declared. Required: False.

<a id="shared-eb4eab24b83b"></a>

| Declared response | Body schema |
|---|---|
| 200 | ShippingAddressDeleteResponse |
| 400 | ErrorResponse |
| 401 | ErrorResponse |
| 403 | ErrorResponse |
| 404 | ErrorResponse |
| 500 | ErrorResponse |

### GET /shipping-addresses/{id} {#get-shipping-addressesid}

get ShippingAddress details based on id

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-818b2d9729b3).

Request body: none declared. Required: False.

<a id="shared-a4bd470548e3"></a>

| Declared response | Body schema |
|---|---|
| 200 | ShippingAddressResponse |
| 400 | ErrorResponse |
| 401 | ErrorResponse |
| 403 | ErrorResponse |
| 404 | ErrorResponse |
| 500 | ErrorResponse |

### POST /challenges {#post-challenges}

Create challenge id.

<a id="shared-625914900a47"></a>

| Input | Location | Required | Type |
|---|---|---|---|
| Accept-Language | header | True | string |
| X-mycheckout-Country | header | True | string |
| X-mycheckout-Tenant | header | True | string |
| X-mycheckout-Channel | header | True | string |
| X-mycheckout-Vertical | header | False | string |

Request body: application/json: `CreateChallengeRequest`. Required: True.

<a id="shared-0315614f7674"></a>

| Declared response | Body schema |
|---|---|
| 200 | CreateChallengeResponse |
| 400 | ErrorResponse |
| 401 | ErrorResponse |
| 403 | ErrorResponse |
| 404 | ErrorResponse |
| 500 | ErrorResponse |
| 409 | ErrorResponse |

### GET /districts {#get-districts}

getDistrictsByStateAndLanguage

<a id="shared-aeec5c125d59"></a>

| Input | Location | Required | Type |
|---|---|---|---|
| language | query | True | string |
| province | query | False | string |
| state | query | False | string |
| Accept-Language | header | True | string |
| X-mycheckout-Country | header | True | string |
| X-mycheckout-Tenant | header | True | string |
| X-mycheckout-Channel | header | True | string |
| X-mycheckout-Vertical | header | False | string |

Request body: none declared. Required: False.

| Declared response | Body schema |
|---|---|
| 200 | array<string> |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |

### GET /postalcodes {#get-postalcodes}

getPostalCodeBySubDistrictAndLanguage

<a id="shared-4ec278208b54"></a>

| Input | Location | Required | Type |
|---|---|---|---|
| language | query | True | string |
| province | query | False | string |
| state | query | False | string |
| district | query | True | string |
| subDistrict | query | True | string |
| Accept-Language | header | True | string |
| X-mycheckout-Country | header | True | string |
| X-mycheckout-Tenant | header | True | string |
| X-mycheckout-Channel | header | True | string |
| X-mycheckout-Vertical | header | False | string |

Request body: none declared. Required: False.

| Declared response | Body schema |
|---|---|
| 200 | array<string> |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |

### GET /states {#get-states}

getStateList

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-625914900a47).

Request body: none declared. Required: False.

| Declared response | Body schema |
|---|---|
| 200 | array<StateData> |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |

### GET /subdistricts {#get-subdistricts}

getSubDistrictByDistrictAndLanguage

<a id="shared-74b933b1aac5"></a>

| Input | Location | Required | Type |
|---|---|---|---|
| language | query | True | string |
| province | query | False | string |
| state | query | False | string |
| district | query | True | string |
| Accept-Language | header | True | string |
| X-mycheckout-Country | header | True | string |
| X-mycheckout-Tenant | header | True | string |
| X-mycheckout-Channel | header | True | string |
| X-mycheckout-Vertical | header | False | string |

Request body: none declared. Required: False.

| Declared response | Body schema |
|---|---|
| 200 | array<string> |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |

### GET /daneCodes {#get-danecodes}

getDaneCodeByCityAndState

<a id="shared-110f90119b79"></a>

| Input | Location | Required | Type |
|---|---|---|---|
| city | query | True | string |
| state | query | True | string |
| Accept-Language | header | True | string |
| X-mycheckout-Country | header | True | string |
| X-mycheckout-Tenant | header | True | string |
| X-mycheckout-Channel | header | True | string |
| X-mycheckout-Vertical | header | False | string |

Request body: none declared. Required: False.

| Declared response | Body schema |
|---|---|
| 200 | array<string> |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |

### GET /delivery-slots/availability {#get-delivery-slotsavailability}

search Delivery Dates on the basis of postalCode

<a id="shared-95ee2e1c063c"></a>

| Input | Location | Required | Type |
|---|---|---|---|
| Accept-Language | header | True | string |
| X-mycheckout-Country | header | True | string |
| X-mycheckout-Tenant | header | True | string |
| X-mycheckout-Channel | header | True | string |
| X-mycheckout-Vertical | header | False | string |
| postalCode | query | True | string |
| orderingDate | query | False | string |

Request body: none declared. Required: False.

<a id="shared-6805d8944108"></a>

| Declared response | Body schema |
|---|---|
| 200 | DeliverySlotResponse |
| 400 | ErrorResponse |
| 401 | ErrorResponse |
| 403 | ErrorResponse |
| 404 | ErrorResponse |
| 500 | ErrorResponse |

### GET /delivery-dates/{id} {#get-delivery-datesid}

search Delivery Date on the basis of id

<a id="shared-81454d48f1c8"></a>

| Input | Location | Required | Type |
|---|---|---|---|
| Accept-Language | header | True | string |
| X-mycheckout-Country | header | True | string |
| X-mycheckout-Tenant | header | True | string |
| X-mycheckout-Channel | header | True | string |
| X-mycheckout-Vertical | header | False | string |
| id | path | True | string |

Request body: none declared. Required: False.

<a id="shared-b03d75c15d2c"></a>

| Declared response | Body schema |
|---|---|
| 200 | DeliveryDateResponse |
| 400 | ErrorResponse |
| 401 | ErrorResponse |
| 403 | ErrorResponse |
| 404 | ErrorResponse |
| 500 | ErrorResponse |

### DELETE /delivery-dates/{id} {#delete-delivery-datesid}

delete Delivery Date on the basis of id

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-81454d48f1c8).

Request body: none declared. Required: False.

<a id="shared-5acf0af44fb8"></a>

| Declared response | Body schema |
|---|---|
| 204 | Successful response. |
| 400 | ErrorResponse |
| 401 | ErrorResponse |
| 403 | ErrorResponse |
| 404 | ErrorResponse |
| 500 | ErrorResponse |

### PUT /delivery-dates/{id} {#put-delivery-datesid}

update Delivery Date on the basis of id

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-81454d48f1c8).

Request body: application/json: `UpdateDeliveryDateRequest`. Required: True.

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-b03d75c15d2c).

### POST /delivery-dates {#post-delivery-dates}

create Delivery Date on the basis of id

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-5c6c92c10fa1).

Request body: application/json: `DeliveryDateRequest`. Required: True.

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-b03d75c15d2c).

### GET /postalcode-serviceabilities/{id} {#get-postalcode-serviceabilitiesid}

search PostalCode Serviceability on the basis of id

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-81454d48f1c8).

Request body: none declared. Required: False.

<a id="shared-3f5ebb7a0fce"></a>

| Declared response | Body schema |
|---|---|
| 200 | PostalCodeServiceabilityResponse |
| 400 | ErrorResponse |
| 401 | ErrorResponse |
| 403 | ErrorResponse |
| 404 | ErrorResponse |
| 500 | ErrorResponse |

### DELETE /postalcode-serviceabilities/{id} {#delete-postalcode-serviceabilitiesid}

delete PostalCode Serviceability on the basis of id

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-81454d48f1c8).

Request body: none declared. Required: False.

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-5acf0af44fb8).

### PUT /postalcode-serviceabilities/{id} {#put-postalcode-serviceabilitiesid}

search PostalCode Serviceability on the basis of id

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-81454d48f1c8).

Request body: application/json: `UpdatePostalCodeServiceabilityRequest`. Required: True.

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-3f5ebb7a0fce).

### POST /postalcode-serviceabilities {#post-postalcode-serviceabilities}

create PostalCode Serviceability on the basis of id

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-5c6c92c10fa1).

Request body: application/json: `PostalCodeServiceabilityRequest`. Required: True.

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-3f5ebb7a0fce).

### GET /postalcode-serviceabilities {#get-postalcode-serviceabilities}

search PostalCode Serviceability on the basis of postalCode

<a id="shared-665ed498b5c8"></a>

| Input | Location | Required | Type |
|---|---|---|---|
| Accept-Language | header | True | string |
| X-mycheckout-Country | header | True | string |
| X-mycheckout-Tenant | header | True | string |
| X-mycheckout-Channel | header | True | string |
| X-mycheckout-Vertical | header | False | string |
| postalCode | query | True | string |

Request body: none declared. Required: False.

<a id="shared-4b9dac986f57"></a>

| Declared response | Body schema |
|---|---|
| 200 | PostalCodeServiceabilityListResponse |
| 400 | ErrorResponse |
| 401 | ErrorResponse |
| 403 | ErrorResponse |
| 404 | ErrorResponse |
| 500 | ErrorResponse |

### POST /stock-levels {#post-stock-levels}

create Stock Level

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-625914900a47).

Request body: application/json: `StockLevelTransactionRequest`. Required: True.

<a id="shared-8d6b0cd74d1a"></a>

| Declared response | Body schema |
|---|---|
| 200 | StockLevelTransactionResponse |
| 400 | ErrorResponse |
| 401 | ErrorResponse |
| 403 | ErrorResponse |
| 500 | ErrorResponse |
| 409 | ErrorResponse |

### GET /stock-levels {#get-stock-levels}

get Stock Level

<a id="shared-990787e9dce5"></a>

| Input | Location | Required | Type |
|---|---|---|---|
| itemCode | query | False | string |
| warehouseCode | query | False | string |
| stockLevelStatus | query | False | string |
| page | query | False | integer |
| size | query | False | integer |
| aliasCode | query | False | string |
| Accept-Language | header | True | string |
| X-mycheckout-Country | header | True | string |
| X-mycheckout-Tenant | header | True | string |
| X-mycheckout-Channel | header | True | string |
| X-mycheckout-Vertical | header | False | string |

Request body: none declared. Required: False.

<a id="shared-df97a0097ba7"></a>

| Declared response | Body schema |
|---|---|
| 200 | StockLevelsListingResponse |
| 400 | ErrorResponse |
| 401 | ErrorResponse |
| 403 | ErrorResponse |
| 404 | ErrorResponse |
| 500 | ErrorResponse |
| 409 | ErrorResponse |

### GET /stock-levels/detail {#get-stock-levelsdetail}

get Stock Level detail

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
