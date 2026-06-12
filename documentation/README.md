# Backend Engineering Docusaurus Portal

This folder contains the Docusaurus application. The documentation content
continues to live in `../docs`, so GitHub Markdown and the generated site use
the same source files.

The portal is organized as a reusable backend engineering study library.
Shopverse appears as a case study rather than defining the complete
documentation taxonomy.

## Local Development

```powershell
cd documentation
npm install
npm start
```

Open `http://localhost:3000/shopverse/`.

## Production Build

```powershell
npm run build
npm run serve
```

The generated static site is written to `documentation/build`.

## Content Rules

- Add reusable project and study material under `docs/`.
- Keep service-specific commands and configuration in each service README.
- Prefer Mermaid for architecture and sequence diagrams.
- Mark roadmap items as planned rather than implemented.
- Link to source files instead of duplicating implementation code unnecessarily.
