import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';

// Repository-owned reference diagram. Keep the page's evidence notes in sync.
const destination = new URL('../static/img/diagrams/amway-checkout-architecture', import.meta.url);
const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
const box = (x, y, w, title, lines, color = '#2563eb') => `
  <rect x="${x}" y="${y}" width="${w}" height="92" rx="12" fill="white" stroke="${color}" stroke-width="2"/>
  <text x="${x + 18}" y="${y + 29}" font-size="19" font-weight="700" fill="#0f172a">${escape(title)}</text>
  ${lines.map((line, i) => `<text x="${x + 18}" y="${y + 53 + i * 20}" font-size="15" fill="#475569">${escape(line)}</text>`).join('')}`;
const arrow = (path, dashed = false) => `<path d="${path}" fill="none" stroke="${dashed ? '#7c3aed' : '#334155'}" stroke-width="2.5" ${dashed ? 'stroke-dasharray="7 5"' : ''} marker-end="url(#arrow)"/>`;
const band = (y, h, title, subtitle, fill) => `
  <rect x="30" y="${y}" width="1540" height="${h}" rx="18" fill="${fill}"/>
  <text x="55" y="${y + 32}" font-size="21" font-weight="700" fill="#0f172a">${title}</text>
  <text x="55" y="${y + 57}" font-size="16" fill="#475569">${subtitle}</text>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1320" viewBox="0 0 1600 1320" role="img" aria-labelledby="title description">
<title id="title">Amway checkout architecture: reference model from existing notes</title>
<desc id="description">Four bands separate request handling, service-owned integrations and data, contract generation, and delivery. Framework ownership and all topology connections require internal verification.</desc>
<defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10" fill="#475569"/></marker></defs>
<rect width="1600" height="1320" fill="#ffffff"/>
<g font-family="Segoe UI, Arial, sans-serif">
<text x="40" y="44" font-size="32" font-weight="700" fill="#0f172a">Amway Next Gen Checkout</text>
<text x="40" y="75" font-size="20" fill="#475569">Architecture learning map · reconstructed workflow + reported stack · 20 Oct 2026</text>
<rect x="40" y="92" width="1520" height="43" rx="8" fill="#fff7ed"/>
<text x="55" y="119" font-size="17" fill="#9a3412">REFERENCE MODEL — not a verified production topology. Spring/Reactor and Quarkus module ownership must be confirmed.</text>
${band(155, 315, '1  REQUEST AND CHECKOUT WORKFLOW', 'Logical execution from screenshot-derived notes; edge/auth placement is conceptual.', '#eff6ff')}
${box(60, 240, 265, 'Web / mobile', ['Checkout request', 'No customer payloads shown'])}
${box(365, 240, 330, 'API entry + validation', ['Authentication and ownership', 'Generated API transport DTO'])}
${box(735, 240, 330, 'Map + workflow context', ['API DTO → CheckoutBizDto', 'Common request / market context'])}
${box(1105, 240, 430, 'Select and execute workflow', ['Provider → tenant factory → strategy', 'Handler keys → pipeline → executor'])}
${arrow('M325 286 H365')}${arrow('M695 286 H735')}${arrow('M1065 286 H1105')}
<text x="65" y="390" font-size="18" font-weight="700" fill="#1e40af">Outcome: persist permitted checkout state → prepare response → map to API response</text>
<text x="65" y="422" font-size="16" fill="#475569">Reconstructed Spring/Reactor path ≠ proof of the same Quarkus module. Handler ordering and failure behavior need source evidence.</text>
${band(490, 285, '2  RUNTIME COLLABORATORS AND SERVICE-OWNED DATA', 'Proposed relationships from the reported technology inventory; each service owns its persistence.', '#f0fdf4')}
${box(60, 585, 350, 'Checkout application', ['Quarkus / Java 21 stack reported', 'Framework/module boundary: verify'], '#15803d')}
${box(465, 585, 350, 'Typed HTTP integrations', ['Account · profile · pricing', 'Inventory · payment, as required'], '#15803d')}
${box(875, 585, 300, 'Checkout-owned data', ['PostgreSQL / RDS', 'DynamoDB role: verify'], '#15803d')}
${box(1230, 585, 305, 'Supporting runtime tools', ['OpenFeature / flagd · SSM', 'Dynatrace telemetry'], '#15803d')}
${arrow('M410 615 H465')}${arrow('M410 660 V710 H1025 V677')}
${arrow('M1382 677 V737 H235 V677', true)}
<text x="465" y="765" font-size="16" fill="#475569">No cross-service database access or global transaction is implied.</text>
${band(795, 200, '3  CONTRACT AND BUILD PLANE', 'Build-time generation and dependency consumption; these arrows are not checkout HTTP calls.', '#faf5ff')}
${box(60, 880, 310, 'Reviewed OpenAPI', ['Canonical YAML / JSON', 'Provider-owned HTTP contract'], '#7c3aed')}
${box(420, 880, 330, 'Generate + validate + test', ['DTOs · client · provider API', 'Pinned generator and options'], '#7c3aed')}
${box(800, 880, 330, 'Versioned artifacts', ['Specification / model / client', 'Immutable approved release'], '#7c3aed')}
${box(1180, 880, 355, 'Provider + consumers', ['Choose compatible versions', 'Map transport ↔ internal models'], '#7c3aed')}
${arrow('M370 926 H420', true)}${arrow('M750 926 H800', true)}${arrow('M1130 926 H1180', true)}
${band(1015, 200, '4  DELIVERY AND OPERATIONAL PLANE', 'Reported tools; exact handoffs, Kubernetes platform, and deployment gates remain to be verified.', '#fff7ed')}
${box(60, 1100, 310, 'GitHub Actions', ['Gradle tests · JaCoCo', 'SonarQube quality evidence'], '#c2410c')}
${box(420, 1100, 330, 'AWS pipeline + build', ['CodePipeline / CodeBuild', 'Approved image + desired state'], '#c2410c')}
${box(800, 1100, 330, 'Argo CD → Kubernetes', ['GitOps reconciliation', 'Amazon EKS: inferred platform'], '#c2410c')}
${box(1180, 1100, 355, 'Runtime verification', ['Dynatrace + smoke checks', 'Promotion / recovery evidence'], '#c2410c')}
${arrow('M370 1146 H420', true)}${arrow('M750 1146 H800', true)}${arrow('M1130 1146 H1180', true)}
<text x="45" y="1260" font-size="17" fill="#334155">Solid arrows: logical runtime relationships. Dashed arrows: supporting configuration, telemetry, build, or delivery relationships.</text>
<text x="45" y="1290" font-size="17" fill="#334155">All connections are explanatory. See the companion page for evidence, ownership, failure behavior, and verification questions.</text>
</g></svg>`;

await writeFile(new URL(`${destination.href}.svg`), svg);
const browser = await chromium.launch({headless: true});
try {
  const page = await browser.newPage({viewport: {width: 1600, height: 1320}, deviceScaleFactor: 1.5});
  await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  await page.screenshot({path: fileURLToPath(new URL(`${destination.href}.png`)), fullPage: true});
} finally {
  await browser.close();
}
console.log('Rendered Amway architecture SVG and PNG.');
