# Audit Progress Tracker

Use this workflow to re-verify `Team/PROGRESS.md` against actual source code and
correct drift, instead of trusting prior status claims or copying status from
documentation without checking it.

## Inputs

```text
Scope: [whole repository, or named services/areas]
Areas of suspected drift: [rows in Team/PROGRESS.md you doubt, or "none, full sweep"]
Related docs to cross-check: [e.g. documentation/docs/reference/FEATURES-*.md]
```

## Workflow Prompt

```text
Follow AGENTS.md. This is a read-only audit; do not modify service code.

1. Read the current Team/PROGRESS.md in full.
2. For each row in scope, verify the claimed status against real source:
   controllers/routers, entities/migrations, Kafka producer/consumer classes,
   and frontend routes/components. Do not accept a README, ADR, or prior
   Team/PROGRESS.md entry as evidence on its own — find the code.
3. Re-run the same keyword sweep the tracker was built from (search, review,
   rating, wishlist, coupon, discount, tax, shipping-provider, currency,
   notification, recommend, plus any new keywords relevant to recent work) to
   catch newly added or newly removed capabilities that predate this audit.
4. Cross-check documentation/docs/reference/FEATURES-SECURITY-CHECKOUT.md and
   FEATURES-RELIABILITY-OBSERVABILITY.md for status changes since the last
   audit; note any disagreement between those pages and what the code shows.
5. Update Team/PROGRESS.md: change Status values with new evidence citations
   (file:line where practical), move completed roadmap items into the
   relevant table with "Done" and evidence, add newly discovered gaps, and
   remove rows that no longer apply (with a one-line reason in the diff, not
   in the file).
6. Update the "verified against source code on <date>" line at the top of
   Team/PROGRESS.md to the audit date.

Do not mark a row Done on the basis of a docs page alone, a test name, or a
class/method name that only partially implements the described behavior.
Prefer "Partial" with a precise description of what is missing over rounding
up to "Done" or down to "Missing".
```

## Quality Gate

Every Status change in the diff must cite the code that justifies it. A
Team/PROGRESS.md that has not been re-verified against source for a long time is
worse than no Team/PROGRESS.md — it will be trusted and it will be wrong. Run this
workflow after any milestone that plausibly changes several rows (a new
service capability, a removed stub, a new frontend feature) rather than on a
fixed calendar, since ShopVerse has no automation that triggers this on its
own.
