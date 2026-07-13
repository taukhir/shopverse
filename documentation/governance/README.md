# Spring Documentation Governance

`npm run check:spring-quality` is the required local gate for Spring documentation.

- `check:docs:governance` validates internal links, duplicate sections, sidebar
  registration, governed versions, and source/test references.
- `check:spring-labs` compiles and tests source-linked examples with the Java 21
  toolchain against Spring Boot 4.0.6.

Runnable examples must live under `documentation/labs/spring-architect` and be
referenced from a page with `snippet-source` and `snippet-test` comments. Small
Java fragments may explain an API, but must not be described as executable. New
architect-lab, decision, and audited security pages containing Java fences must
link to compiled source and a test.
