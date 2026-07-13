---
title: Security Architect Interview Workbook
description: Expandable scenarios for identity, authorization, tokens, secrets, zero trust, and incident response.
difficulty: Advanced
page_type: Interview
status: Generic
prerequisites: [Security architect path]
learning_objectives: [Answer with threat reasoning, Separate controls, Explain failure response]
technologies: [OAuth2, OIDC, JWT, mTLS]
last_reviewed: "2026-07-13"
---

# Security Architect Interview Workbook

<DocLabels items={[
  {label: 'Architect interview', tone: 'advanced'},
  {label: 'Expandable answers', tone: 'production'},
  {label: 'Threat scenarios', tone: 'shopverse'},
]} />

**Authentication versus authorization versus ownership?**

<ExpandableAnswer title="Expand answer">

Authentication establishes identity; authorization evaluates permitted operations;
ownership applies dynamic domain policy. A valid token and role can still be denied
for another customer’s order.

</ExpandableAnswer>

**Opaque token versus JWT?**

<ExpandableAnswer title="Expand answer">

JWT enables local verification but carries stale/revocation and rotation complexity.
Opaque tokens centralize current introspection but add latency and control-plane
dependency. Choose from threat, latency, revocation SLA and operating model.

</ExpandableAnswer>

**Where should secrets live?**

<ExpandableAnswer title="Expand answer">

In a managed secret or workload-identity system with least privilege, audit,
rotation and short lifetime. Environment injection may deliver a secret, but Git,
images, logs and frontend code must never be its source of truth.

</ExpandableAnswer>

**Why validate JWT audience?**

<ExpandableAnswer title="Expand answer">

Issuer and signature prove who minted an intact token. Audience restricts where it
is intended to be accepted and prevents a token for one API being replayed at
another trusting the same issuer and key.

</ExpandableAnswer>

**How do you test authorization architecture?**

<ExpandableAnswer title="Expand answer">

Test anonymous, invalid identity, insufficient authority, wrong tenant/owner,
privileged success and alternate/direct paths. Include stale role, issuer outage,
key rotation and audit evidence. Negative tests are the primary proof.

</ExpandableAnswer>

## Official References

- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- [OAuth 2.0 Security BCP](https://www.rfc-editor.org/rfc/rfc9700)

## Recommended Next

Return to the [Security Learning Guide](../README.md).
