# Documentation Governance

Every Markdown/MDX page carries normalized governance metadata:

```yaml
difficulty: Beginner | Intermediate | Advanced | Architect | All Levels
page_type: Guide | Learning Path | Deep Dive | Concept | Reference | Decision Guide | Tutorial | Interview | Workbook | Practice | Lab | Runbook | Case Study
status: maintained | draft | proposed | deprecated
scope: generic | shopverse | hybrid | compatibility
owner: docs-domain-or-component
reviewer: documentation-maintainers
review_evidence: repository-content-audit-or-review-artifact
last_reviewed: YYYY-MM-DD
```

Use `npm run normalize:metadata` only for a deliberate repository-wide migration;
ordinary page changes should edit metadata explicitly. The full validator rejects
missing or unsupported values, and the library explorer exposes lifecycle, scope,
owner, difficulty, and page type as filters.

`npm run check:spring-quality` is the required local gate for Spring documentation.

All educational pages also follow the
[learning progression standard](./learning-progression-standard.md): begin with
a plain-language definition and beginner mental model, then progress through a
concrete example, mechanics, trade-offs, failure modes, production evidence, and
the next prerequisite-ordered topic. The repository-wide progression audit is
advisory until each domain has been remediated; it must not be bypassed with
generic filler.

- `check:docs:governance` validates internal links, duplicate sections, sidebar
  registration, governed versions, and source/test references.
- `check:spring-labs` compiles and tests source-linked examples with the Java 21
  toolchain against Spring Boot 4.0.6.

Runnable examples must live under `documentation/labs/spring-architect` and be
referenced from a page with `snippet-source` and `snippet-test` comments. Small
Java fragments may explain an API, but must not be described as executable. New
architect-lab, decision, and audited security pages containing Java fences must
link to compiled source and a test.
