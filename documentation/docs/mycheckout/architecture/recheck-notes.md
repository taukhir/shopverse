---
slug: /mycheckout/architecture/recheck-notes
title: "mycheckout — Architecture recheck — revision 2"
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

# mycheckout — Architecture recheck — revision 2

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `architecture/RECHECK-NOTES.md` |
| Source SHA256 | `585e5807b0c91520a52f82bb5bbaf382bd0c37c1bda247d5c5fbb20d49c1d9a6` |
| Guide part | 1 of 1 |

## Architecture recheck — revision 2 {#architecture-recheck--revision-2}

## Revision 3 channel and deployment expansion {#revision-3-channel-and-deployment-expansion}

<a id="shared-6e753b273864"></a>

- Added the project owner's confirmed channels individually: POS terminals, LINE, iOS, Android, CSP, NextGen Web, plus additional partner/system callers.
- Expanded to ten editable pages, retaining a clean overview and adding channel routing, detailed service dependencies, and EKS runtime topology.
- Kept channel presence separate from unverified channel-specific BFFs, LINE adapters/webhooks, mobile login and session-renewal internals.
- Added the CSP backend data path. `csp/commerce-csp-dataservice-main/source/app/src/main/resources/application.yml` confirms PostgreSQL and the `csp` schema. CSP app gateway and network-policy configuration is present in `deployment-config/ngcom-microservice/values-common.yaml`.
- Checkout dependency detail is grounded in `checkout/commerce-checkout-bizservice/source/domain/build.gradle` API contract declarations and previously traced call sites; not every operation invokes every client.
- `fulfillment/commerce-fulfillment-appservice/app-configs/configmap.yml` references `${APIGEE_BASE_PATH}/rest/v1/valomsds` for shipping restrictions. Apigee is therefore shown only as an outbound integration boundary; the primary inbound gateway remains the verified Istio configuration.
- The EKS view distinguishes ingress routing, Kubernetes Services/internal DNS, application Deployments, replicas, jobs, and external managed capabilities. It does not invent the cluster/node/AZ count or uniform sidecars.

Reviewed on 10 November 2026. This is a static code/configuration review, not a production topology discovery.

## Corrections and additions {#corrections-and-additions}

<a id="shared-b02c59a01510"></a>

- Replaced the dense overview with a numbered, layered view: clients, API routing, EKS services, managed data, asynchronous processing, operations.
- Separated CDN/static assets from API traffic. CDN, edge products and identity-provider details remain explicitly unverified.
- Added the asynchronous payment-completion flow: `salesorderpayments_pub_v1` -> adapter -> lookup checkout by order ID -> place-order only for `AWAITING_PAYMENT`, with checkout version.
- Corrected the earlier simplification that sales orders are always published through CDC. Oversized records use `PUBLISHED_BINARY` staging and direct publication after save; normal records use filtered DynamoDB Streams CDC.
- Marked the inventory CDC path as the NEXTGEN implementation. Manhattan is a configurable alternative, not automatically part of the PostgreSQL ledger path.
- Added explicit service-to-store ownership and distinguished S3 archives, OpenSearch read models and Redis state. No direct S3-to-OpenSearch indexing path is inferred.
- Added the fulfillment CronJob -> command API -> DynamoDB locations -> Redis GEOADD loader path. Schedules differ by market; no universal interval is claimed.
- Added provider-authentication boundaries: the backend requests a token and then calls the provider; the token endpoint does not itself call the provider API. Egress-mode authentication is a separate configurable path.
- Retained Kafka schema/tenant routing, per-consumer RLQ/DLQ behavior, configuration/secrets, KEDA/HPA, metrics, tracing and monitoring.
- Added explicit draw.io connection ports and orthogonal waypoints; measured text widths and checked unrelated-node intersections.

## Direct source references {#direct-source-references}

All paths below are relative to `D:/BE Projects/checkout`.

<a id="shared-95368c6b9cb7"></a>

| Subject | Source |
|---|---|
| Payment completion and state guard | `checkout/commerce-checkout-eomadaptorservice/source/app/src/main/java/com/mycheckout/commerce/checkoutadaptorservice/service/impl/SalesOrderPaymentsServiceImpl.java` |
| Oversized sales-order staging/direct publication | Same repository: `service/impl/SalesOrderServiceImpl.java`, `producer/SalesOrderProducer.java` |
| Checkout CDC state-transition filter | `checkout/commerce-checkout-dataservice/infra-as-code/cdk/app-infra/configs/jpn/prod.yaml` |
| Sales-order CDC PUBLISHED/REPUBLISHED filter | `checkout/commerce-checkout-eomadaptorservice/infra-as-code/cdk/app-infra/configs/jpn/prod.yaml` |
| PostgreSQL stock ledger CDC | `fulfillment/commerce-fulfillment-dataservice/infra-as-code/cdk/app-infra/configs/jpn/prod.yaml` |
| Reservation implementation selection | Fulfillment data service: `service/impl/ReservationsServiceImpl.java` and `StockLevelReservationService.java` |
| Location rebuild | Fulfillment data service: `strategies/commands/impl/RedisServiceLocationLoadingCommandStrategy.java` |
| Job command execution/status polling | `fulfillment/commerce-fulfillment-jobservice/source/app/src/main/java/com/mycheckout/commerce/fulfillmentappservice/app/service/CommandExecutionService.java` |
| Market-specific schedules | Fulfillment job service: `deployment-config/ngcom-microservice/values-jpn-prod.yaml`, `values-latam-prod.yaml` |
| Order event intake/archive | `order/commerce-order-eventservice-main/source/app/src/main/java/com/mycheckout/commerce/ordereventservice/app/listener/EomEventListener.java`, `EomEventBaseListener.java` |
| GitOps metadata | Order repositories: `metadata.yml`, annotation `argocd/app-selector` |
| OAuth2 client credentials | Checkout business service: `config/HybrisAuthConfig.java` |
| Provider egress selection | Fulfillment appservice: `app-configs/configmap.yml`, `config/ManhattanClientAuthConfiguration.java` |
| Broader context | `docs/END-TO-END-SYSTEM.md`, `docs/INTERVIEW-PREP.md`, domain documentation |

<a id="shared-2cbac5061211"></a>

The surrounding product, cart, tax and order ownership descriptions partly rely on existing project documentation; they do not represent a full independent audit of those domains. Existing broad security settings are not proof of effective runtime enforcement.

## Remaining boundaries {#remaining-boundaries}

<a id="shared-7f0b17f106b2"></a>

The exact CDN, WAF, external load balancer, identity issuer, token lifetimes, centralized log destination, external indexer, node autoscaler, failover placement, and effective rendered mesh policies still require platform/identity configuration. No dedicated outbox, universal mTLS, distributed rate limiter or blanket exactly-once guarantee has been added without evidence.

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
