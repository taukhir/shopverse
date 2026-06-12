import type {Config} from '@docusaurus/types';
import type {Options, ThemeConfig} from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Backend Engineering Knowledge Base',
  tagline: 'Study material, production patterns, and the Shopverse case study',
  favicon: 'img/favicon.svg',

  url: 'https://taukhir.github.io',
  baseUrl: '/shopverse/',
  organizationName: 'taukhir',
  projectName: 'shopverse',

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
        docsDir: '../docs',
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
          path: '../docs',
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
          editUrl: ({docPath}) =>
            `https://github.com/taukhir/shopverse/edit/main/docs/${docPath}`,
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
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Backend Engineering',
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
      additionalLanguages: ['java', 'bash', 'powershell', 'yaml', 'json', 'sql'],
    },
  } satisfies ThemeConfig,
};

export default config;
