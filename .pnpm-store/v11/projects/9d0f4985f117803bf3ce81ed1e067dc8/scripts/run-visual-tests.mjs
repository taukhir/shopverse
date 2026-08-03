import {spawnSync} from 'node:child_process';

const result = spawnSync(process.execPath, [
  'node_modules/@playwright/test/cli.js',
  'test',
  'tests/visual-regression.spec.ts',
  '--project=desktop-chromium',
  ...process.argv.slice(2),
], {
  stdio: 'inherit',
  env: {...process.env, VISUAL_REGRESSION: '1'},
});

if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
