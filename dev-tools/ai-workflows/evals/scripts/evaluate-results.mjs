import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const evalRoot = path.resolve(scriptDirectory, '..');

function usage(message) {
  if (message) console.error(message);
  console.error('Usage: node evaluate-results.mjs --scenario <id> --result <result.json>');
  process.exit(2);
}

function parseArguments(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || value === undefined) usage(`Invalid argument: ${key ?? ''}`);
    values[key.slice(2)] = value;
  }
  if (!values.scenario || !values.result) usage('Both --scenario and --result are required.');
  return values;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getValue(object, dottedPath) {
  return dottedPath.split('.').reduce((value, key) => value?.[key], object);
}

function hasValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return true;
  return true;
}

function searchableText(result) {
  const claims = (result.claims ?? []).map((claim) => claim.statement ?? '').join('\n');
  return `${result.answer ?? ''}\n${claims}`.toLowerCase();
}

function evaluateCriterion(criterion, result) {
  switch (criterion.type) {
    case 'required_fields': {
      const missing = criterion.paths.filter((fieldPath) => !hasValue(getValue(result, fieldPath)));
      return {passed: missing.length === 0, details: {missing}};
    }
    case 'answer_terms': {
      const text = searchableText(result);
      const missingAll = (criterion.all_terms ?? []).filter((term) => !text.includes(term.toLowerCase()));
      const missingGroups = (criterion.any_term_groups ?? []).filter(
        (group) => !group.some((term) => text.includes(term.toLowerCase())),
      );
      return {
        passed: missingAll.length === 0 && missingGroups.length === 0,
        details: {missing_all_terms: missingAll, unsatisfied_any_term_groups: missingGroups},
      };
    }
    case 'required_claims': {
      const claims = new Map((result.claims ?? []).map((claim) => [claim.id, claim]));
      const missing = [];
      const insufficientEvidence = [];
      const invalidEvidence = [];
      for (const claimId of criterion.claim_ids) {
        const claim = claims.get(claimId);
        if (!claim) {
          missing.push(claimId);
          continue;
        }
        const evidence = Array.isArray(claim.evidence) ? claim.evidence : [];
        if (evidence.length < (criterion.minimum_evidence_per_claim ?? 1)) {
          insufficientEvidence.push(claimId);
        }
        if (criterion.allowed_evidence_prefixes?.length > 0) {
          const hasAllowedEvidence = evidence.some((reference) =>
            criterion.allowed_evidence_prefixes.some((prefix) => reference.startsWith(prefix)),
          );
          if (!hasAllowedEvidence) invalidEvidence.push(claimId);
        }
      }
      return {
        passed: missing.length === 0 && insufficientEvidence.length === 0 && invalidEvidence.length === 0,
        details: {
          missing_claims: missing,
          insufficient_evidence: insufficientEvidence,
          evidence_outside_allowed_prefixes: invalidEvidence,
        },
      };
    }
    case 'file_scope': {
      const changedFiles = Array.isArray(result.changed_files) ? result.changed_files : [];
      const patterns = (criterion.allowed_patterns ?? []).map((pattern) => new RegExp(pattern));
      const outsideScope = changedFiles.filter(
        (file) => patterns.length === 0 || !patterns.some((pattern) => pattern.test(file)),
      );
      const changesRequirementMet = criterion.require_changes ? changedFiles.length > 0 : true;
      const maximumMet = changedFiles.length <= (criterion.maximum_changes ?? Number.POSITIVE_INFINITY);
      return {
        passed: changesRequirementMet && maximumMet && outsideScope.length === 0,
        details: {
          changed_files: changedFiles,
          changes_required: criterion.require_changes,
          maximum_changes: criterion.maximum_changes,
          outside_scope: outsideScope,
        },
      };
    }
    case 'forbidden_terms': {
      const text = searchableText(result);
      const found = criterion.terms.filter((term) => text.includes(term.toLowerCase()));
      return {passed: found.length === 0, details: {found_forbidden_terms: found}};
    }
    case 'commands': {
      const commandText = (result.commands ?? []).join('\n').toLowerCase();
      const missingAll = (criterion.required_all ?? []).filter(
        (fragment) => !commandText.includes(fragment.toLowerCase()),
      );
      const missingGroups = (criterion.required_any_groups ?? []).filter(
        (group) => !group.some((fragment) => commandText.includes(fragment.toLowerCase())),
      );
      return {
        passed: missingAll.length === 0 && missingGroups.length === 0,
        details: {missing_required_fragments: missingAll, unsatisfied_command_groups: missingGroups},
      };
    }
    case 'metrics': {
      const failed = [];
      for (const check of criterion.checks) {
        const actual = getValue(result, check.path);
        const expected = check.value;
        const passed =
          typeof actual === 'number' &&
          ((check.operator === 'eq' && actual === expected) ||
            (check.operator === 'lte' && actual <= expected) ||
            (check.operator === 'gte' && actual >= expected) ||
            (check.operator === 'lt' && actual < expected) ||
            (check.operator === 'gt' && actual > expected));
        if (!passed) failed.push({path: check.path, operator: check.operator, expected, actual});
      }
      return {passed: failed.length === 0, details: {failed_checks: failed}};
    }
    default:
      return {passed: false, details: {error: `Unsupported criterion type: ${criterion.type}`}};
  }
}

const argumentsMap = parseArguments(process.argv.slice(2));
const manifest = readJson(path.join(evalRoot, 'manifest.json'));
const entry = manifest.scenarios.find((candidate) => candidate.id === argumentsMap.scenario);
if (!entry) usage(`Unknown scenario: ${argumentsMap.scenario}`);

const scenario = readJson(path.resolve(evalRoot, entry.file));
const expected = readJson(path.resolve(evalRoot, scenario.expected_path));
const resultPath = path.resolve(process.cwd(), argumentsMap.result);
if (!fs.existsSync(resultPath)) usage(`Result file does not exist: ${argumentsMap.result}`);
const result = readJson(resultPath);

if (result.scenario_id !== scenario.id) {
  console.log(JSON.stringify({
    scenario_id: scenario.id,
    passed: false,
    score: 0,
    threshold: expected.pass_threshold,
    error: `Result scenario_id ${result.scenario_id ?? '<missing>'} does not match ${scenario.id}`,
  }, null, 2));
  process.exit(1);
}

let score = 0;
const criteria = expected.criteria.map((criterion) => {
  const evaluation = evaluateCriterion(criterion, result);
  const earned = evaluation.passed ? criterion.weight : 0;
  score += earned;
  return {
    id: criterion.id,
    type: criterion.type,
    weight: criterion.weight,
    earned,
    passed: evaluation.passed,
    details: evaluation.details,
  };
});

const passed = score >= expected.pass_threshold;
const report = {
  suite: manifest.suite,
  suite_version: manifest.version,
  scenario_id: scenario.id,
  result_file: path.relative(process.cwd(), resultPath),
  score,
  threshold: expected.pass_threshold,
  passed,
  criteria,
};

console.log(JSON.stringify(report, null, 2));
process.exitCode = passed ? 0 : 1;
