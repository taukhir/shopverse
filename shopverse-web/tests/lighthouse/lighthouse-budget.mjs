import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = normalize(join(scriptDir, '../../dist/shopverse-web/browser'));
const host = '127.0.0.1';
const thresholds = {
  performance: 0.55,
  accessibility: 0.85,
  bestPractices: 0.85,
  seo: 0.80,
};

const contentTypes = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

if (!existsSync(join(root, 'index.html'))) {
  throw new Error('Build output not found. Run npm run build before npm run lighthouse.');
}

const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? '/', `http://${host}/`).pathname);
  const candidate = normalize(join(root, pathname === '/' ? 'index.html' : pathname));
  const file = candidate.startsWith(root) && existsSync(candidate) && (await stat(candidate)).isFile()
    ? candidate
    : join(root, 'index.html');
  response.setHeader('Content-Type', contentTypes[extname(file)] ?? 'application/octet-stream');
  createReadStream(file).pipe(response);
});

await new Promise((resolve) => server.listen(0, host, resolve));
const address = server.address();
const port = typeof address === 'object' && address ? address.port : 4300;
const url = `http://${host}:${port}/`;

let chrome;

try {
  chrome = await chromeLauncher.launch({ chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'] });
  const result = await lighthouse(url, {
    port: chrome.port,
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    quiet: true,
  });

  const categories = result.lhr.categories;
  const summary = {
    performance: categories.performance.score,
    accessibility: categories.accessibility.score,
    bestPractices: categories['best-practices'].score,
    seo: categories.seo.score,
  };

  const failures = Object.entries(thresholds)
    .filter(([name, threshold]) => (summary[name] ?? 0) < threshold)
    .map(([name, threshold]) => `${name} score ${summary[name]} is below ${threshold}`);

  console.log('Lighthouse budget summary:', summary);
  if (failures.length) {
    throw new Error(failures.join('\n'));
  }
} finally {
  if (chrome) await chrome.kill();
  await new Promise((resolve) => server.close(resolve));
}
