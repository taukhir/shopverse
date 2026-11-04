# Sam Okafor — Discussion Log

Append-only. Newest entries at the bottom. Don't rewrite past entries.

### 2026 — finalized functional spec for BUG-001
Delivered full spec: user story, 5 functional requirements, business
rules (resolved the duplicate-SKU non-issue, excluded BUG-002 from scope),
3 Gherkin acceptance scenarios, explicit out-of-scope list, Nov 12
deadline with rationale.

**Flagged at the time:** the spec assumed the fix was
frontend-submission-scoped. The Architect has since found the real fix
touches the backend API contract, the Kafka event schema, and a DB
migration. The functional requirements/acceptance criteria describe
*business* behavior and are still valid — but "Out of Scope" assumed "no
order-service persistence change," which is now known to be wrong.
