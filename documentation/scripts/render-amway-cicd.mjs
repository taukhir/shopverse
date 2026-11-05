import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';

const output = new URL('../static/img/diagrams/amway-cicd-pipeline', import.meta.url);
const box = (x, y, w, heading, a, b, color) => `<rect x="${x}" y="${y}" width="${w}" height="110" rx="13" fill="white" stroke="${color}" stroke-width="2"/><text x="${x + 16}" y="${y + 32}" font-size="21" font-weight="700">${heading}</text><text x="${x + 16}" y="${y + 61}" font-size="16" fill="#475569">${a}</text><text x="${x + 16}" y="${y + 86}" font-size="16" fill="#475569">${b}</text>`;
const arrow = (d, dashed = false) => `<path d="${d}" fill="none" stroke="${dashed ? '#7c3aed' : '#334155'}" stroke-width="3" ${dashed ? 'stroke-dasharray="8 6"' : ''} marker-end="url(#arrow)"/>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1080" viewBox="0 0 1600 1080" role="img" aria-labelledby="title desc">
<title id="title">Amway CI/CD and GitOps reference pipeline</title><desc id="desc">Source in GitHub is checked by Actions. A proposed gated AWS pipeline builds an image, publishes it to a registry, and updates deployment configuration in Git. Argo CD reconciles configuration into AWS Kubernetes, where workloads pull the image. Exact trigger and stage ownership need verification.</desc>
<defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10" fill="#475569"/></marker></defs>
<rect width="1600" height="1080" fill="#fff"/><g font-family="Segoe UI, Arial, sans-serif" fill="#0f172a">
<text x="45" y="52" font-size="33" font-weight="700">Amway CI/CD: from source commit to running service</text>
<text x="45" y="88" font-size="20" fill="#475569">User-reported tools + proposed handoffs · GitOps means Git records the desired deployment state</text>
<rect x="40" y="111" width="1520" height="52" rx="9" fill="#fff7ed"/><text x="57" y="143" font-size="18" fill="#9a3412">REFERENCE FLOW — confirm trigger, build owner, registry, approvals, EKS identity, and sync mode in actual configuration.</text>
<rect x="30" y="185" width="1540" height="235" rx="18" fill="#eff6ff"/>
<text x="55" y="221" font-size="23" font-weight="700">1  VALIDATE, BUILD, AND PUBLISH</text>
${box(55, 267, 260, 'GitHub source', 'Push / pull request / merge', 'Application code + tests', '#2563eb')}
${box(355, 267, 260, 'GitHub Actions', 'Required CI checks', 'Gate approved revision', '#2563eb')}
${box(655, 267, 260, 'AWS CodePipeline', 'Promote exact revision', 'Approvals + orchestration', '#2563eb')}
${box(955, 267, 260, 'Build stage', 'CodeBuild or Actions: verify', 'Test + container image', '#2563eb')}
${box(1255, 267, 290, 'Image registry', 'ECR or approved registry', 'Immutable image digest', '#2563eb')}
${arrow('M315 322 H355')}${arrow('M615 322 H655', true)}${arrow('M915 322 H955')}${arrow('M1215 322 H1255')}
<text x="624" y="251" font-size="15" fill="#7c3aed">Trigger: verify</text>
<rect x="30" y="480" width="1540" height="260" rx="18" fill="#f0fdf4"/>
<text x="55" y="512" font-size="23" font-weight="700">2  RECORD DESIRED STATE AND RECONCILE</text>
${arrow('M1085 377 V447 H42 V600 H55', true)}
<rect x="435" y="430" width="560" height="31" rx="6" fill="white"/><text x="451" y="452" font-size="17" fill="#7c3aed">Pipeline proposes image-digest update; approval policy: verify</text>
${box(55, 545, 330, 'Deployment config in Git', 'Helm values / Kustomize / YAML', 'Reviewed environment + digest', '#15803d')}
${box(445, 545, 330, 'Argo CD', 'Reads Git; compares live state', 'Auto or approved manual sync', '#15803d')}
${box(835, 545, 330, 'AWS Kubernetes', 'Amazon EKS: confirm name', 'Deployments + Pods + Services', '#15803d')}
${box(1225, 545, 320, 'Release verification', 'Readiness + smoke + Dynatrace', 'Success / recovery decision', '#15803d')}
${arrow('M385 600 H445')}${arrow('M775 600 H835')}${arrow('M1165 600 H1225')}
${arrow('M1400 377 V467 H1000 V545', true)}
<text x="1165" y="491" font-size="16" fill="#7c3aed">Pods pull registry image</text>
<text x="60" y="703" font-size="18" fill="#166534">Argo CD owns reconciliation in this model. AWS stages publish/promote desired state; avoid two writers for the same resources.</text>
<rect x="30" y="770" width="1540" height="210" rx="18" fill="#faf5ff"/>
<text x="55" y="808" font-size="23" font-weight="700">3  CLOSE THE LOOP</text>
<text x="60" y="851" font-size="20">Promotion: dev → test → production, using the same approved image digest.</text>
<text x="60" y="891" font-size="20">Recovery: revert approved desired state in Git, reconcile, and verify; database compatibility needs its own plan.</text>
<text x="60" y="931" font-size="20">Traceability: source SHA → CI run → image digest → config commit → Argo sync → running workload.</text>
<text x="45" y="1025" font-size="18" fill="#475569">Solid arrows: proposed stage flow. Dashed arrows: trigger, config update, or image distribution; confirm implementation.</text>
<text x="45" y="1057" font-size="18" fill="#475569">GitOps is a deployment practice, not a separate GitHub feature. Image publication alone does not update the GitOps configuration.</text>
</g></svg>`;
await writeFile(new URL(`${output.href}.svg`), svg);
const browser = await chromium.launch({headless: true});
try {
  const page = await browser.newPage({viewport: {width: 1600, height: 1080}, deviceScaleFactor: 1.5});
  await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  await page.screenshot({path: fileURLToPath(new URL(`${output.href}.png`)), fullPage: true});
} finally {
  await browser.close();
}
console.log('Rendered Amway CI/CD SVG and PNG.');
