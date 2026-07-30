import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const documentationRoot = path.resolve(scriptDirectory, '..');
const repositoryRoot = path.resolve(documentationRoot, '..');
const outputDirectory = path.join(documentationRoot, 'docs', 'services', 'readmes');
const outputRepositoryDirectory = 'documentation/docs/services/readmes';
const checkOnly = process.argv.includes('--check');

const entries = [
  {
    source: 'api-gateway/README.md',
    slug: 'API-GATEWAY-README',
    title: 'API Gateway Service README',
    label: 'API Gateway README',
    description: 'Site mirror of the API Gateway responsibilities, routes, security, observability, validation, and AI-assisted workflows.',
  },
  {
    source: 'auth-service/README.md',
    slug: 'AUTH-SERVICE-README',
    title: 'Auth Service README',
    label: 'Auth Service README',
    description: 'Site mirror of authentication, JWT and JWKS behavior, configuration, validation, limitations, and AI-assisted workflows.',
  },
  {
    source: 'user-service/README.md',
    slug: 'USER-SERVICE-README',
    title: 'User Service README',
    label: 'User Service README',
    description: 'Site mirror of user, role, permission, persistence, security, testing, and AI-assisted workflows.',
  },
  {
    source: 'order-service/README.md',
    slug: 'ORDER-SERVICE-README',
    title: 'Order Service README',
    label: 'Order Service README',
    description: 'Site mirror of checkout, order state, idempotency, saga, outbox, recovery, validation, and AI-assisted workflows.',
  },
  {
    source: 'inventory-service/README.md',
    slug: 'INVENTORY-SERVICE-README',
    title: 'Inventory Service README',
    label: 'Inventory Service README',
    description: 'Site mirror of catalog, stock, reservation, expiry, compensation, validation, and AI-assisted workflows.',
  },
  {
    source: 'payment-service/README.md',
    slug: 'PAYMENT-SERVICE-README',
    title: 'Payment Service README',
    label: 'Payment Service README',
    description: 'Site mirror of payment lifecycle, saga, reconciliation, ownership, validation, and AI-assisted workflows.',
  },
  {
    source: 'config-server/README.md',
    slug: 'CONFIG-SERVER-README',
    title: 'Config Server README',
    label: 'Config Server README',
    description: 'Site mirror of centralized configuration delivery, refresh, Docker, observability, and AI-assisted workflows.',
  },
  {
    source: 'cloud-configs/README.md',
    slug: 'CLOUD-CONFIGS-README',
    title: 'Cloud Configuration README',
    label: 'Cloud Configs README',
    description: 'Site mirror of shared Shopverse runtime settings, route boundaries, security cautions, and AI-assisted workflows.',
  },
  {
    source: 'discovery-server/README.md',
    slug: 'DISCOVERY-SERVER-README',
    title: 'Discovery Server README',
    label: 'Discovery Server README',
    description: 'Site mirror of Eureka responsibilities, operations, validation, observability, and AI-assisted workflows.',
  },
  {
    source: 'shopverse-platform/README.md',
    slug: 'SHOPVERSE-PLATFORM-README',
    title: 'Shopverse Platform README',
    label: 'Platform README',
    description: 'Site mirror of shared platform starters, adoption, compatibility, verification, and AI-assisted workflows.',
  },
  {
    source: 'shopverse-web/README.md',
    slug: 'SHOPVERSE-WEB-README',
    title: 'Shopverse Web README',
    label: 'Web README',
    description: 'Site mirror of the Angular storefront, backend integrations, validation, user experience, and AI-assisted workflows.',
  },
];

function toPosix(value) {
  return value.replaceAll(path.sep, '/');
}

function rewriteDestination(destination, sourceRepositoryPath) {
  if (
    destination.startsWith('http://') ||
    destination.startsWith('https://') ||
    destination.startsWith('#') ||
    destination.startsWith('mailto:')
  ) {
    return destination;
  }

  const hashIndex = destination.indexOf('#');
  const relativePart = hashIndex >= 0 ? destination.slice(0, hashIndex) : destination;
  const anchor = hashIndex >= 0 ? destination.slice(hashIndex) : '';
  const sourceDirectory = path.posix.dirname(sourceRepositoryPath);
  const repositoryTarget = path.posix.normalize(path.posix.join(sourceDirectory, relativePart));

  if (repositoryTarget.startsWith('documentation/docs/')) {
    const documentationRelative = path.posix.relative(outputRepositoryDirectory, repositoryTarget);
    return `${documentationRelative}${anchor}`;
  }

  return `https://github.com/taukhir/shopverse/blob/main/${repositoryTarget}${anchor}`;
}

function rewriteLinks(markdown, sourceRepositoryPath) {
  return markdown.replace(/(!?\[[^\]]*\])\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (match, label, destination) => {
    return `${label}(${rewriteDestination(destination, sourceRepositoryPath)})`;
  });
}

function render(entry) {
  const sourcePath = path.join(repositoryRoot, ...entry.source.split('/'));
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Canonical README does not exist: ${entry.source}`);
  }

  const source = fs.readFileSync(sourcePath, 'utf8').replaceAll('\r\n', '\n').trimEnd();
  const body = rewriteLinks(source, entry.source);
  const canonicalUrl = `https://github.com/taukhir/shopverse/blob/main/${entry.source}`;

  return `---
title: ${entry.title}
description: ${JSON.stringify(entry.description)}
sidebar_label: ${entry.label}
difficulty: Intermediate
page_type: Reference
status: maintained
scope: shopverse
owner: ${entry.source.split('/')[0]}
reviewer: documentation-maintainers
review_evidence: canonical-readme-sync
technologies: [Shopverse, Service Documentation, AI-Assisted Development]
last_reviewed: "2026-07-29"
---

<!-- Generated by scripts/sync-service-readmes.mjs. Edit the canonical service README, not this file. -->

> This page is generated from the canonical [${entry.source}](${canonicalUrl}).
> Repository-relative source links are rewritten for the documentation site.

${body}
`;
}

const drift = [];
if (!checkOnly) fs.mkdirSync(outputDirectory, {recursive: true});

for (const entry of entries) {
  const outputPath = path.join(outputDirectory, `${entry.slug}.md`);
  const expected = render(entry);
  const actual = fs.existsSync(outputPath)
    ? fs.readFileSync(outputPath, 'utf8').replaceAll('\r\n', '\n')
    : null;

  if (actual !== expected) {
    if (checkOnly) {
      drift.push(toPosix(path.relative(repositoryRoot, outputPath)));
    } else {
      fs.writeFileSync(outputPath, expected, 'utf8');
      console.log(`updated ${toPosix(path.relative(repositoryRoot, outputPath))}`);
    }
  }
}

if (checkOnly && drift.length > 0) {
  console.error('Service README mirrors are stale or missing:');
  for (const file of drift) console.error(`- ${file}`);
  console.error('Run: npm run sync:service-readmes');
  process.exitCode = 1;
} else if (checkOnly) {
  console.log(`Service README mirrors are current (${entries.length}/${entries.length}).`);
} else {
  console.log(`Service README synchronization complete (${entries.length}/${entries.length}).`);
}
