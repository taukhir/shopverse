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

## Content Rules

- Add reusable project and study material under `documentation/docs/`.
- Keep service-specific commands and configuration in each service README.
- Prefer Mermaid for architecture and sequence diagrams.
- Mark roadmap items as planned rather than implemented.
- Link to source files instead of duplicating implementation code unnecessarily.
