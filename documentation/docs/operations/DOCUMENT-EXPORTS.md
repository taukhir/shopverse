---
title: Documentation Export Architecture
page_type: Reference
difficulty: Intermediate
status: Implemented
last_reviewed: "2026-07-10"
---

# Documentation Export Architecture

Every guide supports browser print-to-PDF and a browser-generated
Word-compatible `.doc` file. Both paths use the current article content and a
print-oriented version of the portal theme.

## Optional True DOCX Service

A static browser cannot reliably reproduce complex HTML, Mermaid SVGs, page
breaks, tables, and code blocks as a native OOXML document. If readers report
that the `.doc` output is insufficient, configure:

```text
DOCS_DOCX_EXPORT_ENDPOINT=https://docs-export.example.com/v1/docx
```

The portal then sends `title`, sanitized article `html`, and `sourceUrl` as
JSON. The service must return a DOCX response. A production implementation
should authenticate requests, enforce an HTML-size limit, sanitize markup,
block remote-resource fetching, use a bounded conversion queue, delete
temporary files, and rate-limit callers.

Keep the endpoint unset until those controls and a render-based DOCX quality
gate are available. The browser-compatible `.doc` export remains the safe
fallback.

## Privacy-Aware Analytics

Analytics is disabled by default. To make the opt-in control available, set:

```text
DOCS_ANALYTICS_DOMAIN=docs.example.com
```

The analytics script loads only after explicit reader consent. Progress,
bookmarks, recent pages, and reading preferences remain local and are never
included in analytics events.
