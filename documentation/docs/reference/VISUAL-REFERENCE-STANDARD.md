---
title: Documentation Visual And Reference Standard
difficulty: Beginner
page_type: Reference
status: Generic
learning_objectives: [Choose an appropriate visual format, Make diagrams accessible and maintainable, Cite authoritative technical sources]
technologies: [Docusaurus, SVG, Mermaid]
last_reviewed: "2026-07-12"
---

# Documentation Visual And Reference Standard

Visuals answer a specific question. Use Mermaid for flows and sequences, SVG for
precise reusable internals diagrams, graphs for measured relationships, and GIF
only when changing state cannot be understood as clearly from a static sequence.

## Required Visual Properties

- repository-owned or licensed/attributed source;
- meaningful alt text describing the information, not “diagram”;
- nearby caption explaining how to read it and its limitation;
- readable at mobile width and in light/dark contexts;
- no information represented by color alone;
- optimized file size and stable descriptive filename;
- accompanying text that remains sufficient when images are unavailable.

Prefer SVG/Mermaid over raster screenshots for architecture. Preserve externally
supplied images only when attribution and learning value justify them. Do not copy
an official diagram merely because the official page can be linked.

## Animation Rule

Animation is appropriate for GC movement, scheduler ownership changes, work
stealing, retry state, or partition reassignment. Provide pause-friendly duration,
avoid flashing, keep the final state visible, and describe the same states in text.

## Official References

Technical pages should link to exact primary-source sections: specifications,
RFCs, project reference manuals, API documentation, JEPs, or vendor operational
manuals. Separate official references from optional community reading. Record
version-specific claims and review them when dependencies upgrade.

## Automated Audit

Run `npm run check:docs:audit` to report repeated long paragraphs, advanced pages
without official references, text-heavy pages without images, missing recommended-
next sections, and possible sidebar orphans. The report is advisory until reviewed;
generated category behavior and deliberate canonical repetition can produce valid exceptions.
