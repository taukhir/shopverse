import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {assertCandidate, assertGate, assertReleaseRun, releaseManifest, selectChanges, services} from './pipeline.mjs';

const sourceSha = 'a'.repeat(40);
const otherSha = 'b'.repeat(40);
const repository = 'taukhir/shopverse';
const select = options => selectChanges({event: 'pull_request', ref: 'refs/pull/1/merge',
  base: sourceSha, before: sourceSha, diff: () => [], ...options});
const selected = result => JSON.parse(result.matrix).include.map(row => row.service);

for (const event of ['schedule', 'workflow_dispatch', 'merge_group']) {
  test(`${event} verifies every service and integration suite`, () => {
    const result = select({event});
    assert.deepEqual(selected(result), services);
    assert.equal(JSON.parse(result.integration_matrix).include.length, 3);
    assert.equal(result.smoke_required, 'true');
    assert.equal(result.release_candidate, 'false');
  });
}
test('master pushes create complete release candidates even for docs-only commits', () => {
  const result = select({event: 'push', ref: 'refs/heads/master', diff: () => ['documentation/docs/intro.md']});
  assert.deepEqual(selected(result), services);
  assert.equal(result.release_candidate, 'true');
});
test('unavailable, zero and malformed history conservatively selects all services', () => {
  for (const base of ['', '0'.repeat(40), 'not-a-sha']) assert.deepEqual(selected(select({base})), services);
  assert.deepEqual(selected(select({diff: () => { throw new Error('missing object'); }})), services);
});
for (const file of ['gradle/libs.versions.toml', 'gradle/checkstyle/checkstyle.xml',
  '.dockerignore', '.gitattributes', '.github/ci/pipeline.mjs', '.github/workflows/ci-backend.yml',
  'shopverse-common/shopverse-security-starter/build.gradle', 'build-logic/settings.gradle',
  'infra/cloud-configs/application.yml', 'docker-compose.test.yml']) {
  test(`shared build input selects all services: ${file}`, () => {
    const result = select({diff: () => [file]});
    assert.deepEqual(selected(result), services);
    assert.equal(result.common_required, 'true');
  });
}
test('service-only changes select exactly the owning service', () => {
  const result = select({diff: () => ['services/order-service/src/RemovedFile.java']});
  assert.deepEqual(selected(result), ['order-service']);
  assert.equal(result.has_integration_changes, 'true');
  assert.equal(result.common_required, 'false');
  assert.equal(result.smoke_required, 'false');
});
test('documentation-only PRs have intentional empty matrices', () => {
  const result = select({diff: () => ['documentation/docs/intro.md']});
  assert.deepEqual(selected(result), []);
  assert.equal(result.has_changes, 'false');
  assert.equal(result.common_required, 'false');
});
test('push and PR diff callbacks distinguish net change from merge-base comparisons', () => {
  for (const event of ['push', 'pull_request']) {
    let called = false;
    select({event, ref: 'refs/heads/topic', diff: (start, pr) => {
      assert.equal(start, sourceSha); assert.equal(pr, event === 'pull_request'); called = true; return [];
    }});
    assert.equal(called, true);
  }
});

function results(flags = select({event: 'schedule'})) {
  const needs = Object.fromEntries(['validate-config', 'detect-changes', 'security']
    .map(job => [job, {result: 'success'}]));
  needs['detect-changes'].outputs = flags;
  for (const [job, flag] of Object.entries({'test-unit': 'has_changes',
    'test-integration': 'has_integration_changes', 'test-common': 'common_required',
    'build-images': 'has_changes', 'test-checkout-saga': 'smoke_required'})) {
    needs[job] = {result: flags[flag] === 'true' ? 'success' : 'skipped'};
  }
  return needs;
}
test('gate accepts successful full runs and justified no-change skips', () => {
  assert.doesNotThrow(() => assertGate(results()));
  assert.doesNotThrow(() => assertGate(results(select())));
});
test('every required failure, cancellation, unexpected skip or missing job blocks release', () => {
  for (const job of Object.keys(results())) for (const result of ['failure', 'cancelled', 'skipped', undefined]) {
    const needs = results(); needs[job].result = result;
    assert.throws(() => assertGate(needs), job + ': ' + result);
  }
  const needs = results(); delete needs['detect-changes'].outputs.has_changes;
  assert.throws(() => assertGate(needs));
});

function run(overrides = {}) {
  return {id: 123, status: 'completed', conclusion: 'success', event: 'push', head_branch: 'master',
    head_sha: sourceSha, path: '.github/workflows/ci-backend.yml',
    repository: {full_name: repository}, head_repository: {full_name: repository}, ...overrides};
}
test('release accepts only successful same-repository master backend push runs', () => {
  assert.deepEqual(assertReleaseRun(run(), repository), {source_sha: sourceSha, ci_run_id: '123'});
  for (const override of [{conclusion: 'failure'}, {status: 'in_progress'}, {event: 'pull_request'},
    {event: 'workflow_dispatch'}, {head_branch: 'topic'}, {head_repository: {full_name: 'fork/shopverse'}},
    {repository: {full_name: 'fork/shopverse'}}, {path: '.github/workflows/ci.yml'}, {head_sha: 'invalid'}, {id: 0}]) {
    assert.throws(() => assertReleaseRun(run(override), repository));
  }
});
test('candidate must bind source SHA, CI run, service and Docker image ID', () => {
  const candidate = {service: 'order-service', source_sha: sourceSha, ci_run_id: '123', image_id: `sha256:${'c'.repeat(64)}`};
  const expected = {service: 'order-service', sourceSha, runId: '123'};
  assert.doesNotThrow(() => assertCandidate(candidate, expected));
  for (const override of [{source_sha: otherSha}, {service: 'payment-service'}, {ci_run_id: '124'}, {image_id: 'bad'}]) {
    assert.throws(() => assertCandidate({...candidate, ...override}, expected));
  }
});
function records() {
  return services.map((service, i) => ({service, source_sha: sourceSha, ci_run_id: '123',
    repository: `ghcr.io/${repository}/${service}`, digest: `sha256:${String(i).repeat(64)}`}));
}
const identity = {sourceSha, runId: '123', repository};
test('manifest preserves a distinct immutable digest for every service', () => {
  const manifest = releaseManifest(records(), identity);
  assert.equal(Object.keys(manifest.images).length, 8);
  assert.equal(new Set(Object.values(manifest.images)).size, 8);
  assert.ok(Object.values(manifest.images).every(image => /@sha256:[a-f0-9]{64}$/.test(image)));
});
test('partial, duplicate, mixed-source, mixed-run and foreign registry records are rejected', () => {
  assert.throws(() => releaseManifest(records().slice(1), identity));
  assert.throws(() => releaseManifest([...records(), records()[0]], identity));
  for (const override of [{source_sha: otherSha}, {ci_run_id: '456'}, {digest: 'latest'},
    {repository: 'ghcr.io/attacker/order-service'}, {service: 'unknown'}]) {
    const input = records(); input[0] = {...input[0], ...override};
    assert.throws(() => releaseManifest(input, identity));
  }
});

test('manifest CLI ignores companion SBOM JSON and emits deployable digest override', () => {
  const directory = mkdtempSync(join(tmpdir(), 'shopverse-manifest-test-'));
  mkdirSync(join(directory, 'image-records'));
  for (const record of records()) {
    writeFileSync(join(directory, 'image-records', record.service + '.json'), JSON.stringify(record));
    writeFileSync(join(directory, 'image-records', record.service + '.cdx.json'), JSON.stringify({bomFormat: 'CycloneDX'}));
  }
  const outputFile = join(directory, 'outputs.txt');
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('./pipeline.mjs', import.meta.url)), 'manifest'], {
    cwd: directory, encoding: 'utf8', env: {...process.env, GITHUB_OUTPUT: outputFile,
      GITHUB_REPOSITORY: repository, SOURCE_SHA: sourceSha, CI_RUN_ID: '123'},
  });
  assert.equal(result.status, 0, result.stderr);
  const compose = JSON.parse(readFileSync(join(directory, 'compose.release.json'), 'utf8'));
  assert.deepEqual(Object.keys(compose.services).sort(), [...services].sort());
  const encoded = readFileSync(outputFile, 'utf8').trim().slice('compose_b64='.length);
  assert.deepEqual(JSON.parse(Buffer.from(encoded, 'base64').toString()), compose);
});
