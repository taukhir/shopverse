import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {unified} from 'unified';
import remarkParse from 'remark-parse';
import GithubSlugger from 'github-slugger';
import {toString} from 'mdast-util-to-string';

// Explicit snapshot import: normal builds never depend on an external local folder.
const site = fileURLToPath(new URL('../', import.meta.url));
const source = path.resolve(process.argv[2] ?? '');
if (!process.argv[2]) throw new Error('Usage: npm run import:mycheckout -- "PATH/TO/checkout/docs"');
const output = path.join(site, 'docs/mycheckout');
const assets = path.join(site, 'static/mycheckout');
const parser = unified().use(remarkParse);
const words = (text) => (text.match(/\b[\w-]+\b/g) ?? []).length;
const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const hash = (data) => createHash('sha256').update(data).digest('hex');
const posix = (text) => text.replaceAll('\\', '/');
const urlPath = (text) => text.split('/').map(encodeURIComponent).join('/');
const excluded = new Set(['README.md', 'checkout-chat-history-2026-10-21.md']);
const importedOn = new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'}).format(new Date());
const manifest = {source: 'checkout/docs', importedOn, documents: [], assets: [], unresolvedReferences: []};
const previousManifest = await fs.readFile(path.join(site, 'mycheckout-import-manifest.json'), 'utf8').then(JSON.parse).catch((error) => {
  if (error.code === 'ENOENT') return {documents: [], assets: []};
  throw error;
});

async function walk(dir) {
  const entries = await fs.readdir(dir, {withFileTypes: true});
  return (await Promise.all(entries.filter((e) => !['tmp', '__pycache__'].includes(e.name)).map((e) => {
    const target = path.join(dir, e.name);
    return e.isDirectory() ? walk(target) : target;
  }))).flat();
}
const all = (await walk(source)).sort();
const records = [];
for (const file of all.filter((f) => f.endsWith('.md') && !excluded.has(posix(path.relative(source, f))))) {
  const relative = posix(path.relative(source, file));
  const bytes = await fs.readFile(file);
  const raw = bytes.toString('utf8').replace(/^\uFEFF/, '').replaceAll('\r\n', '\n');
  if (/amway/i.test(raw)) throw new Error(`Old branding in ${relative}; sanitize the source before importing.`);
  const tree = parser.parse(raw);
  const heading = tree.children.find((n) => n.type === 'heading');
  const title = toString(heading ?? {type: 'text', value: path.basename(file, '.md')});
  const id = relative.split('/').map((p) => slug(p.replace(/\.md$/, ''))).join('/');
  const slugger = new GithubSlugger();
  const nodes = tree.children.map((node) => {
    const start = node.position.start.offset;
    const end = node.position.end.offset;
    const anchor = node.type === 'heading' ? slugger.slug(toString(node)) : null;
    return {node, start, end, anchor, text: raw.slice(start, end)};
  });
  // Keep fenced examples and tables intact. Prefer heading boundaries, but split
  // between other complete Markdown blocks when one section is unusually long.
  const chunks = [];
  let chunk = []; let size = 0;
  for (const item of nodes) {
    const count = words(item.text);
    if (count > 2800) throw new Error(`Oversized Markdown block in ${relative}:${item.node.position.start.line}`);
    if (chunk.length && (size + count > 2700 || (item.node.type === 'heading' && item.node.depth <= 2 && size > 1500))) {
      chunks.push(chunk); chunk = []; size = 0;
    }
    chunk.push(item); size += count;
  }
  if (chunk.length) chunks.push(chunk);
  const parts = chunks.map((items, i) => ({items, id: chunks.length === 1 ? id : `${id}/part-${i + 1}`, index: i}));
  const anchors = new Map();
  for (const part of parts) for (const item of part.items) if (item.anchor !== null) anchors.set(item.anchor, part);
  records.push({file, relative, raw, sourceHash: hash(bytes), title, id, parts, anchors});
}
const bySource = new Map(records.map((r) => [r.relative.toLowerCase(), r]));
const assetMap = new Map();
for (const file of all) {
  const rel = posix(path.relative(source, file));
  if (!['.svg', '.png', '.docx', '.pdf', '.drawio', '.zip'].includes(path.extname(file)) && !rel.endsWith('FULFILLMENT-CATALOG.json')) continue;
  assetMap.set(rel.toLowerCase(), rel);
}
await fs.mkdir(output, {recursive: true});
await fs.mkdir(assets, {recursive: true});
for (const rel of assetMap.values()) {
  const data = await fs.readFile(path.join(source, rel));
  const dest = path.join(assets, rel);
  await fs.mkdir(path.dirname(dest), {recursive: true});
  await fs.writeFile(dest, data);
  manifest.assets.push({source: rel, sha256: hash(data), bytes: data.length});
}

function targetFor(record, target, currentPart) {
  if (/^(https?:|mailto:|data:)/i.test(target)) return target;
  let decoded;
  try { decoded = decodeURIComponent(target); } catch { decoded = target; }
  const [pathname, anchor] = decoded.split('#');
  const normalized = posix(pathname).replace(/^\/?D:\/BE Projects\/checkout\/docs\//i, '');
  const relative = pathname ? path.posix.normalize(path.posix.join(path.posix.dirname(record.relative), normalized)) : record.relative;
  const candidate = bySource.get(relative.toLowerCase()) ?? bySource.get(normalized.toLowerCase());
  if (candidate) {
    const part = anchor ? candidate.anchors.get(anchor) : candidate.parts[0];
    if (part) return `/mycheckout/${part.id}${anchor ? `#${anchor}` : ''}`;
    // A stale source anchor should remain discoverable without shipping a broken link.
    manifest.unresolvedReferences.push({source: record.relative, target, reason: 'missing source heading'});
    return `/mycheckout/${candidate.parts[0].id}`;
  }
  const asset = assetMap.get(relative.toLowerCase()) ?? assetMap.get(normalized.toLowerCase());
  if (asset) return `/mycheckout/${urlPath(asset)}`;
  if (pathname === 'README.md' && path.posix.dirname(record.relative) === '.') return '/mycheckout/overview';
  manifest.unresolvedReferences.push({source: record.relative, target, reason: 'local source or working-file reference'});
  return null;
}

function rewrite(record, text, currentPart) {
  // Work on parsed links rather than code examples or inline source paths.
  const tree = parser.parse(text); const edits = [];
  const visit = (node) => {
    if (['link', 'image', 'definition'].includes(node.type)) {
      const target = targetFor(record, node.url, currentPart);
      const original = text.slice(node.position.start.offset, node.position.end.offset);
      const label = toString(node);
      let replacement;
      if (target === null) replacement = `${label || node.identifier || 'Source reference'} (local reference: \`${node.url.replaceAll('`', '')}\`)`;
      else if (node.type === 'definition') replacement = `[${node.identifier}]: ${target}`;
      else replacement = `${node.type === 'image' ? '!' : ''}[${node.type === 'image' ? node.alt ?? '' : original.startsWith('[') ? original.slice(1, original.lastIndexOf('](')) : label}](${target})`;
      edits.push({start: node.position.start.offset, end: node.position.end.offset, replacement});
      return;
    }
    for (const child of node.children ?? []) visit(child);
  };
  visit(tree);
  for (const edit of edits.sort((a, b) => b.start - a.start)) text = text.slice(0, edit.start) + edit.replacement + text.slice(edit.end);
  return text;
}

function metadata(title, type = 'Reference') {
  return `---\ntitle: ${JSON.stringify(title)}\nmdx:\n  format: md\ndifficulty: Advanced\npage_type: ${type}\nstatus: maintained\nscope: generic\nowner: docs-mycheckout\nreviewer: documentation-maintainers\nreview_evidence: imported-source-documentation-link-and-build-check\nlast_reviewed: "${importedOn}"\n---\n\n`;
}
async function writeDoc(id, content) {
  const file = path.join(output, `${id}.md`);
  await fs.mkdir(path.dirname(file), {recursive: true});
  await fs.writeFile(file, content.replace(/^---\n/, `---\nslug: /mycheckout/${id}\n`));
}
const sharedReferences = new Map();
function shareRepeatedBlocks(body, record, part) {
  let fence = false; let section = record.title;
  return body.split(/\n\s*\n/).map((block) => {
    const markers = block.match(/^\s*(```|~~~)/gm) ?? [];
    const inCode = fence || markers.length > 0;
    if (markers.length % 2) fence = !fence;
    if (inCode) return block;
    if (/^#{1,6} /m.test(block)) section = block.replace(/^#+\s*/, '').replace(/\s*\{#.*?\}/g, '');
    const fingerprint = block.toLowerCase().replace(/\[[^\]]+\]\([^)]+\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
    if (fingerprint.length < 180 && block.trim().length < 180) return block;
    const previous = sharedReferences.get(fingerprint);
    if (previous) return `See the [shared definition](/mycheckout/${previous.id}#${previous.anchor}).`;
    const anchor = `shared-${hash(fingerprint).slice(0, 12)}`;
    sharedReferences.set(fingerprint, {id: part.id, anchor, section});
    return `<a id="${anchor}"></a>\n\n${block}`;
  }).join('\n\n');
}
const officialReferences = '\n\n## Official References\n\nPlatform documentation explains the underlying technologies; project behavior remains grounded in the source evidence above.\n\n- [AWS service documentation](https://docs.aws.amazon.com/)\n- [Apache Kafka documentation](https://kafka.apache.org/documentation/)\n- [Quarkus guides](https://quarkus.io/guides/)\n';
for (const record of records) {
  const entries = [];
  for (const part of record.parts) {
    const title = `mycheckout — ${record.title}${record.parts.length > 1 ? ` — Part ${part.index + 1}` : ''}`;
    let body = part.items.map((item) => {
      if (item.node.type === 'heading') {
        const text = item.text.replace(/^#+\s*/, '');
        return `${'#'.repeat(Math.max(2, item.node.depth))} ${text} {#${item.anchor}}`;
      }
      return item.text;
    }).join('\n\n');
    // Reference definitions are document-scoped and can be needed by later parts.
    const definitions = record.parts.flatMap((p) => p.items).filter((item) => item.node.type === 'definition' && !part.items.includes(item));
    body += definitions.length ? `\n\n${definitions.map((d) => d.text).join('\n')}` : '';
    body = rewrite(record, body, part);
    body = shareRepeatedBlocks(body, record, part);
    const navigation = record.parts.map((p) => `[Part ${p.index + 1}](/mycheckout/${p.id})`).join(' · ');
    const historical = /BUG-CONTEXT|COMPLETE-CONTEXT|availability-issue|Understanding-Notes|COVERAGE-AUDIT/i.test(record.relative);
    const note = historical ? '**Historical source notes.** Fix claims and observations retain their original dates; they have not been reverified against current runtime behavior.\n\n' : '';
    const provenance = `Source names are anonymized; original evidence dates and runtime limitations apply.\n\n| Import record | Value |\n|---|---|\n| Source document | \`${record.relative}\` |\n| Source SHA256 | \`${record.sourceHash}\` |\n| Guide part | ${part.index + 1} of ${record.parts.length} |\n\n`;
    const content = metadata(title) + `# ${title}\n\n${note}${provenance}` + (record.parts.length > 1 ? `${navigation}\n\n` : '') + body + officialReferences;
    if (words(content) > 3500) throw new Error(`Generated page exceeds word limit: ${part.id}`);
    await writeDoc(part.id, content);
    entries.push(`mycheckout/${part.id}`);
  }
  manifest.documents.push({source: record.relative, sha256: record.sourceHash, pages: entries});
}

const groups = [
  ['Architecture and platform', (r) => r.relative.startsWith('architecture/') || ['END-TO-END-SYSTEM.md', 'API-AND-EVENT-CATALOG.md', 'COVERAGE-AUDIT.md'].includes(r.relative)],
  ['Checkout and payment flows', (r) => /^(CREATE-CHECKOUT|PLACE-ORDER|guest-checkout|PAYMENT-CDC)/.test(r.relative)],
  ['Fulfillment', (r) => r.relative.startsWith('fulfillment docs/') || r.relative === 'Fulfilment-Understanding-Notes.md'],
  ['Interview preparation', (r) => ['INTERVIEW-PREP.md', 'AWS-INTERVIEW-PREP.md'].includes(r.relative)],
];
const sidebarGroups = groups.map(([label, select]) => ({type: 'category', label, items: records.filter(select).map((r) => r.parts.length === 1 ? `mycheckout/${r.parts[0].id}` : {type: 'category', label: r.title, link: {type: 'doc', id: `mycheckout/${r.parts[0].id}`}, items: r.parts.map((p) => `mycheckout/${p.id}`)})}));
const mapped = new Set(groups.flatMap(([, select]) => records.filter(select)));
if (mapped.size !== records.length) throw new Error('Uncategorized imported document');
let overview = metadata('mycheckout documentation', 'Learning Path') + `# mycheckout documentation\n\nExplore the retail checkout platform through its architecture, checkout and payment flows, fulfillment behavior, API references and interview guides. This project is separate from the Shopverse implementation.\n\n## Start reading\n\n`;
for (const [label, select] of groups) {
  overview += `### ${label}\n\n` + records.filter(select).map((r) => `- [${r.title}](/mycheckout/${r.parts[0].id})${r.parts.length > 1 ? ` (${r.parts.length} linked parts)` : ''}`).join('\n') + '\n\n';
}
overview += `## Evidence and naming\n\nThese pages are imported source documentation, not a fresh review of the application. Keep each guide's original evidence date, source/configuration labels, known gaps and runtime limitations. The import review covers navigation and rendering.\n\nOrganization names in packages, hosts and excerpts have been anonymized to **mycheckout**. Such examples may differ from the real source and are not working deployment settings. Historical bug/fix notes are retained as history.\n\n## Architecture diagrams\n\n`;
for (const rel of assetMap.values()) if (/architecture\/\d.*\.svg$/.test(rel)) overview += `### ${path.basename(rel, '.svg').replace(/^\d+-/, '').replaceAll('-', ' ')}\n\n![mycheckout ${path.basename(rel, '.svg').replaceAll('-', ' ')}](/mycheckout/${urlPath(rel)})\n\n`;
overview += '## Downloads\n\n';
for (const rel of assetMap.values()) if (/\.(pdf|docx|drawio|zip)$/.test(rel)) overview += `- [${path.basename(rel)}](/mycheckout/${urlPath(rel)})\n`;
overview += '\n## Recommended Next\n\nStart with the [end-to-end system guide](/mycheckout/end-to-end-system/part-1), then follow [create checkout](/mycheckout/create-checkout-flow/part-1) and [place order](/mycheckout/place-order-flow/part-1).\n' + officialReferences;
overview += '\n## Source snapshot\n\nThe checked-in pages work without the original local folder. The source is `checkout/docs`; source hashes, imported pages and assets are recorded in `documentation/mycheckout-import-manifest.json`. Chat history, raw logs, private shortcuts, scripts and temporary/backup exports are excluded.\n\n';
await writeDoc('overview', overview);
const sidebarPath = path.join(site, 'sidebars.ts');
let sidebar = await fs.readFile(sidebarPath, 'utf8');
const serializedSidebar = JSON.stringify({type: 'category', label: 'mycheckout', link: {type: 'doc', id: 'mycheckout/overview'}, collapsed: true, items: ['mycheckout/overview', ...sidebarGroups]}, null, 2)
  .replace(/"(?:[^"\\]|\\.)*"/g, (quoted) => `'${JSON.parse(quoted).replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`);
const block = `    // BEGIN MYCHECKOUT IMPORT\n${serializedSidebar.split('\n').map((l) => `    ${l}`).join('\n')},\n    // END MYCHECKOUT IMPORT`;
if (sidebar.includes('// BEGIN MYCHECKOUT IMPORT')) sidebar = sidebar.replace(/    \/\/ BEGIN MYCHECKOUT IMPORT[\s\S]*?    \/\/ END MYCHECKOUT IMPORT/, block);
else sidebar = sidebar.replace("    'DOCUMENTATION-INDEX',", "    'DOCUMENTATION-INDEX',\n" + block);
await fs.writeFile(sidebarPath, sidebar);
// Remove only obsolete files recorded by the previous import, never other content.
const currentPages = new Set(manifest.documents.flatMap((d) => d.pages));
const currentAssets = new Set(manifest.assets.map((a) => a.source));
async function removeManaged(root, relative) {
  const target = path.resolve(root, relative);
  if (!target.startsWith(path.resolve(root) + path.sep)) throw new Error(`Unsafe managed path: ${relative}`);
  await fs.rm(target, {force: true});
}
for (const id of previousManifest.documents.flatMap((d) => d.pages)) {
  if (!currentPages.has(id)) await removeManaged(output, `${id.replace(/^mycheckout\//, '')}.md`);
}
for (const asset of previousManifest.assets) {
  if (!currentAssets.has(asset.source)) await removeManaged(assets, asset.source);
}
await fs.writeFile(path.join(site, 'mycheckout-import-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Imported ${records.length} guides into ${records.reduce((n, r) => n + r.parts.length, 1)} pages with ${assetMap.size} assets. ${manifest.unresolvedReferences.length} local/stale references retained as source annotations or guide-level links.`);
