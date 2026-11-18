---
slug: /mycheckout/fulfillment-docs/fulfillment-api-catalog/part-4
title: "mycheckout — Fulfillment API catalog — Part 4"
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

# mycheckout — Fulfillment API catalog — Part 4

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `fulfillment docs/FULFILLMENT-API-CATALOG.md` |
| Source SHA256 | `eb6a6fc456ee5016287ab2005921f7dd0b8d21560544141a64b0e088bfeebfcb` |
| Guide part | 4 of 5 |

[Part 1](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1) · [Part 2](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-2) · [Part 3](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-3) · [Part 4](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-4) · [Part 5](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-5)

<a id="shared-1220e1314029"></a>

| Schema | Kind/base | Direct fields (required marked *) |
|---|---|---|
| StockLevelTransactionsAuditResponse | object | transactions:array<StockLevelTransactionAuditItemResponse>, pagination:Pagination |
| StockLevelTransactionAuditItemResponse | object | itemCode:string, warehouseCode:string, version:integer, attributes:array<string>, createdAt:string, referenceId:string |
| StockLevelsDetailResponse | object | stockLevels:array<StockLevelResponse>, pagination:Pagination |
| StockLevelsListingResponse | object | stockLevels:array<StockLevelsListingItemResponse>, pagination:Pagination |
| StockLevelsListingItemResponse | object | availabilityDetails:object, createdAt:string, itemCode:string, warehouseCode:string, version:integer, stockLevelStatus:StockLevelStatus |
| Pagination | object | offset:integer, limit:integer, totalElements:integer, totalPages:integer |
| StockLevelsBatchTransactionRequest | object | stockLevels:array<StockLevelTransactionRequest> |
| StockLevelsBatchTransactionResponse | object | stockLevels:array<StockLevelTransactionResponse> |
| StockLevelsBatchResponse | object | stockLevels:array<StockLevelResponse> |
| StockLevelTransactionRequest | StockLevelTransactionCommon | — |
| StockLevelTransactionCommon | StockLevelCommon + object | — |
| StockLevelCommon | object | itemCode*:string, warehouseCode*:string, version:integer, stockLevelStatus:StockLevelStatus, backorderReserve:integer, backorderQuantity:integer, backorderEta:string, onHandQuantity:integer, reservedQuantity:integer, sopProtection:integer, lowStockThreshold:integer, sopEta:string, nextAvailablityEta:string, beBackorderQuantity:integer, discontinuationDate:string |
| StockLevelTransactionResponse | StockLevelTransactionCommon | — |
| StockLevelResponse | StockLevelCommon + object | — |
| AvailabilityDetail | object | dispositionStatus:DispositionStatus, onHandQuantityAvailableToSell:integer, backorderQuantityAvailableToSell:integer |
| StockLevelTransactionType | string | — |
| StockLevelStatus | string | — |
| DispositionStatus | string | — |
| PickupLocationReservationRequest | object | availabilityCheckKey:string |
| PickupLocationCheckRequest | object | value:string |
| PickupLocationCheck | PickupLocationCheckRequest | key:string |
| CommandRequest | object | beanId:string |
| Command | object | id:string, beanId:string, status:string |
| CommandCollection | object | commands:array<Command> |
| PostLocation | object | version:integer, country*:string, postCode*:string, id:string |
| PostLocationCollection | object | postLocations:array<PostLocation> |
| FulfillmentTypeRequest | FulfillmentTypeInternal | version:integer |
| FulfillmentType | FulfillmentTypeInternal | version:integer, serviceLocations:array<ServiceLocation>, isRestricted:boolean |
| FulfillmentTypeInternal | object | id*:string, description:array<MultilingualText>, serviceLevels:array<ServiceLevel>, imageUrl:string, rank:number, evaluatePickupWithShipTo:boolean, evaluatePickup:boolean, evaluateShipping:boolean, promisingConfigName:string, demandType:string, viewName:string, deliveryMethodId:string, countryIsoCode:string, supportedSalesChannels:array<string>, restrictedUserTypes:array<UserType>, restrictedOrderTypes:array<OrderType>, isPickup:boolean, isHomeDelivery:boolean, defaultRadiusInMiles:number |
| FulfillmentTypeCollection | object | fulfillmentTypes:array<FulfillmentType> |
| ServiceLevel | object | id*:string, description:array<MultilingualText>, minimumNumberOfDays:integer, maximumNumberOfDays:integer, fees:array<ServiceFee>, isRestricted:boolean, shippingMethodId:string |
| ServiceLevelCollection | object | serviceLevels:array<ServiceLevel> |
| MultilingualText | object | language*:string, text*:string |
| OpeningHours | object | openingTime:string, closingTime:string, isOpen*:boolean |
| OpeningSchedule | object | monday:OpeningHours, tuesday:OpeningHours, wednesday:OpeningHours, thursday:OpeningHours, friday:OpeningHours, saturday:OpeningHours, sunday:OpeningHours, asString:string |
| Warehouse | object | id*:string |
| WarehouseCollection | object | warehouses:array<Warehouse> |
| ServiceFee | object | userType*:array<UserType>, orderType*:array<OrderType>, serviceFee*:Amount, minimumThresholdAmount*:Amount, thresholdType:ThresholdType, id:string, startDate*:string, endDate:string |
| UserType | string | — |
| OrderType | string | — |
| ServiceFeeCollection | object | serviceFees:array<ServiceFee> |
| Address | object | country*:string, postCode:string, region:string, regionCode:string, line1:string, line2:string, line3:string, city:string, district:string, subDistrict:string, lat:string, long:string, ownerId:string |
| ServiceLocation | object | version:integer, name:string, address*:Address, phone:string, schedule:OpeningSchedule, id:string, countryIsoCode:string, displayCode:string, warehouseId:string, fulfillmentType:string, distanceInMiles:number, allItemsAvailable:boolean, type:string, subType:string, taxNumber:string, locationGroup:string, holidays:array<Holiday> |
| Holiday | object | date:string, description:string |
| ServiceLocationCollection | object | serviceLocations:array<ServiceLocation>, metadata:SearchResultMetadata |
| UnitOfLength | string | — |
| UnitOfWeight | string | — |
| Weight | object | unit:UnitOfWeight, weight:number |
| Dimension | object | unit:UnitOfLength, length:number, width:number, height:number |
| Product | object | hazardCode:string, dimension:Dimension, weight:Weight, productId:string, flags:Flags |
| Flags | object | isPickupAvailable:boolean, isDeliveryAvailable:boolean, restrictFromCollectionCenter:boolean, isDurable:boolean, isMedical:boolean, isServiceItem:boolean |
| Amount | object | currency:string, amount:number |
| SearchResultMetadata | object | lastEvaluationKey:string |
| LineItem | object | lineId*:string, allocationLineId:string, itemId*:string, itemQuantity*:integer, lineAmount:Amount, mycheckoutValue:mycheckoutValue, product:Product, isRequired:boolean, bundleLineId:string |
| BundleItem | object | bundleId*:string, allocationBundleId:string, bundleQuantity*:integer, lineItems*:array<LineItem> |
| mycheckoutValue | object | businessVolume*:number, pointValue*:number |
| ThresholdType | string | — |
| Price | object | value*:number, currency:string, mycheckoutValue:mycheckoutValue |
| Allocation | FulfillmentDetail + object | — |
| PickupLocationAvailabilityRequest | FulfillmentDetail + object | — |
| DeliveryFeeCalculationRequest | FulfillmentDetail + object | — |
| DeliveryFee | object | id:string, fee:Amount |
| PickupLocationAvailabilityResponse | object | isAvailable:boolean, availabilityCheckId:string, availabilityResponseCode:PickupLocationAvailabilityResponseCode |
| PickupLocationAvailabilityResponseCode | string | — |
| ShippingFeeDetails | object | totalApplicableFee:Amount, shipmentDetails:array<ShipmentDetails> |
| ShipmentDetails | object | fulfillmentTypeId:string, serviceLevelId:string, deliveryfees:array<DeliveryFee>, freeDeliveryThresholdAmount:FreeDeliveryThreshold |
| FreeDeliveryThreshold | object + Amount | — |
| FulfillmentDetail | object | userType:UserType, orderType:OrderType, address:Address, isGroupOrder:boolean, isCombinedOrder:boolean, id*:string, fulfillmentTypeId:string, lineItems:array<LineItem>, bundleItems:array<BundleItem> |
| AllocationOption | object | allocationGroups*:array<AllocationGroup>, allocationRequestId:string |
| AllocationGroup | object | id*:string, fulfillmentType*:FulfillmentType, serviceLevel:ServiceLevel, entries*:array<AllocationGroupEntry>, address:Address, estimatedDeliveryTime:string, estimatedShippingTime:string, fee:Amount, allItemsAvailable:boolean, inventoryAllocationEvaluated:boolean |
| AllocationGroupEntry | object | warehouseId:string, lineItem*:LineItem, sourcedQuantity*:integer, backorderableQuantity:integer, backorderEta:string, id*:string, inventoryReservations:array<InventoryReservation>, reservedQuantity:integer, dispositionStatus:AvailabilityDisposition, stockLevelStatus:StockLevelStatus, isRestricted:boolean, estimatedDeliveryTime:string, estimatedShippingTime:string |
| AvailabilityDisposition | string | — |
| Reservation | object | id*:string, allocationGroups*:array<AllocationGroup>, reservationExpiryDateTime:string, orderType:OrderType |
| InventoryReservation | object | dateTime*:string, requestedQuantity*:integer, reservedQuantity*:integer, imsReservationId*:string |
| Error | object | timestamp:string, type:string, title:string, detail:string, instance:string, code:string, subDetails:array<object>, params:object |
| CreateShippingAddressRequest | object + ShippingAddress | — |
| UpdateShippingAddressRequest | object + ShippingAddress | — |
| AddressType | string | — |
| ValidationType | string | — |
| MetaData | object | createdBy:string, createdAt:string, lastUpdatedBy:string, lastUpdatedAt:string, projectVersion:string, isDeleted:boolean, version:integer, X-mycheckout-Tenant:string, X-mycheckout-Vertical:string, X-mycheckout-Country:string, X-mycheckout-Channel:string |
| ShippingAddress | object | contactType:AddressType, ownerType:OwnerType, phone:string, email:string, addrLineOne:string, addrLineTwo:string, addrLineThree:string, city:string, country:string, county:string, state:string, postalCode:string, district:string, subDistrict:string, recipientFirstName:string, recipientLastName:string, contactNickname:string, deliveryInstructions:string, validationStatus:ValidationType, addressValidatedDate:string, addressValidationOverrideFlag:boolean, extensions:Extensions, isDefault:boolean, sourceApplication:string, sourceApplicationId:string, addressType:string, sideline:string, houseNumber:string, daneCode:string, mainRoad:string, isFallback:boolean, copyShippingAddress:boolean, prefectureCityDisplay:string, version:integer |
| ShippingAddressResponse | object + MetaData + CreateShippingAddressRequest | — |
| ShippingAddressesResponse | object | shippingAddresses*:array<ShippingAddressResponse> |
| OwnerType | string | — |
| Extensions | object | districtName:string, subDistrictName:string, townName:string, miscCode:string, sez:boolean, locality:string |
| UnprocessableErrorResponse | object | timestamp:string, type:string, title:string, status:string, detail:string, instance:string, code:string, subDetails:object |
| Matches | object | addrLineOne:string, addrLineTwo:string, addrLineThree:string, city:string, country:string, countryCode:string, postalCode:string |
| ShippingAddressDeleteResponse | object | message:string |
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
| ErrorResponse | object | timestamp:string, type:string, title:string, status:string, detail:string, instance:string, code:string, subDetails:array<object> |

## Review: contract operations without concrete name matches {#review-contract-operations-without-concrete-name-matches}

<a id="shared-f894e7df1b95"></a>

- appservice: `GET /districts` → `getDistrictsByStateAndLanguage`.
- appservice: `GET /postalcodes` → `getPostalCodeBySubDistrictAndLanguage`.
- appservice: `GET /states` → `getStateList`.
- appservice: `GET /subdistricts` → `getSubDistrictByDistrictAndLanguage`.
- appservice: `GET /daneCodes` → `getDaneCodeByCityAndState`.
- appservice: `GET /delivery-dates/{id}` → `getDeliveryDate`.
- appservice: `DELETE /delivery-dates/{id}` → `deleteDeliveryDate`.
- appservice: `PUT /delivery-dates/{id}` → `updateDeliveryDate`.
- appservice: `POST /delivery-dates` → `createDeliveryDate`.
- appservice: `GET /postalcode-serviceabilities/{id}` → `getPostalCodeServiceability`.
- appservice: `DELETE /postalcode-serviceabilities/{id}` → `deletePostalCodeServiceability`.
- appservice: `PUT /postalcode-serviceabilities/{id}` → `updatePostalCodeServiceability`.
- appservice: `POST /postalcode-serviceabilities` → `createPostalCodeServiceability`.
- appservice: `GET /postalcode-serviceabilities` → `getPostalCodeServiceabilityForPostalCode`.

## Review: concrete controller methods not matched to these contracts {#review-concrete-controller-methods-not-matched-to-these-contracts}

These may come from a newer generated dependency, a naming difference, or implementation drift. Do not infer HTTP routes solely from these method names.

## Event channel registration inventory {#event-channel-registration-inventory}

Registrations show source wiring, not effective runtime enablement. See the reverse-engineering guide for behavior.

<a id="shared-5961ee655803"></a>

| Service | Registration | Channel | Source |
|---|---|---|---|
| eventservice | Incoming | `inventory-aggregated-in` | AggregatedDailyFeedInventoryEventConsumer.java (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-eventservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmenteventservice/app/consumer/impl/AggregatedDailyFeedInventoryEventConsumer.java:35`) |
| eventservice | Incoming | `readInventoryAtsEvent` | As400FeedInventoryEventConsumer.java (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-eventservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmenteventservice/app/consumer/impl/As400FeedInventoryEventConsumer.java:47`) |
| eventservice | Incoming | `readInventoryAtsEventRlq` | As400FeedInventoryRlqEventConsumer.java (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-eventservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmenteventservice/app/consumer/impl/As400FeedInventoryRlqEventConsumer.java:74`) |
| eventservice | Incoming | `dailyfeed-inventory-events` | DailyFeedInventoryEventConsumer.java (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-eventservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmenteventservice/app/consumer/impl/DailyFeedInventoryEventConsumer.java:51`) |
| eventservice | Incoming | `intraday-inventory-events` | IntraDayFeedInventoryEventConsumer.java (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-eventservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmenteventservice/app/consumer/impl/IntraDayFeedInventoryEventConsumer.java:28`) |
| eventservice | Incoming | `readSalesOrderEvent` | SalesOrderEventConsumer.java (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-eventservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmenteventservice/app/consumer/impl/SalesOrderEventConsumer.java:59`) |
| eventservice | Incoming | `readSalesOrderRlqEvent` | SalesOrderRlqEventConsumer.java (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-eventservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmenteventservice/app/consumer/impl/SalesOrderRlqEventConsumer.java:82`) |
| eventservice | Incoming | `stock-level-cdc-events` | StockLevelCdcEventConsumer.java (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-eventservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmenteventservice/app/consumer/impl/StockLevelCdcEventConsumer.java:37`) |
| eventservice | Channel | `inventory-aggregated-out` | AggregatedDailyFeedInventoryEventProducer.java (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-eventservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmenteventservice/app/producer/impl/AggregatedDailyFeedInventoryEventProducer.java:22`) |
| eventservice | Channel | `readInventoryAtsEventProcessor` | As400FeedInventoryDlqEventProducer.java (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-eventservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmenteventservice/app/producer/impl/As400FeedInventoryDlqEventProducer.java:27`) |
| eventservice | Channel | `readInventoryAtsEventProcessorRlq` | As400FeedInventoryRlqEventProducer.java (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-eventservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmenteventservice/app/producer/impl/As400FeedInventoryRlqEventProducer.java:31`) |
| eventservice | Channel | `dailyfeed-inventory-dlq-out` | DailyFeedInventoryDlqProducer.java (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-eventservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmenteventservice/app/producer/impl/DailyFeedInventoryDlqProducer.java:24`) |
| eventservice | Channel | `dailyfeed-inventory-events-out` | DailyFeedInventoryEventProducer.java (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-eventservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmenteventservice/app/producer/impl/DailyFeedInventoryEventProducer.java:22`) |
| eventservice | Channel | `inventory-availability-events-out` | InventoryAvailabilityEventProducer.java (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-eventservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmenteventservice/app/producer/impl/InventoryAvailabilityEventProducer.java:32`) |
| eventservice | Channel | `readSalesOrderEventProcessor` | SalesOrderDlqEventProducer.java (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-eventservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmenteventservice/app/producer/impl/SalesOrderDlqEventProducer.java:28`) |
| eventservice | Channel | `readSalesOrderEventProcessorRlq` | SalesOrderRlqEventProducer.java (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-eventservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmenteventservice/app/producer/impl/SalesOrderRlqEventProducer.java:35`) |
| eventservice | Channel | `stockLevelCdcEvents` | StockLevelInternalDlqEventProcessor.java (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-eventservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmenteventservice/app/producer/impl/StockLevelInternalDlqEventProcessor.java:28`) |

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
