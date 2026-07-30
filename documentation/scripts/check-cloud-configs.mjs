import {readFile, readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import yaml from 'js-yaml';

const documentationRoot = fileURLToPath(new URL('../', import.meta.url));
const configRoot = join(documentationRoot, '..', 'cloud-configs');
const required = [
  'application.yml',
  'API-GATEWAY.yml',
  'AUTH-SERVICE.yml',
  'USER-SERVICE.yml',
  'ORDER-SERVICE.yml',
  'PAYMENT-SERVICE.yml',
  'INVENTORY-SERVICE.yml',
  'DISCOVERY-SERVER.yml',
];

const failures = [];
const files = (await readdir(configRoot)).filter((file) => /\.ya?ml$/i.test(file));
for (const expected of required) {
  if (!files.includes(expected)) failures.push(`Missing required configuration file: ${expected}`);
}

for (const file of files) {
  const source = await readFile(join(configRoot, file), 'utf8');
  let parsed;
  try {
    parsed = yaml.load(source);
  } catch (error) {
    failures.push(`${file}: invalid YAML (${error.message})`);
    continue;
  }
  if (!parsed || typeof parsed !== 'object') failures.push(`${file}: root must be a YAML object`);
  for (const match of source.matchAll(/^\s*(password|secret|private-key|token):\s*(.+)$/gim)) {
    const value = match[2].trim();
    if (value && !value.startsWith('${') && !['null', '""', "''"].includes(value)) {
      failures.push(`${file}: ${match[1]} must come from an environment placeholder, not a literal value`);
    }
  }
  if (file !== 'application.yml' && !parsed?.server?.port) {
    failures.push(`${file}: server.port is required for the service contract`);
  }
}

const gatewaySource = await readFile(join(configRoot, 'API-GATEWAY.yml'), 'utf8');
for (const route of ['/api/v1/cart/**', '/api/v1/admin/**']) {
  if (!gatewaySource.includes(route)) failures.push(`API-GATEWAY.yml: missing required public route ${route}`);
}
if (gatewaySource.includes('/api/v1/internal/')) {
  failures.push('API-GATEWAY.yml: internal service routes must not be exposed');
}

if (failures.length) {
  console.error(`Cloud configuration validation failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Cloud configuration validation passed: ${files.length} YAML files, ${required.length} required contracts, route and secret checks.`);
}
