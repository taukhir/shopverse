import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const documentationDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryDir = path.resolve(documentationDir, '..');
const wrapper = path.join(repositoryDir, 'shopverse-platform',
  process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');
const projectDir = path.join(documentationDir, 'labs', 'spring-architect');

console.log('Compiling and testing Java 21 / Spring Boot 4 documentation examples...');
const quotePowerShell = (value) => `'${value.replaceAll("'", "''")}'`;
const command = process.platform === 'win32' ? 'powershell.exe' : wrapper;
const args = process.platform === 'win32'
  ? ['-NoProfile', '-NonInteractive', '-Command',
      `& ${quotePowerShell(wrapper)} -p ${quotePowerShell(projectDir)} clean test --console=plain`]
  : ['-p', projectDir, 'clean', 'test', '--console=plain'];
const result = spawnSync(command, args, {
  cwd: repositoryDir,
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
