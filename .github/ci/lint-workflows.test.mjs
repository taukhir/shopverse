import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, readdirSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {basename, dirname, join, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

const helper = new URL('./lint-workflows.mjs', import.meta.url).href;

for (const scenario of [
  {name: 'HTTP error', response: '{ok: false, status: 503}', error: /Cannot download actionlint: HTTP 503/},
  {name: 'tampered archive', response: `{
    ok: true,
    arrayBuffer: async () => new TextEncoder().encode('tampered actionlint archive').buffer,
  }`, error: /actionlint checksum mismatch/},
]) {
  test(`Actionlint rejects ${scenario.name} before creating or writing temporary files`, () => {
    const directory = mkdtempSync(join(tmpdir(), 'shopverse-actionlint-test-'));
    try {
      // Exercise the real downloader entry point, replacing only the HTTP response.
      const source = `
        import assert from 'node:assert/strict';
        globalThis.fetch = async (url) => {
          const suffix = process.platform === 'win32' ? 'windows_amd64.zip' : 'linux_amd64.tar.gz';
          assert.equal(url, 'https://github.com/rhysd/actionlint/releases/download/v1.7.10/actionlint_1.7.10_' + suffix);
          return ${scenario.response};
        };
        await import(${JSON.stringify(helper)});
      `;
      const result = spawnSync(process.execPath, ['--input-type=module', '--eval', source], {
        encoding: 'utf8',
        timeout: 10000,
        windowsHide: true,
        env: {...process.env, TMPDIR: directory, TMP: directory, TEMP: directory},
      });
      assert.equal(result.error, undefined);
      assert.equal(result.status, 1);
      assert.match(result.stderr, scenario.error);
      assert.deepEqual(readdirSync(directory), [], 'Rejected downloads must not reach filesystem writes/extraction');
    } finally {
      // Remove only the exact test-owned directory beneath the OS temporary root.
      assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
      assert.ok(basename(directory).startsWith('shopverse-actionlint-test-'));
      rmSync(directory, {recursive: true, force: true});
    }
  });
}
