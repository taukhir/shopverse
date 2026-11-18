---
slug: /mycheckout/fulfillment-docs/fulfillment-api-catalog/part-2
title: "mycheckout — Fulfillment API catalog — Part 2"
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

# mycheckout — Fulfillment API catalog — Part 2

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `fulfillment docs/FULFILLMENT-API-CATALOG.md` |
| Source SHA256 | `eb6a6fc456ee5016287ab2005921f7dd0b8d21560544141a64b0e088bfeebfcb` |
| Guide part | 2 of 5 |

[Part 1](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1) · [Part 2](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-2) · [Part 3](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-3) · [Part 4](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-4) · [Part 5](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-5)

<a id="shared-566e88ffef31"></a>

| Input | Location | Required | Type |
|---|---|---|---|
| itemCode | query | False | string |
| warehouseCode | query | False | string |
| version | query | False | integer |
| hasBackorderReservations | query | False | boolean |
| page | query | False | integer |
| size | query | False | integer |
| Accept-Language | header | True | string |
| X-mycheckout-Country | header | True | string |
| X-mycheckout-Tenant | header | True | string |
| X-mycheckout-Channel | header | True | string |
| X-mycheckout-Vertical | header | False | string |

Request body: none declared. Required: False.

<a id="shared-a590cf9d975d"></a>

| Declared response | Body schema |
|---|---|
| 200 | StockLevelsDetailResponse |
| 400 | ErrorResponse |
| 401 | ErrorResponse |
| 403 | ErrorResponse |
| 404 | ErrorResponse |
| 500 | ErrorResponse |
| 409 | ErrorResponse |

### POST /stock-levels/batch {#post-stock-levelsbatch}

batch create Stock Level

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-625914900a47).

Request body: application/json: `StockLevelsBatchTransactionRequest`. Required: True.

<a id="shared-6e3732a8cb21"></a>

| Declared response | Body schema |
|---|---|
| 200 | StockLevelsBatchTransactionResponse |
| 400 | ErrorResponse |
| 401 | ErrorResponse |
| 403 | ErrorResponse |
| 500 | ErrorResponse |
| 409 | ErrorResponse |

### GET /stock-levels/audit {#get-stock-levelsaudit}

get Stock Level audit

<a id="shared-a03b231f9ccd"></a>

| Input | Location | Required | Type |
|---|---|---|---|
| itemCode | query | True | string |
| warehouseCode | query | True | string |
| page | query | False | integer |
| size | query | False | integer |
| Accept-Language | header | True | string |
| X-mycheckout-Country | header | True | string |
| X-mycheckout-Tenant | header | True | string |
| X-mycheckout-Channel | header | True | string |
| X-mycheckout-Vertical | header | False | string |

Request body: none declared. Required: False.

<a id="shared-b28292947d6e"></a>

| Declared response | Body schema |
|---|---|
| 200 | StockLevelTransactionsAuditResponse |
| 400 | ErrorResponse |
| 401 | ErrorResponse |
| 403 | ErrorResponse |
| 404 | ErrorResponse |
| 500 | ErrorResponse |
| 409 | ErrorResponse |

### POST /delivery-fees {#post-delivery-fees}

List all DeliveryFees

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-55de17bbbbf9).

Request body: application/json: `array<DeliveryFeeCalculationRequest>`. Required: True.

| Declared response | Body schema |
|---|---|
| 200 | ShippingFeeDetails |
| 401 | ErrorResponse |
| 500 | ErrorResponse |

### Schema inventory {#schema-inventory}

<a id="shared-76d33ab49807"></a>

Direct properties and required lists are shown here; inheritance, nested structures, enums, constraints, examples and complete references are preserved in the JSON catalog and original spec.

<a id="shared-9594a1257cd1"></a>

| Schema | Kind/base | Direct fields (required marked *) |
|---|---|---|
| DeliveryFeeCalculationRequest | Allocation + object | — |
| mycheckoutValue | object | businessVolume*:number, pointValue*:number |
| ShippingFeeDetails | object | totalApplicableFee:Amount, shipmentDetails:array<ShipmentDetails> |
| ShipmentDetails | object | fulfillmentTypeId:string, serviceLevelId:string, deliveryfees:array<DeliveryFee>, freeDeliveryThresholdAmount:FreeDeliveryThreshold |
| DeliveryFee | object | id:string, fee:Amount |
| FreeDeliveryThreshold | object + Amount | — |
| FulfillmentType | object | version:integer, id*:string, description:array<MultilingualText>, serviceLevels:array<ServiceLevel>, serviceLocations:array<ServiceLocation>, imageUrl:string, rank:number, isRestricted:boolean, supportedSalesChannels:array<string>, restrictedUserTypes:array<UserType>, restrictedOrderTypes:array<OrderType>, isPickup:boolean, isHomeDelivery:boolean |
| CartPickupLocationResponse | FulfillmentTypeCollection | metadata:SearchResultMetadata |
| SearchResultMetadata | object | lastEvaluationKey:string |
| FulfillmentTypeCollection | object | fulfillmentTypes:array<FulfillmentType> |
| ServiceLevel | object | id*:string, description:array<MultilingualText>, minimumNumberOfDays:integer, maximumNumberOfDays:integer, fees:array<ServiceFeeInternal> |
| MultilingualText | object | language*:string, text*:string |
| OpeningHours | object | openingTime:string, closingTime:string, isOpen*:boolean |
| OpeningSchedule | object | monday:OpeningHours, tuesday:OpeningHours, wednesday:OpeningHours, thursday:OpeningHours, friday:OpeningHours, saturday:OpeningHours, sunday:OpeningHours, asString:string |
| Warehouse | object | id*:string, address:Address, fulfillmenttypes:array<FulfillmentType> |
| WarehouseCollection | object | warehouses:array<Warehouse> |
| ServiceFee | ServiceFeeInternal | fulfillmentType*:string, serviceLevel*:string |
| ServiceFeeInternal | object | userType*:array<UserType>, orderType*:array<OrderType>, serviceFee*:Amount, minimumThresholdAmount*:Amount, thresholdType:ThresholdType, id:string, startDate*:string, endDate:string, version:integer |
| ThresholdType | string | — |
| UserType | string | — |
| OrderType | string | — |
| ServiceFeeCollection | object | serviceFees:array<ServiceFee> |
| Address | object | country*:string, postCode:string, region:string, regionCode:string, line1:string, line2:string, line3:string, city:string, district:string, subDistrict:string, lat:string, long:string |
| ServiceLocation | object | name:string, address*:Address, phone:string, schedule:OpeningSchedule, id:string, displayCode:string, warehouseId:string, distanceInMiles:number, allItemsAvailable:boolean, locationGroup:string, holidays:array<Holiday> |
| Holiday | object | date:string, formattedDate:string, description:string |
| UnitOfLength | string | — |
| UnitOfWeight | string | — |
| Weight | object | unit:UnitOfWeight, weight:number |
| Dimension | object | unit:UnitOfLength, length:number, width:number, height:number |
| Product | object | hazardCode:string, dimension:Dimension, weight:Weight, productId:string, flags:Flags |
| Flags | object | isPickupAvailable:boolean, isDeliveryAvailable:boolean, restrictFromCollectionCenter:boolean, isDurable:boolean, isMedical:boolean, isServiceItem:boolean |
| Amount | object | currency:string, amount:number |
| LineItem | object | lineId:string, allocationLineId:string, itemId:string, itemQuantity:integer, lineAmount:Amount, mycheckoutValue:mycheckoutValue, product:Product |
| BundleItem | object | bundleId:string, allocationBundleId:string, bundleQuantity:integer, lineItems:array<LineItem> |
| CartPickupLocationRequest | object | radiusInMiles:number, lastEvaluatedKey:string, searchText:string, limit:integer, allocations:array<Allocation> |
| Allocation | object | userType:UserType, orderType:OrderType, address:Address, isGroupOrder:boolean, isCombinedOrder:boolean, id*:string, fulfillmentTypeId:string, warehouseId:string, lineItems:array<LineItem>, bundleItems:array<BundleItem> |
| ServiceLocationCollection | object | serviceLocations:array<ServiceLocation>, metadata:SearchResultMetadata |
| ErrorResponse | object | timestamp:string, type:string, title:string, detail:string, instance:string, code:string, subDetails:array<object>, params:object |
| StateData | object | state:string, countryCode:string, stateName:string, regionZone:string, regionCode:string |
| CreateShippingAddress | object + ShippingAddress | — |
| UpdateShippingAddressRequest | object + ShippingAddress | — |
| AddressType | string | — |
| ValidationType | string | — |
| MetaData | object | createdBy:string, createdAt:string, lastUpdatedBy:string, lastUpdatedAt:string, projectVersion:string, isDeleted:boolean, version:integer, X-mycheckout-Tenant:string, X-mycheckout-Vertical:string, X-mycheckout-Country:string, X-mycheckout-Channel:string |
| ShippingAddress | object | contactType:AddressType, ownerType:OwnerType, phone:string, email:string, addrLineOne:string, addrLineTwo:string, addrLineThree:string, city:string, country:string, county:string, state:string, postalCode:string, district:string, subDistrict:string, recipientFirstName:string, recipientLastName:string, contactNickname:string, deliveryInstructions:string, validationStatus:ValidationType, addressValidatedDate:string, addressValidationOverrideFlag:boolean, extensions:Extensions, isDefault:boolean, sourceApplication:string, sourceApplicationId:string, addressType:string, sideline:string, houseNumber:string, daneCode:string, mainRoad:string, prefectureCityDisplay:string, otpChallengeId:string, otpContext:string, version:integer |
| ShippingAddressResponse | object + MetaData + CreateShippingAddress | — |
| ShippingAddressesResponse | object | shippingAddresses*:array<ShippingAddressResponse> |
| OwnerType | string | — |
| Extensions | object | districtName:string, subDistrictName:string, townName:string, miscCode:string, sez:boolean, locality:string |
| UnprocessableErrorResponse | object | timestamp:string, type:string, title:string, status:string, detail:string, instance:string, code:string, subDetails:object |
| Matches | object | addrLineOne:string, addrLineTwo:string, addrLineThree:string, city:string, country:string, countryCode:string, postalCode:string |
| ShippingAddressDeleteResponse | object | message:string |
| CreateChallengeRequest | object | purpose*:ChallengePurpose, challengeId:string, mode:string, value:string |
| CreateChallengeResponse | object | challengeId:string, challengeVerified:boolean, modeValue:string, otpResendTime:string, version:integer |
| ChallengePurpose | string | — |
| DeliveryDateResponse | object | id:string, orderDayStartTime:string, orderDayEndTime:string, deliveryDate:string, zoneId:string, country:string, createdAt:string, updatedAt:string, version:integer |
| DeliveryDateRequest | DeliveryDateResponse | — |
| UpdateDeliveryDateRequest | DeliveryDateResponse | — |
| PostalCodeServiceabilityListResponse | object | serviceableZones:array<PostalCodeServiceabilityResponse> |
| PostalCodeServiceabilityResponse | object | id:string, postalCode:string, country:string, zoneId:string, warehouseId:string, isTimedDelivery:boolean, startDate:string, endDate:string, createdAt:string, updatedAt:string, version:string |
| PostalCodeServiceabilityRequest | PostalCodeServiceabilityResponse | — |
| UpdatePostalCodeServiceabilityRequest | PostalCodeServiceabilityResponse | — |
| DeliverySlotResponse | object | availableDates:array<string>, slots:array<object>, errors:array<ValidationError> |
| ErrorCategory | string | — |
| ValidationError | object | fieldName:string, description:string, code:string, type:ErrorCategory |
| StockLevelTransactionsAuditResponse | object | transactions:array<StockLevelTransactionAuditItemResponse>, pagination:Pagination |
| StockLevelTransactionAuditItemResponse | object | itemCode:string, warehouseCode:string, version:integer, attributes:array<string>, createdAt:string, referenceId:string |
| StockLevelsDetailResponse | object | stockLevels:array<StockLevelResponse>, pagination:Pagination |
| StockLevelsListingResponse | object | stockLevels:array<StockLevelsListingItemResponse>, pagination:Pagination |
| StockLevelsListingItemResponse | object | availabilityDetails:object, createdAt:string, itemCode:string, warehouseCode:string, version:integer, stockLevelStatus:StockLevelStatus |
| Pagination | object | offset:integer, limit:integer, totalElements:integer, totalPages:integer |
| StockLevelsBatchTransactionRequest | object | stockLevels:array<StockLevelTransactionRequest> |
| StockLevelsBatchTransactionResponse | object | stockLevels:array<StockLevelTransactionResponse> |
| StockLevelTransactionRequest | StockLevelTransactionCommon | — |
| StockLevelTransactionCommon | StockLevelCommon + object | — |
| StockLevelCommon | object | itemCode*:string, warehouseCode*:string, version:integer, stockLevelStatus:StockLevelStatus, backorderReserve:integer, backorderQuantity:integer, backorderEta:string, onHandQuantity:integer, reservedQuantity:integer, sopProtection:integer, lowStockThreshold:integer, sopEta:string, nextAvailablityEta:string, beBackorderQuantity:integer, discontinuationDate:string |
| StockLevelTransactionResponse | StockLevelTransactionCommon | — |
| StockLevelResponse | StockLevelCommon + object | — |
| AvailabilityDetail | object | dispositionStatus:DispositionStatus, onHandQuantityAvailableToSell:integer, backorderQuantityAvailableToSell:integer |
| StockLevelTransactionType | string | — |
| StockLevelStatus | string | — |
| DispositionStatus | string | — |

## dataservice: 49 operations {#dataservice-49-operations}

<a id="shared-6667175b1f06"></a>

Contract: openapi-rest.yml (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-api/source/fulfillment-data-rest/v1/openapi-rest.yml:1`). 99 component schemas.

<a id="shared-7497383f07e1"></a>

| Method/path | Operation | Controller match |
|---|---|---|
| `GET /fulfillment-types` | `getfulfillmenttypes` | FulfillmentTypesController.getfulfillmenttypes (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/FulfillmentTypesController.java:49`) |
| `POST /fulfillment-types` | `createFulfillmentType` | FulfillmentTypesController.createFulfillmentType (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/FulfillmentTypesController.java:64`) |
| `GET /fulfillment-types/{fulfillmentTypeId}` | `getFulfillmentType` | FulfillmentTypesController.getFulfillmentType (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/FulfillmentTypesController.java:42`) |
| `PUT /fulfillment-types/{fulfillmentTypeId}` | `updateFulfillmentType` | FulfillmentTypesController.updateFulfillmentType (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/FulfillmentTypesController.java:56`) |
| `DELETE /fulfillment-types/{fulfillmentTypeId}` | `deleteFulfillmentType` | FulfillmentTypesController.deleteFulfillmentType (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/FulfillmentTypesController.java:79`) |
| `PATCH /fulfillment-types/{fulfillmentTypeId}` | `patchFulfillmentType` | FulfillmentTypesController.patchFulfillmentType (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/FulfillmentTypesController.java:72`) |
| `GET /post-locations` | `getpostlocations` | PostLocationsController.getpostlocations (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/PostLocationsController.java:49`) |
| `POST /post-locations` | `createPostLocation` | PostLocationsController.createPostLocation (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/PostLocationsController.java:28`) |
| `GET /post-locations/{postLocationId}` | `getPostLocation` | PostLocationsController.getPostLocation (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/PostLocationsController.java:42`) |
| `PUT /post-locations/{postLocationId}` | `updatePostLocation` | PostLocationsController.updatePostLocation (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/PostLocationsController.java:61`) |
| `DELETE /post-locations/{postLocationId}` | `deletePostLocation` | PostLocationsController.deletePostLocation (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/PostLocationsController.java:35`) |
| `POST /allocations` | `generateAllocations` | AllocationsController.generateAllocations (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/AllocationsController.java:35`) |
| `POST /delivery-fees` | `createDeliveryFee` | ServiceFeeController.createDeliveryFee (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/ServiceFeeController.java:33`) |
| `POST /service-locations/{serviceLocationId}/pickup-availability` | `pickupLocationAvailability` | ServiceLocationsController.pickupLocationAvailability (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/ServiceLocationsController.java:101`) |
| `POST /service-locations/{serviceLocationId}/pickup-reservations` | `reservePickupLocation` | ServiceLocationsController.reservePickupLocation (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/ServiceLocationsController.java:109`) |
| `POST /reservations` | `createReservation` | ReservationsController.createReservation (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/ReservationsController.java:36`) |
| `DELETE /reservations/{reservationId}` | `deleteExistingReservation` | ReservationsController.deleteExistingReservation (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/ReservationsController.java:49`) |
| `GET /service-locations` | `getservicelocations` | ServiceLocationsController.getservicelocations (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/ServiceLocationsController.java:40`) |
| `POST /service-locations` | `createServiceLocation` | ServiceLocationsController.createServiceLocation (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/ServiceLocationsController.java:70`) |
| `DELETE /service-locations` | `deleteServiceLocations` | ServiceLocationsController.deleteServiceLocations (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/ServiceLocationsController.java:89`) |
| `GET /service-locations/{serviceLocationId}` | `getServiceLocation` | ServiceLocationsController.getServiceLocation (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/ServiceLocationsController.java:34`) |
| `PUT /service-locations/{serviceLocationId}` | `updateServiceLocation` | ServiceLocationsController.updateServiceLocation (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/ServiceLocationsController.java:76`) |
| `DELETE /service-locations/{serviceLocationId}` | `deleteServiceLocation` | ServiceLocationsController.deleteServiceLocation (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/ServiceLocationsController.java:83`) |
| `GET /warehouses` | `getwarehouses` | WarehousesController.getwarehouses (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/WarehousesController.java:25`) |
| `GET /commands` | `getCommands` | CommandsController.getCommands (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/CommandsController.java:39`) |
| `POST /commands` | `createCommand` | CommandsController.createCommand (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/CommandsController.java:27`) |
| `GET /commands/{commandId}` | `getCommand` | CommandsController.getCommand (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/CommandsController.java:33`) |
| `POST /shipping-addresses` | `createShippingAddress` | ShippingAddressesController.createShippingAddress (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/ShippingAddressesController.java:42`) |
| `GET /shipping-addresses` | `searchShippingAddress` | ShippingAddressesController.searchShippingAddress (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/ShippingAddressesController.java:88`) |
| `PUT /shipping-addresses/{id}` | `updateShippingAddress` | ShippingAddressesController.updateShippingAddress (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/ShippingAddressesController.java:75`) |
| `DELETE /shipping-addresses/{id}` | `deleteShippingAddress` | ShippingAddressesController.deleteShippingAddress (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/ShippingAddressesController.java:99`) |
| `GET /shipping-addresses/{id}` | `getShippingAddress` | ShippingAddressesController.getShippingAddress (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/ShippingAddressesController.java:67`) |
| `PUT /pickup-location-checks/{checkKey}` | `putPickupLocationCheck` | PickupLocationChecksController.putPickupLocationCheck (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/PickupLocationChecksController.java:25`) |
| `GET /pickup-location-checks/{checkKey}` | `getPickupLocationCheck` | PickupLocationChecksController.getPickupLocationCheck (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/PickupLocationChecksController.java:34`) |
| `GET /delivery-slots/availability` | `getAvailableDeliverySlots` | DeliverySlotAvailabilityController.getAvailableDeliverySlots (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/DeliverySlotAvailabilityController.java:33`) |
| `GET /delivery-dates/{id}` | `getDeliveryDate` | DeliveryDateController.getDeliveryDate (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/DeliveryDateController.java:47`) |
| `DELETE /delivery-dates/{id}` | `deleteDeliveryDate` | DeliveryDateController.deleteDeliveryDate (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/DeliveryDateController.java:41`) |
| `PUT /delivery-dates/{id}` | `updateDeliveryDate` | DeliveryDateController.updateDeliveryDate (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/DeliveryDateController.java:56`) |
| `POST /delivery-dates` | `createDeliveryDate` | DeliveryDateController.createDeliveryDate (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/DeliveryDateController.java:31`) |
| `GET /postalcode-serviceabilities/{id}` | `getPostalCodeServiceability` | PostalCodeServiceabilityController.getPostalCodeServiceability (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/PostalCodeServiceabilityController.java:45`) |
| `DELETE /postalcode-serviceabilities/{id}` | `deletePostalCodeServiceability` | PostalCodeServiceabilityController.deletePostalCodeServiceability (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/PostalCodeServiceabilityController.java:39`) |
| `PUT /postalcode-serviceabilities/{id}` | `updatePostalCodeServiceability` | PostalCodeServiceabilityController.updatePostalCodeServiceability (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/PostalCodeServiceabilityController.java:53`) |
| `POST /postalcode-serviceabilities` | `createPostalCodeServiceability` | PostalCodeServiceabilityController.createPostalCodeServiceability (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/PostalCodeServiceabilityController.java:30`) |
| `GET /postalcode-serviceabilities` | `getPostalCodeServiceabilityForPostalCode` | PostalCodeServiceabilityController.getPostalCodeServiceabilityForPostalCode (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/PostalCodeServiceabilityController.java:66`) |
| `POST /stock-levels` | `createStockLevel` | StockLevelController.createStockLevel (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/StockLevelController.java:64`) |
| `GET /stock-levels` | `getStockLevel` | StockLevelController.getStockLevel (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/StockLevelController.java:50`) |
| `GET /stock-levels/detail` | `getStockLevelDetail` | StockLevelController.getStockLevelDetail (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/StockLevelController.java:97`) |
| `POST /stock-levels/batch` | `batchCreateStockLevels` | StockLevelController.batchCreateStockLevels (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/StockLevelController.java:78`) |
| `GET /stock-levels/audit` | `getStockLevelAudit` | StockLevelController.getStockLevelAudit (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/StockLevelController.java:112`) |

### GET /fulfillment-types {#get-fulfillment-types-1}

List All fulfillmenttypes

<a id="shared-abcb18ebdd66"></a>

| Input | Location | Required | Type |
|---|---|---|---|
| Accept-Language | header | True | string |
| X-mycheckout-Country | header | True | string |
| X-mycheckout-Tenant | header | True | string |
| X-mycheckout-Vertical | header | False | string |
| X-mycheckout-Channel | header | True | string |
| fulfillmentTypeIds | query | False | array<string> |
| userType | query | False | UserType |
| orderType | query | False | OrderType |

Request body: none declared. Required: False.

| Declared response | Body schema |
|---|---|
| 200 | FulfillmentTypeCollection |
| 401 | Error |
| 500 | Error |

### POST /fulfillment-types {#post-fulfillment-types}

Create a FulfillmentType

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1#shared-55de17bbbbf9).

Request body: application/json: `FulfillmentTypeRequest`. Required: True.

| Declared response | Body schema |
|---|---|
| 201 | FulfillmentType |
| 401 | Error |
| 500 | Error |

### GET /fulfillment-types/{fulfillmentTypeId} {#get-fulfillment-typesfulfillmenttypeid}

Get a FulfillmentType

<a id="shared-e8bab6b1cf8e"></a>

| Input | Location | Required | Type |
|---|---|---|---|
| fulfillmentTypeId | path | True | string |
| Accept-Language | header | True | string |
| X-mycheckout-Country | header | True | string |
| X-mycheckout-Tenant | header | True | string |
| X-mycheckout-Vertical | header | False | string |
| X-mycheckout-Channel | header | True | string |
| userType | query | False | UserType |
| orderType | query | False | OrderType |

Request body: none declared. Required: False.

| Declared response | Body schema |
|---|---|
| 200 | FulfillmentType |
| 401 | Error |
| 404 | Error |
| 500 | Error |

### PUT /fulfillment-types/{fulfillmentTypeId} {#put-fulfillment-typesfulfillmenttypeid}

Update a FulfillmentType

<a id="shared-225112e4df38"></a>

| Input | Location | Required | Type |
|---|---|---|---|
| fulfillmentTypeId | path | True | string |
| Accept-Language | header | True | string |
| X-mycheckout-Country | header | True | string |
| X-mycheckout-Tenant | header | True | string |
| X-mycheckout-Vertical | header | False | string |
| X-mycheckout-Channel | header | True | string |

Request body: application/json: `FulfillmentTypeRequest`. Required: True.

| Declared response | Body schema |
|---|---|
| 202 | FulfillmentType |
| 401 | Error |
| 404 | Error |
| 500 | Error |

### DELETE /fulfillment-types/{fulfillmentTypeId} {#delete-fulfillment-typesfulfillmenttypeid}

Delete a FulfillmentType

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-2#shared-225112e4df38).

Request body: none declared. Required: False.

| Declared response | Body schema |
|---|---|
| 204 | Successful response. |
| 401 | Error |
| 404 | Error |
| 500 | Error |

### PATCH /fulfillment-types/{fulfillmentTypeId} {#patch-fulfillment-typesfulfillmenttypeid}

Update a FulfillmentType

See the [shared definition](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-2#shared-225112e4df38).

Request body: application/json: `FulfillmentTypeRequest`. Required: True.

| Declared response | Body schema |
|---|---|
| 202 | FulfillmentType |
| 401 | Error |
| 404 | Error |
| 500 | Error |

### GET /post-locations {#get-post-locations}

List All postlocations

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
