# Update Documentation

Use this workflow to add or revise ShopVerse documentation without creating
duplicate, disconnected, or unverified guidance.

## Inputs

```text
Reader outcome: [what the reader can understand or do]
Audience and difficulty: [values]
Topic and scope: [values]
Authoritative sources: [repository files, official docs, ADRs]
Existing pages to assess: [paths or discover them]
Navigation location: [track/category or discover it]
Freshness requirements: [current facts needing verification]
```

## Workflow Prompt

```text
Follow AGENTS.md and inspect existing documentation before editing.

1. Search for overlapping coverage, canonical pages, terminology, and links.
2. Verify repository-specific claims against current source, build files, tests,
   or configuration.
3. Verify temporally unstable external claims using authoritative primary
   documentation and cite them close to the supported statement.
4. Propose whether to extend an existing page or add a focused new page.
5. Preserve metadata conventions, progression, and sidebar organization.

Write for practical understanding. Include prerequisites, mental model, concrete
examples, failure modes, security/operational trade-offs, validation, interview
signals, and next links when they materially help. Do not pad the page with
generic text or copy large passages from sources.

After editing:
- run the full documentation validator for broad changes;
- run maintenance, language, and TypeScript checks;
- run the Docusaurus production build;
- verify every new route exists;
- review internal links, HTTPS links, metadata, and the final diff.

Return changed pages, navigation changes, validation results, source links, and
known gaps. Do not claim complete coverage merely because a page exists.
```

## Quality Gate

The final documentation must agree with actual ShopVerse behavior. Mark planned
patterns as planned; do not describe a reference guide, such as the inbox pattern,
as an implemented runtime feature unless code and migrations prove it.
