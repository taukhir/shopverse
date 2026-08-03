import {access, readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const sidebar = await readFile(join(root, 'sidebars.ts'), 'utf8');

const coverage = [
  ['1. Engineering Foundations', 'development/ENGINEERING-FOUNDATIONS-OVERVIEW'],
  ['Design Patterns', 'development/DESIGN-PATTERNS'],
  ['Arrays', 'data-structures/programming/arrays/ARRAYS-OVERVIEW'],
  ['2. Java', 'java/CORE-JAVA-DEEP-DIVE'],
  ['Collections And Data Structures', 'java/JAVA-COLLECTIONS'],
  ['3. Spring And Spring Boot', 'spring/README'],
  ['4. Data And Persistence', 'data/DATA-PERSISTENCE-OVERVIEW'],
  ['5. Microservices And Distributed Systems', 'architecture/MICROSERVICES-DISTRIBUTED-SYSTEMS'],
  ['6. Security', 'security/README'],
  ['7. Logging And Observability', 'observability/OBSERVABILITY-OVERVIEW'],
  ['8. Delivery, Containers And CI/CD', 'operations/README'],
  ['Maven Engineering Path', 'operations/MAVEN-OVERVIEW'],
  ['Terraform And OpenTofu IaC', 'operations/INFRASTRUCTURE-AS-CODE-OVERVIEW'],
  ['Helm, GitOps And Argo CD', 'operations/HELM-GITOPS-ARGOCD-OVERVIEW'],
  ['Linux Production Troubleshooting', 'operations/LINUX-OVERVIEW'],
  ['Kubernetes Beginner-To-Architect', 'operations/kubernetes/KUBERNETES-OVERVIEW'],
  ['Deployment Strategies', 'operations/DEPLOYMENT-STRATEGIES'],
  ['Docker Beginner-To-Architect', 'operations/DOCKER'],
  ['9. Cloud And AWS', 'cloud/README'],
  ['AWS', 'cloud/aws/AWS-UMBRELLA'],
  ['10. Production Platform Engineering', 'architecture/PRODUCTION-PLATFORM-ENGINEERING'],
  ['11. AI, RAG And Java AI', 'ai/README'],
  ['12. Shopverse Implementation', 'case-study/SHOPVERSE'],
];

async function findDoc(id) {
  for (const extension of ['.md', '.mdx']) {
    const path = join(root, 'docs', `${id}${extension}`);
    try {
      await access(path);
      return path;
    } catch {
      // Try the other supported documentation extension.
    }
  }
  return null;
}

const failures = [];
for (const [label, id] of coverage) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const categoryPattern = new RegExp(
    `label:\\s*'${escapedLabel}'[\\s\\S]{0,500}?link:\\s*\\{type:\\s*'doc',\\s*id:\\s*'${escapedId}'\\}`,
  );
  if (!categoryPattern.test(sidebar)) {
    failures.push(`${label}: sidebar category does not link to ${id}`);
    continue;
  }

  const docPath = await findDoc(id);
  if (!docPath) {
    failures.push(`${label}: overview document ${id} does not exist`);
    continue;
  }

  const content = await readFile(docPath, 'utf8');
  const title = content.match(/^title:\s*(.+)$/m)?.[1]?.trim();
  if (!title) failures.push(`${label}: ${id} has no frontmatter title`);
}

console.log(`Overview coverage audit: ${coverage.length - failures.length}/${coverage.length} entry points connected.`);
if (failures.length) {
  console.error('Overview coverage failures:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
}

