# Backend Engineering Docusaurus Portal

This folder contains both the Docusaurus application and its documentation
content. Markdown and MDX live under `documentation/docs`, while React
components, styling, static assets, and build configuration remain beside it.

The complete setup, customization, content, image, Mermaid, search,
troubleshooting, and GitHub Pages deployment guide is:

```text
documentation/docs/operations/DOCUSAURUS.md
```

The portal is organized as a reusable backend engineering study library.
Shopverse appears as a case study rather than defining the complete
documentation taxonomy.

Reader experience includes local full-text search, Mermaid diagrams, dark
mode, collapsible navigation, a reading-progress indicator, image previews,
reading-time and word-count metadata, share and feedback actions, print-friendly
pages, and a back-to-top control for long technical guides.

## Local Development

```powershell
cd documentation
npm ci
npm start
```

Open `http://localhost:3000/shopverse/`.

## Production Build

```powershell
npm run typecheck
npm run build
npm run serve
```

The generated static site is written to `documentation/build`.

## Automated Verification

Run the same complete gate used by the main and scheduled CI workflows:

```powershell
npm run check
```

The gate validates all source pages, governed terminology, metadata, sidebar
registration, depth and duplicate-content rules, executable Java and Spring
examples, TypeScript, strict Docusaurus links and anchors, the production build,
all generated routes and assets, performance budgets, accessibility, responsive
layout, images, Mermaid diagrams, reader features, and Chromium, Firefox, and
WebKit behavior.

Useful narrower commands:

```powershell
npm run check:fast           # changed content and TypeScript
npm run check:content-quality
npm run check:build          # strict build, generated-site crawl, performance
npm run test:changed         # changed/representative routes on desktop + mobile
npm run test:cross-browser   # Firefox + WebKit smoke coverage
npm run test:visual          # committed Chromium screenshot baselines
npm run check:scheduled      # complete gate plus live official-link validation
```

Pull requests run changed-page and representative UI coverage. Pushes and the
weekly schedule run the complete suite. UI/theme changes also trigger visual
regression, and the schedule checks official external references. Browser failure
traces, screenshots, and diffs are uploaded by GitHub Actions.

## Content Rules

- Add reusable project and study material under `documentation/docs/`.
- Keep project ADRs under `documentation/docs/architecture/adr/` so they are
  rendered and searchable with the rest of the Docusaurus portal.
- Keep service-specific commands and configuration in each service README.
- Prefer Mermaid for architecture and sequence diagrams.
- Mark roadmap items as planned rather than implemented.
- For Shopverse-specific pages, separate current runtime behavior from
  production hardening and target design.
- Every Shopverse implementation claim should either link to runnable evidence,
  source/configuration, or the implementation matrix.
- Preserve generic study material as reusable guidance. Do not imply that a
  generic production practice is already implemented by Shopverse unless a
  case-study page marks it implemented.
- Link to source files instead of duplicating implementation code unnecessarily.
