import {appendFileSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const services = ['config-server', 'discovery-server', 'user-service',
  'auth-service', 'order-service', 'payment-service', 'inventory-service', 'api-gateway'];
const integrationServices = new Set(['order-service', 'inventory-service', 'payment-service']);
const shaPattern = /^[a-f0-9]{40}$/;
const digestPattern = /^sha256:[a-f0-9]{64}$/;
const imageIdPattern = /^sha256:[a-f0-9]{64}$/;
const sharedPath = /^(build-logic\/|gradle\/|shopverse-common\/|infra\/|docker-compose[^/]*$|\.(dockerignore|gitattributes)$|\.github\/(workflows|ci)\/)/;
const independentWorkflows = new Set(['ci-web.yml', 'docs-verify-publish.yml',
  'ci-docs-visual.yml', 'ci-java-labs.yml', 'ci-database-lab.yml', 'integration-jenkins.yml']);

function affectsSharedBackend(file) {
  if (file.startsWith('.github/workflows/') && independentWorkflows.has(file.slice('.github/workflows/'.length))) {
    return false;
  }
  // Config validation runs these tests and Actionlint on every PR. Documentation
  // and test-only edits do not change service artifacts or their dependencies.
  if (file.startsWith('.github/ci/') && (file.endsWith('.md') || file.endsWith('.test.mjs') ||
      file === '.github/ci/lint-workflows.mjs')) return false;
  return sharedPath.test(file);
}

export function selectChanges({event, ref, before, base, diff}) {
  const releaseCandidate = event === 'push' && ref === 'refs/heads/master';
  let full = releaseCandidate || ['schedule', 'workflow_dispatch', 'merge_group'].includes(event);
  let files = [];
  if (!full) {
    const start = event === 'pull_request' ? base : before;
    if (!shaPattern.test(start || '') || /^0+$/.test(start)) full = true;
    else {
      try { files = diff(start, event === 'pull_request'); }
      catch { full = true; }
    }
  }
  const shared = full || files.some(affectsSharedBackend);
  const selected = services.filter(service => shared || files.some(file => file.startsWith(`services/${service}/`)));
  const row = service => ({service, path: `services/${service}`, dockerfile: `services/${service}/Dockerfile`});
  return {
    matrix: JSON.stringify({include: selected.map(row)}),
    integration_matrix: JSON.stringify({include: selected.filter(s => integrationServices.has(s)).map(row)}),
    has_changes: String(selected.length > 0),
    has_integration_changes: String(selected.some(s => integrationServices.has(s))),
    common_required: String(shared),
    smoke_required: String(full),
    release_candidate: String(releaseCandidate),
  };
}

export function assertGate(needs) {
  for (const job of ['validate-config', 'detect-changes', 'security']) {
    if (needs[job]?.result !== 'success') throw new Error(`Required job ${job} did not succeed`);
  }
  const flags = needs['detect-changes'].outputs;
  const expectations = {
    'test-unit': flags.has_changes,
    'test-integration': flags.has_integration_changes,
    'test-common': flags.common_required,
    'build-images': flags.has_changes,
    'test-checkout-saga': flags.smoke_required,
  };
  for (const [job, expected] of Object.entries(expectations)) {
    if (!['true', 'false'].includes(expected)) throw new Error(`Missing/invalid selection for ${job}`);
    const result = needs[job]?.result;
    if (result !== (expected === 'true' ? 'success' : 'skipped')) {
      throw new Error(`Unexpected result for ${job}: ${result}`);
    }
  }
}

export function assertReleaseRun(run, repository) {
  if (run.status !== 'completed' || run.conclusion !== 'success' || run.event !== 'push' ||
      run.head_branch !== 'master' || run.head_repository?.full_name !== repository ||
      run.repository?.full_name !== repository || run.path !== '.github/workflows/ci-backend.yml' ||
      !shaPattern.test(run.head_sha) || !Number.isSafeInteger(run.id) || run.id <= 0) {
    throw new Error('Release requires a successful same-repository master push through ci-backend.yml');
  }
  return {source_sha: run.head_sha, ci_run_id: String(run.id)};
}

export function assertCandidate(candidate, {service, sourceSha, runId}) {
  if (!services.includes(service) || candidate.service !== service || candidate.source_sha !== sourceSha ||
      candidate.ci_run_id !== String(runId) || !shaPattern.test(sourceSha) ||
      !imageIdPattern.test(candidate.image_id || '')) throw new Error('Candidate identity mismatch');
}

export function releaseManifest(records, {sourceSha, runId, repository}) {
  if (!shaPattern.test(sourceSha) || !/^\d+$/.test(String(runId)) ||
      !/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/.test(repository)) throw new Error('Invalid release identity');
  const images = {};
  for (const record of records) {
    if (!services.includes(record.service) || images[record.service] ||
        record.source_sha !== sourceSha || record.ci_run_id !== String(runId) ||
        !digestPattern.test(record.digest) ||
        record.repository !== `ghcr.io/${repository}/${record.service}`) throw new Error('Invalid image record');
    images[record.service] = `${record.repository}@${record.digest}`;
  }
  if (Object.keys(images).length !== services.length) throw new Error('Release must contain all eight services');
  return {schema_version: 1, source_sha: sourceSha, ci_run_id: String(runId), images};
}

function output(values) {
  for (const [key, value] of Object.entries(values)) appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
}

async function main(command) {
  const env = process.env;
  if (command === 'detect') {
    output(selectChanges({event: env.GITHUB_EVENT_NAME, ref: env.GITHUB_REF,
      before: env.BEFORE_SHA, base: env.PR_BASE_SHA, diff(start, pr) {
        const range = pr ? `${start}...HEAD` : start;
        const args = ['diff', '--name-only', '-z', range, ...(pr ? [] : ['HEAD']), '--'];
        const result = spawnSync('git', args, {encoding: 'utf8'});
        if (result.status !== 0) throw new Error('History unavailable');
        return result.stdout.split('\0').filter(Boolean);
      }}));
  } else if (command === 'gate') {
    assertGate(JSON.parse(env.NEEDS_JSON));
    console.log('Backend CI gate passed, including required security and image scans.');
  } else if (command === 'resolve-release') {
    const id = env.CI_RUN_ID;
    if (!/^[1-9]\d*$/.test(id || '')) throw new Error('A numeric CI run ID is required');
    const response = await fetch(`${env.GITHUB_API_URL}/repos/${env.GITHUB_REPOSITORY}/actions/runs/${id}`, {
      headers: {Authorization: `Bearer ${env.GH_TOKEN}`, Accept: 'application/vnd.github+json'},
    });
    if (!response.ok) throw new Error(`Cannot read CI run: HTTP ${response.status}`);
    output(assertReleaseRun(await response.json(), env.GITHUB_REPOSITORY));
  } else if (command === 'candidate') {
    if (!services.includes(env.SERVICE) || !shaPattern.test(env.GITHUB_SHA)) throw new Error('Invalid candidate');
    const result = spawnSync('docker', ['image', 'inspect', `shopverse/${env.SERVICE}:ci-${env.GITHUB_SHA}`,
      '--format', '{{.Id}}'], {encoding: 'utf8'});
    if (result.status !== 0 || !imageIdPattern.test(result.stdout.trim())) throw new Error('Cannot inspect candidate');
    writeFileSync('candidate/identity.json', JSON.stringify({service: env.SERVICE, source_sha: env.GITHUB_SHA,
      ci_run_id: env.GITHUB_RUN_ID, image_id: result.stdout.trim()}, null, 2) + '\n');
  } else if (command === 'verify-candidate') {
    const candidate = JSON.parse(readFileSync('candidate/identity.json', 'utf8'));
    assertCandidate(candidate, {service: env.SERVICE, sourceSha: env.SOURCE_SHA, runId: env.CI_RUN_ID});
    const result = spawnSync('docker', ['image', 'inspect', `shopverse/${env.SERVICE}:ci-${env.SOURCE_SHA}`,
      '--format', '{{.Id}}'], {encoding: 'utf8'});
    if (result.status !== 0 || result.stdout.trim() !== candidate.image_id) throw new Error('Loaded image identity mismatch');
  } else if (command === 'compose-candidates') {
    if (!shaPattern.test(env.GITHUB_SHA)) throw new Error('Invalid source SHA');
    writeFileSync('candidate-images.json', JSON.stringify({services: Object.fromEntries(
      services.map(service => [service, {image: `shopverse/${service}:ci-${env.GITHUB_SHA}`}]))}));
  } else if (command === 'manifest') {
    const records = readdirSync('image-records').filter(f => f.endsWith('.json') && !f.endsWith('.cdx.json'))
      .map(file => JSON.parse(readFileSync(`image-records/${file}`, 'utf8')));
    const manifest = releaseManifest(records, {sourceSha: env.SOURCE_SHA,
      runId: env.CI_RUN_ID, repository: env.GITHUB_REPOSITORY.toLowerCase()});
    writeFileSync('release-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
    writeFileSync('compose.release.json', JSON.stringify({services: Object.fromEntries(
      Object.entries(manifest.images).map(([service, image]) => [service, {image}]))}, null, 2) + '\n');
    output({compose_b64: Buffer.from(readFileSync('compose.release.json')).toString('base64')});
  } else if (command === 'record-published') {
    const repository = `ghcr.io/${env.GITHUB_REPOSITORY.toLowerCase()}/${env.SERVICE}`;
    const prefix = `${repository}@`;
    if (!services.includes(env.SERVICE) || !env.PUBLISHED_REF?.startsWith(prefix) ||
        !digestPattern.test(env.PUBLISHED_REF.slice(prefix.length))) throw new Error('Invalid registry digest');
    writeFileSync(`image-records/${env.SERVICE}.json`, JSON.stringify({service: env.SERVICE,
      source_sha: env.SOURCE_SHA, ci_run_id: env.CI_RUN_ID, repository,
      digest: env.PUBLISHED_REF.slice(prefix.length)}, null, 2) + '\n');
  } else throw new Error(`Unknown command: ${command}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv[2]).catch(error => { console.error(error.message); process.exitCode = 1; });
}
