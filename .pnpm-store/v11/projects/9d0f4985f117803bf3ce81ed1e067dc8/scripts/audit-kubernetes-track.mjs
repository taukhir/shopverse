import {access, readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const docsRoot = join(root, 'docs');
const sidebar = await readFile(join(root, 'sidebars.ts'), 'utf8');

const orderedPages = [
  'operations/kubernetes/KUBERNETES-OVERVIEW',
  'operations/KUBERNETES-ARCHITECT-PATH',
  'operations/KUBERNETES-WORKLOAD-ENGINEERING',
  'operations/kubernetes/KUBERNETES-KUBECTL-MANIFESTS-COMMANDS',
  'operations/kubernetes/KUBERNETES-KUBECONFIG-ACCESS',
  'operations/kubernetes/KUBERNETES-CONTROL-PLANE-INTERNALS',
  'operations/kubernetes/KUBERNETES-WORKLOADS-SCHEDULING',
  'operations/kubernetes/KUBERNETES-NETWORKING-SERVICES',
  'operations/kubernetes/KUBERNETES-STORAGE-STATEFUL',
  'operations/kubernetes/KUBERNETES-SECURITY-MULTITENANCY',
  'operations/kubernetes/KUBERNETES-CLUSTER-OPERATIONS',
  'operations/kubernetes/KUBERNETES-CONTAINERS-VMS-BOSH',
  'operations/kubernetes/TKGI-OVERVIEW-PATH',
  'operations/kubernetes/KUBERNETES-TROUBLESHOOTING-INTERVIEW-REVISION',
];

const detailedPages = orderedPages.filter(
  (id) => id.includes('/kubernetes/KUBERNETES-') && !id.endsWith('TROUBLESHOOTING-INTERVIEW-REVISION'),
);
detailedPages.push('operations/kubernetes/KUBERNETES-TROUBLESHOOTING-INTERVIEW-REVISION');

const failures = [];

async function readDoc(id) {
  const path = join(docsRoot, `${id}.md`);
  try {
    await access(path);
    return await readFile(path, 'utf8');
  } catch {
    failures.push(`${id}: document is missing`);
    return '';
  }
}

let previousIndex = -1;
for (const id of orderedPages) {
  const index = sidebar.indexOf(`'${id}'`);
  if (index < 0) failures.push(`${id}: not connected to the sidebar`);
  if (index >= 0 && index < previousIndex) failures.push(`${id}: appears out of learning order`);
  if (index >= 0) previousIndex = index;
  await readDoc(id);
}

for (const id of detailedPages) {
  const content = await readDoc(id);
  if (!content) continue;
  if (!/^title:\s*\S.+$/m.test(content)) failures.push(`${id}: missing a descriptive frontmatter title`);
  if (!/^difficulty:\s*(Beginner|Intermediate|Advanced)$/m.test(content)) {
    failures.push(`${id}: missing a valid difficulty level`);
  }
  if (!/^## (Top )?Interview (Questions|Scenarios|Revision)/m.test(content)) {
    failures.push(`${id}: missing an explicit interview section`);
  }
  if (!/^## Official References$/m.test(content)) failures.push(`${id}: missing official references`);
  if (!/^## Recommended Next$/m.test(content)) failures.push(`${id}: missing recommended next step`);
  if (!/```|^\|.+\|$/m.test(content)) failures.push(`${id}: missing a code, flow, or table example`);
}

const overview = await readDoc('operations/kubernetes/KUBERNETES-OVERVIEW');
for (const term of ['API server', 'etcd', 'kubelet', 'CNI', 'CSI', 'EndpointSlice', 'StorageClass', 'RBAC', 'kubeconfig']) {
  if (!overview.includes(term)) failures.push(`Kubernetes overview: missing terminology entry for ${term}`);
}
if (!overview.includes('## Kubernetes Terminology Glossary')) {
  failures.push('Kubernetes overview: missing the terminology glossary');
}

const kubectl = await readDoc('operations/kubernetes/KUBERNETES-KUBECTL-MANIFESTS-COMMANDS');
for (const command of [
  'kubectl config current-context',
  'kubectl api-resources',
  'kubectl get',
  'kubectl describe',
  'kubectl logs',
  'kubectl apply',
  'kubectl diff',
  'kubectl rollout',
  'kubectl exec',
  'kubectl debug',
  'kubectl drain',
  'kubectl auth can-i',
  'kubectl patch',
]) {
  if (!kubectl.includes(command)) failures.push(`kubectl handbook: missing ${command}`);
}

console.log(`Kubernetes track audit: ${orderedPages.length} pages ordered, ${detailedPages.length} detailed pages checked.`);
if (failures.length) {
  console.error('Kubernetes track failures:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('Terminology, commands, examples, references, next steps, and interview coverage are present.');
}
