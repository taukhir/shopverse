---
slug: /mycheckout/architecture/readme
title: "mycheckout — mycheckout NextGen commerce architecture"
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

# mycheckout — mycheckout NextGen commerce architecture

Source names are anonymized; original evidence dates and runtime limitations apply.

| Import record | Value |
|---|---|
| Source document | `architecture/README.md` |
| Source SHA256 | `acbc0f2a5da65b163ca958d5a4e18e2bd08d649b5aec0ecc85fed123befc0885` |
| Guide part | 1 of 1 |

## mycheckout NextGen commerce architecture {#mycheckout-nextgen-commerce-architecture}

<a id="shared-a5ecb79774a5"></a>

Open **mycheckout-complete-architecture.drawio** in draw.io / diagrams.net using **File > Open From > Device**. All boxes, text, and connectors are editable; use the ten page tabs at the bottom. This is revision 3; superseded backups and cached previews are preserved outside this folder in `D:/BE Projects/checkout-docs-backup-20261116/`.

For a clean single-page version, open **mycheckout-overview.drawio**. Both versions are included in the ZIP.

<a id="shared-c2a4a643dff1"></a>

1. Platform overview: clients, CDN boundary, Istio, EKS workloads, data services, Kafka, and shared controls.
2. Order publication and inventory: checkout and sales-order CDC, oversized-order direct publication, consumers, inventory feedback, RLQ/DLQ.
3. CI/CD and infrastructure: GitHub Actions, CodePipeline, CodeBuild, CodeArtifact, ECR, Helm, Argo CD, CDK.
4. Security, scaling, monitoring: token boundaries, authorization, Redis, KEDA/HPA, tracing, metrics, logs.
5. Data ownership and caching: service-to-store dependencies, S3 archive vs OpenSearch, Redis GEO and pickup state, scheduled index loading.
6. Payment and integration boundaries: asynchronous payment completion, state checks, outbound OAuth2 and egress integration.
7. Frontends and API routing: NextGen Web, POS terminals, LINE, iOS, Android, CSP, and additional API callers; gateway routing and guest/login context.
8. Service dependencies: checkout orchestration and configured product, customer/account, promotion, fulfillment, payment/loyalty, tax, subscription, identity and persistence contracts.
9. EKS deployment topology: ingress, internal service discovery, deployments, Pods, jobs, scaling, workload identity, configuration and managed services.
10. Scope and evidence: sources and items requiring platform-team confirmation.

<a id="shared-3ecb87855be1"></a>

Each page also has a high-resolution PNG and vector SVG preview in this directory. Run `python expand_channels.py` to regenerate revision 3 and the ZIP bundle (Python + Pillow). `revise_architecture.py` supplies revision-2 page definitions and validation, while `build_architecture.py` supplies drawing helpers and the original definitions. Running those scripts directly regenerates older revisions. The ZIP contains only the current ten pages, not superseded previews or the backup.

## Evidence and limits {#evidence-and-limits}

<a id="shared-9e75494152a6"></a>

The diagram reflects local documentation and selected source/deployment configuration, reviewed on 10 November 2026. It is a logical view centered on checkout and fulfillment, with surrounding commerce domains for context. It is not a verified organization-wide production inventory.

<a id="shared-5462414a3c1a"></a>

Amber dashed boxes mark unknown products or boundaries. CDN, DNS/WAF/load-balancer details, identity-provider settings, token lifetimes, central logging sink, and exact failover topology are not established by the inspected repositories. Their inclusion is a placeholder for the requested complete view, not evidence that a particular product is deployed. The CDN asset path and edge API path are separated.

<a id="shared-096fb296aa03"></a>

Istio ingress is confirmed; Amazon API Gateway is not. Managed databases and Confluent Kafka are not depicted as application Pods. PostgreSQL CDC and DynamoDB Streams/Lambda CDC are distinct. CDC does not imply a dedicated outbox table or exactly-once processing. Redis pickup state is separate from inventory authority; OpenSearch is a read model rather than a cache.

<a id="shared-6cd2b797e0dc"></a>

Deployment settings may be overridden by market/environment values and shared chart defaults. The diagram does not assert that every route validates JWT, every service enables OPA, or every internal call uses mTLS. Shared pipeline implementations and the external order indexer were not fully inspected.

Primary source documents:

<a id="shared-0bda94f35fa6"></a>

- `D:/BE Projects/checkout/docs/END-TO-END-SYSTEM.md`
- `D:/BE Projects/checkout/docs/INTERVIEW-PREP.md`
- `D:/BE Projects/checkout/docs/fulfillment docs/FULFILLMENT-REDIS-AND-DELIVERY-FEE.md`

<a id="shared-c8be698dd4bd"></a>

The frontend list is confirmed by the project owner. API lines represent logical access; exact LINE adapters, mobile BFFs, session exchange and channel-to-endpoint mappings are not established. CSP is shown separately as a frontend channel and a backend service domain. An outbound Apigee shipping-restriction configuration exists; it does not establish Apigee as the inbound gateway.

<a id="shared-7b1699b26ea7"></a>

Source/config references are also listed on page 10 and in `RECHECK-NOTES.md`. XML/page counts, node identifiers, bounds, orthogonal routes, text widths, and unrelated-node crossings are validated by the generator. Preview images were visually inspected. Draw.io connection ports and route waypoints are explicitly stored to match the previews. The file was not opened in a running draw.io editor during creation.

## Checkout Flows document {#checkout-flows-document}

<a id="shared-2cc13808146a"></a>

`output/pdf/Checkout-Flows.pdf` is the standalone 86-page flow guide. It covers 18 flows with connected walkthroughs, 18 vector flow diagrams, 18 vector sequence diagrams, code excerpts, failure paths and diagnostic checks. `Checkout-Flows.drawio` contains the matching 36 editable diagram pages.

<a id="shared-b3b3b01eea10"></a>

Coverage includes standard/guest creation, guest challenge reuse, GCO/GROUP purchases, interactive/automatic SOP, read/recalculation, parent/child updates, fulfillment, pickup/Redis, payment selection, loyalty, default/Japan place order, asynchronous payment completion, one-shot/POS purchases, order events and concurrency/recovery.

<a id="shared-8eb3f4cc11c2"></a>

Source content is in `checkout_flows_content.py`; `render_checkout_flows.py` generates the PDF and draw.io file. `qa_checkout_flows.py` validates rendered-page counts, source fingerprints, excerpt line correspondence, internal PDF links and draw.io references, then builds visual contact sheets. The QA process inspects source; it does not run live purchases or the referenced application test suites.

<a id="shared-6c423c04dd39"></a>

The flow guide distinguishes executable local code from logical diagram groupings. The subscription scheduler, provider internals, full channel UI mapping and live feature-flag values remain external or unverified. It does not treat bulk/GCO, one-shot order creation and auto-SOP as interchangeable flows.

## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)
