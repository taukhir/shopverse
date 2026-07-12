import type {Config} from '@docusaurus/types';
import type {Options, ThemeConfig} from '@docusaurus/preset-classic';
import {themes as prismThemes} from 'prism-react-renderer';

const glossaryTerms: Record<string, string> = {
  'idempotency': 'idempotency',
  'transactional outbox': 'transactional-outbox',
  'saga': 'saga',
  'jwks': 'jwks',
  'fencing token': 'fencing-token',
  'consumer group': 'consumer-group',
  'distributed lock': 'distributed-lock',
  'correlation id': 'correlation-id',
  'circuit breaker': 'circuit-breaker',
  'backpressure': 'backpressure',
  'optimistic locking': 'optimistic-locking',
  'dead letter topic': 'dead-letter-topic',
  'rbac': 'rbac',
  'abac': 'abac',
  'retrieval-augmented generation': 'rag',
  'bulkhead': 'bulkhead',
  'eventual consistency': 'eventual-consistency',
  'cqrs': 'cqrs',
  'cache stampede': 'cache-stampede',
  'split brain': 'split-brain',
  'mtls': 'mtls',
  'csrf': 'csrf',
  'vector database': 'vector-database',
  'embedding': 'embedding',
  'prompt injection': 'prompt-injection',
  'oltp': 'oltp',
  'olap': 'olap',
  'nosql': 'nosql',
  'partitioning': 'partitioning',
  'sharding': 'sharding',
  'keyset pagination': 'keyset-pagination',
  'connection pool': 'connection-pool',
  'query plan': 'query-plan',
  'sli': 'sli',
  'slo': 'slo',
  'rpo': 'rpo',
  'rto': 'rto',
  'cdc': 'cdc',
  'sbom': 'sbom',
  'watermark': 'watermark',
  'model context protocol': 'model-context-protocol',
  'tool calling': 'tool-calling',
  'reranking': 'reranking',
};

function remarkGlossaryLinks() {
  return (tree: any, file: any) => {
    if (String(file.path ?? '').includes('GLOSSARY')) return;
    const linked = new Set<string>();
    const walk = (node: any) => {
      if (!node.children || ['link', 'code', 'inlineCode', 'heading'].includes(node.type)) return;
      for (let index = 0; index < node.children.length; index += 1) {
        const child = node.children[index];
        if (child.type !== 'text') { walk(child); continue; }
        const candidates = Object.keys(glossaryTerms).filter((term) => !linked.has(term));
        const match = candidates.map((term) => ({term, index: child.value.toLowerCase().indexOf(term)})).filter((item) => item.index >= 0).sort((a, b) => a.index - b.index)[0];
        if (!match) continue;
        const before = child.value.slice(0, match.index); const label = child.value.slice(match.index, match.index + match.term.length); const after = child.value.slice(match.index + match.term.length);
        const replacement = [before && {type: 'text', value: before}, {type: 'link', url: `/shopverse/reference/GLOSSARY#${glossaryTerms[match.term]}`, title: `Glossary: ${label}`, children: [{type: 'text', value: label}]}, after && {type: 'text', value: after}].filter(Boolean);
        node.children.splice(index, 1, ...replacement); linked.add(match.term); index += replacement.length - 1;
      }
    };
    walk(tree);
  };
}

const config: Config = {
  title: 'Backend Engineering Knowledge Base',
  tagline: 'Study material, production patterns, and the Shopverse case study',
  favicon: 'img/favicon.svg',

  url: 'https://taukhir.github.io',
  baseUrl: '/shopverse/',
  organizationName: 'taukhir',
  projectName: 'shopverse',
  customFields: {
    analyticsDomain: process.env.DOCS_ANALYTICS_DOMAIN ?? '',
    docxExportEndpoint: process.env.DOCS_DOCX_EXPORT_ENDPOINT ?? '',
  },

  onBrokenLinks: 'warn',
  onBrokenAnchors: 'warn',

  markdown: {
    mermaid: true,
  },
  themes: [
    '@docusaurus/theme-mermaid',
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        language: ['en'],
        indexDocs: true,
        indexBlog: false,
        docsDir: 'docs',
        docsRouteBasePath: '/',
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      },
    ],
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          path: 'docs',
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          remarkPlugins: [remarkGlossaryLinks],
          // Git-derived dates are unreliable for local and newly generated pages.
          showLastUpdateAuthor: false,
          showLastUpdateTime: false,
          editUrl: ({docPath}) =>
            `https://github.com/taukhir/shopverse/edit/main/documentation/docs/${docPath}`,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
        },
      } satisfies Options,
    ],
  ],

  themeConfig: {
    metadata: [
      {name: 'description', content: 'Backend engineering guides, production patterns, and the Shopverse microservices case study.'},
    ],
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: true,
      },
    },
    announcementBar: {
      id: 'reading_help_v1',
      content: 'Tip: use search to jump across the library, and click any documentation image to inspect it full size.',
      backgroundColor: '#e6e8ff',
      textColor: '#2f3d9e',
      isCloseable: true,
    },
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Backend Engineering',
      logo: {
        alt: 'Backend Engineering Knowledge Base',
        src: 'img/favicon.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Study Library',
        },
        {
          to: '/reference/LEARNING-PATH',
          label: 'Learning Path',
          position: 'left',
        },
        {
          to: '/case-study/SHOPVERSE',
          label: 'Shopverse Case Study',
          position: 'left',
        },
        {
          href: 'https://github.com/taukhir/shopverse',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Study',
          items: [
            {label: 'Learning path', to: '/reference/LEARNING-PATH'},
            {label: 'Spring ecosystem', to: '/spring/SPRING-ECOSYSTEM'},
            {label: 'Database engineering', to: '/data/DATABASE-ENGINEERING'},
          ],
        },
        {
          title: 'Distributed Systems',
          items: [
            {label: 'Microservices', to: '/architecture/MICROSERVICES-GENERIC'},
            {label: 'Kafka', to: '/integration/APACHE-KAFKA'},
            {label: 'SAGA and Outbox', to: '/reliability/SAGA-GENERIC'},
          ],
        },
        {
          title: 'Case Study',
          items: [
            {label: 'Shopverse overview', to: '/case-study/SHOPVERSE'},
            {label: 'System design', to: '/architecture/SYSTEM-DESIGN'},
            {label: 'Problems and solutions', to: '/reliability/PROBLEMS-AND-SOLUTIONS'},
          ],
        },
      ],
      copyright: `Copyright ${new Date().getFullYear()} Backend Engineering Knowledge Base`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.vsDark,
      additionalLanguages: ['java', 'bash', 'powershell', 'yaml', 'json', 'sql'],
    },
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 4,
    },
  } satisfies ThemeConfig,
};

export default config;
