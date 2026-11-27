import { execFileSync } from 'node:child_process';

const range = process.env.COMMIT_RANGE;
if (!range || !/^[0-9a-f]{40}\.\.[0-9a-f]{40}$/i.test(range)) {
  throw new Error('COMMIT_RANGE must contain two commit SHAs in the form BASE..HEAD.');
}

const commits = execFileSync('git', ['rev-list', '--reverse', range], {
  encoding: 'utf8',
}).trim().split(/\r?\n/).filter(Boolean);
const format = /^\[[A-Z][A-Z0-9]*-[A-Z0-9]+\] : .+/;
const invalid = [];

for (const sha of commits) {
  const subject = execFileSync('git', ['show', '-s', '--format=%s', sha], {
    encoding: 'utf8',
  }).trim();
  if (!format.test(subject)) {
    invalid.push(`${sha.slice(0, 12)} ${subject}`);
  }
}

if (invalid.length > 0) {
  console.error('Commit subjects must match: [JIRA-ID] : commit message');
  console.error('Example: [BUG-003] : cover multi-item checkout');
  console.error(`Invalid commit(s):\n${invalid.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${commits.length} commit subject(s).`);
}
