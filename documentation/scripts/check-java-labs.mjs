import {execFileSync} from 'node:child_process';
import {mkdirSync, rmSync} from 'node:fs';
import {resolve} from 'node:path';

const root = resolve('labs/java-senior');
const source = resolve(root, 'src/main/java/io/shopverse/labs');
const output = resolve(root, 'target/plain-classes');
const files = ['ThreadPoolSaturationLab.java', 'VirtualThreadPinningLab.java',
  'DirectMemoryPressureLab.java', 'ClassLoaderIdentityLab.java', 'GcAllocationWorkload.java',
  'AdvancedApisLab.java', 'SelectorEchoLab.java', 'CoreLanguageScenarios.java',
  'ForkJoinSumLab.java', 'RangeSpliterator.java']
  .map((name) => resolve(source, name));

rmSync(output, {recursive: true, force: true});
mkdirSync(output, {recursive: true});
execFileSync('javac', ['--release', '24', '-d', output, ...files], {stdio: 'inherit'});
for (const main of ['ThreadPoolSaturationLab', 'ClassLoaderIdentityLab', 'VirtualThreadPinningLab', 'AdvancedApisLab']) {
  execFileSync('java', ['-cp', output, `io.shopverse.labs.${main}`], {stdio: 'inherit'});
}
console.log('Java senior lab smoke checks passed.');
