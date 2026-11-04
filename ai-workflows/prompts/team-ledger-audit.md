# Audit Team Ledgers

Use this workflow to re-verify `Team/DECISIONS.md` and
`Team/OPEN-QUESTIONS.md` against the actual current state of the
simulated-team workspace (role `discussions.md`/`tasks.md` files, sprint
discussion files), instead of trusting the ledgers once written and
never re-checked. Companion to [`progress-audit.md`](progress-audit.md),
which does the same thing for `Team/PROGRESS.md` against source code — this
one does it for team decisions/open-questions against the team's own
discussion history.

## Inputs

```text
Scope: [a specific sprint, a specific role, or "whole Team/ tree"]
Rows of suspected drift: [row numbers in either ledger, or "none, full sweep"]
Recent review rounds to check: [discussion-NN files or role discussions.md entries since the last audit]
```

## Workflow Prompt

```text
Read Team/README.md's "Standing Rule: One Canonical Copy Of Each Fact"
section first. This is a read-only audit; do not modify role profile.md
files, and do not rewrite history in any discussions.md — append
corrections, never erase past entries.

1. Read Team/DECISIONS.md and Team/OPEN-QUESTIONS.md in full.
2. For each row in scope, verify it against the actual source: the
   cited role's discussions.md/context.md entry, or the cited sprint
   discussion file. Do not accept a ledger row's own prior wording as
   evidence of itself — find where the decision or question actually
   originated and confirm the row still matches it.
3. Read every sprint discussion file and role discussions.md entry
   since the ledgers' last "Last updated" date. For each one, check:
   - Did it produce a decision not yet in DECISIONS.md? Add it.
   - Did it resolve an open question? Move it to OPEN-QUESTIONS.md's
     "Resolved" section with a one-line resolution + link; do not
     delete the row.
   - Did it surface a new open question? Add it to OPEN-QUESTIONS.md.
   - Did it restate an existing ledger row instead of linking to it?
     That's drift in the discussion file, not the ledger — flag it in
     your report, but do not edit past discussion files to fix it
     (they're historical record); fix it going forward instead.
4. Check every role's tasks.md for action items that correspond to an
   OPEN-QUESTIONS.md row. If a role's tasks.md marks something done
   that the ledger still shows open (or vice versa), reconcile and note
   which one was stale.
5. Update the "Last updated" line at the top of both ledgers to the
   audit date and the latest row number touched.

Do not mark a question resolved on the basis of someone having given an
opinion on it — resolved means a decision was actually made and acted
on, not just discussed. Prefer leaving a row open with a note like
"opinions given, no decision made" over prematurely closing it.
```

## Quality Gate

Every ledger change in the diff must cite the discussion file or role
file that justifies it. A ledger that has not been re-verified for
several review rounds is worse than no ledger — it will be trusted and
it will be wrong, which is the exact failure `sprint-0001/index.md` hit
before these ledgers existed. Run this workflow after any meeting round
that touches several open items at once, or when a ledger's "Last
updated" row number looks far behind the most recent discussion file's
number.
