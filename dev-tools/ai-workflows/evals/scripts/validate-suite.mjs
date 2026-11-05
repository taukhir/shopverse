import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const evalRoot = path.resolve(scriptDirectory, '..');
const manifestPath = path.join(evalRoot, 'manifest.json');
const supportedCriteria = new Set([
  'required_fields',
  'answer_terms',
  'required_claims',
  'file_scope',
  'forbidden_terms',
  'commands',
  'metrics',
]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function requireFile(relativePath, errors, label) {
  const resolved = path.resolve(evalRoot, relativePath);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    errors.push(`${label} does not exist: ${relativePath}`);
  }
  return resolved;
}

const errors = [];
const manifest = readJson(manifestPath);
const ids = new Set();

if (!Array.isArray(manifest.scenarios) || manifest.scenarios.length === 0) {
  errors.push('manifest.scenarios must contain at least one scenario');
}

for (const entry of manifest.scenarios ?? []) {
  if (ids.has(entry.id)) errors.push(`duplicate scenario id: ${entry.id}`);
  ids.add(entry.id);

  const scenarioPath = requireFile(entry.file, errors, `scenario ${entry.id}`);
  if (!fs.existsSync(scenarioPath)) continue;

  const scenario = readJson(scenarioPath);
  if (scenario.id !== entry.id) {
    errors.push(`scenario id mismatch for ${entry.id}: ${scenario.id}`);
  }
  if (!scenario.task || !scenario.authority || !scenario.output_contract) {
    errors.push(`scenario ${entry.id} is missing task, authority, or output_contract`);
  }

  requireFile(scenario.prompt_path, errors, `prompt for ${entry.id}`);
  for (const fixture of scenario.fixture_paths ?? []) {
    requireFile(fixture, errors, `fixture for ${entry.id}`);
  }

  const expectedPath = requireFile(scenario.expected_path, errors, `rubric for ${entry.id}`);
  if (!fs.existsSync(expectedPath)) continue;

  const expected = readJson(expectedPath);
  if (expected.scenario_id !== entry.id) {
    errors.push(`rubric scenario_id mismatch for ${entry.id}`);
  }
  if (!Number.isFinite(expected.pass_threshold) || expected.pass_threshold < 0 || expected.pass_threshold > 100) {
    errors.push(`invalid pass_threshold for ${entry.id}`);
  }

  const criteria = expected.criteria ?? [];
  const criterionIds = new Set();
  let totalWeight = 0;
  for (const criterion of criteria) {
    if (criterionIds.has(criterion.id)) {
      errors.push(`duplicate criterion ${criterion.id} in ${entry.id}`);
    }
    criterionIds.add(criterion.id);
    if (!supportedCriteria.has(criterion.type)) {
      errors.push(`unsupported criterion type ${criterion.type} in ${entry.id}`);
    }
    if (!Number.isFinite(criterion.weight) || criterion.weight <= 0) {
      errors.push(`invalid weight for ${criterion.id} in ${entry.id}`);
    }
    totalWeight += criterion.weight ?? 0;
  }
  if (totalWeight !== 100) {
    errors.push(`rubric weights for ${entry.id} total ${totalWeight}, expected 100`);
  }
}

const report = {
  suite: manifest.suite,
  version: manifest.version,
  scenarios: manifest.scenarios?.length ?? 0,
  valid: errors.length === 0,
  errors,
};

console.log(JSON.stringify(report, null, 2));
process.exitCode = errors.length === 0 ? 0 : 1;
