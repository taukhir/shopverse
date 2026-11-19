---
slug: /mycheckout/fulfillment-docs/fulfillment-source-index/part-3
title: "mycheckout — Fulfillment source evidence index — Part 3"
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

# mycheckout — Fulfillment source evidence index — Part 3

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `fulfillment docs/FULFILLMENT-SOURCE-INDEX.md` |
| Source SHA256 | `cb2bdf57d9af62fdf55493b4b7a5c14402fe397838e7e839ce0c3b4f2ee9e1a9` |
| Guide part | 3 of 3 |

[Part 1](/mycheckout/fulfillment-docs/fulfillment-source-index/part-1) · [Part 2](/mycheckout/fulfillment-docs/fulfillment-source-index/part-2) · [Part 3](/mycheckout/fulfillment-docs/fulfillment-source-index/part-3)

## Additional reverse-engineering evidence: 2026-10-26 {#additional-reverse-engineering-evidence-2026-10-26}

<a id="shared-24d913e29077"></a>

| Evidence | Source anchor |
|---|---|
| App fee CRUD edits fulfillment types | ServiceFeesServiceImpl.java:111 (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-appservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentappservice/app/services/impl/ServiceFeesServiceImpl.java:111`) |
| Fee identifier format | ServiceFeesIdentifier.java:21 (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-appservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentappservice/app/domain/mappers/ServiceFeesIdentifier.java:21`) |
| Address update access checks | AddressOpaAuthorizationImpl.java:44 (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-appservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentappservice/app/authorization/AddressOpaAuthorizationImpl.java:44`) |
| Warehouse fallback and default singleton | WarehousesServiceImpl.java:37 (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/service/impl/WarehousesServiceImpl.java:37`) |
| Post-location update saves body | PostLocationsController.java:61 (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/controllers/PostLocationsController.java:61`) |
| Fulfillment type PATCH merges and validates | FulfillmentTypesServiceImpl.java:101 (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/service/impl/FulfillmentTypesServiceImpl.java:101`) |
| Patch nested rule mapping | FulfillmentTypePatchMapper.java:23 (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/domain/mapper/FulfillmentTypePatchMapper.java:23`) |
| Date selection ordering window | DeliveryDateRepository.java:25 (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/repositories/DeliveryDateRepository.java:25`) |
| Postcode update body-id and version | PostalCodeServiceabilityServiceImpl.java:163 (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/service/impl/PostalCodeServiceabilityServiceImpl.java:163`) |
| Dataservice structured error mapping | GlobalExceptionHandler.java:67 (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-dataservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentdataservice/app/exceptions/handler/GlobalExceptionHandler.java:67`) |
| Legacy aggregation arithmetic | InventoryAggregationService.java:25 (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-eventservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmenteventservice/app/service/InventoryAggregationService.java:25`) |
| Legacy intraday write is TODO | IntraDayFeedInventoryEventConsumer.java:57 (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-eventservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmenteventservice/app/consumer/impl/IntraDayFeedInventoryEventConsumer.java:57`) |
| Availability producer catches send failures | InventoryAvailabilityEventProducer.java:44 (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-eventservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmenteventservice/app/producer/impl/InventoryAvailabilityEventProducer.java:44`) |
| Sales order disable gate | SalesOrderEventConsumer.java:110 (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-eventservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmenteventservice/app/consumer/impl/SalesOrderEventConsumer.java:110`) |
| Limited AS400 event validation | As400InventoryEventValidator.java:35 (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-eventservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmenteventservice/app/validator/impl/As400InventoryEventValidator.java:35`) |
| HTTP error routing order | StockLevelServiceImpl.java:52 (local reference: `D:/BE Projects/checkout/fulfillment/commerce-fulfillment-eventservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmenteventservice/app/service/impl/StockLevelServiceImpl.java:52`) |

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
