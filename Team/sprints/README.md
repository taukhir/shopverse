# Sprint Ceremony Log

This is the chronological complement to the per-role folders one level up
(`../product-architect/`, `../product-owner/`, etc.). The distinction
matters:

- **Per-role files** (`context.md`, `discussions.md`, `tasks.md`) answer
  "what does this person know and what have they said, across all time."
  Read one role's `index.md` when you need to act as or consult that role.
- **Sprint ceremony files** (here) answer "what happened in this specific
  meeting, across everyone." Read a sprint's `index.md` when you need to
  reconstruct a point-in-time event rather than one person's accumulated
  view.

Both exist because they serve different lookups — don't try to merge them.

## Structure

```
sprints/
  sprint-0001/
    index.md        -- sprint goal, status, dates, links to everything below
    discussion-01.md, discussion-02.md, ...   -- one file per substantive meeting
    standups.md      -- single rolling log, dated entries (see note below)
    demo.md          -- end-of-sprint demo notes
    retro.md          -- end-of-sprint retrospective
```

**Why standups are one rolling file, not one file per standup:** a standup
is short (yesterday/today/blockers) and frequent. One file per occurrence
would multiply file count fast for almost no content each, which works
against the whole point of this structure — fast, cheap lookups. Append
dated entries to `standups.md` instead. Discussions get their own numbered
files because they're substantive enough to be worth isolating (so a
lookup for "what happened in discussion-02" doesn't have to load every
other discussion too).

## Naming

Sprint folders are zero-padded for sort order: `sprint-0001`,
`sprint-0002`, etc. Discussion files are numbered within a sprint, reset
per sprint: `discussion-01.md`, `discussion-02.md`.

## Sprint Index

| Sprint | Status | Goal |
|---|---|---|
| [sprint-0001](sprint-0001/index.md) | In progress | Resolve BUG-001 (multi-item checkout) |
