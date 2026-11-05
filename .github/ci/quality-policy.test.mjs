import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';

const policy = readFileSync(new URL('./spotbugs-exclude.xml', import.meta.url), 'utf8');
const matches = [...policy.matchAll(/<Match>([\s\S]*?)<\/Match>/g)].map(match => match[1]);

function exactMembers(value) {
  const decoded = value.replaceAll('&lt;', '<').replaceAll('&gt;', '>');
  const names = decoded.startsWith('~(') && decoded.endsWith(')')
    ? decoded.slice(2, -1).split('|') : [decoded];
  return names.every(name => /^(?:[A-Za-z_$][\w$]*|<init>)$/.test(name));
}

test('SpotBugs exceptions require exact classes, fields, methods and reviewed bug patterns', () => {
  assert.ok(matches.length > 0);
  for (const match of matches) {
    const klass = match.match(/<Class name="([^"]+)"\/>/)?.[1];
    const field = match.match(/<Field name="([^"]+)"\/>/)?.[1];
    const method = match.match(/<Method name="([^"]+)"\/>/)?.[1];
    const patterns = match.match(/<Bug pattern="([^"]+)"\/>/)?.[1];
    assert.ok(klass && field && method && patterns, 'No blanket class/package suppressions');
    assert.doesNotMatch(klass, /[~*]/, 'Class names must be exact');
    assert.ok(exactMembers(field) && exactMembers(method), 'Member patterns must enumerate exact members');
    for (const pattern of patterns.split(',')) assert.ok(['EI_EXPOSE_REP', 'EI_EXPOSE_REP2'].includes(pattern));
  }
});

test('DTO and authentication model collections stay subject to representation-exposure analysis', () => {
  for (const match of matches) {
    const klass = match.match(/<Class name="([^"]+)"\/>/)[1];
    assert.doesNotMatch(klass, /\.(dto|model)\./, 'Fix collection ownership instead of suppressing DTO findings');
    assert.ok(!['ApiErrorResponse', 'PageResponse', 'ReadinessCheck', 'ReadinessResponse']
      .some(name => klass.endsWith('.' + name)));
  }
});

test('Config Server mounts the canonical configuration files from an existing directory', () => {
  const compose = readFileSync(new URL('../../docker-compose.yml', import.meta.url), 'utf8');
  const source = compose.match(/- (\.\/[^\r\n:]+):\/config:ro/)?.[1];
  assert.ok(source, 'Config Server must mount its native configuration directory');
  for (const file of ['application.yml', 'USER-SERVICE.yml', 'ORDER-SERVICE.yml']) {
    assert.ok(existsSync(new URL(`../../${source}/${file}`, import.meta.url)), `Missing mounted ${file}`);
  }
});

test('Documentation image includes every canonical README required by prebuild', () => {
  const script = readFileSync(new URL('../../documentation/scripts/sync-service-readmes.mjs', import.meta.url), 'utf8');
  const dockerfile = readFileSync(new URL('../../documentation/Dockerfile', import.meta.url), 'utf8');
  const sources = [...script.matchAll(/source: '([^']+)'/g)].map(match => match[1]);
  assert.ok(sources.length > 0);
  for (const match of dockerfile.matchAll(/^COPY ([^\s-][^\s]*) /gm)) {
    const source = match[1];
    if (!source.includes('*')) {
      assert.ok(existsSync(new URL(`../../${source}`, import.meta.url)), `Docker COPY source missing: ${source}`);
    }
  }
  for (const source of sources) {
    assert.ok(dockerfile.includes(`COPY ${source} /workspace/${source}`), `README absent from Docker build: ${source}`);
  }
});
