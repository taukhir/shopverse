import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

function header(name) {
  return readFileSync(new URL(`../workflows/${name}.yml`, import.meta.url), 'utf8')
    .replaceAll('\r\n', '\n').split(/^jobs:/m)[0];
}

function pathsFor(name, event) {
  const block = header(name).match(new RegExp(`^  ${event}:\\n([\\s\\S]*?)(?=^  [a-z_]+:|^permissions:)`, 'm'))?.[1];
  // These workflows use quoted block-style path lists. Fail on unexpected syntax
  // rather than silently accepting an empty or partially parsed trigger.
  const list = block?.match(/^    paths:\n((?:      - [^\n]+\n)+)/m)?.[1];
  assert.ok(list, `${name}/${event} must declare an explicit path filter`);
  return list.trimEnd().split('\n').map(line => {
    const match = line.match(/^      - ["']([^"']+)["']$/);
    assert.ok(match, `Unsupported path entry: ${line}`);
    return match[1];
  });
}

for (const event of ['push', 'pull_request']) {
  for (const [name, folder] of [['ci-web', 'shopverse-web']]) {
    test(`${name}/${event} triggers only for its owning directory`, () => {
      assert.deepEqual(pathsFor(name, event), [`${folder}/**`]);
    });
  }
  for (const name of ['ci-java-labs']) {
    test(`${name}/${event} retains filters entirely within labs`, () => {
      assert.ok(pathsFor(name, event).every(path => path.startsWith('labs/')));
    });
  }
}

test('manual site verification remains available', () => {
  for (const name of ['ci-web', 'ci-java-labs']) {
    assert.match(header(name), /^  workflow_dispatch:/m);
  }
});
