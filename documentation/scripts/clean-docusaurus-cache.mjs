import {access, rm} from 'node:fs/promises';
import {basename, dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const documentationDirectory = resolve(scriptsDirectory, '..');
const cacheDirectory = resolve(documentationDirectory, '.docusaurus');
const packageFile = resolve(documentationDirectory, 'package.json');

if (basename(cacheDirectory) !== '.docusaurus') {
  throw new Error(`Refusing to clean unexpected path: ${cacheDirectory}`);
}

await access(packageFile);

try {
  await rm(cacheDirectory, {
    recursive: true,
    force: true,
    maxRetries: 12,
    retryDelay: 250,
  });
  console.log('Cleared generated Docusaurus cache.');
} catch (error) {
  const detail = error instanceof Error ? error.message : String(error);
  throw new Error(
    `Unable to clear ${cacheDirectory}. Close any running documentation dev or build process and retry. ${detail}`,
    {cause: error},
  );
}
