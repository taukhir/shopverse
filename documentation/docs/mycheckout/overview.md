---
slug: /mycheckout/overview
title: "mycheckout documentation"
mdx:
  format: md
difficulty: Advanced
page_type: Learning Path
status: maintained
scope: generic
owner: docs-mycheckout
reviewer: documentation-maintainers
review_evidence: imported-source-documentation-link-and-build-check
last_reviewed: "2026-11-16"
---

# mycheckout documentation

Explore the retail checkout platform through its architecture, checkout and payment flows, fulfillment behavior, API references and interview guides. This project is separate from the Shopverse implementation.

## Start reading

### Architecture and platform

- [API and Event Catalogue (all domains)](/mycheckout/api-and-event-catalog)
- [Documentation Coverage Audit](/mycheckout/coverage-audit)
- [NextGen Commerce: End-to-End System Guide](/mycheckout/end-to-end-system/part-1) (6 linked parts)
- [mycheckout NextGen commerce architecture](/mycheckout/architecture/readme)
- [Architecture recheck — revision 2](/mycheckout/architecture/recheck-notes)

### Checkout and payment flows

- [Create Checkout — Complete Flow](/mycheckout/create-checkout-flow/part-1) (2 linked parts)
- [Checkout Payment and CDC Complete Flow](/mycheckout/payment-cdc-sequence-guide/part-1) (3 linked parts)
- [Place Order — Complete Flow](/mycheckout/place-order-flow/part-1) (3 linked parts)
- [Guest checkout: end-to-end flow](/mycheckout/guest-checkout-flow/part-1) (6 linked parts)

### Fulfillment

- [Fulfilment](/mycheckout/fulfilment-understanding-notes/part-1) (2 linked parts)
- [Fulfillment API catalog](/mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1) (5 linked parts)
- [Executive summary](/mycheckout/fulfillment-docs/fulfillment-bug-context)
- [Completeness check](/mycheckout/fulfillment-docs/fulfillment-complete-context/part-1) (2 linked parts)
- [Fulfillment configuration registrations](/mycheckout/fulfillment-docs/fulfillment-configuration-catalog)
- [Fulfillment: End-to-End Guide](/mycheckout/fulfillment-docs/fulfillment-end-to-end/part-1) (6 linked parts)
- [Fulfillment: Interview Prep Guide](/mycheckout/fulfillment-docs/fulfillment-interview-prep/part-1) (3 linked parts)
- [Redis and Delivery Fee: Deep Dive](/mycheckout/fulfillment-docs/fulfillment-redis-and-delivery-fee/part-1) (2 linked parts)
- [Fulfillment reverse-engineering reference](/mycheckout/fulfillment-docs/fulfillment-reverse-engineering/part-1) (2 linked parts)
- [Fulfillment source evidence index](/mycheckout/fulfillment-docs/fulfillment-source-index/part-1) (3 linked parts)
- [Fulfilment Engineering Reference](/mycheckout/fulfillment-docs/fulfilment-understanding-notes/part-1) (4 linked parts)
- [Fulfillment documentation](/mycheckout/fulfillment-docs/readme)
- [Fulfillment Availability Calculation Fix](/mycheckout/fulfillment-docs/fulfillment-availability-issue-fix)

### Interview preparation

- [AWS Interview Preparation for Checkout](/mycheckout/aws-interview-prep/part-1) (2 linked parts)
- [Checkout Platform: Interview Preparation](/mycheckout/interview-prep/part-1) (7 linked parts)

## Evidence and naming

These pages are imported source documentation, not a fresh review of the application. Keep each guide's original evidence date, source/configuration labels, known gaps and runtime limitations. The import review covers navigation and rendering.

Organization names in packages, hosts and excerpts have been anonymized to **mycheckout**. Such examples may differ from the real source and are not working deployment settings. Historical bug/fix notes are retained as history.

## Architecture diagrams

### platform overview

![mycheckout 01 platform overview](/mycheckout/architecture/01-platform-overview.svg)

### order and inventory events

![mycheckout 02 order and inventory events](/mycheckout/architecture/02-order-and-inventory-events.svg)

### ci cd and infrastructure

![mycheckout 03 ci cd and infrastructure](/mycheckout/architecture/03-ci-cd-and-infrastructure.svg)

### security scaling monitoring

![mycheckout 04 security scaling monitoring](/mycheckout/architecture/04-security-scaling-monitoring.svg)

### data ownership and caching

![mycheckout 05 data ownership and caching](/mycheckout/architecture/05-data-ownership-and-caching.svg)

### payment and integrations

![mycheckout 06 payment and integrations](/mycheckout/architecture/06-payment-and-integrations.svg)

### frontends and api routing

![mycheckout 07 frontends and api routing](/mycheckout/architecture/07-frontends-and-api-routing.svg)

### service dependencies

![mycheckout 08 service dependencies](/mycheckout/architecture/08-service-dependencies.svg)

### eks deployment topology

![mycheckout 09 eks deployment topology](/mycheckout/architecture/09-eks-deployment-topology.svg)

### scope and evidence

![mycheckout 10 scope and evidence](/mycheckout/architecture/10-scope-and-evidence.svg)

## Downloads

- [Checkout-Design-Patterns.docx](/mycheckout/Checkout-Design-Patterns.docx)
- [Japan_Commerce_Order_Flow_Guide.docx](/mycheckout/Japan_Commerce_Order_Flow_Guide.docx)
- [Checkout-Flows.drawio](/mycheckout/architecture/Checkout-Flows.drawio)
- [mycheckout-architecture-bundle.zip](/mycheckout/architecture/mycheckout-architecture-bundle.zip)
- [mycheckout-complete-architecture.drawio](/mycheckout/architecture/mycheckout-complete-architecture.drawio)
- [mycheckout-overview.drawio](/mycheckout/architecture/mycheckout-overview.drawio)
- [Checkout-Flows.pdf](/mycheckout/architecture/output/pdf/Checkout-Flows.pdf)
- [mycheckout-Architecture-and-CICD-Handbook.pdf](/mycheckout/architecture/output/pdf/mycheckout-Architecture-and-CICD-Handbook.pdf)
- [Fulfilment-Engineering-Reference.docx](/mycheckout/fulfillment%20docs/Fulfilment-Engineering-Reference.docx)

## Recommended Next

Start with the [end-to-end system guide](/mycheckout/end-to-end-system/part-1), then follow [create checkout](/mycheckout/create-checkout-flow/part-1) and [place order](/mycheckout/place-order-flow/part-1).


## Official References

Platform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.

- [AWS service documentation](https://docs.aws.amazon.com/)
- [Apache Kafka documentation](https://kafka.apache.org/documentation/)
- [Quarkus guides](https://quarkus.io/guides/)

## Source snapshot

The checked-in pages work without the original local folder. The source is `checkout/docs`; source hashes, imported pages and assets are recorded in `documentation/mycheckout-import-manifest.json`. Chat history, raw logs, private shortcuts, scripts and temporary/backup exports are excluded.

