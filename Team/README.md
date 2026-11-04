# ShopVerse Simulated SDLC Team — Context Store

This is persistent memory for the practice SDLC team tracked in
[`TEAM.md`](TEAM.md), so that each role's project knowledge and
decisions survive beyond a single conversation. Without this, every new
session starts the Product Owner, Architect, and everyone else cold, and
"they know the project in and out" stops being true the moment the chat
window closes.

## Structure

Each role has its own folder with four files:

- **`index.md`** — tiny fast-lookup entry point: current one-line status
  and a table of what's in the other three files. **Read this first, and
  only open the other files if the index says you need to.** This is the
  whole point of the split — a role with months of history shouldn't cost
  a full context load just to check its current status.
- **`profile.md`** — who they are: experience, responsibilities, how they
  think. Stable; only edit when the role itself changes.
- **`context.md`** — durable project/domain knowledge this role holds
  (architecture facts, backlog awareness, business context). Append dated
  entries; this is "what they know," not "what was said."
- **`discussions.md`** — append-only log of meeting turns and dialogue this
  role has participated in, newest at the bottom, each under a dated
  heading. This is "what was said and decided," in sequence.
- **`tasks.md`** — current open and completed action items for this role.
  Mark items done in place rather than deleting them.

Never rewrite past entries in `context.md` or `discussions.md` — if
something turns out wrong, append a correction, don't erase the mistake
(that history has value, e.g. the BUG-001 scope correction below).

## Standing Rule: Independent Reasoning

Every role reasons independently and justifies its own position —
disagreement with another role is expected and good, not a problem to
smooth over. A role should never just agree with whoever spoke first or
with the Senior Developer's stated preference. Concretely: when briefing
a role for a meeting turn, don't tell it what another role already said
unless the scenario specifically requires reacting to that input: give it
the same facts, and let its own reasoning (grounded in its `profile.md`
and `context.md`) produce the position, even if that position creates a
disagreement. See `sprints/sprint-0001/discussion-04.md` for why this
matters — Jordan and Priya reasoning independently in parallel surfaced a
real planning conflict (Jordan's proposed BUG-001a vs. Priya's actual
decision) that a single combined answer would have hidden.

## Standing Rule: One Canonical Copy Of Each Fact

Two ledgers exist specifically to stop the same fact or question from
being restated across multiple files, which is what happened before
this rule existed — [`sprint-0001/index.md`](sprints/sprint-0001/index.md)'s
own "current open items" section drifted stale within two meetings
because it duplicated facts that were also being restated elsewhere.

- **[`../DECISIONS.md`](../DECISIONS.md)** — every durable decision,
  one row each, linking to the one place the full reasoning lives.
- **[`../OPEN-QUESTIONS.md`](../OPEN-QUESTIONS.md)** — every currently
  unresolved question, one row each. A question gets listed here
  exactly once; if a new discussion touches it, link to the row and
  update it in place instead of writing "still open after N meetings"
  in a new file.

**Both ledgers are project-level, not sprint-scoped.** When a new sprint
starts, its `index.md` links to these same two files — it does not
start its own "open items"/"decided this sprint" section. A sprint
index may still note which specific rows it moved, but the rows
themselves live in exactly one ledger across the whole project's life.

**Staleness check:** each ledger carries a "Last updated" line at the
top. If you're about to add a row, bump that line. If you're reading a
ledger and the date looks old relative to recent discussion files, run
[`ai-workflows/prompts/team-ledger-audit.md`](../ai-workflows/prompts/team-ledger-audit.md)
before trusting it.

Concretely: when a discussion, role file, or sprint index needs to
reference a past decision or a known-open question, **link to the
ledger row — do not restate the fact or question in prose.** When a
discussion or review round produces a new decision or surfaces a new
open question, add it to the relevant ledger as part of wrapping up that
round, not as an afterthought.

This is also why every role folder (and now `tauqeer/task/*`) follows
the same `index`/`context`/`discussions`/`tasks` split rather than one
growing file per topic — a single file mixing stable facts with a
chronological log is what made `order-contract-design/task.md` the
second-largest file in the whole system before it was split.

## How To Use This

**Before acting as, or consulting, a role:** read that role's `index.md`
first. It tells you the current status and which of the other files
actually matter right now — often you only need `tasks.md`, not a full
reload of `context.md` and `discussions.md`. A subagent playing the
Product Owner should load `Team/product-owner/index.md` before forming an
opinion, the same way a person would glance at their own task list before
a meeting, and only dig into `discussions.md` if the index says there's
unresolved history relevant to the question at hand.

**After a role learns, decides, or is assigned something new:** append to
the right file (`context.md` for durable knowledge, `discussions.md` for
dialogue, `tasks.md` for action items) and update that role's `index.md`
status line so the next lookup doesn't have to re-read everything to find
out what changed. Keep entries factual and specific — cite files and line
numbers where the role is a technical one (Architect, developers), cite
ticket IDs from [`BACKLOG.md`](BACKLOG.md) where the role is
business-facing (Client, PO, BA).

**If a role's existing context doesn't cover something it's asked about:**
that role goes and reads the actual project (README, AGENTS.md, source)
rather than guessing — the whole point of the Product Owner and Architect
"knowing the project in and out" is that their knowledge is grounded, not
invented. Append what was learned afterward so the next session doesn't
have to re-derive it.

## Sprint Ceremony Log

[`sprints/`](sprints/) is the chronological complement to the per-role
folders below — it answers "what happened in this meeting, across
everyone" rather than "what does this one person know." See
[`sprints/README.md`](sprints/README.md) for the structure (discussions,
standups, demo, retro) and why standups are a single rolling log instead
of one file per occurrence.

## Roster Index

Each link goes straight to the role's `index.md` — the fast-lookup entry
point, not the full folder.

| Role | Name | Index |
|---|---|---|
| Senior Solutions Architect | Codex | [senior-solutions-architect/index.md](senior-solutions-architect/index.md) |
| Cybersecurity Engineer | Security agent | [cybersecurity-engineer/index.md](cybersecurity-engineer/index.md) |
| Senior Developer | *(you)* | [senior-developer/index.md](senior-developer/index.md) |
| Product Architect | Elena Vasquez | [product-architect/index.md](product-architect/index.md) |
| Product Owner | Jordan Lee | [product-owner/index.md](product-owner/index.md) |
| Client | Priya Raman | [client/index.md](client/index.md) |
| Business Analyst | Sam Okafor | [business-analyst/index.md](business-analyst/index.md) |
| Frontend Developer (Junior Dev 1) | Maya Chen | [frontend-developer/index.md](frontend-developer/index.md) |
| Senior Microservices Developer | Diego Alvarez | [senior-microservices-developer/index.md](senior-microservices-developer/index.md) |
| Backend Developer (Junior Dev 2) | Arjun Mehta | [backend-developer/index.md](backend-developer/index.md) |
| Tester 1 | Noah Bennett | [tester-1/index.md](tester-1/index.md) |
| Tester 2 | Lena Ortiz | [tester-2/index.md](tester-2/index.md) |
