import {createHash} from 'node:crypto';
import {mkdtempSync, writeFileSync, chmodSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

// Verify a fixed upstream release before executing it; no npm/go installation.
const windows = process.platform === 'win32';
if (!['win32', 'linux'].includes(process.platform) || process.arch !== 'x64') {
  throw new Error('Workflow lint supports Linux and Windows x64');
}
const file = `actionlint_1.7.10_${windows ? 'windows_amd64.zip' : 'linux_amd64.tar.gz'}`;
const expected = windows ? '283467f9d6202a8cb8c00ad8dd0ee4e685b71fb86a6a56c68fcbb9ae8ed91237'
  : 'f4c76b71db5755a713e6055cbb0857ed07e103e028bda117817660ebadb4386f';
const response = await fetch(`https://github.com/rhysd/actionlint/releases/download/v1.7.10/${file}`);
if (!response.ok) throw new Error(`Cannot download actionlint: HTTP ${response.status}`);
const bytes = Buffer.from(await response.arrayBuffer());
if (createHash('sha256').update(bytes).digest('hex') !== expected) throw new Error('actionlint checksum mismatch');
const directory = mkdtempSync(join(tmpdir(), 'shopverse-actionlint-'));
const archive = join(directory, file);
writeFileSync(archive, bytes);
const extraction = spawnSync('tar', ['-xf', archive, '-C', directory], {stdio: 'inherit'});
if (extraction.status !== 0) throw new Error('Cannot extract actionlint');
const binary = join(directory, `actionlint${windows ? '.exe' : ''}`);
if (!windows) chmodSync(binary, 0o755);
// Optional shellcheck/pyflakes are checked separately when available; schema and expressions always run.
const result = spawnSync(binary, ['-shellcheck=', '-pyflakes=', ...process.argv.slice(2)], {stdio: 'inherit'});
process.exitCode = result.status ?? 1;
