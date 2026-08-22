import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/shopverse/search',
    component: ComponentCreator('/shopverse/search', 'e53'),
    exact: true
  },
  {
    path: '/shopverse/',
    component: ComponentCreator('/shopverse/', '0bc'),
    routes: [
      {
        path: '/shopverse/',
        component: ComponentCreator('/shopverse/', '042'),
        routes: [
          {
            path: '/shopverse/tags',
            component: ComponentCreator('/shopverse/tags', 'bed'),
            exact: true
          },
          {
            path: '/shopverse/tags/abac',
            component: ComponentCreator('/shopverse/tags/abac', '47d'),
            exact: true
          },
          {
            path: '/shopverse/tags/amway',
            component: ComponentCreator('/shopverse/tags/amway', 'f24'),
            exact: true
          },
          {
            path: '/shopverse/tags/aop',
            component: ComponentCreator('/shopverse/tags/aop', '290'),
            exact: true
          },
          {
            path: '/shopverse/tags/api-client',
            component: ComponentCreator('/shopverse/tags/api-client', '7be'),
            exact: true
          },
          {
            path: '/shopverse/tags/api-contracts',
            component: ComponentCreator('/shopverse/tags/api-contracts', '2f3'),
            exact: true
          },
          {
            path: '/shopverse/tags/architecture',
            component: ComponentCreator('/shopverse/tags/architecture', 'aff'),
            exact: true
          },
          {
            path: '/shopverse/tags/argo-cd',
            component: ComponentCreator('/shopverse/tags/argo-cd', '8f5'),
            exact: true
          },
          {
            path: '/shopverse/tags/arraydeque',
            component: ComponentCreator('/shopverse/tags/arraydeque', '531'),
            exact: true
          },
          {
            path: '/shopverse/tags/arraylist',
            component: ComponentCreator('/shopverse/tags/arraylist', '2fd'),
            exact: true
          },
          {
            path: '/shopverse/tags/authorization',
            component: ComponentCreator('/shopverse/tags/authorization', '6e1'),
            exact: true
          },
          {
            path: '/shopverse/tags/aws',
            component: ComponentCreator('/shopverse/tags/aws', '5cf'),
            exact: true
          },
          {
            path: '/shopverse/tags/behavioral',
            component: ComponentCreator('/shopverse/tags/behavioral', '043'),
            exact: true
          },
          {
            path: '/shopverse/tags/cache',
            component: ComponentCreator('/shopverse/tags/cache', '787'),
            exact: true
          },
          {
            path: '/shopverse/tags/case-studies',
            component: ComponentCreator('/shopverse/tags/case-studies', 'd46'),
            exact: true
          },
          {
            path: '/shopverse/tags/cdi',
            component: ComponentCreator('/shopverse/tags/cdi', '102'),
            exact: true
          },
          {
            path: '/shopverse/tags/checkout',
            component: ComponentCreator('/shopverse/tags/checkout', '365'),
            exact: true
          },
          {
            path: '/shopverse/tags/code-generation',
            component: ComponentCreator('/shopverse/tags/code-generation', 'f01'),
            exact: true
          },
          {
            path: '/shopverse/tags/collections',
            component: ComponentCreator('/shopverse/tags/collections', '400'),
            exact: true
          },
          {
            path: '/shopverse/tags/commerce',
            component: ComponentCreator('/shopverse/tags/commerce', '62e'),
            exact: true
          },
          {
            path: '/shopverse/tags/concurrency',
            component: ComponentCreator('/shopverse/tags/concurrency', '0dd'),
            exact: true
          },
          {
            path: '/shopverse/tags/containers',
            component: ComponentCreator('/shopverse/tags/containers', '68a'),
            exact: true
          },
          {
            path: '/shopverse/tags/contract-testing',
            component: ComponentCreator('/shopverse/tags/contract-testing', '116'),
            exact: true
          },
          {
            path: '/shopverse/tags/creational',
            component: ComponentCreator('/shopverse/tags/creational', '654'),
            exact: true
          },
          {
            path: '/shopverse/tags/data',
            component: ComponentCreator('/shopverse/tags/data', 'dc5'),
            exact: true
          },
          {
            path: '/shopverse/tags/data-structures',
            component: ComponentCreator('/shopverse/tags/data-structures', '702'),
            exact: true
          },
          {
            path: '/shopverse/tags/defensive-copy',
            component: ComponentCreator('/shopverse/tags/defensive-copy', 'fca'),
            exact: true
          },
          {
            path: '/shopverse/tags/deque',
            component: ComponentCreator('/shopverse/tags/deque', '357'),
            exact: true
          },
          {
            path: '/shopverse/tags/design-patterns',
            component: ComponentCreator('/shopverse/tags/design-patterns', '7b2'),
            exact: true
          },
          {
            path: '/shopverse/tags/domain-modeling',
            component: ComponentCreator('/shopverse/tags/domain-modeling', '667'),
            exact: true
          },
          {
            path: '/shopverse/tags/dynatrace',
            component: ComponentCreator('/shopverse/tags/dynatrace', '651'),
            exact: true
          },
          {
            path: '/shopverse/tags/enummap',
            component: ComponentCreator('/shopverse/tags/enummap', '3d5'),
            exact: true
          },
          {
            path: '/shopverse/tags/enumset',
            component: ComponentCreator('/shopverse/tags/enumset', 'b48'),
            exact: true
          },
          {
            path: '/shopverse/tags/events',
            component: ComponentCreator('/shopverse/tags/events', 'd92'),
            exact: true
          },
          {
            path: '/shopverse/tags/fundamentals',
            component: ComponentCreator('/shopverse/tags/fundamentals', 'aca'),
            exact: true
          },
          {
            path: '/shopverse/tags/github-actions',
            component: ComponentCreator('/shopverse/tags/github-actions', '8cf'),
            exact: true
          },
          {
            path: '/shopverse/tags/go-f',
            component: ComponentCreator('/shopverse/tags/go-f', '939'),
            exact: true
          },
          {
            path: '/shopverse/tags/gradle',
            component: ComponentCreator('/shopverse/tags/gradle', 'd8b'),
            exact: true
          },
          {
            path: '/shopverse/tags/hashmap',
            component: ComponentCreator('/shopverse/tags/hashmap', '028'),
            exact: true
          },
          {
            path: '/shopverse/tags/hashset',
            component: ComponentCreator('/shopverse/tags/hashset', 'f31'),
            exact: true
          },
          {
            path: '/shopverse/tags/heap',
            component: ComponentCreator('/shopverse/tags/heap', '6e7'),
            exact: true
          },
          {
            path: '/shopverse/tags/hibernate',
            component: ComponentCreator('/shopverse/tags/hibernate', '847'),
            exact: true
          },
          {
            path: '/shopverse/tags/hld',
            component: ComponentCreator('/shopverse/tags/hld', '555'),
            exact: true
          },
          {
            path: '/shopverse/tags/idempotency',
            component: ComponentCreator('/shopverse/tags/idempotency', 'e99'),
            exact: true
          },
          {
            path: '/shopverse/tags/immutability',
            component: ComponentCreator('/shopverse/tags/immutability', '3ca'),
            exact: true
          },
          {
            path: '/shopverse/tags/integration',
            component: ComponentCreator('/shopverse/tags/integration', 'db3'),
            exact: true
          },
          {
            path: '/shopverse/tags/internals',
            component: ComponentCreator('/shopverse/tags/internals', '9b2'),
            exact: true
          },
          {
            path: '/shopverse/tags/interview',
            component: ComponentCreator('/shopverse/tags/interview', '8a4'),
            exact: true
          },
          {
            path: '/shopverse/tags/java',
            component: ComponentCreator('/shopverse/tags/java', '3dd'),
            exact: true
          },
          {
            path: '/shopverse/tags/jwt',
            component: ComponentCreator('/shopverse/tags/jwt', '5bf'),
            exact: true
          },
          {
            path: '/shopverse/tags/kafka',
            component: ComponentCreator('/shopverse/tags/kafka', '60a'),
            exact: true
          },
          {
            path: '/shopverse/tags/keycloak',
            component: ComponentCreator('/shopverse/tags/keycloak', 'fe6'),
            exact: true
          },
          {
            path: '/shopverse/tags/kubernetes',
            component: ComponentCreator('/shopverse/tags/kubernetes', '520'),
            exact: true
          },
          {
            path: '/shopverse/tags/legacy-route',
            component: ComponentCreator('/shopverse/tags/legacy-route', '168'),
            exact: true
          },
          {
            path: '/shopverse/tags/linkedhashmap',
            component: ComponentCreator('/shopverse/tags/linkedhashmap', '9b0'),
            exact: true
          },
          {
            path: '/shopverse/tags/linkedhashset',
            component: ComponentCreator('/shopverse/tags/linkedhashset', '975'),
            exact: true
          },
          {
            path: '/shopverse/tags/linkedlist',
            component: ComponentCreator('/shopverse/tags/linkedlist', '549'),
            exact: true
          },
          {
            path: '/shopverse/tags/list',
            component: ComponentCreator('/shopverse/tags/list', 'd05'),
            exact: true
          },
          {
            path: '/shopverse/tags/lld',
            component: ComponentCreator('/shopverse/tags/lld', '083'),
            exact: true
          },
          {
            path: '/shopverse/tags/map',
            component: ComponentCreator('/shopverse/tags/map', '621'),
            exact: true
          },
          {
            path: '/shopverse/tags/maven',
            component: ComponentCreator('/shopverse/tags/maven', '527'),
            exact: true
          },
          {
            path: '/shopverse/tags/micrometer',
            component: ComponentCreator('/shopverse/tags/micrometer', 'bd5'),
            exact: true
          },
          {
            path: '/shopverse/tags/microservices',
            component: ComponentCreator('/shopverse/tags/microservices', '6a8'),
            exact: true
          },
          {
            path: '/shopverse/tags/native-image',
            component: ComponentCreator('/shopverse/tags/native-image', '090'),
            exact: true
          },
          {
            path: '/shopverse/tags/oauth-2',
            component: ComponentCreator('/shopverse/tags/oauth-2', '8b3'),
            exact: true
          },
          {
            path: '/shopverse/tags/object-oriented-design',
            component: ComponentCreator('/shopverse/tags/object-oriented-design', '0e1'),
            exact: true
          },
          {
            path: '/shopverse/tags/observability',
            component: ComponentCreator('/shopverse/tags/observability', 'f6f'),
            exact: true
          },
          {
            path: '/shopverse/tags/oidc',
            component: ComponentCreator('/shopverse/tags/oidc', '7b0'),
            exact: true
          },
          {
            path: '/shopverse/tags/openapi',
            component: ComponentCreator('/shopverse/tags/openapi', 'fe6'),
            exact: true
          },
          {
            path: '/shopverse/tags/opentelemetry',
            component: ComponentCreator('/shopverse/tags/opentelemetry', '276'),
            exact: true
          },
          {
            path: '/shopverse/tags/ownership',
            component: ComponentCreator('/shopverse/tags/ownership', 'd0a'),
            exact: true
          },
          {
            path: '/shopverse/tags/panache',
            component: ComponentCreator('/shopverse/tags/panache', 'e62'),
            exact: true
          },
          {
            path: '/shopverse/tags/platform',
            component: ComponentCreator('/shopverse/tags/platform', '926'),
            exact: true
          },
          {
            path: '/shopverse/tags/priorityqueue',
            component: ComponentCreator('/shopverse/tags/priorityqueue', '8d3'),
            exact: true
          },
          {
            path: '/shopverse/tags/production',
            component: ComponentCreator('/shopverse/tags/production', '2c4'),
            exact: true
          },
          {
            path: '/shopverse/tags/quarkus',
            component: ComponentCreator('/shopverse/tags/quarkus', 'e14'),
            exact: true
          },
          {
            path: '/shopverse/tags/queue',
            component: ComponentCreator('/shopverse/tags/queue', '691'),
            exact: true
          },
          {
            path: '/shopverse/tags/rbac',
            component: ComponentCreator('/shopverse/tags/rbac', '11d'),
            exact: true
          },
          {
            path: '/shopverse/tags/red-black-tree',
            component: ComponentCreator('/shopverse/tags/red-black-tree', '47b'),
            exact: true
          },
          {
            path: '/shopverse/tags/reference',
            component: ComponentCreator('/shopverse/tags/reference', '425'),
            exact: true
          },
          {
            path: '/shopverse/tags/reliability',
            component: ComponentCreator('/shopverse/tags/reliability', 'b24'),
            exact: true
          },
          {
            path: '/shopverse/tags/rest',
            component: ComponentCreator('/shopverse/tags/rest', 'a49'),
            exact: true
          },
          {
            path: '/shopverse/tags/security',
            component: ComponentCreator('/shopverse/tags/security', 'c3b'),
            exact: true
          },
          {
            path: '/shopverse/tags/services',
            component: ComponentCreator('/shopverse/tags/services', '306'),
            exact: true
          },
          {
            path: '/shopverse/tags/set',
            component: ComponentCreator('/shopverse/tags/set', '462'),
            exact: true
          },
          {
            path: '/shopverse/tags/shopverse',
            component: ComponentCreator('/shopverse/tags/shopverse', '633'),
            exact: true
          },
          {
            path: '/shopverse/tags/spring',
            component: ComponentCreator('/shopverse/tags/spring', 'c57'),
            exact: true
          },
          {
            path: '/shopverse/tags/spring-security',
            component: ComponentCreator('/shopverse/tags/spring-security', '6e7'),
            exact: true
          },
          {
            path: '/shopverse/tags/structural',
            component: ComponentCreator('/shopverse/tags/structural', '383'),
            exact: true
          },
          {
            path: '/shopverse/tags/swagger',
            component: ComponentCreator('/shopverse/tags/swagger', '2ff'),
            exact: true
          },
          {
            path: '/shopverse/tags/system-design',
            component: ComponentCreator('/shopverse/tags/system-design', '5a1'),
            exact: true
          },
          {
            path: '/shopverse/tags/testing',
            component: ComponentCreator('/shopverse/tags/testing', 'e16'),
            exact: true
          },
          {
            path: '/shopverse/tags/tracing',
            component: ComponentCreator('/shopverse/tags/tracing', '0fe'),
            exact: true
          },
          {
            path: '/shopverse/tags/treemap',
            component: ComponentCreator('/shopverse/tags/treemap', '76c'),
            exact: true
          },
          {
            path: '/shopverse/tags/treeset',
            component: ComponentCreator('/shopverse/tags/treeset', '1c4'),
            exact: true
          },
          {
            path: '/shopverse/tags/tutorial',
            component: ComponentCreator('/shopverse/tags/tutorial', 'c7e'),
            exact: true
          },
          {
            path: '/shopverse/tags/uml',
            component: ComponentCreator('/shopverse/tags/uml', '653'),
            exact: true
          },
          {
            path: '/shopverse/tags/validation',
            component: ComponentCreator('/shopverse/tags/validation', 'ff6'),
            exact: true
          },
          {
            path: '/shopverse/',
            component: ComponentCreator('/shopverse/', '605'),
            routes: [
              {
                path: '/shopverse/ai/',
                component: ComponentCreator('/shopverse/ai/', '5f2'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/ADVANCED-AGENTIC-WORKFLOWS-WORKTREES',
                component: ComponentCreator('/shopverse/ai/ADVANCED-AGENTIC-WORKFLOWS-WORKTREES', '1b1'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/ADVANCED-AI-TOPICS',
                component: ComponentCreator('/shopverse/ai/ADVANCED-AI-TOPICS', '34b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/AGENTS-TOOL-CALLING',
                component: ComponentCreator('/shopverse/ai/AGENTS-TOOL-CALLING', 'd5d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/AI-ASSISTED-SDLC-DEVELOPER-PRODUCTIVITY',
                component: ComponentCreator('/shopverse/ai/AI-ASSISTED-SDLC-DEVELOPER-PRODUCTIVITY', 'f69'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/AI-CONTEXT-ENGINEERING-GUIDE',
                component: ComponentCreator('/shopverse/ai/AI-CONTEXT-ENGINEERING-GUIDE', '7a9'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/AI-DEVELOPER-TOOLKIT-COMMANDS-PROMPTS-CONNECTORS',
                component: ComponentCreator('/shopverse/ai/AI-DEVELOPER-TOOLKIT-COMMANDS-PROMPTS-CONNECTORS', '24e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/AI-DEVELOPMENT-INTERVIEW-WORKBOOK',
                component: ComponentCreator('/shopverse/ai/AI-DEVELOPMENT-INTERVIEW-WORKBOOK', 'acd'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/AI-EVALUATION-COST-PRODUCTIVITY-METRICS',
                component: ComponentCreator('/shopverse/ai/AI-EVALUATION-COST-PRODUCTIVITY-METRICS', '02f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/AI-EVALUATION-OPERATIONS',
                component: ComponentCreator('/shopverse/ai/AI-EVALUATION-OPERATIONS', '25e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/AI-FRAMEWORKS-FROM-ZERO',
                component: ComponentCreator('/shopverse/ai/AI-FRAMEWORKS-FROM-ZERO', '13d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/AI-LEARNING-PLAN',
                component: ComponentCreator('/shopverse/ai/AI-LEARNING-PLAN', '473'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/AI-MODEL-INTERNALS-SELECTION',
                component: ComponentCreator('/shopverse/ai/AI-MODEL-INTERNALS-SELECTION', '458'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/AI-REVISION-SHEET',
                component: ComponentCreator('/shopverse/ai/AI-REVISION-SHEET', '6fa'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/AI-SECURITY-GUARDRAILS',
                component: ComponentCreator('/shopverse/ai/AI-SECURITY-GUARDRAILS', '91b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/AI-SECURITY-PROMPT-INJECTION-PLAYBOOK',
                component: ComponentCreator('/shopverse/ai/AI-SECURITY-PROMPT-INJECTION-PLAYBOOK', 'b37'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/API-INTEGRATION-PROMPTING',
                component: ComponentCreator('/shopverse/ai/API-INTEGRATION-PROMPTING', '588'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/BEGINNER-TO-ADVANCED-GUIDE',
                component: ComponentCreator('/shopverse/ai/BEGINNER-TO-ADVANCED-GUIDE', 'e04'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/EMBEDDINGS-VECTOR-DB-RAG',
                component: ComponentCreator('/shopverse/ai/EMBEDDINGS-VECTOR-DB-RAG', '150'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/ENTERPRISE-AI-ARCHITECTURE',
                component: ComponentCreator('/shopverse/ai/ENTERPRISE-AI-ARCHITECTURE', 'd4b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/HANDS-ON-LABS',
                component: ComponentCreator('/shopverse/ai/HANDS-ON-LABS', '024'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/INTERVIEW-QA',
                component: ComponentCreator('/shopverse/ai/INTERVIEW-QA', 'ca9'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/JAVA-AI-CODE-COOKBOOK',
                component: ComponentCreator('/shopverse/ai/JAVA-AI-CODE-COOKBOOK', '34a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/JAVA-AI-DEVELOPER-GUIDE',
                component: ComponentCreator('/shopverse/ai/JAVA-AI-DEVELOPER-GUIDE', '6c0'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/JAVA-AI-REQUEST-RAG-PATTERNS',
                component: ComponentCreator('/shopverse/ai/JAVA-AI-REQUEST-RAG-PATTERNS', 'a14'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/JAVA-AI-TOOLS-SECURITY-PATTERNS',
                component: ComponentCreator('/shopverse/ai/JAVA-AI-TOOLS-SECURITY-PATTERNS', 'cd7'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/LANGCHAIN4J-ARCHITECTURE-AI-SERVICES',
                component: ComponentCreator('/shopverse/ai/LANGCHAIN4J-ARCHITECTURE-AI-SERVICES', 'f65'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/LANGCHAIN4J-DEEP-DIVE',
                component: ComponentCreator('/shopverse/ai/LANGCHAIN4J-DEEP-DIVE', 'a3c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/LANGCHAIN4J-RAG-SPRING-OPERATIONS',
                component: ComponentCreator('/shopverse/ai/LANGCHAIN4J-RAG-SPRING-OPERATIONS', '45d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/LANGCHAIN4J-TOOLS-MEMORY',
                component: ComponentCreator('/shopverse/ai/LANGCHAIN4J-TOOLS-MEMORY', '1fa'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/LANGCHAIN4J-TUTORIAL-AI-SERVICES',
                component: ComponentCreator('/shopverse/ai/LANGCHAIN4J-TUTORIAL-AI-SERVICES', '9cf'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/LANGCHAIN4J-TUTORIAL-CHAT-MODELS',
                component: ComponentCreator('/shopverse/ai/LANGCHAIN4J-TUTORIAL-CHAT-MODELS', 'be7'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/LANGCHAIN4J-TUTORIAL-RAG',
                component: ComponentCreator('/shopverse/ai/LANGCHAIN4J-TUTORIAL-RAG', 'ff7'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/LANGCHAIN4J-TUTORIAL-SPRING-BOOT',
                component: ComponentCreator('/shopverse/ai/LANGCHAIN4J-TUTORIAL-SPRING-BOOT', '108'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/LANGCHAIN4J-TUTORIAL-TOOLS-MEMORY',
                component: ComponentCreator('/shopverse/ai/LANGCHAIN4J-TUTORIAL-TOOLS-MEMORY', 'ad7'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/LANGCHAIN4J-TUTORIALS',
                component: ComponentCreator('/shopverse/ai/LANGCHAIN4J-TUTORIALS', '300'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/LANGCHAIN4J-UMBRELLA',
                component: ComponentCreator('/shopverse/ai/LANGCHAIN4J-UMBRELLA', '032'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/LLM-GENERATIVE-AI-FUNDAMENTALS',
                component: ComponentCreator('/shopverse/ai/LLM-GENERATIVE-AI-FUNDAMENTALS', 'd29'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/MCP-PRIMITIVES-TRANSPORTS',
                component: ComponentCreator('/shopverse/ai/MCP-PRIMITIVES-TRANSPORTS', '6b5'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/MCP-PROTOCOL-LIFECYCLE',
                component: ComponentCreator('/shopverse/ai/MCP-PROTOCOL-LIFECYCLE', 'd40'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/MCP-SECURITY-OPERATIONS',
                component: ComponentCreator('/shopverse/ai/MCP-SECURITY-OPERATIONS', '1c2'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/MCP-SPRING-AI',
                component: ComponentCreator('/shopverse/ai/MCP-SPRING-AI', '983'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/MCP-SPRING-SHOPVERSE-LAB',
                component: ComponentCreator('/shopverse/ai/MCP-SPRING-SHOPVERSE-LAB', '777'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/MCP-UMBRELLA',
                component: ComponentCreator('/shopverse/ai/MCP-UMBRELLA', '881'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/PROMPT-ENGINEERING-STRUCTURED-OUTPUT',
                component: ComponentCreator('/shopverse/ai/PROMPT-ENGINEERING-STRUCTURED-OUTPUT', '133'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/RAG-ENGINEERING',
                component: ComponentCreator('/shopverse/ai/RAG-ENGINEERING', '990'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/RAG-FOR-ENGINEERING-DOCUMENTATION',
                component: ComponentCreator('/shopverse/ai/RAG-FOR-ENGINEERING-DOCUMENTATION', '7a6'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/SECURE-AI-AGENTS-DATA-PERFORMANCE',
                component: ComponentCreator('/shopverse/ai/SECURE-AI-AGENTS-DATA-PERFORMANCE', 'e16'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/SHOPVERSE-AI-POC-PLAN',
                component: ComponentCreator('/shopverse/ai/SHOPVERSE-AI-POC-PLAN', 'b0e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/SHOPVERSE-AI-PRACTICAL-WORKBOOK',
                component: ComponentCreator('/shopverse/ai/SHOPVERSE-AI-PRACTICAL-WORKBOOK', 'ed4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/SPRING-AI-DEEP-DIVE',
                component: ComponentCreator('/shopverse/ai/SPRING-AI-DEEP-DIVE', 'c54'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/SPRING-AI-LANGCHAIN4J-JAVA',
                component: ComponentCreator('/shopverse/ai/SPRING-AI-LANGCHAIN4J-JAVA', '20b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/SPRING-AI-UMBRELLA',
                component: ComponentCreator('/shopverse/ai/SPRING-AI-UMBRELLA', 'ac8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/SPRING-AI-VS-LANGCHAIN4J',
                component: ComponentCreator('/shopverse/ai/SPRING-AI-VS-LANGCHAIN4J', 'e8c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/SPRING-CLOUD-AI-MCP-ECOSYSTEM',
                component: ComponentCreator('/shopverse/ai/SPRING-CLOUD-AI-MCP-ECOSYSTEM', 'f66'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/ai/VISUAL-LEARNING-GUIDE',
                component: ComponentCreator('/shopverse/ai/VISUAL-LEARNING-GUIDE', '7c4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/adr/gateway-discovery-config',
                component: ComponentCreator('/shopverse/architecture/adr/gateway-discovery-config', 'd98'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/adr/jwt-jwks-security',
                component: ComponentCreator('/shopverse/architecture/adr/jwt-jwks-security', '436'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/adr/kafka-choreography-saga',
                component: ComponentCreator('/shopverse/architecture/adr/kafka-choreography-saga', '54d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/adr/observability-stack',
                component: ComponentCreator('/shopverse/architecture/adr/observability-stack', '220'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/AMWAY-CHECKOUT-DOMAIN-PRIMER',
                component: ComponentCreator('/shopverse/architecture/AMWAY-CHECKOUT-DOMAIN-PRIMER', '1b2'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/AMWAY-DELIVERY-OBSERVABILITY',
                component: ComponentCreator('/shopverse/architecture/AMWAY-DELIVERY-OBSERVABILITY', 'de8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/AMWAY-OPENAPI-CONTRACT-ARTIFACTS',
                component: ComponentCreator('/shopverse/architecture/AMWAY-OPENAPI-CONTRACT-ARTIFACTS', '1d2'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/AMWAY-PROJECT-TECH-STACK',
                component: ComponentCreator('/shopverse/architecture/AMWAY-PROJECT-TECH-STACK', '4e6'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/API-EVENT-COMPATIBILITY',
                component: ComponentCreator('/shopverse/architecture/API-EVENT-COMPATIBILITY', '007'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/API-EVENT-SCHEMA-GOVERNANCE-PATH',
                component: ComponentCreator('/shopverse/architecture/API-EVENT-SCHEMA-GOVERNANCE-PATH', '5dc'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/ARCHITECTURE-OVERVIEW',
                component: ComponentCreator('/shopverse/architecture/ARCHITECTURE-OVERVIEW', '8b7'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/ARCHITECTURE-REVISION-SHEET',
                component: ComponentCreator('/shopverse/architecture/ARCHITECTURE-REVISION-SHEET', '4e4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/ARCHITECTURE-STYLES',
                component: ComponentCreator('/shopverse/architecture/ARCHITECTURE-STYLES', '1c8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/ASYNC-REALTIME-DISTRIBUTED-TIME',
                component: ComponentCreator('/shopverse/architecture/ASYNC-REALTIME-DISTRIBUTED-TIME', '4b0'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/CACHE-PROVIDERS',
                component: ComponentCreator('/shopverse/architecture/CACHE-PROVIDERS', '5e0'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/CACHE-UMBRELLA',
                component: ComponentCreator('/shopverse/architecture/CACHE-UMBRELLA', 'a2f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/CACHING-GENERIC',
                component: ComponentCreator('/shopverse/architecture/CACHING-GENERIC', '7c6'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/CHANGE-DATA-CAPTURE',
                component: ComponentCreator('/shopverse/architecture/CHANGE-DATA-CAPTURE', '0a9'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/CHECKOUT-SECURITY-EVENT-FLOWS',
                component: ComponentCreator('/shopverse/architecture/CHECKOUT-SECURITY-EVENT-FLOWS', '67b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/CQRS',
                component: ComponentCreator('/shopverse/architecture/CQRS', 'bfe'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/DISTRIBUTED-CONSISTENCY-CAP',
                component: ComponentCreator('/shopverse/architecture/DISTRIBUTED-CONSISTENCY-CAP', 'ee1'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/DISTRIBUTED-HYBRID-CACHE',
                component: ComponentCreator('/shopverse/architecture/DISTRIBUTED-HYBRID-CACHE', '409'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/DISTRIBUTED-SYSTEMS',
                component: ComponentCreator('/shopverse/architecture/DISTRIBUTED-SYSTEMS', '74d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/DISTRIBUTED-SYSTEMS-GENERIC',
                component: ComponentCreator('/shopverse/architecture/DISTRIBUTED-SYSTEMS-GENERIC', '0c5'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/DOMAIN-DRIVEN-DESIGN',
                component: ComponentCreator('/shopverse/architecture/DOMAIN-DRIVEN-DESIGN', 'd18'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/financial/FINANCIAL-CONTROLS-SECURITY-AUDIT',
                component: ComponentCreator('/shopverse/architecture/financial/FINANCIAL-CONTROLS-SECURITY-AUDIT', '842'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/financial/FINANCIAL-PRODUCTION-INTERVIEW',
                component: ComponentCreator('/shopverse/architecture/financial/FINANCIAL-PRODUCTION-INTERVIEW', '47b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/financial/FINANCIAL-SYSTEMS-ARCHITECT-PATH',
                component: ComponentCreator('/shopverse/architecture/financial/FINANCIAL-SYSTEMS-ARCHITECT-PATH', 'c08'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/financial/MONEY-LEDGER-ACCOUNTING-INVARIANTS',
                component: ComponentCreator('/shopverse/architecture/financial/MONEY-LEDGER-ACCOUNTING-INVARIANTS', '938'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/financial/PAYMENT-LIFECYCLE-IDEMPOTENCY',
                component: ComponentCreator('/shopverse/architecture/financial/PAYMENT-LIFECYCLE-IDEMPOTENCY', '3b7'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/financial/RECONCILIATION-SETTLEMENT-BATCH',
                component: ComponentCreator('/shopverse/architecture/financial/RECONCILIATION-SETTLEMENT-BATCH', '768'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/governance/API-CONTRACT-GOVERNANCE',
                component: ComponentCreator('/shopverse/architecture/governance/API-CONTRACT-GOVERNANCE', '8df'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/governance/CONTRACT-GOVERNANCE-OPERATIONS',
                component: ComponentCreator('/shopverse/architecture/governance/CONTRACT-GOVERNANCE-OPERATIONS', '32c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/governance/EVENT-SCHEMA-REGISTRY-GOVERNANCE',
                component: ComponentCreator('/shopverse/architecture/governance/EVENT-SCHEMA-REGISTRY-GOVERNANCE', '960'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/governance/SCHEMA-GOVERNANCE-INTERVIEW-REVISION',
                component: ComponentCreator('/shopverse/architecture/governance/SCHEMA-GOVERNANCE-INTERVIEW-REVISION', '084'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/GRPC-PROTOBUF-ARCHITECT-PATH',
                component: ComponentCreator('/shopverse/architecture/GRPC-PROTOBUF-ARCHITECT-PATH', '8c6'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/grpc/GRPC-PROTOBUF-INTERVIEW-REVISION',
                component: ComponentCreator('/shopverse/architecture/grpc/GRPC-PROTOBUF-INTERVIEW-REVISION', '3d5'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/grpc/GRPC-RUNTIME-RELIABILITY',
                component: ComponentCreator('/shopverse/architecture/grpc/GRPC-RUNTIME-RELIABILITY', '405'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/grpc/PROTOBUF-CONTRACT-EVOLUTION',
                component: ComponentCreator('/shopverse/architecture/grpc/PROTOBUF-CONTRACT-EVOLUTION', '12a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/grpc/SPRING-GRPC-PRODUCTION',
                component: ComponentCreator('/shopverse/architecture/grpc/SPRING-GRPC-PRODUCTION', '68c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/HLD-LLD',
                component: ComponentCreator('/shopverse/architecture/HLD-LLD', 'e69'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/hld-lld/CAPACITY-ESTIMATION-FUNDAMENTALS',
                component: ComponentCreator('/shopverse/architecture/hld-lld/CAPACITY-ESTIMATION-FUNDAMENTALS', 'b62'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/hld-lld/CAPACITY-PERFORMANCE-ESTIMATION',
                component: ComponentCreator('/shopverse/architecture/hld-lld/CAPACITY-PERFORMANCE-ESTIMATION', '610'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/hld-lld/CAPACITY-STORAGE-QUEUE-POOL-MODELS',
                component: ComponentCreator('/shopverse/architecture/hld-lld/CAPACITY-STORAGE-QUEUE-POOL-MODELS', 'c53'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/hld-lld/DATA-PARTITIONING',
                component: ComponentCreator('/shopverse/architecture/hld-lld/DATA-PARTITIONING', '390'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/hld-lld/DATABASE-LLD-DESIGN-PROCESS',
                component: ComponentCreator('/shopverse/architecture/hld-lld/DATABASE-LLD-DESIGN-PROCESS', 'd49'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/hld-lld/ERD-DIAGRAMS',
                component: ComponentCreator('/shopverse/architecture/hld-lld/ERD-DIAGRAMS', 'b91'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/hld-lld/HLD-FUNDAMENTALS',
                component: ComponentCreator('/shopverse/architecture/hld-lld/HLD-FUNDAMENTALS', '3f7'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/hld-lld/HLD-INTERVIEW-WORKBOOK',
                component: ComponentCreator('/shopverse/architecture/hld-lld/HLD-INTERVIEW-WORKBOOK', '74c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/hld-lld/hld/AVAILABILITY',
                component: ComponentCreator('/shopverse/architecture/hld-lld/hld/AVAILABILITY', 'd9f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/hld-lld/hld/CAP-THEOREM',
                component: ComponentCreator('/shopverse/architecture/hld-lld/hld/CAP-THEOREM', '7d0'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/hld-lld/hld/CONSISTENCY',
                component: ComponentCreator('/shopverse/architecture/hld-lld/hld/CONSISTENCY', '0ea'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/hld-lld/hld/CONTENT-DELIVERY-NETWORK',
                component: ComponentCreator('/shopverse/architecture/hld-lld/hld/CONTENT-DELIVERY-NETWORK', 'f9d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/hld-lld/hld/INTRODUCTION-TO-HLD',
                component: ComponentCreator('/shopverse/architecture/hld-lld/hld/INTRODUCTION-TO-HLD', '947'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/hld-lld/LLD-EXAMPLES-DIAGRAMS',
                component: ComponentCreator('/shopverse/architecture/hld-lld/LLD-EXAMPLES-DIAGRAMS', '793'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/hld-lld/LLD-INTERVIEW-WORKBOOK',
                component: ComponentCreator('/shopverse/architecture/hld-lld/LLD-INTERVIEW-WORKBOOK', '9fe'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/hld-lld/NON-FUNCTIONAL-REQUIREMENTS',
                component: ComponentCreator('/shopverse/architecture/hld-lld/NON-FUNCTIONAL-REQUIREMENTS', 'b75'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/hld-lld/PERFORMANCE-CAPACITY-MODELS',
                component: ComponentCreator('/shopverse/architecture/hld-lld/PERFORMANCE-CAPACITY-MODELS', '1df'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/hld-lld/PERFORMANCE-LATENCY-THROUGHPUT-MODELS',
                component: ComponentCreator('/shopverse/architecture/hld-lld/PERFORMANCE-LATENCY-THROUGHPUT-MODELS', 'cbc'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/hld-lld/SHOPVERSE-CAPACITY-WORKED-EXAMPLE',
                component: ComponentCreator('/shopverse/architecture/hld-lld/SHOPVERSE-CAPACITY-WORKED-EXAMPLE', '744'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/hld-lld/SIXTEEN-SYSTEM-DESIGN-CASE-STUDIES',
                component: ComponentCreator('/shopverse/architecture/hld-lld/SIXTEEN-SYSTEM-DESIGN-CASE-STUDIES', 'f02'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/hld-lld/UML-DIAGRAMS',
                component: ComponentCreator('/shopverse/architecture/hld-lld/UML-DIAGRAMS', '940'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/LOAD-BALANCING-GENERIC',
                component: ComponentCreator('/shopverse/architecture/LOAD-BALANCING-GENERIC', '9be'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/MICROSERVICES-DISTRIBUTED-SYSTEMS',
                component: ComponentCreator('/shopverse/architecture/MICROSERVICES-DISTRIBUTED-SYSTEMS', '31d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/MICROSERVICES-GENERIC',
                component: ComponentCreator('/shopverse/architecture/MICROSERVICES-GENERIC', '6cf'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/MICROSERVICES-INTERNALS-DEEP-DIVE',
                component: ComponentCreator('/shopverse/architecture/MICROSERVICES-INTERNALS-DEEP-DIVE', '0c0'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/MICROSERVICES-PATTERNS',
                component: ComponentCreator('/shopverse/architecture/MICROSERVICES-PATTERNS', 'a9b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/microservices/MICROSERVICES-ARCHITECT-PATH',
                component: ComponentCreator('/shopverse/architecture/microservices/MICROSERVICES-ARCHITECT-PATH', 'dde'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/microservices/MICROSERVICES-CASCADING-FAILURE-PREVENTION',
                component: ComponentCreator('/shopverse/architecture/microservices/MICROSERVICES-CASCADING-FAILURE-PREVENTION', '10f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/microservices/MICROSERVICES-INCIDENT-LABS',
                component: ComponentCreator('/shopverse/architecture/microservices/MICROSERVICES-INCIDENT-LABS', 'bdf'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/microservices/MICROSERVICES-INTERVIEW-WORKBOOK',
                component: ComponentCreator('/shopverse/architecture/microservices/MICROSERVICES-INTERVIEW-WORKBOOK', '33e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/microservices/MICROSERVICES-MCQ-PRACTICE',
                component: ComponentCreator('/shopverse/architecture/microservices/MICROSERVICES-MCQ-PRACTICE', '017'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/microservices/MICROSERVICES-MULTI-REGION-RECOVERY',
                component: ComponentCreator('/shopverse/architecture/microservices/MICROSERVICES-MULTI-REGION-RECOVERY', 'af1'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/microservices/MICROSERVICES-OBSERVABILITY-SLOS',
                component: ComponentCreator('/shopverse/architecture/microservices/MICROSERVICES-OBSERVABILITY-SLOS', '385'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/microservices/MICROSERVICES-PRODUCTION-MASTERY',
                component: ComponentCreator('/shopverse/architecture/microservices/MICROSERVICES-PRODUCTION-MASTERY', '490'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/microservices/SERVICE-BOUNDARIES-OWNERSHIP',
                component: ComponentCreator('/shopverse/architecture/microservices/SERVICE-BOUNDARIES-OWNERSHIP', '885'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/MULTITENANCY-STORAGE-FEATURE-FLAGS',
                component: ComponentCreator('/shopverse/architecture/MULTITENANCY-STORAGE-FEATURE-FLAGS', '27a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/NETWORK-PROTOCOL-DIAGNOSIS-PATH',
                component: ComponentCreator('/shopverse/architecture/NETWORK-PROTOCOL-DIAGNOSIS-PATH', '81e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/NETWORKING-GRPC-SERVICE-MESH',
                component: ComponentCreator('/shopverse/architecture/NETWORKING-GRPC-SERVICE-MESH', '460'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/networking/DNS-RESOLUTION-DIAGNOSIS',
                component: ComponentCreator('/shopverse/architecture/networking/DNS-RESOLUTION-DIAGNOSIS', '946'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/networking/NETWORK-INCIDENT-LABS-REVISION',
                component: ComponentCreator('/shopverse/architecture/networking/NETWORK-INCIDENT-LABS-REVISION', 'c51'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/networking/TCP-CONNECTION-DIAGNOSIS',
                component: ComponentCreator('/shopverse/architecture/networking/TCP-CONNECTION-DIAGNOSIS', '48b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/networking/TLS-HTTP2-DIAGNOSIS',
                component: ComponentCreator('/shopverse/architecture/networking/TLS-HTTP2-DIAGNOSIS', '1a9'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/PRODUCTION-PLATFORM-ENGINEERING',
                component: ComponentCreator('/shopverse/architecture/PRODUCTION-PLATFORM-ENGINEERING', 'df0'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/retail/BLACK-FRIDAY-RETAIL-RESILIENCE',
                component: ComponentCreator('/shopverse/architecture/retail/BLACK-FRIDAY-RETAIL-RESILIENCE', '058'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/retail/CLICKHOUSE-RETAIL-ANALYTICS',
                component: ComponentCreator('/shopverse/architecture/retail/CLICKHOUSE-RETAIL-ANALYTICS', '53f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/retail/REDIS-RETAIL-CACHING-SESSIONS',
                component: ComponentCreator('/shopverse/architecture/retail/REDIS-RETAIL-CACHING-SESSIONS', 'd03'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/retail/RETAIL-DOMAIN-ARCHITECTURE',
                component: ComponentCreator('/shopverse/architecture/retail/RETAIL-DOMAIN-ARCHITECTURE', '96f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/retail/RETAIL-DOMAIN-INTERVIEW',
                component: ComponentCreator('/shopverse/architecture/retail/RETAIL-DOMAIN-INTERVIEW', '17c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/retail/RETAIL-ORDER-METRICS-ANALYTICS',
                component: ComponentCreator('/shopverse/architecture/retail/RETAIL-ORDER-METRICS-ANALYTICS', '6db'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/SERVICE-DISCOVERY',
                component: ComponentCreator('/shopverse/architecture/SERVICE-DISCOVERY', '637'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/SERVICE-MESH-ARCHITECT-PATH',
                component: ComponentCreator('/shopverse/architecture/SERVICE-MESH-ARCHITECT-PATH', 'd7e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/service-mesh/SERVICE-MESH-ARCHITECTURE-SELECTION',
                component: ComponentCreator('/shopverse/architecture/service-mesh/SERVICE-MESH-ARCHITECTURE-SELECTION', '507'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/service-mesh/SERVICE-MESH-INTERVIEW-REVISION',
                component: ComponentCreator('/shopverse/architecture/service-mesh/SERVICE-MESH-INTERVIEW-REVISION', 'bcb'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/service-mesh/SERVICE-MESH-PRODUCTION-OPERATIONS',
                component: ComponentCreator('/shopverse/architecture/service-mesh/SERVICE-MESH-PRODUCTION-OPERATIONS', 'acd'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/service-mesh/SERVICE-MESH-TRAFFIC-SECURITY',
                component: ComponentCreator('/shopverse/architecture/service-mesh/SERVICE-MESH-TRAFFIC-SECURITY', '3a1'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/shopverse-capstones/',
                component: ComponentCreator('/shopverse/architecture/shopverse-capstones/', '3ba'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/shopverse-capstones/CATALOG-SEARCH-DESIGN',
                component: ComponentCreator('/shopverse/architecture/shopverse-capstones/CATALOG-SEARCH-DESIGN', 'c39'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/shopverse-capstones/CHECKOUT-ORDER-DESIGN',
                component: ComponentCreator('/shopverse/architecture/shopverse-capstones/CHECKOUT-ORDER-DESIGN', 'b0c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/shopverse-capstones/IDENTITY-ACCESS-DESIGN',
                component: ComponentCreator('/shopverse/architecture/shopverse-capstones/IDENTITY-ACCESS-DESIGN', '281'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/shopverse-capstones/INVENTORY-RESERVATION-DESIGN',
                component: ComponentCreator('/shopverse/architecture/shopverse-capstones/INVENTORY-RESERVATION-DESIGN', '86a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/shopverse-capstones/PAYMENT-RELIABILITY-DESIGN',
                component: ComponentCreator('/shopverse/architecture/shopverse-capstones/PAYMENT-RELIABILITY-DESIGN', '891'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/STATE-DATA-DEPLOYMENT-BOUNDARIES',
                component: ComponentCreator('/shopverse/architecture/STATE-DATA-DEPLOYMENT-BOUNDARIES', 'c25'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/SYSTEM-CONTEXT-SERVICE-OWNERSHIP',
                component: ComponentCreator('/shopverse/architecture/SYSTEM-CONTEXT-SERVICE-OWNERSHIP', '3de'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/SYSTEM-DESIGN',
                component: ComponentCreator('/shopverse/architecture/SYSTEM-DESIGN', '066'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/SYSTEM-DESIGN-CONCEPTS',
                component: ComponentCreator('/shopverse/architecture/SYSTEM-DESIGN-CONCEPTS', '316'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/SYSTEM-DESIGN-DEEP-DIVES',
                component: ComponentCreator('/shopverse/architecture/SYSTEM-DESIGN-DEEP-DIVES', 'eab'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/system-design-deep-dives/CASE-STUDY-WORKBOOK',
                component: ComponentCreator('/shopverse/architecture/system-design-deep-dives/CASE-STUDY-WORKBOOK', 'cb3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/system-design-deep-dives/DISTRIBUTED-COMPONENT-INTERNALS',
                component: ComponentCreator('/shopverse/architecture/system-design-deep-dives/DISTRIBUTED-COMPONENT-INTERNALS', 'f00'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/system-design-deep-dives/END-TO-END-DESIGN-METHOD',
                component: ComponentCreator('/shopverse/architecture/system-design-deep-dives/END-TO-END-DESIGN-METHOD', '810'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/system-design-deep-dives/FIFTEEN-CASE-STUDY-VISUALS',
                component: ComponentCreator('/shopverse/architecture/system-design-deep-dives/FIFTEEN-CASE-STUDY-VISUALS', '6dd'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/system-design-deep-dives/INTERVIEW-RUBRIC',
                component: ComponentCreator('/shopverse/architecture/system-design-deep-dives/INTERVIEW-RUBRIC', 'f66'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/system-design-deep-dives/SYSTEM-DESIGN-INTERVIEW-CATALOG',
                component: ComponentCreator('/shopverse/architecture/system-design-deep-dives/SYSTEM-DESIGN-INTERVIEW-CATALOG', '5f2'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/architecture/system-design-deep-dives/SYSTEM-DESIGN-MCQ-PRACTICE',
                component: ComponentCreator('/shopverse/architecture/system-design-deep-dives/SYSTEM-DESIGN-MCQ-PRACTICE', '8b1'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/case-study/COMPLETE-DEMO',
                component: ComponentCreator('/shopverse/case-study/COMPLETE-DEMO', 'fc9'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/case-study/COMPLETE-DEMO-RECOVERY-OBSERVABILITY',
                component: ComponentCreator('/shopverse/case-study/COMPLETE-DEMO-RECOVERY-OBSERVABILITY', '773'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/case-study/COMPLETE-DEMO-SETUP-CHECKOUT',
                component: ComponentCreator('/shopverse/case-study/COMPLETE-DEMO-SETUP-CHECKOUT', '4b8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/case-study/DEMO-IDEMPOTENCY-OUTBOX-RECOVERY',
                component: ComponentCreator('/shopverse/case-study/DEMO-IDEMPOTENCY-OUTBOX-RECOVERY', '7f6'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/case-study/DEMO-OBSERVABILITY-AUTOMATION',
                component: ComponentCreator('/shopverse/case-study/DEMO-OBSERVABILITY-AUTOMATION', 'ce6'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/case-study/DEMO-PLATFORM-AUTHENTICATION',
                component: ComponentCreator('/shopverse/case-study/DEMO-PLATFORM-AUTHENTICATION', '75c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/case-study/DEMO-SEED-CHECKOUT-SAGA',
                component: ComponentCreator('/shopverse/case-study/DEMO-SEED-CHECKOUT-SAGA', 'ddd'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/case-study/PRODUCTION-CAPSTONE-PATH',
                component: ComponentCreator('/shopverse/case-study/PRODUCTION-CAPSTONE-PATH', 'da4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/case-study/production-capstone/CAPSTONE-IMPLEMENTATION-EVIDENCE',
                component: ComponentCreator('/shopverse/case-study/production-capstone/CAPSTONE-IMPLEMENTATION-EVIDENCE', '4e4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/case-study/SHOPVERSE',
                component: ComponentCreator('/shopverse/case-study/SHOPVERSE', '3ff'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/case-study/SHOPVERSE-ARCHITECTURE-CURRENT-STATE',
                component: ComponentCreator('/shopverse/case-study/SHOPVERSE-ARCHITECTURE-CURRENT-STATE', '5bb'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/case-study/SHOPVERSE-ARCHITECTURE-REFACTORING-READINESS',
                component: ComponentCreator('/shopverse/case-study/SHOPVERSE-ARCHITECTURE-REFACTORING-READINESS', '58c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/case-study/SHOPVERSE-ARCHITECTURE-REVISION',
                component: ComponentCreator('/shopverse/case-study/SHOPVERSE-ARCHITECTURE-REVISION', '35d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/case-study/SHOPVERSE-ONBOARDING-ARCHITECTURE-AUDIT',
                component: ComponentCreator('/shopverse/case-study/SHOPVERSE-ONBOARDING-ARCHITECTURE-AUDIT', '5bf'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/cloud/',
                component: ComponentCreator('/shopverse/cloud/', 'a31'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/cloud/aws/AWS-CLOUDWATCH',
                component: ComponentCreator('/shopverse/cloud/aws/AWS-CLOUDWATCH', 'c36'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/cloud/aws/AWS-COMPUTE-EBS-SCALING',
                component: ComponentCreator('/shopverse/cloud/aws/AWS-COMPUTE-EBS-SCALING', 'c9a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/cloud/aws/AWS-DATABASES',
                component: ComponentCreator('/shopverse/cloud/aws/AWS-DATABASES', 'e40'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/cloud/aws/AWS-EVENTS-STORAGE',
                component: ComponentCreator('/shopverse/cloud/aws/AWS-EVENTS-STORAGE', 'aaf'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/cloud/aws/AWS-LAMBDA-SERVERLESS',
                component: ComponentCreator('/shopverse/cloud/aws/AWS-LAMBDA-SERVERLESS', 'e17'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/cloud/aws/AWS-UMBRELLA',
                component: ComponentCreator('/shopverse/cloud/aws/AWS-UMBRELLA', '181'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/cloud/aws/AWS-VPC-NETWORKING',
                component: ComponentCreator('/shopverse/cloud/aws/AWS-VPC-NETWORKING', '485'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/cloud/aws/EKS-PRODUCTION-ARCHITECT-PATH',
                component: ComponentCreator('/shopverse/cloud/aws/EKS-PRODUCTION-ARCHITECT-PATH', '56e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/cloud/aws/eks/EKS-OPERATIONS-INTERVIEW',
                component: ComponentCreator('/shopverse/cloud/aws/eks/EKS-OPERATIONS-INTERVIEW', 'b91'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/cloud/CLOUD-AWS-REVISION-SHEET',
                component: ComponentCreator('/shopverse/cloud/CLOUD-AWS-REVISION-SHEET', '333'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/cloud/CLOUD-FUNDAMENTALS',
                component: ComponentCreator('/shopverse/cloud/CLOUD-FUNDAMENTALS', '217'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data-structures/',
                component: ComponentCreator('/shopverse/data-structures/', 'a25'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data-structures/ALGORITHM-COMPLEXITY-PROBLEM-SOLVING',
                component: ComponentCreator('/shopverse/data-structures/ALGORITHM-COMPLEXITY-PROBLEM-SOLVING', '6ac'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data-structures/BACKTRACKING-TRIE-INTERVIEW',
                component: ComponentCreator('/shopverse/data-structures/BACKTRACKING-TRIE-INTERVIEW', 'b9d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data-structures/CONCURRENT-JAVA-CODING-EXERCISES',
                component: ComponentCreator('/shopverse/data-structures/CONCURRENT-JAVA-CODING-EXERCISES', '718'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data-structures/DATA-STRUCTURES-FUNDAMENTALS',
                component: ComponentCreator('/shopverse/data-structures/DATA-STRUCTURES-FUNDAMENTALS', '6e8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data-structures/DSA-INTERVIEW-QUESTION-BANK',
                component: ComponentCreator('/shopverse/data-structures/DSA-INTERVIEW-QUESTION-BANK', 'ea3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data-structures/DYNAMIC-PROGRAMMING-INTERVIEW',
                component: ComponentCreator('/shopverse/data-structures/DYNAMIC-PROGRAMMING-INTERVIEW', 'e0f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data-structures/GRAPH-ALGORITHMS-INTERVIEW',
                component: ComponentCreator('/shopverse/data-structures/GRAPH-ALGORITHMS-INTERVIEW', 'e92'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data-structures/LINEAR-DATA-STRUCTURES',
                component: ComponentCreator('/shopverse/data-structures/LINEAR-DATA-STRUCTURES', 'd02'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data-structures/MACHINE-CODING-OOD-INTERVIEW',
                component: ComponentCreator('/shopverse/data-structures/MACHINE-CODING-OOD-INTERVIEW', '500'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data-structures/NON-LINEAR-DATA-STRUCTURES',
                component: ComponentCreator('/shopverse/data-structures/NON-LINEAR-DATA-STRUCTURES', 'b24'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data-structures/programming/arrays/ARRAY-30-PROBLEM-ROADMAP',
                component: ComponentCreator('/shopverse/data-structures/programming/arrays/ARRAY-30-PROBLEM-ROADMAP', 'fb8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data-structures/programming/arrays/ARRAY-INTERVIEW-REVISION',
                component: ComponentCreator('/shopverse/data-structures/programming/arrays/ARRAY-INTERVIEW-REVISION', '4ad'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data-structures/programming/arrays/ARRAY-PROBLEMS-01-10',
                component: ComponentCreator('/shopverse/data-structures/programming/arrays/ARRAY-PROBLEMS-01-10', 'e21'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data-structures/programming/arrays/ARRAY-PROBLEMS-11-20',
                component: ComponentCreator('/shopverse/data-structures/programming/arrays/ARRAY-PROBLEMS-11-20', '882'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data-structures/programming/arrays/ARRAY-PROBLEMS-21-30',
                component: ComponentCreator('/shopverse/data-structures/programming/arrays/ARRAY-PROBLEMS-21-30', '8cf'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data-structures/programming/arrays/ARRAYS-OVERVIEW',
                component: ComponentCreator('/shopverse/data-structures/programming/arrays/ARRAYS-OVERVIEW', '89b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data-structures/programming/arrays/KADANE-FAMILY',
                component: ComponentCreator('/shopverse/data-structures/programming/arrays/KADANE-FAMILY', '7d6'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data-structures/programming/arrays/TWO-SUM-FAMILY',
                component: ComponentCreator('/shopverse/data-structures/programming/arrays/TWO-SUM-FAMILY', 'e71'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data-structures/programming/JAVA-PROGRAMMING-INTERVIEW-PATH',
                component: ComponentCreator('/shopverse/data-structures/programming/JAVA-PROGRAMMING-INTERVIEW-PATH', 'a23'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/CASSANDRA-ARCHITECT-PATH',
                component: ComponentCreator('/shopverse/data/CASSANDRA-ARCHITECT-PATH', 'cc3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/cassandra/CASSANDRA-ARCHITECTURE-CONSISTENCY',
                component: ComponentCreator('/shopverse/data/cassandra/CASSANDRA-ARCHITECTURE-CONSISTENCY', 'fce'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/cassandra/CASSANDRA-CQL-DATA-MODELING',
                component: ComponentCreator('/shopverse/data/cassandra/CASSANDRA-CQL-DATA-MODELING', 'a64'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/cassandra/CASSANDRA-INTERVIEW-LABS-REVISION',
                component: ComponentCreator('/shopverse/data/cassandra/CASSANDRA-INTERVIEW-LABS-REVISION', '5cb'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/cassandra/CASSANDRA-OPERATIONS-CAPACITY',
                component: ComponentCreator('/shopverse/data/cassandra/CASSANDRA-OPERATIONS-CAPACITY', '355'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/cassandra/CASSANDRA-PRODUCTION-INTERVIEW-SCENARIOS',
                component: ComponentCreator('/shopverse/data/cassandra/CASSANDRA-PRODUCTION-INTERVIEW-SCENARIOS', '4db'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/cassandra/CASSANDRA-STORAGE-INDEXES',
                component: ComponentCreator('/shopverse/data/cassandra/CASSANDRA-STORAGE-INDEXES', 'a93'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/DATA-PERSISTENCE-OVERVIEW',
                component: ComponentCreator('/shopverse/data/DATA-PERSISTENCE-OVERVIEW', 'a1d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/DATA-PIPELINE-PRODUCTION-INTERVIEW',
                component: ComponentCreator('/shopverse/data/DATA-PIPELINE-PRODUCTION-INTERVIEW', '129'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/DATA-PIPELINES-SEARCH-OPERATIONS',
                component: ComponentCreator('/shopverse/data/DATA-PIPELINES-SEARCH-OPERATIONS', 'b1e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/DATABASE-CONSISTENCY-SCALING',
                component: ComponentCreator('/shopverse/data/DATABASE-CONSISTENCY-SCALING', 'fb5'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/DATABASE-ENGINE-INTERNALS',
                component: ComponentCreator('/shopverse/data/DATABASE-ENGINE-INTERNALS', '193'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/DATABASE-ENGINEERING',
                component: ComponentCreator('/shopverse/data/DATABASE-ENGINEERING', '1b0'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/DATABASE-MCQ-PRACTICE',
                component: ComponentCreator('/shopverse/data/DATABASE-MCQ-PRACTICE', 'da1'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/DATABASE-PRODUCTION-MASTERY',
                component: ComponentCreator('/shopverse/data/DATABASE-PRODUCTION-MASTERY', '58c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/DATABASE-REVISION-SHEET',
                component: ComponentCreator('/shopverse/data/DATABASE-REVISION-SHEET', 'd79'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/DATABASE-SELECTION-GUIDE',
                component: ComponentCreator('/shopverse/data/DATABASE-SELECTION-GUIDE', 'b60'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/database-selection/CONSISTENCY-MODELS-BASE',
                component: ComponentCreator('/shopverse/data/database-selection/CONSISTENCY-MODELS-BASE', 'f58'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/database-selection/DATABASE-CONCURRENCY-BACKPRESSURE',
                component: ComponentCreator('/shopverse/data/database-selection/DATABASE-CONCURRENCY-BACKPRESSURE', '278'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/database-selection/DATABASE-CONNECTION-POOL-FAILOVER',
                component: ComponentCreator('/shopverse/data/database-selection/DATABASE-CONNECTION-POOL-FAILOVER', '706'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/database-selection/DATABASE-DECISION-WORKSHEET',
                component: ComponentCreator('/shopverse/data/database-selection/DATABASE-DECISION-WORKSHEET', '4e3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/database-selection/DATABASE-HANDS-ON-LABS',
                component: ComponentCreator('/shopverse/data/database-selection/DATABASE-HANDS-ON-LABS', 'ab0'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/database-selection/DATABASE-INTERVIEW-EXERCISES',
                component: ComponentCreator('/shopverse/data/database-selection/DATABASE-INTERVIEW-EXERCISES', 'b0a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/database-selection/DATABASE-LOAD-INCIDENT-RUNBOOK',
                component: ComponentCreator('/shopverse/data/database-selection/DATABASE-LOAD-INCIDENT-RUNBOOK', '7e0'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/database-selection/DATABASE-MIGRATIONS-OPERATIONS',
                component: ComponentCreator('/shopverse/data/database-selection/DATABASE-MIGRATIONS-OPERATIONS', '3eb'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/database-selection/DATABASE-QUERY-OPTIMIZATION',
                component: ComponentCreator('/shopverse/data/database-selection/DATABASE-QUERY-OPTIMIZATION', '82c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/database-selection/DATABASE-QUICK-CHOICE',
                component: ComponentCreator('/shopverse/data/database-selection/DATABASE-QUICK-CHOICE', '5c3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/database-selection/DATABASE-REPLICATION-BACKUP-RECOVERY',
                component: ComponentCreator('/shopverse/data/database-selection/DATABASE-REPLICATION-BACKUP-RECOVERY', 'c27'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/database-selection/DISTRIBUTED-SQL-NOSQL',
                component: ComponentCreator('/shopverse/data/database-selection/DISTRIBUTED-SQL-NOSQL', 'bdf'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/database-selection/INDEXES-QUERY-PLANS',
                component: ComponentCreator('/shopverse/data/database-selection/INDEXES-QUERY-PLANS', '9be'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/database-selection/RELATIONAL-DATABASES',
                component: ComponentCreator('/shopverse/data/database-selection/RELATIONAL-DATABASES', '816'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/database-selection/SCALING-CAP-DISTRIBUTION',
                component: ComponentCreator('/shopverse/data/database-selection/SCALING-CAP-DISTRIBUTION', '4a0'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/database-selection/SPECIALIZED-DATABASES',
                component: ComponentCreator('/shopverse/data/database-selection/SPECIALIZED-DATABASES', 'a9d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/database-selection/SYSTEM-DESIGN-SCENARIOS',
                component: ComponentCreator('/shopverse/data/database-selection/SYSTEM-DESIGN-SCENARIOS', '27b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/database-selection/VECTOR-DATABASES',
                component: ComponentCreator('/shopverse/data/database-selection/VECTOR-DATABASES', '1e1'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/DISTRIBUTED-DATABASES',
                component: ComponentCreator('/shopverse/data/DISTRIBUTED-DATABASES', 'eac'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/ELASTICSEARCH-ARCHITECT-PATH',
                component: ComponentCreator('/shopverse/data/ELASTICSEARCH-ARCHITECT-PATH', 'b3f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/elasticsearch/ELASTICSEARCH-INTERNALS-MAPPING',
                component: ComponentCreator('/shopverse/data/elasticsearch/ELASTICSEARCH-INTERNALS-MAPPING', 'ec5'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/elasticsearch/ELASTICSEARCH-OPERATIONS',
                component: ComponentCreator('/shopverse/data/elasticsearch/ELASTICSEARCH-OPERATIONS', '446'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/elasticsearch/ELASTICSEARCH-PRODUCTION-INTERVIEW-SCENARIOS',
                component: ComponentCreator('/shopverse/data/elasticsearch/ELASTICSEARCH-PRODUCTION-INTERVIEW-SCENARIOS', 'd55'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/elasticsearch/ELASTICSEARCH-QUERY-RELEVANCE',
                component: ComponentCreator('/shopverse/data/elasticsearch/ELASTICSEARCH-QUERY-RELEVANCE', '6cd'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/elasticsearch/ELASTICSEARCH-SPRING-INTERVIEW-REVISION',
                component: ComponentCreator('/shopverse/data/elasticsearch/ELASTICSEARCH-SPRING-INTERVIEW-REVISION', '4d9'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/HIBERNATE',
                component: ComponentCreator('/shopverse/data/HIBERNATE', 'b2e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/hibernate/HIBERNATE-ANNOTATIONS-MAPPING',
                component: ComponentCreator('/shopverse/data/hibernate/HIBERNATE-ANNOTATIONS-MAPPING', '7d3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/hibernate/HIBERNATE-AUDITING-VALIDATION',
                component: ComponentCreator('/shopverse/data/hibernate/HIBERNATE-AUDITING-VALIDATION', 'a69'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/hibernate/HIBERNATE-BASICS-LIFECYCLE',
                component: ComponentCreator('/shopverse/data/hibernate/HIBERNATE-BASICS-LIFECYCLE', '540'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/hibernate/HIBERNATE-CACHING',
                component: ComponentCreator('/shopverse/data/hibernate/HIBERNATE-CACHING', '795'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/hibernate/HIBERNATE-FETCHING-PERFORMANCE',
                component: ComponentCreator('/shopverse/data/hibernate/HIBERNATE-FETCHING-PERFORMANCE', '059'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/hibernate/HIBERNATE-INTERVIEW-SCENARIOS',
                component: ComponentCreator('/shopverse/data/hibernate/HIBERNATE-INTERVIEW-SCENARIOS', '8c7'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/LIQUIBASE-GENERIC',
                component: ComponentCreator('/shopverse/data/LIQUIBASE-GENERIC', '783'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/ORACLE-DATABASE-ARCHITECT-PATH',
                component: ComponentCreator('/shopverse/data/ORACLE-DATABASE-ARCHITECT-PATH', '1ab'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/oracle/ORACLE-ARCHITECTURE-STORAGE-INTERNALS',
                component: ComponentCreator('/shopverse/data/oracle/ORACLE-ARCHITECTURE-STORAGE-INTERNALS', 'c6c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/oracle/ORACLE-HA-OPERATIONS',
                component: ComponentCreator('/shopverse/data/oracle/ORACLE-HA-OPERATIONS', 'ac3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/oracle/ORACLE-SPRING-INTERVIEW-REVISION',
                component: ComponentCreator('/shopverse/data/oracle/ORACLE-SPRING-INTERVIEW-REVISION', 'd91'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/oracle/ORACLE-SQL-OPTIMIZER-CONCURRENCY',
                component: ComponentCreator('/shopverse/data/oracle/ORACLE-SQL-OPTIMIZER-CONCURRENCY', '42d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/redis/REDIS-INTERNALS-OPERATIONS-INTERVIEW',
                component: ComponentCreator('/shopverse/data/redis/REDIS-INTERNALS-OPERATIONS-INTERVIEW', 'a35'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/data/RELATIONAL-MODELING-QUERY-PERFORMANCE',
                component: ComponentCreator('/shopverse/data/RELATIONAL-MODELING-QUERY-PERFORMANCE', 'f1d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/API-GATEWAY-ARCHITECTURE',
                component: ComponentCreator('/shopverse/development/API-GATEWAY-ARCHITECTURE', 'dec'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/API-GATEWAY-GENERIC',
                component: ComponentCreator('/shopverse/development/API-GATEWAY-GENERIC', '2ba'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/API-GATEWAY-IMPLEMENTATION-GUIDE',
                component: ComponentCreator('/shopverse/development/API-GATEWAY-IMPLEMENTATION-GUIDE', 'e7c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/API-GATEWAY-OPERATIONS',
                component: ComponentCreator('/shopverse/development/API-GATEWAY-OPERATIONS', '517'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/API-GATEWAY-REACTIVE-FILTER-LIFECYCLE',
                component: ComponentCreator('/shopverse/development/API-GATEWAY-REACTIVE-FILTER-LIFECYCLE', 'cc2'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/API-GUIDE',
                component: ComponentCreator('/shopverse/development/API-GUIDE', 'a9a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/DEBUGGING',
                component: ComponentCreator('/shopverse/development/DEBUGGING', '559'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/DEBUGGING-DATA-SAGA-KAFKA',
                component: ComponentCreator('/shopverse/development/DEBUGGING-DATA-SAGA-KAFKA', 'f24'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/DEBUGGING-OBSERVABILITY-RECOVERY',
                component: ComponentCreator('/shopverse/development/DEBUGGING-OBSERVABILITY-RECOVERY', '887'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/DEBUGGING-REQUEST-PLATFORM',
                component: ComponentCreator('/shopverse/development/DEBUGGING-REQUEST-PLATFORM', '39a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/DESIGN-PATTERNS',
                component: ComponentCreator('/shopverse/development/DESIGN-PATTERNS', '09d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/DESIGN-PATTERNS-BEHAVIORAL-DISTRIBUTED',
                component: ComponentCreator('/shopverse/development/DESIGN-PATTERNS-BEHAVIORAL-DISTRIBUTED', '9a0'),
                exact: true
              },
              {
                path: '/shopverse/development/DESIGN-PATTERNS-CREATIONAL-STRUCTURAL',
                component: ComponentCreator('/shopverse/development/DESIGN-PATTERNS-CREATIONAL-STRUCTURAL', 'ac5'),
                exact: true
              },
              {
                path: '/shopverse/development/design-patterns/abstract-factory',
                component: ComponentCreator('/shopverse/development/design-patterns/abstract-factory', '222'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/design-patterns/adapter',
                component: ComponentCreator('/shopverse/development/design-patterns/adapter', '40d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/design-patterns/BEHAVIORAL-PATTERNS',
                component: ComponentCreator('/shopverse/development/design-patterns/BEHAVIORAL-PATTERNS', '088'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/design-patterns/bridge',
                component: ComponentCreator('/shopverse/development/design-patterns/bridge', '9ad'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/design-patterns/builder',
                component: ComponentCreator('/shopverse/development/design-patterns/builder', '816'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/design-patterns/chain-of-responsibility',
                component: ComponentCreator('/shopverse/development/design-patterns/chain-of-responsibility', 'a36'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/design-patterns/CREATIONAL-PATTERNS',
                component: ComponentCreator('/shopverse/development/design-patterns/CREATIONAL-PATTERNS', '500'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/design-patterns/decorator',
                component: ComponentCreator('/shopverse/development/design-patterns/decorator', '9b4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/design-patterns/DESIGN-PATTERN-SELECTION-CHEATSHEET',
                component: ComponentCreator('/shopverse/development/design-patterns/DESIGN-PATTERN-SELECTION-CHEATSHEET', 'e06'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/design-patterns/factory',
                component: ComponentCreator('/shopverse/development/design-patterns/factory', '565'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/design-patterns/immutable-class',
                component: ComponentCreator('/shopverse/development/design-patterns/immutable-class', '162'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/design-patterns/observer',
                component: ComponentCreator('/shopverse/development/design-patterns/observer', '696'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/design-patterns/prototype',
                component: ComponentCreator('/shopverse/development/design-patterns/prototype', 'e01'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/design-patterns/proxy',
                component: ComponentCreator('/shopverse/development/design-patterns/proxy', '1da'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/design-patterns/singleton',
                component: ComponentCreator('/shopverse/development/design-patterns/singleton', '7bc'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/design-patterns/strategy',
                component: ComponentCreator('/shopverse/development/design-patterns/strategy', 'ad0'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/design-patterns/STRUCTURAL-PATTERNS',
                component: ComponentCreator('/shopverse/development/design-patterns/STRUCTURAL-PATTERNS', '473'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/design-patterns/template-method',
                component: ComponentCreator('/shopverse/development/design-patterns/template-method', '3b7'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/ENGINEERING-FOUNDATIONS-OVERVIEW',
                component: ComponentCreator('/shopverse/development/ENGINEERING-FOUNDATIONS-OVERVIEW', 'e73'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/ENGINEERING-FOUNDATIONS-REVISION',
                component: ComponentCreator('/shopverse/development/ENGINEERING-FOUNDATIONS-REVISION', '07e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/ENGINEERING-PRINCIPLES',
                component: ComponentCreator('/shopverse/development/ENGINEERING-PRINCIPLES', 'be3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/PRODUCTION-DESIGN-PRINCIPLES',
                component: ComponentCreator('/shopverse/development/PRODUCTION-DESIGN-PRINCIPLES', '29e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/REST-API-GENERIC',
                component: ComponentCreator('/shopverse/development/REST-API-GENERIC', '760'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/REST-API-HTTP-CONTRACTS',
                component: ComponentCreator('/shopverse/development/REST-API-HTTP-CONTRACTS', 'a55'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/REST-API-PRODUCTION-DESIGN',
                component: ComponentCreator('/shopverse/development/REST-API-PRODUCTION-DESIGN', '0ab'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/SOLID-JAVA-SHOPVERSE',
                component: ComponentCreator('/shopverse/development/SOLID-JAVA-SHOPVERSE', 'fa6'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/SPRING-BOOT-INTERNALS',
                component: ComponentCreator('/shopverse/development/SPRING-BOOT-INTERNALS', 'a93'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/spring-boot-internals/AUTOWIRING-CIRCULAR-REFERENCE-INTERNALS',
                component: ComponentCreator('/shopverse/development/spring-boot-internals/AUTOWIRING-CIRCULAR-REFERENCE-INTERNALS', '5ab'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/spring-boot-internals/BEAN-SCOPES-LIFECYCLE',
                component: ComponentCreator('/shopverse/development/spring-boot-internals/BEAN-SCOPES-LIFECYCLE', 'a56'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/spring-boot-internals/CONFIGURATION-PROPERTIES',
                component: ComponentCreator('/shopverse/development/spring-boot-internals/CONFIGURATION-PROPERTIES', 'e7b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/spring-boot-internals/DEPENDENCY-INJECTION-BEAN-RESOLUTION',
                component: ComponentCreator('/shopverse/development/spring-boot-internals/DEPENDENCY-INJECTION-BEAN-RESOLUTION', 'f6a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/spring-boot-internals/DI-BEAN-LIFECYCLE-AOP',
                component: ComponentCreator('/shopverse/development/spring-boot-internals/DI-BEAN-LIFECYCLE-AOP', 'b32'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/spring-boot-internals/INFRASTRUCTURE-INTERNALS',
                component: ComponentCreator('/shopverse/development/spring-boot-internals/INFRASTRUCTURE-INTERNALS', '0cd'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/spring-boot-internals/OPERATIONS-INTERNALS',
                component: ComponentCreator('/shopverse/development/spring-boot-internals/OPERATIONS-INTERNALS', '61e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/spring-boot-internals/PRODUCTION-TUNING',
                component: ComponentCreator('/shopverse/development/spring-boot-internals/PRODUCTION-TUNING', '5b2'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/spring-boot-internals/SERVLET-DISPATCHER-SERVLET',
                component: ComponentCreator('/shopverse/development/spring-boot-internals/SERVLET-DISPATCHER-SERVLET', 'ca7'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/spring-boot-internals/SPRING-BEAN-LIFECYCLE-GC-STATIC-REFERENCES',
                component: ComponentCreator('/shopverse/development/spring-boot-internals/SPRING-BEAN-LIFECYCLE-GC-STATIC-REFERENCES', '5fe'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/spring-boot-internals/STARTUP-AUTOCONFIGURATION',
                component: ComponentCreator('/shopverse/development/spring-boot-internals/STARTUP-AUTOCONFIGURATION', 'f6d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/spring-boot-internals/STARTUP-EXTENSION-POINTS',
                component: ComponentCreator('/shopverse/development/spring-boot-internals/STARTUP-EXTENSION-POINTS', '158'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/spring-boot-internals/WEB-MVC-SERVLET-FILTERS',
                component: ComponentCreator('/shopverse/development/spring-boot-internals/WEB-MVC-SERVLET-FILTERS', '523'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/SPRING-CLOUD-GATEWAY-ADVANCED',
                component: ComponentCreator('/shopverse/development/SPRING-CLOUD-GATEWAY-ADVANCED', '17d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/SPRING-REST-APIS',
                component: ComponentCreator('/shopverse/development/SPRING-REST-APIS', '522'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/spring-rest/REST-BASICS-CRUD',
                component: ComponentCreator('/shopverse/development/spring-rest/REST-BASICS-CRUD', '9a3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/spring-rest/REST-CLIENTS-FEIGN',
                component: ComponentCreator('/shopverse/development/spring-rest/REST-CLIENTS-FEIGN', '2c1'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/spring-rest/REST-CONTROLLER-REQUEST-MAPPING',
                component: ComponentCreator('/shopverse/development/spring-rest/REST-CONTROLLER-REQUEST-MAPPING', '3de'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/spring-rest/REST-ERROR-CONTRACTS',
                component: ComponentCreator('/shopverse/development/spring-rest/REST-ERROR-CONTRACTS', 'f67'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/spring-rest/REST-FILES-PAGINATION-IDEMPOTENCY',
                component: ComponentCreator('/shopverse/development/spring-rest/REST-FILES-PAGINATION-IDEMPOTENCY', '9d8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/spring-rest/REST-IDEMPOTENT-COMMANDS',
                component: ComponentCreator('/shopverse/development/spring-rest/REST-IDEMPOTENT-COMMANDS', '30b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/spring-rest/REST-INTERVIEW-WORKBOOK',
                component: ComponentCreator('/shopverse/development/spring-rest/REST-INTERVIEW-WORKBOOK', '39c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/spring-rest/REST-MAPPING-VALIDATION-ERRORS',
                component: ComponentCreator('/shopverse/development/spring-rest/REST-MAPPING-VALIDATION-ERRORS', '5cc'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/spring-rest/REST-OPENAPI-CONTRACT-GOVERNANCE',
                component: ComponentCreator('/shopverse/development/spring-rest/REST-OPENAPI-CONTRACT-GOVERNANCE', '450'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/spring-rest/REST-PAGINATION-CONDITIONAL-REQUESTS',
                component: ComponentCreator('/shopverse/development/spring-rest/REST-PAGINATION-CONDITIONAL-REQUESTS', 'dd6'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/spring-rest/REST-SECURE-FILE-TRANSFER',
                component: ComponentCreator('/shopverse/development/spring-rest/REST-SECURE-FILE-TRANSFER', '447'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/spring-rest/REST-TESTING',
                component: ComponentCreator('/shopverse/development/spring-rest/REST-TESTING', 'bdf'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/spring-rest/REST-TESTING-INTERVIEW',
                component: ComponentCreator('/shopverse/development/spring-rest/REST-TESTING-INTERVIEW', 'f83'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/TESTING',
                component: ComponentCreator('/shopverse/development/TESTING', 'bed'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/TESTING-ARCHITECTURE-COVERAGE',
                component: ComponentCreator('/shopverse/development/TESTING-ARCHITECTURE-COVERAGE', '18d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/development/TESTING-MODES-CI-TRIAGE',
                component: ComponentCreator('/shopverse/development/TESTING-MODES-CI-TRIAGE', '667'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/documentation-index',
                component: ComponentCreator('/shopverse/documentation-index', 'e9c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/integration/',
                component: ComponentCreator('/shopverse/integration/', 'a1d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/integration/APACHE-KAFKA',
                component: ComponentCreator('/shopverse/integration/APACHE-KAFKA', '143'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/integration/EVENT-STREAMING-APPLICATION-PATH',
                component: ComponentCreator('/shopverse/integration/EVENT-STREAMING-APPLICATION-PATH', '431'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/integration/KAFKA-ARCHITECT-OVERVIEW',
                component: ComponentCreator('/shopverse/integration/KAFKA-ARCHITECT-OVERVIEW', '811'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/integration/KAFKA-ARCHITECT-PATH',
                component: ComponentCreator('/shopverse/integration/KAFKA-ARCHITECT-PATH', '68a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/integration/KAFKA-MCQ-PRACTICE',
                component: ComponentCreator('/shopverse/integration/KAFKA-MCQ-PRACTICE', '220'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/integration/KAFKA-REVISION-SHEET',
                component: ComponentCreator('/shopverse/integration/KAFKA-REVISION-SHEET', 'f3e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/integration/kafka/KAFKA-ARCHITECT-LABS',
                component: ComponentCreator('/shopverse/integration/kafka/KAFKA-ARCHITECT-LABS', 'e41'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/integration/kafka/KAFKA-CAPACITY-PERFORMANCE-PLANNING',
                component: ComponentCreator('/shopverse/integration/kafka/KAFKA-CAPACITY-PERFORMANCE-PLANNING', 'f52'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/integration/kafka/KAFKA-CONSUMER-GROUPS-REBALANCING-ORDERING',
                component: ComponentCreator('/shopverse/integration/kafka/KAFKA-CONSUMER-GROUPS-REBALANCING-ORDERING', 'a97'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/integration/kafka/KAFKA-CONSUMER-MULTITHREADING',
                component: ComponentCreator('/shopverse/integration/kafka/KAFKA-CONSUMER-MULTITHREADING', 'e94'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/integration/kafka/KAFKA-CONSUMER-OFFSET-COMMITS',
                component: ComponentCreator('/shopverse/integration/kafka/KAFKA-CONSUMER-OFFSET-COMMITS', '76b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/integration/kafka/KAFKA-ECOSYSTEM',
                component: ComponentCreator('/shopverse/integration/kafka/KAFKA-ECOSYSTEM', '327'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/integration/kafka/KAFKA-INTERNALS',
                component: ComponentCreator('/shopverse/integration/kafka/KAFKA-INTERNALS', '277'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/integration/kafka/KAFKA-MULTI-CLUSTER-DISASTER-RECOVERY',
                component: ComponentCreator('/shopverse/integration/kafka/KAFKA-MULTI-CLUSTER-DISASTER-RECOVERY', 'c60'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/integration/kafka/KAFKA-PRODUCER-RELIABILITY-BACKPRESSURE',
                component: ComponentCreator('/shopverse/integration/kafka/KAFKA-PRODUCER-RELIABILITY-BACKPRESSURE', '61d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/integration/kafka/KAFKA-PRODUCTION-FAILURE-PLAYBOOK',
                component: ComponentCreator('/shopverse/integration/kafka/KAFKA-PRODUCTION-FAILURE-PLAYBOOK', '985'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/integration/kafka/KAFKA-PRODUCTION-MASTERY',
                component: ComponentCreator('/shopverse/integration/kafka/KAFKA-PRODUCTION-MASTERY', 'ee8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/integration/kafka/KAFKA-SECURITY-OPERATIONS',
                component: ComponentCreator('/shopverse/integration/kafka/KAFKA-SECURITY-OPERATIONS', 'c5e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/integration/MESSAGING-PLATFORM-SELECTION',
                component: ComponentCreator('/shopverse/integration/MESSAGING-PLATFORM-SELECTION', '2c7'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/integration/RABBITMQ-SPRING-AMQP-ARCHITECT-PATH',
                component: ComponentCreator('/shopverse/integration/RABBITMQ-SPRING-AMQP-ARCHITECT-PATH', '6ab'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/integration/rabbitmq/RABBITMQ-INTERNALS-RELIABILITY',
                component: ComponentCreator('/shopverse/integration/rabbitmq/RABBITMQ-INTERNALS-RELIABILITY', '47d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/integration/rabbitmq/RABBITMQ-OPERATIONS-INTERVIEW',
                component: ComponentCreator('/shopverse/integration/rabbitmq/RABBITMQ-OPERATIONS-INTERVIEW', '519'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/integration/streaming/EVENT-STREAMING-INTERVIEW-REVISION',
                component: ComponentCreator('/shopverse/integration/streaming/EVENT-STREAMING-INTERVIEW-REVISION', '860'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/integration/streaming/KAFKA-CONNECT-CDC-PRODUCTION',
                component: ComponentCreator('/shopverse/integration/streaming/KAFKA-CONNECT-CDC-PRODUCTION', '01f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/integration/streaming/KAFKA-CONNECT-OVERVIEW',
                component: ComponentCreator('/shopverse/integration/streaming/KAFKA-CONNECT-OVERVIEW', '655'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/integration/streaming/KAFKA-STREAMS-OVERVIEW',
                component: ComponentCreator('/shopverse/integration/streaming/KAFKA-STREAMS-OVERVIEW', 'cdc'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/integration/streaming/KAFKA-STREAMS-STATEFUL-PRODUCTION',
                component: ComponentCreator('/shopverse/integration/streaming/KAFKA-STREAMS-STATEFUL-PRODUCTION', 'aca'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/integration/streaming/SPRING-CLOUD-STREAM-FUNCTIONS-BINDINGS',
                component: ComponentCreator('/shopverse/integration/streaming/SPRING-CLOUD-STREAM-FUNCTIONS-BINDINGS', 'e7c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/integration/streaming/SPRING-CLOUD-STREAM-KAFKA-PRODUCTION',
                component: ComponentCreator('/shopverse/integration/streaming/SPRING-CLOUD-STREAM-KAFKA-PRODUCTION', '064'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/integration/streaming/SPRING-CLOUD-STREAM-OVERVIEW',
                component: ComponentCreator('/shopverse/integration/streaming/SPRING-CLOUD-STREAM-OVERVIEW', 'dec'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/INTERVIEW-QUESTIONNAIRES',
                component: ComponentCreator('/shopverse/INTERVIEW-QUESTIONNAIRES', 'a30'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/advanced-internals/CONCURRENCY-AQS-VIRTUAL-THREADS',
                component: ComponentCreator('/shopverse/java/advanced-internals/CONCURRENCY-AQS-VIRTUAL-THREADS', '711'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/advanced-internals/DYNAMIC-JAVA-INTERNALS',
                component: ComponentCreator('/shopverse/java/advanced-internals/DYNAMIC-JAVA-INTERNALS', '786'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/advanced-internals/JAVA-MEMORY-MODEL',
                component: ComponentCreator('/shopverse/java/advanced-internals/JAVA-MEMORY-MODEL', 'a42'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/advanced-internals/JVM-EXECUTION-INTERNALS',
                component: ComponentCreator('/shopverse/java/advanced-internals/JVM-EXECUTION-INTERNALS', 'dc8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/advanced-internals/NIO-PERFORMANCE-JMH',
                component: ComponentCreator('/shopverse/java/advanced-internals/NIO-PERFORMANCE-JMH', '02d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/ADVANCED-JAVA-INTERNALS',
                component: ComponentCreator('/shopverse/java/ADVANCED-JAVA-INTERNALS', 'a90'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/collections/COLLECTION-CONTRACTS-AND-SELECTION',
                component: ComponentCreator('/shopverse/java/collections/COLLECTION-CONTRACTS-AND-SELECTION', 'f17'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/collections/LIST-SET-MAP-CHOICES',
                component: ComponentCreator('/shopverse/java/collections/LIST-SET-MAP-CHOICES', '809'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/collections/list/ARRAYLIST-INTERNALS',
                component: ComponentCreator('/shopverse/java/collections/list/ARRAYLIST-INTERNALS', '038'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/collections/list/COPYONWRITEARRAYLIST-INTERNALS',
                component: ComponentCreator('/shopverse/java/collections/list/COPYONWRITEARRAYLIST-INTERNALS', '75f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/collections/list/LINKEDLIST-INTERNALS',
                component: ComponentCreator('/shopverse/java/collections/list/LINKEDLIST-INTERNALS', '118'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/collections/list/LIST-OVERVIEW',
                component: ComponentCreator('/shopverse/java/collections/list/LIST-OVERVIEW', '424'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/collections/map/ENUMMAP-INTERNALS',
                component: ComponentCreator('/shopverse/java/collections/map/ENUMMAP-INTERNALS', '37f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/collections/map/HASHMAP-INTERNALS',
                component: ComponentCreator('/shopverse/java/collections/map/HASHMAP-INTERNALS', '6c3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/collections/map/LINKEDHASHMAP-INTERNALS',
                component: ComponentCreator('/shopverse/java/collections/map/LINKEDHASHMAP-INTERNALS', 'ff8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/collections/map/MAP-OVERVIEW',
                component: ComponentCreator('/shopverse/java/collections/map/MAP-OVERVIEW', '4e9'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/collections/map/TREEMAP-INTERNALS',
                component: ComponentCreator('/shopverse/java/collections/map/TREEMAP-INTERNALS', '26d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/collections/queue/ARRAYDEQUE-INTERNALS',
                component: ComponentCreator('/shopverse/java/collections/queue/ARRAYDEQUE-INTERNALS', 'adc'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/collections/queue/PRIORITYQUEUE-INTERNALS',
                component: ComponentCreator('/shopverse/java/collections/queue/PRIORITYQUEUE-INTERNALS', '13b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/collections/queue/QUEUE-DEQUE-OVERVIEW',
                component: ComponentCreator('/shopverse/java/collections/queue/QUEUE-DEQUE-OVERVIEW', 'a05'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/collections/SAFE-COLLECTION-MUTATION',
                component: ComponentCreator('/shopverse/java/collections/SAFE-COLLECTION-MUTATION', '5ac'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/collections/set/ENUMSET-INTERNALS',
                component: ComponentCreator('/shopverse/java/collections/set/ENUMSET-INTERNALS', '21c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/collections/set/HASHSET-INTERNALS',
                component: ComponentCreator('/shopverse/java/collections/set/HASHSET-INTERNALS', 'b7f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/collections/set/LINKEDHASHSET-INTERNALS',
                component: ComponentCreator('/shopverse/java/collections/set/LINKEDHASHSET-INTERNALS', '7ff'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/collections/set/SET-OVERVIEW',
                component: ComponentCreator('/shopverse/java/collections/set/SET-OVERVIEW', '84f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/collections/set/TREESET-INTERNALS',
                component: ComponentCreator('/shopverse/java/collections/set/TREESET-INTERNALS', 'e60'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/completable-future/COMPLETABLE-FUTURE-COMPOSITION',
                component: ComponentCreator('/shopverse/java/completable-future/COMPLETABLE-FUTURE-COMPOSITION', '1c3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/completable-future/COMPLETABLE-FUTURE-FAILURE-CANCELLATION',
                component: ComponentCreator('/shopverse/java/completable-future/COMPLETABLE-FUTURE-FAILURE-CANCELLATION', 'edd'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/completable-future/COMPLETABLE-FUTURE-FUNDAMENTALS',
                component: ComponentCreator('/shopverse/java/completable-future/COMPLETABLE-FUTURE-FUNDAMENTALS', '6bd'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/completable-future/COMPLETABLE-FUTURE-PRODUCTION',
                component: ComponentCreator('/shopverse/java/completable-future/COMPLETABLE-FUTURE-PRODUCTION', '365'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/CORE-JAVA-DEEP-DIVE',
                component: ComponentCreator('/shopverse/java/CORE-JAVA-DEEP-DIVE', '7ed'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/CORE-JAVA-SOURCE-COVERAGE',
                component: ComponentCreator('/shopverse/java/CORE-JAVA-SOURCE-COVERAGE', 'd6d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/features-8-to-26/JAVA-25-26-LANGUAGE',
                component: ComponentCreator('/shopverse/java/features-8-to-26/JAVA-25-26-LANGUAGE', 'da7'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/features-8-to-26/JAVA-25-26-RUNTIME',
                component: ComponentCreator('/shopverse/java/features-8-to-26/JAVA-25-26-RUNTIME', 'a07'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/features-8-to-26/JAVA-8-TO-26',
                component: ComponentCreator('/shopverse/java/features-8-to-26/JAVA-8-TO-26', '8fa'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/features-8-to-26/JAVA-LAMBDAS',
                component: ComponentCreator('/shopverse/java/features-8-to-26/JAVA-LAMBDAS', '9f1'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/features-8-to-26/JAVA-OPTIONAL',
                component: ComponentCreator('/shopverse/java/features-8-to-26/JAVA-OPTIONAL', '036'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/features-8-to-26/JAVA-RECORDS',
                component: ComponentCreator('/shopverse/java/features-8-to-26/JAVA-RECORDS', '3e5'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/features-8-to-26/JAVA-SEALED-CLASSES',
                component: ComponentCreator('/shopverse/java/features-8-to-26/JAVA-SEALED-CLASSES', '0e5'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/features-8-to-26/JAVA-SWITCH',
                component: ComponentCreator('/shopverse/java/features-8-to-26/JAVA-SWITCH', '34e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/features-8-to-26/JAVA-VAR',
                component: ComponentCreator('/shopverse/java/features-8-to-26/JAVA-VAR', '7e0'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/features-8-to-26/JAVA-VIRTUAL-THREADS',
                component: ComponentCreator('/shopverse/java/features-8-to-26/JAVA-VIRTUAL-THREADS', 'cc9'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-ABSTRACTION-INTERFACES',
                component: ComponentCreator('/shopverse/java/JAVA-ABSTRACTION-INTERFACES', '9b3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-ADVANCED-CONCURRENCY-UTILITIES',
                component: ComponentCreator('/shopverse/java/JAVA-ADVANCED-CONCURRENCY-UTILITIES', '8cf'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-API-DESIGN-COMPATIBILITY',
                component: ComponentCreator('/shopverse/java/JAVA-API-DESIGN-COMPATIBILITY', '7d2'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-ASSERTIONS-TOOLCHAIN',
                component: ComponentCreator('/shopverse/java/JAVA-ASSERTIONS-TOOLCHAIN', 'd44'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-COLLECTION-IMPLEMENTATIONS-ARCHITECT',
                component: ComponentCreator('/shopverse/java/JAVA-COLLECTION-IMPLEMENTATIONS-ARCHITECT', '0dd'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-COLLECTION-INTERNALS',
                component: ComponentCreator('/shopverse/java/JAVA-COLLECTION-INTERNALS', '3f9'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-COLLECTIONS',
                component: ComponentCreator('/shopverse/java/JAVA-COLLECTIONS', 'cdc'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-COMPARABLE-COMPARATOR-DEEP-DIVE',
                component: ComponentCreator('/shopverse/java/JAVA-COMPARABLE-COMPARATOR-DEEP-DIVE', '335'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-COMPLETABLE-FUTURE',
                component: ComponentCreator('/shopverse/java/JAVA-COMPLETABLE-FUTURE', 'de2'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-CONCURRENCY-DESIGN-REVIEW',
                component: ComponentCreator('/shopverse/java/JAVA-CONCURRENCY-DESIGN-REVIEW', '7ba'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-CONCURRENT-HASHMAP-OPENJDK',
                component: ComponentCreator('/shopverse/java/JAVA-CONCURRENT-HASHMAP-OPENJDK', '18f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-CONTAINERS-RESOURCE-LIMITS',
                component: ComponentCreator('/shopverse/java/JAVA-CONTAINERS-RESOURCE-LIMITS', '437'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-CORE-INTERVIEW-WORKBOOK',
                component: ComponentCreator('/shopverse/java/JAVA-CORE-INTERVIEW-WORKBOOK', '81f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-CUSTOM-EXCEPTIONS-CHECKED-UNCHECKED',
                component: ComponentCreator('/shopverse/java/JAVA-CUSTOM-EXCEPTIONS-CHECKED-UNCHECKED', '7c5'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-DYNAMIC-JPMS-PACKAGING',
                component: ComponentCreator('/shopverse/java/JAVA-DYNAMIC-JPMS-PACKAGING', 'cd2'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-ENUMS',
                component: ComponentCreator('/shopverse/java/JAVA-ENUMS', '097'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-EXCEPTION-ASYNC-DEEP-DIVE',
                component: ComponentCreator('/shopverse/java/JAVA-EXCEPTION-ASYNC-DEEP-DIVE', '34b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-EXCEPTIONS-STREAMS-INTERNALS',
                component: ComponentCreator('/shopverse/java/JAVA-EXCEPTIONS-STREAMS-INTERNALS', '1b4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-EXECUTABLE-LABS',
                component: ComponentCreator('/shopverse/java/JAVA-EXECUTABLE-LABS', '8d3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-EXECUTORS-THREAD-POOLS',
                component: ComponentCreator('/shopverse/java/JAVA-EXECUTORS-THREAD-POOLS', 'fb0'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-FFM-METHOD-HANDLES-RUNTIME',
                component: ComponentCreator('/shopverse/java/JAVA-FFM-METHOD-HANDLES-RUNTIME', '9f3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-FORKJOINPOOL-DEEP-DIVE',
                component: ComponentCreator('/shopverse/java/JAVA-FORKJOINPOOL-DEEP-DIVE', '1be'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-FRAMEWORK-RUNTIME-INTERACTIONS',
                component: ComponentCreator('/shopverse/java/JAVA-FRAMEWORK-RUNTIME-INTERACTIONS', '819'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-FUNCTIONAL-INTERFACES',
                component: ComponentCreator('/shopverse/java/JAVA-FUNCTIONAL-INTERFACES', 'a76'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-FUNDAMENTALS',
                component: ComponentCreator('/shopverse/java/JAVA-FUNDAMENTALS', '105'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-FUNDAMENTALS-SCENARIOS',
                component: ComponentCreator('/shopverse/java/JAVA-FUNDAMENTALS-SCENARIOS', 'b86'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-GC-COLLECTORS-ARCHITECT',
                component: ComponentCreator('/shopverse/java/JAVA-GC-COLLECTORS-ARCHITECT', '526'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-GC-OBJECT-LAYOUT-DEEP-DIVE',
                component: ComponentCreator('/shopverse/java/JAVA-GC-OBJECT-LAYOUT-DEEP-DIVE', 'bb3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-GENERICS',
                component: ComponentCreator('/shopverse/java/JAVA-GENERICS', 'ac4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-GENERICS-ERASURE-INTERNALS',
                component: ComponentCreator('/shopverse/java/JAVA-GENERICS-ERASURE-INTERNALS', '0a4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-HASH-COLLECTIONS-DEEP-DIVE',
                component: ComponentCreator('/shopverse/java/JAVA-HASH-COLLECTIONS-DEEP-DIVE', '771'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-INTERNALS-LABS',
                component: ComponentCreator('/shopverse/java/JAVA-INTERNALS-LABS', '24f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-INTERVIEW-PREPARATION',
                component: ComponentCreator('/shopverse/java/JAVA-INTERVIEW-PREPARATION', '059'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-JVM-ARCHITECTURE-OPERATIONS',
                component: ComponentCreator('/shopverse/java/JAVA-JVM-ARCHITECTURE-OPERATIONS', '246'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-JVM-MEMORY',
                component: ComponentCreator('/shopverse/java/JAVA-JVM-MEMORY', 'e01'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-KEYWORDS',
                component: ComponentCreator('/shopverse/java/JAVA-KEYWORDS', 'c64'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-LANGUAGE-OOP-INTERNALS',
                component: ComponentCreator('/shopverse/java/JAVA-LANGUAGE-OOP-INTERNALS', 'a4e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-LANGUAGE-SEMANTICS',
                component: ComponentCreator('/shopverse/java/JAVA-LANGUAGE-SEMANTICS', '1ce'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-LEAD-ARCHITECT-PATH',
                component: ComponentCreator('/shopverse/java/JAVA-LEAD-ARCHITECT-PATH', 'a1b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-MCQ-PRACTICE',
                component: ComponentCreator('/shopverse/java/JAVA-MCQ-PRACTICE', 'a0b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-MULTITHREADING',
                component: ComponentCreator('/shopverse/java/JAVA-MULTITHREADING', 'af7'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-NESTED-TYPES',
                component: ComponentCreator('/shopverse/java/JAVA-NESTED-TYPES', '378'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-NIO-IO-RESOURCE-OWNERSHIP',
                component: ComponentCreator('/shopverse/java/JAVA-NIO-IO-RESOURCE-OWNERSHIP', 'dc1'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-OBJECTS-STRINGS-GC',
                component: ComponentCreator('/shopverse/java/JAVA-OBJECTS-STRINGS-GC', '9dc'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-OOP',
                component: ComponentCreator('/shopverse/java/JAVA-OOP', 'b0c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-OPERATORS-CONTROL-FLOW',
                component: ComponentCreator('/shopverse/java/JAVA-OPERATORS-CONTROL-FLOW', '3e7'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-OVERLOADING-RESOLUTION-DEEP-DIVE',
                component: ComponentCreator('/shopverse/java/JAVA-OVERLOADING-RESOLUTION-DEEP-DIVE', 'db1'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-OVERRIDING-HIDING-DEEP-DIVE',
                component: ComponentCreator('/shopverse/java/JAVA-OVERRIDING-HIDING-DEEP-DIVE', '65c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-PARALLEL-STREAM-INTERNALS',
                component: ComponentCreator('/shopverse/java/JAVA-PARALLEL-STREAM-INTERNALS', '0cc'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-PERFORMANCE-DIAGNOSTICS-TOOLING',
                component: ComponentCreator('/shopverse/java/JAVA-PERFORMANCE-DIAGNOSTICS-TOOLING', '952'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-PERFORMANCE-ENGINEERING-CAPACITY',
                component: ComponentCreator('/shopverse/java/JAVA-PERFORMANCE-ENGINEERING-CAPACITY', '878'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-PRODUCTION-INCIDENTS',
                component: ComponentCreator('/shopverse/java/JAVA-PRODUCTION-INCIDENTS', 'bb1'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-PRODUCTION-MASTERY',
                component: ComponentCreator('/shopverse/java/JAVA-PRODUCTION-MASTERY', '91e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-REFLECTION-ANNOTATIONS-CLASSLOADERS',
                component: ComponentCreator('/shopverse/java/JAVA-REFLECTION-ANNOTATIONS-CLASSLOADERS', '6ca'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-REGEX-INTERNATIONALIZATION',
                component: ComponentCreator('/shopverse/java/JAVA-REGEX-INTERNATIONALIZATION', '888'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-REVISION-SHEET',
                component: ComponentCreator('/shopverse/java/JAVA-REVISION-SHEET', 'fb1'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-SECURE-ASYNC-IO',
                component: ComponentCreator('/shopverse/java/JAVA-SECURE-ASYNC-IO', '577'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-SENIOR-INTERVIEW-BANK',
                component: ComponentCreator('/shopverse/java/JAVA-SENIOR-INTERVIEW-BANK', '941'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-SENIOR-LABS-INTERVIEW',
                component: ComponentCreator('/shopverse/java/JAVA-SENIOR-LABS-INTERVIEW', 'eeb'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-SERIALIZATION',
                component: ComponentCreator('/shopverse/java/JAVA-SERIALIZATION', '17d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-SERIALIZATION-EVOLUTION-SECURITY',
                component: ComponentCreator('/shopverse/java/JAVA-SERIALIZATION-EVOLUTION-SECURITY', '6df'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-SERIALIZATION-INTERNALS',
                component: ComponentCreator('/shopverse/java/JAVA-SERIALIZATION-INTERNALS', 'b38'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-SERIALIZATION-UMBRELLA',
                component: ComponentCreator('/shopverse/java/JAVA-SERIALIZATION-UMBRELLA', '0ea'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-SHOPVERSE-CROSSWALK',
                component: ComponentCreator('/shopverse/java/JAVA-SHOPVERSE-CROSSWALK', '55d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-SPECIALIZED-COLLECTIONS-INTERNALS',
                component: ComponentCreator('/shopverse/java/JAVA-SPECIALIZED-COLLECTIONS-INTERNALS', '1d9'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-STREAM-PIPELINE-INTERNALS',
                component: ComponentCreator('/shopverse/java/JAVA-STREAM-PIPELINE-INTERNALS', '733'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-STREAMS',
                component: ComponentCreator('/shopverse/java/JAVA-STREAMS', 'd68'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-STRINGS-ENCODING-INTERNALS',
                component: ComponentCreator('/shopverse/java/JAVA-STRINGS-ENCODING-INTERNALS', '37c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-THREAD-COORDINATION',
                component: ComponentCreator('/shopverse/java/JAVA-THREAD-COORDINATION', '9e3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-THREAD-CREATION-SCHEDULING',
                component: ComponentCreator('/shopverse/java/JAVA-THREAD-CREATION-SCHEDULING', 'b41'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-THREAD-SCHEDULER-DEEP-DIVE',
                component: ComponentCreator('/shopverse/java/JAVA-THREAD-SCHEDULER-DEEP-DIVE', 'd55'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-THREADING-MODEL',
                component: ComponentCreator('/shopverse/java/JAVA-THREADING-MODEL', 'fad'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-THREADING-UMBRELLA',
                component: ComponentCreator('/shopverse/java/JAVA-THREADING-UMBRELLA', '304'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-TIME-NUMERIC-SECURITY',
                component: ComponentCreator('/shopverse/java/JAVA-TIME-NUMERIC-SECURITY', 'b7f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-TIMED-MOCK-INTERVIEWS',
                component: ComponentCreator('/shopverse/java/JAVA-TIMED-MOCK-INTERVIEWS', '039'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JAVA-VIRTUAL-STRUCTURED-CONCURRENCY',
                component: ComponentCreator('/shopverse/java/JAVA-VIRTUAL-STRUCTURED-CONCURRENCY', 'ca9'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/JVM-PROFILING-GC-NATIVE',
                component: ComponentCreator('/shopverse/java/JVM-PROFILING-GC-NATIVE', 'a36'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/keywords/JAVA-CONTROL-ERROR-KEYWORDS',
                component: ComponentCreator('/shopverse/java/keywords/JAVA-CONTROL-ERROR-KEYWORDS', '2d9'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/keywords/JAVA-STATE-CONCURRENCY-KEYWORDS',
                component: ComponentCreator('/shopverse/java/keywords/JAVA-STATE-CONCURRENCY-KEYWORDS', '3de'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/keywords/JAVA-TYPE-DECLARATION-KEYWORDS',
                component: ComponentCreator('/shopverse/java/keywords/JAVA-TYPE-DECLARATION-KEYWORDS', '0e8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/LOMBOK-GUIDE',
                component: ComponentCreator('/shopverse/java/LOMBOK-GUIDE', '12e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/oop/OOP-COMPOSITION-INHERITANCE',
                component: ComponentCreator('/shopverse/java/oop/OOP-COMPOSITION-INHERITANCE', '7a9'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/oop/OOP-DOMAIN-POLYMORPHISM-OBJECT-CONTRACTS',
                component: ComponentCreator('/shopverse/java/oop/OOP-DOMAIN-POLYMORPHISM-OBJECT-CONTRACTS', '000'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/threading/TASK-CANCELLATION-DEADLINES',
                component: ComponentCreator('/shopverse/java/threading/TASK-CANCELLATION-DEADLINES', '94b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/java/threading/THREAD-CONTEXT-PROPAGATION',
                component: ComponentCreator('/shopverse/java/threading/THREAD-CONTEXT-PROPAGATION', '508'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/leadership/ARCHITECT-PRACTICE-EVIDENCE-PATH',
                component: ComponentCreator('/shopverse/leadership/ARCHITECT-PRACTICE-EVIDENCE-PATH', '565'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/leadership/architect-practice/ARCHITECT-FAILURE-DIAGNOSIS',
                component: ComponentCreator('/shopverse/leadership/architect-practice/ARCHITECT-FAILURE-DIAGNOSIS', '9c9'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/leadership/architect-practice/ARCHITECT-PRODUCTION-EVIDENCE-WORKBOOK',
                component: ComponentCreator('/shopverse/leadership/architect-practice/ARCHITECT-PRODUCTION-EVIDENCE-WORKBOOK', '9ee'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/leadership/architect-practice/ARCHITECT-RUNTIME-DESIGN-REASONING',
                component: ComponentCreator('/shopverse/leadership/architect-practice/ARCHITECT-RUNTIME-DESIGN-REASONING', 'ed1'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/leadership/architect-practice/ARCHITECT-SCALE-SECURITY-TRADEOFFS',
                component: ComponentCreator('/shopverse/leadership/architect-practice/ARCHITECT-SCALE-SECURITY-TRADEOFFS', '468'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/leadership/ARCHITECTURE-DECISIONS-AND-DISAGREEMENTS',
                component: ComponentCreator('/shopverse/leadership/ARCHITECTURE-DECISIONS-AND-DISAGREEMENTS', '465'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/leadership/ARCHITECTURE-PORTFOLIO-MOCK-INTERVIEW-PROGRAM',
                component: ComponentCreator('/shopverse/leadership/ARCHITECTURE-PORTFOLIO-MOCK-INTERVIEW-PROGRAM', '2fa'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/leadership/ENGINEERING-LEADERSHIP-INTERVIEW-SCENARIOS',
                component: ComponentCreator('/shopverse/leadership/ENGINEERING-LEADERSHIP-INTERVIEW-SCENARIOS', '10b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/leadership/ENGINEERING-LEADERSHIP-PRACTICES',
                component: ComponentCreator('/shopverse/leadership/ENGINEERING-LEADERSHIP-PRACTICES', 'da4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/leadership/interview-program/ARCHITECTURE-PORTFOLIO-BUILDING',
                component: ComponentCreator('/shopverse/leadership/interview-program/ARCHITECTURE-PORTFOLIO-BUILDING', '324'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/leadership/interview-program/DAY-ZERO-ASSESSOR-SCORING-ROUTING',
                component: ComponentCreator('/shopverse/leadership/interview-program/DAY-ZERO-ASSESSOR-SCORING-ROUTING', '59d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/leadership/interview-program/DAY-ZERO-DIAGNOSTIC-ASSESSMENT',
                component: ComponentCreator('/shopverse/leadership/interview-program/DAY-ZERO-DIAGNOSTIC-ASSESSMENT', '819'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/leadership/interview-program/INTERVIEW-PRACTICE-DASHBOARD',
                component: ComponentCreator('/shopverse/leadership/interview-program/INTERVIEW-PRACTICE-DASHBOARD', 'e7d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/leadership/interview-program/LEAD-ARCHITECT-PREPARATION-DASHBOARD',
                component: ComponentCreator('/shopverse/leadership/interview-program/LEAD-ARCHITECT-PREPARATION-DASHBOARD', 'e98'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/leadership/interview-program/MCQ-PRACTICE-CENTER',
                component: ComponentCreator('/shopverse/leadership/interview-program/MCQ-PRACTICE-CENTER', '13e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/leadership/interview-program/MOCK-INTERVIEW-FORMATS-QUESTION-BANK',
                component: ComponentCreator('/shopverse/leadership/interview-program/MOCK-INTERVIEW-FORMATS-QUESTION-BANK', 'ddb'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/leadership/interview-program/REVISION-READINESS-SCORECARD',
                component: ComponentCreator('/shopverse/leadership/interview-program/REVISION-READINESS-SCORECARD', '074'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/leadership/interview-program/ROLE-BASED-PREPARATION-ROUTES',
                component: ComponentCreator('/shopverse/leadership/interview-program/ROLE-BASED-PREPARATION-ROUTES', '597'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/leadership/interview-program/SYSTEM-DESIGN-BEHAVIORAL-LEADERSHIP-ROUNDS',
                component: ComponentCreator('/shopverse/leadership/interview-program/SYSTEM-DESIGN-BEHAVIORAL-LEADERSHIP-ROUNDS', 'c35'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/leadership/interview-program/TWELVE-WEEK-PREPARATION-PROGRAM',
                component: ComponentCreator('/shopverse/leadership/interview-program/TWELVE-WEEK-PREPARATION-PROGRAM', '8ec'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/leadership/LEADERSHIP-ARCHITECTURE-INTERVIEW-WORKBOOK',
                component: ComponentCreator('/shopverse/leadership/LEADERSHIP-ARCHITECTURE-INTERVIEW-WORKBOOK', 'f07'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/leadership/LEADERSHIP-ARCHITECTURE-SCENARIOS',
                component: ComponentCreator('/shopverse/leadership/LEADERSHIP-ARCHITECTURE-SCENARIOS', '9eb'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/leadership/LEGACY-TO-SPRING-BOOT-MODERNIZATION',
                component: ComponentCreator('/shopverse/leadership/LEGACY-TO-SPRING-BOOT-MODERNIZATION', '6cf'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/leadership/MONOLITH-TO-MICROSERVICES-STRATEGY',
                component: ComponentCreator('/shopverse/leadership/MONOLITH-TO-MICROSERVICES-STRATEGY', 'bba'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/leadership/PRODUCTION-PERFORMANCE-AND-AVAILABILITY',
                component: ComponentCreator('/shopverse/leadership/PRODUCTION-PERFORMANCE-AND-AVAILABILITY', 'fbc'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/leadership/ZERO-DOWNTIME-DELIVERY',
                component: ComponentCreator('/shopverse/leadership/ZERO-DOWNTIME-DELIVERY', 'e6a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/observability/',
                component: ComponentCreator('/shopverse/observability/', '77e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/observability/CORRELATION-IDENTIFIERS-HTTP-PROPAGATION',
                component: ComponentCreator('/shopverse/observability/CORRELATION-IDENTIFIERS-HTTP-PROPAGATION', '209'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/observability/DISTRIBUTED-TRACING-INTERNALS-PERFORMANCE',
                component: ComponentCreator('/shopverse/observability/DISTRIBUTED-TRACING-INTERNALS-PERFORMANCE', '765'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/observability/GRAFANA',
                component: ComponentCreator('/shopverse/observability/GRAFANA', '63d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/observability/LOGGING-GENERIC',
                component: ComponentCreator('/shopverse/observability/LOGGING-GENERIC', '1f9'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/observability/LOKI',
                component: ComponentCreator('/shopverse/observability/LOKI', '7a2'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/observability/MDC-CORRELATION-TRACING',
                component: ComponentCreator('/shopverse/observability/MDC-CORRELATION-TRACING', 'ff8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/observability/MDC-GENERIC',
                component: ComponentCreator('/shopverse/observability/MDC-GENERIC', '676'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/observability/MDC-KAFKA-ASYNC-PROPAGATION',
                component: ComponentCreator('/shopverse/observability/MDC-KAFKA-ASYNC-PROPAGATION', '618'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/observability/MICROMETER-COUNTERS',
                component: ComponentCreator('/shopverse/observability/MICROMETER-COUNTERS', '9f6'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/observability/MICROMETER-METRICS',
                component: ComponentCreator('/shopverse/observability/MICROMETER-METRICS', '46a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/observability/MICROMETER-TIMERS-TAGS-OPERATIONS',
                component: ComponentCreator('/shopverse/observability/MICROMETER-TIMERS-TAGS-OPERATIONS', '8ba'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/observability/OBSERVABILITY-IMPLEMENTATION-GUIDE',
                component: ComponentCreator('/shopverse/observability/OBSERVABILITY-IMPLEMENTATION-GUIDE', '456'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/observability/OBSERVABILITY-OVERVIEW',
                component: ComponentCreator('/shopverse/observability/OBSERVABILITY-OVERVIEW', '75f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/observability/OBSERVABILITY-REVISION-SHEET',
                component: ComponentCreator('/shopverse/observability/OBSERVABILITY-REVISION-SHEET', '984'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/observability/PII-SAFE-LOGGING',
                component: ComponentCreator('/shopverse/observability/PII-SAFE-LOGGING', 'b04'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/observability/PROMETHEUS',
                component: ComponentCreator('/shopverse/observability/PROMETHEUS', '9fc'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/observability/PROMTAIL',
                component: ComponentCreator('/shopverse/observability/PROMTAIL', 'f0b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/observability/SHOPVERSE-OBSERVABILITY-OPERATIONS',
                component: ComponentCreator('/shopverse/observability/SHOPVERSE-OBSERVABILITY-OPERATIONS', 'caf'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/observability/STRUCTURED-LOGGING',
                component: ComponentCreator('/shopverse/observability/STRUCTURED-LOGGING', 'bc4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/',
                component: ComponentCreator('/shopverse/operations/', '261'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/CI-CD-AUTOMATION',
                component: ComponentCreator('/shopverse/operations/CI-CD-AUTOMATION', '1dc'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/DEPLOYMENT-CONTRACTS-RELEASE-GATES',
                component: ComponentCreator('/shopverse/operations/DEPLOYMENT-CONTRACTS-RELEASE-GATES', 'b3a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/DEPLOYMENT-STRATEGIES',
                component: ComponentCreator('/shopverse/operations/DEPLOYMENT-STRATEGIES', '11e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/DEPLOYMENT-STRATEGY-SELECTION',
                component: ComponentCreator('/shopverse/operations/DEPLOYMENT-STRATEGY-SELECTION', '903'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/DEPLOYMENT-TRAFFIC-ROLLBACK',
                component: ComponentCreator('/shopverse/operations/DEPLOYMENT-TRAFFIC-ROLLBACK', 'dbb'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/DOCKER',
                component: ComponentCreator('/shopverse/operations/DOCKER', 'c8b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/DOCKER-ARCHITECT-PATH',
                component: ComponentCreator('/shopverse/operations/DOCKER-ARCHITECT-PATH', '523'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/DOCKER-INTERNALS-LAYERS-STORAGE',
                component: ComponentCreator('/shopverse/operations/DOCKER-INTERNALS-LAYERS-STORAGE', '209'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/DOCKER-MCQ-PRACTICE',
                component: ComponentCreator('/shopverse/operations/DOCKER-MCQ-PRACTICE', '4dc'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/docker/DOCKER-ENGINE-RUNTIME-INTERNALS',
                component: ComponentCreator('/shopverse/operations/docker/DOCKER-ENGINE-RUNTIME-INTERNALS', '114'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/docker/DOCKER-IMAGES-BUILDKIT-SUPPLY-CHAIN',
                component: ComponentCreator('/shopverse/operations/docker/DOCKER-IMAGES-BUILDKIT-SUPPLY-CHAIN', '3d6'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/docker/DOCKER-PRODUCTION-MASTERY',
                component: ComponentCreator('/shopverse/operations/docker/DOCKER-PRODUCTION-MASTERY', '8d0'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/docker/DOCKER-SECURITY-PRODUCTION-OPERATIONS',
                component: ComponentCreator('/shopverse/operations/docker/DOCKER-SECURITY-PRODUCTION-OPERATIONS', '8dc'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/docker/DOCKER-STORAGE-NETWORKING-INTERNALS',
                component: ComponentCreator('/shopverse/operations/docker/DOCKER-STORAGE-NETWORKING-INTERNALS', 'd4f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/docker/DOCKER-TROUBLESHOOTING-INTERVIEW-REVISION',
                component: ComponentCreator('/shopverse/operations/docker/DOCKER-TROUBLESHOOTING-INTERVIEW-REVISION', 'add'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/DOCUMENT-EXPORTS',
                component: ComponentCreator('/shopverse/operations/DOCUMENT-EXPORTS', '134'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/DOCUSAURUS',
                component: ComponentCreator('/shopverse/operations/DOCUSAURUS', '662'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/DOCUSAURUS-AUTHORING-NAVIGATION',
                component: ComponentCreator('/shopverse/operations/DOCUSAURUS-AUTHORING-NAVIGATION', '6ea'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/DOCUSAURUS-COMPONENTS-DEPLOYMENT',
                component: ComponentCreator('/shopverse/operations/DOCUSAURUS-COMPONENTS-DEPLOYMENT', '5cb'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/GIT-COMMANDS',
                component: ComponentCreator('/shopverse/operations/GIT-COMMANDS', 'fb9'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/GIT-DAILY-SYNC-CONFLICTS',
                component: ComponentCreator('/shopverse/operations/GIT-DAILY-SYNC-CONFLICTS', '0e1'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/GIT-HISTORY-RECOVERY-COLLABORATION',
                component: ComponentCreator('/shopverse/operations/GIT-HISTORY-RECOVERY-COLLABORATION', 'f91'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/GITHUB-ACTIONS',
                component: ComponentCreator('/shopverse/operations/GITHUB-ACTIONS', 'd15'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/HELM-GITOPS-ARGOCD-OVERVIEW',
                component: ComponentCreator('/shopverse/operations/HELM-GITOPS-ARGOCD-OVERVIEW', '165'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/HELM-GITOPS-ARGOCD-PATH',
                component: ComponentCreator('/shopverse/operations/HELM-GITOPS-ARGOCD-PATH', '8a2'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/helm-gitops/ARGOCD-PRODUCTION-OPERATIONS',
                component: ComponentCreator('/shopverse/operations/helm-gitops/ARGOCD-PRODUCTION-OPERATIONS', 'c76'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/helm-gitops/GITOPS-DELIVERY-DESIGN',
                component: ComponentCreator('/shopverse/operations/helm-gitops/GITOPS-DELIVERY-DESIGN', '2d8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/helm-gitops/HELM-CHART-ENGINEERING',
                component: ComponentCreator('/shopverse/operations/helm-gitops/HELM-CHART-ENGINEERING', '14a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/helm-gitops/HELM-GITOPS-ARGOCD-INTERVIEW-REVISION',
                component: ComponentCreator('/shopverse/operations/helm-gitops/HELM-GITOPS-ARGOCD-INTERVIEW-REVISION', '5bd'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/iac/IAC-IMPLEMENTATION-OPERATIONS-INTERVIEW',
                component: ComponentCreator('/shopverse/operations/iac/IAC-IMPLEMENTATION-OPERATIONS-INTERVIEW', '2b8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/INFRASTRUCTURE-AS-CODE-ARCHITECT-PATH',
                component: ComponentCreator('/shopverse/operations/INFRASTRUCTURE-AS-CODE-ARCHITECT-PATH', '7d5'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/INFRASTRUCTURE-AS-CODE-OVERVIEW',
                component: ComponentCreator('/shopverse/operations/INFRASTRUCTURE-AS-CODE-OVERVIEW', '887'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/JENKINS',
                component: ComponentCreator('/shopverse/operations/JENKINS', '756'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/KUBERNETES-ARCHITECT-PATH',
                component: ComponentCreator('/shopverse/operations/KUBERNETES-ARCHITECT-PATH', 'c9a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/KUBERNETES-MCQ-PRACTICE',
                component: ComponentCreator('/shopverse/operations/KUBERNETES-MCQ-PRACTICE', '3ef'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/KUBERNETES-WORKLOAD-ENGINEERING',
                component: ComponentCreator('/shopverse/operations/KUBERNETES-WORKLOAD-ENGINEERING', 'e30'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/kubernetes/KUBERNETES-CLUSTER-OPERATIONS',
                component: ComponentCreator('/shopverse/operations/kubernetes/KUBERNETES-CLUSTER-OPERATIONS', '45d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/kubernetes/KUBERNETES-CONTAINERS-VMS-BOSH',
                component: ComponentCreator('/shopverse/operations/kubernetes/KUBERNETES-CONTAINERS-VMS-BOSH', 'c51'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/kubernetes/KUBERNETES-CONTROL-PLANE-INTERNALS',
                component: ComponentCreator('/shopverse/operations/kubernetes/KUBERNETES-CONTROL-PLANE-INTERNALS', 'bad'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/kubernetes/KUBERNETES-KUBECONFIG-ACCESS',
                component: ComponentCreator('/shopverse/operations/kubernetes/KUBERNETES-KUBECONFIG-ACCESS', '3f7'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/kubernetes/KUBERNETES-KUBECTL-MANIFESTS-COMMANDS',
                component: ComponentCreator('/shopverse/operations/kubernetes/KUBERNETES-KUBECTL-MANIFESTS-COMMANDS', '6d8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/kubernetes/KUBERNETES-NETWORKING-SERVICES',
                component: ComponentCreator('/shopverse/operations/kubernetes/KUBERNETES-NETWORKING-SERVICES', '189'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/kubernetes/KUBERNETES-OVERVIEW',
                component: ComponentCreator('/shopverse/operations/kubernetes/KUBERNETES-OVERVIEW', '54a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/kubernetes/KUBERNETES-SECURITY-MULTITENANCY',
                component: ComponentCreator('/shopverse/operations/kubernetes/KUBERNETES-SECURITY-MULTITENANCY', '237'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/kubernetes/KUBERNETES-STORAGE-STATEFUL',
                component: ComponentCreator('/shopverse/operations/kubernetes/KUBERNETES-STORAGE-STATEFUL', '15d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/kubernetes/KUBERNETES-TROUBLESHOOTING-INTERVIEW-REVISION',
                component: ComponentCreator('/shopverse/operations/kubernetes/KUBERNETES-TROUBLESHOOTING-INTERVIEW-REVISION', '460'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/kubernetes/KUBERNETES-WORKLOADS-SCHEDULING',
                component: ComponentCreator('/shopverse/operations/kubernetes/KUBERNETES-WORKLOADS-SCHEDULING', '18c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/kubernetes/TKGI-API-SERVER-LIFECYCLE',
                component: ComponentCreator('/shopverse/operations/kubernetes/TKGI-API-SERVER-LIFECYCLE', '813'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/kubernetes/TKGI-ARCHITECTURE-OPERATIONS',
                component: ComponentCreator('/shopverse/operations/kubernetes/TKGI-ARCHITECTURE-OPERATIONS', 'd55'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/kubernetes/TKGI-BACKUP-RESTORE-DR',
                component: ComponentCreator('/shopverse/operations/kubernetes/TKGI-BACKUP-RESTORE-DR', 'b4f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/kubernetes/TKGI-BOSH-LIFECYCLE',
                component: ComponentCreator('/shopverse/operations/kubernetes/TKGI-BOSH-LIFECYCLE', '401'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/kubernetes/TKGI-CONSOLE-MONITORING',
                component: ComponentCreator('/shopverse/operations/kubernetes/TKGI-CONSOLE-MONITORING', '4ca'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/kubernetes/TKGI-CONTROL-PLANE-ARCHITECTURE',
                component: ComponentCreator('/shopverse/operations/kubernetes/TKGI-CONTROL-PLANE-ARCHITECTURE', '0ac'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/kubernetes/TKGI-DATABASE-STATE',
                component: ComponentCreator('/shopverse/operations/kubernetes/TKGI-DATABASE-STATE', '028'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/kubernetes/TKGI-HARBOR-REGISTRY',
                component: ComponentCreator('/shopverse/operations/kubernetes/TKGI-HARBOR-REGISTRY', '80d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/kubernetes/TKGI-INSTALLATION-FOUNDATION',
                component: ComponentCreator('/shopverse/operations/kubernetes/TKGI-INSTALLATION-FOUNDATION', '7be'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/kubernetes/TKGI-NETWORKING-LOAD-BALANCERS',
                component: ComponentCreator('/shopverse/operations/kubernetes/TKGI-NETWORKING-LOAD-BALANCERS', '019'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/kubernetes/TKGI-OVERVIEW-PATH',
                component: ComponentCreator('/shopverse/operations/kubernetes/TKGI-OVERVIEW-PATH', '38a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/kubernetes/TKGI-PLANS-SIZING-CAPACITY',
                component: ComponentCreator('/shopverse/operations/kubernetes/TKGI-PLANS-SIZING-CAPACITY', 'e42'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/kubernetes/TKGI-PRODUCTION-INCIDENT-REVISION',
                component: ComponentCreator('/shopverse/operations/kubernetes/TKGI-PRODUCTION-INCIDENT-REVISION', '803'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/kubernetes/TKGI-PRODUCTION-OPERATIONS-PATH',
                component: ComponentCreator('/shopverse/operations/kubernetes/TKGI-PRODUCTION-OPERATIONS-PATH', 'b92'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/kubernetes/TKGI-TELEMETRY-SINKS-OBSERVABILITY',
                component: ComponentCreator('/shopverse/operations/kubernetes/TKGI-TELEMETRY-SINKS-OBSERVABILITY', 'bdb'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/kubernetes/TKGI-UAA-SECURITY',
                component: ComponentCreator('/shopverse/operations/kubernetes/TKGI-UAA-SECURITY', '902'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/kubernetes/TKGI-UPGRADE-LIFECYCLE',
                component: ComponentCreator('/shopverse/operations/kubernetes/TKGI-UPGRADE-LIFECYCLE', 'e26'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/LINUX-OVERVIEW',
                component: ComponentCreator('/shopverse/operations/LINUX-OVERVIEW', '441'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/LINUX-PRODUCTION-TROUBLESHOOTING-PATH',
                component: ComponentCreator('/shopverse/operations/LINUX-PRODUCTION-TROUBLESHOOTING-PATH', '4d1'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/linux/LINUX-FILESYSTEM-STORAGE',
                component: ComponentCreator('/shopverse/operations/linux/LINUX-FILESYSTEM-STORAGE', '3d0'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/linux/LINUX-INCIDENT-LABS-REVISION',
                component: ComponentCreator('/shopverse/operations/linux/LINUX-INCIDENT-LABS-REVISION', '26f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/linux/LINUX-PROCESS-CPU-MEMORY',
                component: ComponentCreator('/shopverse/operations/linux/LINUX-PROCESS-CPU-MEMORY', '129'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/linux/LINUX-SERVICES-NETWORK-CONTAINERS',
                component: ComponentCreator('/shopverse/operations/linux/LINUX-SERVICES-NETWORK-CONTAINERS', '742'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/LOCAL-DOCKER-IMPLEMENTATION-GUIDE',
                component: ComponentCreator('/shopverse/operations/LOCAL-DOCKER-IMPLEMENTATION-GUIDE', '9a4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/MAVEN-ENGINEERING-PATH',
                component: ComponentCreator('/shopverse/operations/MAVEN-ENGINEERING-PATH', 'e40'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/MAVEN-OVERVIEW',
                component: ComponentCreator('/shopverse/operations/MAVEN-OVERVIEW', '0d8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/maven/MAVEN-CI-SECURITY-REPRODUCIBILITY',
                component: ComponentCreator('/shopverse/operations/maven/MAVEN-CI-SECURITY-REPRODUCIBILITY', 'f54'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/maven/MAVEN-DEPENDENCIES-REACTOR',
                component: ComponentCreator('/shopverse/operations/maven/MAVEN-DEPENDENCIES-REACTOR', '8f7'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/maven/MAVEN-POM-LIFECYCLE-PLUGINS',
                component: ComponentCreator('/shopverse/operations/maven/MAVEN-POM-LIFECYCLE-PLUGINS', 'c79'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/maven/MAVEN-TROUBLESHOOTING-INTERVIEW-REVISION',
                component: ComponentCreator('/shopverse/operations/maven/MAVEN-TROUBLESHOOTING-INTERVIEW-REVISION', '82a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/MINIO',
                component: ComponentCreator('/shopverse/operations/MINIO', '149'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/OPERATIONS-CHEATSHEET',
                component: ComponentCreator('/shopverse/operations/OPERATIONS-CHEATSHEET', 'a30'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/PERFORMANCE-CAPACITY-FINOPS',
                component: ComponentCreator('/shopverse/operations/PERFORMANCE-CAPACITY-FINOPS', 'f3d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/PERFORMANCE-CHAOS-ENGINEERING-PATH',
                component: ComponentCreator('/shopverse/operations/PERFORMANCE-CHAOS-ENGINEERING-PATH', 'b60'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/performance-chaos/PERFORMANCE-CHAOS-LABS-INTERVIEW',
                component: ComponentCreator('/shopverse/operations/performance-chaos/PERFORMANCE-CHAOS-LABS-INTERVIEW', '590'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/performance-chaos/PRODUCTION-SLOWNESS-DIAGNOSIS-RUNBOOK',
                component: ComponentCreator('/shopverse/operations/performance-chaos/PRODUCTION-SLOWNESS-DIAGNOSIS-RUNBOOK', '516'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/PLATFORM-ENGINEERING-GOLDEN-PATH',
                component: ComponentCreator('/shopverse/operations/PLATFORM-ENGINEERING-GOLDEN-PATH', 'b61'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/platform-engineering/PLATFORM-OPERATIONS-INTERVIEW',
                component: ComponentCreator('/shopverse/operations/platform-engineering/PLATFORM-OPERATIONS-INTERVIEW', 'ecd'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/SHELL-AUTOMATION-ENGINEERING-PATH',
                component: ComponentCreator('/shopverse/operations/SHELL-AUTOMATION-ENGINEERING-PATH', '377'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/SHOPVERSE-DOCKER',
                component: ComponentCreator('/shopverse/operations/SHOPVERSE-DOCKER', '546'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/SHOPVERSE-JENKINS',
                component: ComponentCreator('/shopverse/operations/SHOPVERSE-JENKINS', '47c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/SPRING-BOOT-ACTUATOR',
                component: ComponentCreator('/shopverse/operations/SPRING-BOOT-ACTUATOR', '8c3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/SPRING-BOOT-ADMIN',
                component: ComponentCreator('/shopverse/operations/SPRING-BOOT-ADMIN', '632'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/operations/SRE-DR-CHAOS',
                component: ComponentCreator('/shopverse/operations/SRE-DR-CHAOS', '440'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/platform/',
                component: ComponentCreator('/shopverse/platform/', 'bf3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/platform/BEFORE-AFTER-FILES',
                component: ComponentCreator('/shopverse/platform/BEFORE-AFTER-FILES', 'a27'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/platform/COMMON-ERROR',
                component: ComponentCreator('/shopverse/platform/COMMON-ERROR', '634'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/platform/CONFIG-PROPERTIES',
                component: ComponentCreator('/shopverse/platform/CONFIG-PROPERTIES', 'e75'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/platform/DUPLICATE-LOGIC',
                component: ComponentCreator('/shopverse/platform/DUPLICATE-LOGIC', '14d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/platform/KAFKA-PARSING',
                component: ComponentCreator('/shopverse/platform/KAFKA-PARSING', 'bf4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/platform/KAFKA-RECOVERY-STARTER',
                component: ComponentCreator('/shopverse/platform/KAFKA-RECOVERY-STARTER', 'a4d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/platform/MIGRATION-CHECKLIST',
                component: ComponentCreator('/shopverse/platform/MIGRATION-CHECKLIST', 'fc5'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/platform/OBSERVABILITY-STARTER',
                component: ComponentCreator('/shopverse/platform/OBSERVABILITY-STARTER', 'e62'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/platform/OUTBOX-STARTER',
                component: ComponentCreator('/shopverse/platform/OUTBOX-STARTER', 'e8c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/platform/SECURITY-STARTER',
                component: ComponentCreator('/shopverse/platform/SECURITY-STARTER', 'cc9'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/platform/TROUBLESHOOTING',
                component: ComponentCreator('/shopverse/platform/TROUBLESHOOTING', '6be'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/platform/WEB-PAGINATION',
                component: ComponentCreator('/shopverse/platform/WEB-PAGINATION', '35a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/quarkus/',
                component: ComponentCreator('/shopverse/quarkus/', '8e7'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/quarkus/QUARKUS-CHECKOUT-TUTORIAL',
                component: ComponentCreator('/shopverse/quarkus/QUARKUS-CHECKOUT-TUTORIAL', '148'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/quarkus/QUARKUS-DATA-TRANSACTIONS-TESTING',
                component: ComponentCreator('/shopverse/quarkus/QUARKUS-DATA-TRANSACTIONS-TESTING', '953'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/quarkus/QUARKUS-FUNDAMENTALS',
                component: ComponentCreator('/shopverse/quarkus/QUARKUS-FUNDAMENTALS', 'd60'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/quarkus/QUARKUS-INTEGRATION-SECURITY-OBSERVABILITY',
                component: ComponentCreator('/shopverse/quarkus/QUARKUS-INTEGRATION-SECURITY-OBSERVABILITY', '319'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/quarkus/QUARKUS-NATIVE-KUBERNETES-PRODUCTION',
                component: ComponentCreator('/shopverse/quarkus/QUARKUS-NATIVE-KUBERNETES-PRODUCTION', '9c3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/quarkus/QUARKUS-OPENAPI-CLIENT-ARTIFACTS',
                component: ComponentCreator('/shopverse/quarkus/QUARKUS-OPENAPI-CLIENT-ARTIFACTS', 'ea4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/quarkus/QUARKUS-OPENAPI-FUNDAMENTALS',
                component: ComponentCreator('/shopverse/quarkus/QUARKUS-OPENAPI-FUNDAMENTALS', 'b79'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/quarkus/QUARKUS-OPENAPI-PROVIDER',
                component: ComponentCreator('/shopverse/quarkus/QUARKUS-OPENAPI-PROVIDER', '3ce'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/quarkus/QUARKUS-REST-CDI-CONFIG',
                component: ComponentCreator('/shopverse/quarkus/QUARKUS-REST-CDI-CONFIG', '044'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reference/CODE-CROSS-CHECK',
                component: ComponentCreator('/shopverse/reference/CODE-CROSS-CHECK', 'ff4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reference/DISTRIBUTED-SYSTEMS-INTERVIEW',
                component: ComponentCreator('/shopverse/reference/DISTRIBUTED-SYSTEMS-INTERVIEW', '4e6'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reference/DOCUMENTATION-COMPONENTS',
                component: ComponentCreator('/shopverse/reference/DOCUMENTATION-COMPONENTS', '99f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reference/DOCUMENTATION-GUIDE',
                component: ComponentCreator('/shopverse/reference/DOCUMENTATION-GUIDE', '844'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reference/DOCUMENTATION-MAINTENANCE-MAP',
                component: ComponentCreator('/shopverse/reference/DOCUMENTATION-MAINTENANCE-MAP', '088'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reference/DOCUMENTATION-QUALITY-AUDIT',
                component: ComponentCreator('/shopverse/reference/DOCUMENTATION-QUALITY-AUDIT', '044'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reference/DOCUMENTATION-STRUCTURE',
                component: ComponentCreator('/shopverse/reference/DOCUMENTATION-STRUCTURE', '3af'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reference/FEATURES-AND-DEMOS',
                component: ComponentCreator('/shopverse/reference/FEATURES-AND-DEMOS', '940'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reference/FEATURES-RELIABILITY-OBSERVABILITY',
                component: ComponentCreator('/shopverse/reference/FEATURES-RELIABILITY-OBSERVABILITY', '061'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reference/FEATURES-SECURITY-CHECKOUT',
                component: ComponentCreator('/shopverse/reference/FEATURES-SECURITY-CHECKOUT', 'a0d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reference/FINAL-DOCUMENTATION-AUDIT',
                component: ComponentCreator('/shopverse/reference/FINAL-DOCUMENTATION-AUDIT', '535'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reference/GLOSSARY',
                component: ComponentCreator('/shopverse/reference/GLOSSARY', '04e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reference/LEARNING-PATH',
                component: ComponentCreator('/shopverse/reference/LEARNING-PATH', '140'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reference/OVERVIEW-COVERAGE-AUDIT',
                component: ComponentCreator('/shopverse/reference/OVERVIEW-COVERAGE-AUDIT', '1d8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reference/VISUAL-REFERENCE-STANDARD',
                component: ComponentCreator('/shopverse/reference/VISUAL-REFERENCE-STANDARD', '4c7'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/DISTRIBUTED-FAILURE-CONSENSUS',
                component: ComponentCreator('/shopverse/reliability/DISTRIBUTED-FAILURE-CONSENSUS', '256'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/DISTRIBUTED-RATE-LIMITING',
                component: ComponentCreator('/shopverse/reliability/DISTRIBUTED-RATE-LIMITING', '681'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/DISTRIBUTED-SCHEDULER-WORK-CLAIMS',
                component: ComponentCreator('/shopverse/reliability/DISTRIBUTED-SCHEDULER-WORK-CLAIMS', '7a7'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/DISTRIBUTED-TRANSACTIONS-LOCKS',
                component: ComponentCreator('/shopverse/reliability/DISTRIBUTED-TRANSACTIONS-LOCKS', '737'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/HIGH-AVAILABILITY-SPOF',
                component: ComponentCreator('/shopverse/reliability/HIGH-AVAILABILITY-SPOF', '399'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/IDEMPOTENCY-GENERIC',
                component: ComponentCreator('/shopverse/reliability/IDEMPOTENCY-GENERIC', 'edd'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/INBOX-PATTERN',
                component: ComponentCreator('/shopverse/reliability/INBOX-PATTERN', '925'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/locking/DATABASE-LOCKING-AND-CLAIMS',
                component: ComponentCreator('/shopverse/reliability/locking/DATABASE-LOCKING-AND-CLAIMS', 'ee7'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/locking/DISTRIBUTED-LOCKS-AND-FENCING',
                component: ComponentCreator('/shopverse/reliability/locking/DISTRIBUTED-LOCKS-AND-FENCING', '15c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/locking/LOCKING-AND-WORK-OWNERSHIP',
                component: ComponentCreator('/shopverse/reliability/locking/LOCKING-AND-WORK-OWNERSHIP', 'b4b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/locking/PARTITION-AND-QUEUE-OWNERSHIP',
                component: ComponentCreator('/shopverse/reliability/locking/PARTITION-AND-QUEUE-OWNERSHIP', '8c5'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/locking/SCHEDULER-LOCKING-SHEDLOCK',
                component: ComponentCreator('/shopverse/reliability/locking/SCHEDULER-LOCKING-SHEDLOCK', 'e04'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/locking/SPRING-DISTRIBUTED-LOCKING-OPTIONS',
                component: ComponentCreator('/shopverse/reliability/locking/SPRING-DISTRIBUTED-LOCKING-OPTIONS', '7e3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/OUTBOX-DELIVERY-OPERATIONS',
                component: ComponentCreator('/shopverse/reliability/OUTBOX-DELIVERY-OPERATIONS', 'e14'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/OUTBOX-IMPLEMENTATION-GUIDE',
                component: ComponentCreator('/shopverse/reliability/OUTBOX-IMPLEMENTATION-GUIDE', '7a8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/OUTBOX-PATTERN',
                component: ComponentCreator('/shopverse/reliability/OUTBOX-PATTERN', 'ac4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/OUTBOX-PRODUCTION-FAILURE-MODES',
                component: ComponentCreator('/shopverse/reliability/OUTBOX-PRODUCTION-FAILURE-MODES', '4e8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/PROBLEMS-AND-SOLUTIONS',
                component: ComponentCreator('/shopverse/reliability/PROBLEMS-AND-SOLUTIONS', '496'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/problems/',
                component: ComponentCreator('/shopverse/reliability/problems/', '81c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/problems/CURRENT-PROBLEMS-AND-SOLUTIONS',
                component: ComponentCreator('/shopverse/reliability/problems/CURRENT-PROBLEMS-AND-SOLUTIONS', '25f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/problems/DEPENDENCY-VERIFICATION-PROBLEMS',
                component: ComponentCreator('/shopverse/reliability/problems/DEPENDENCY-VERIFICATION-PROBLEMS', '970'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/problems/DOCKER-RUNTIME-IMAGE-PROBLEMS',
                component: ComponentCreator('/shopverse/reliability/problems/DOCKER-RUNTIME-IMAGE-PROBLEMS', '851'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/problems/OPTIMIZATION-SOLUTIONS',
                component: ComponentCreator('/shopverse/reliability/problems/OPTIMIZATION-SOLUTIONS', 'b22'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/problems/optimization/DOCKER-BUILD-CONTEXT-PLATFORM',
                component: ComponentCreator('/shopverse/reliability/problems/optimization/DOCKER-BUILD-CONTEXT-PLATFORM', 'c91'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/problems/optimization/DOCKER-COMPOSE-PROFILES',
                component: ComponentCreator('/shopverse/reliability/problems/optimization/DOCKER-COMPOSE-PROFILES', '59b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/problems/optimization/DOCKER-IMAGE-SIZE-OPTIMIZATION',
                component: ComponentCreator('/shopverse/reliability/problems/optimization/DOCKER-IMAGE-SIZE-OPTIMIZATION', '471'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/problems/optimization/GRADLE-BUILD-PERFORMANCE',
                component: ComponentCreator('/shopverse/reliability/problems/optimization/GRADLE-BUILD-PERFORMANCE', '291'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/problems/optimization/GRADLE-DEPENDENCY-OPTIMIZATION',
                component: ComponentCreator('/shopverse/reliability/problems/optimization/GRADLE-DEPENDENCY-OPTIMIZATION', '975'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/problems/optimization/JAR-SIZE-OPTIMIZATION',
                component: ComponentCreator('/shopverse/reliability/problems/optimization/JAR-SIZE-OPTIMIZATION', '02e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/problems/optimization/OPTIMIZATION-BASELINE',
                component: ComponentCreator('/shopverse/reliability/problems/optimization/OPTIMIZATION-BASELINE', '924'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/problems/optimization/ORDER-SERVICE-TEST-OPTIMIZATION',
                component: ComponentCreator('/shopverse/reliability/problems/optimization/ORDER-SERVICE-TEST-OPTIMIZATION', 'c26'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/problems/optimization/RUNTIME-OPTIMIZATION',
                component: ComponentCreator('/shopverse/reliability/problems/optimization/RUNTIME-OPTIMIZATION', '9e8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/problems/optimization/VERIFICATION-AND-DOCUMENTATION',
                component: ComponentCreator('/shopverse/reliability/problems/optimization/VERIFICATION-AND-DOCUMENTATION', '99b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/problems/OUTBOX-RUNTIME-PROBLEMS',
                component: ComponentCreator('/shopverse/reliability/problems/OUTBOX-RUNTIME-PROBLEMS', 'da0'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/problems/PROBLEMS-SUMMARY-LINKS',
                component: ComponentCreator('/shopverse/reliability/problems/PROBLEMS-SUMMARY-LINKS', 'aa6'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/problems/RUNTIME-RELIABILITY-PROBLEMS',
                component: ComponentCreator('/shopverse/reliability/problems/RUNTIME-RELIABILITY-PROBLEMS', 'c96'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/problems/runtime/ATOMIC-CONDITIONAL-RESERVATION-CLAIM',
                component: ComponentCreator('/shopverse/reliability/problems/runtime/ATOMIC-CONDITIONAL-RESERVATION-CLAIM', 'ff6'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/problems/runtime/ATOMIC-RESERVATION-CLAIM',
                component: ComponentCreator('/shopverse/reliability/problems/runtime/ATOMIC-RESERVATION-CLAIM', 'a70'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/problems/runtime/CATALOG-LOOKUP-CHECKOUT',
                component: ComponentCreator('/shopverse/reliability/problems/runtime/CATALOG-LOOKUP-CHECKOUT', '0dd'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/problems/runtime/DISTRIBUTED-CHECKOUT',
                component: ComponentCreator('/shopverse/reliability/problems/runtime/DISTRIBUTED-CHECKOUT', 'f39'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/problems/runtime/IDEMPOTENT-CHECKOUT',
                component: ComponentCreator('/shopverse/reliability/problems/runtime/IDEMPOTENT-CHECKOUT', 'e56'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/problems/runtime/INDEX-AND-LOCKING',
                component: ComponentCreator('/shopverse/reliability/problems/runtime/INDEX-AND-LOCKING', '450'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/problems/runtime/KAFKA-IDEMPOTENCY',
                component: ComponentCreator('/shopverse/reliability/problems/runtime/KAFKA-IDEMPOTENCY', '9e6'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/problems/runtime/LATE-PAYMENT-AFTER-EXPIRY',
                component: ComponentCreator('/shopverse/reliability/problems/runtime/LATE-PAYMENT-AFTER-EXPIRY', '56f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/problems/runtime/MULTI-REPLICA-RESERVATION-EXPIRY',
                component: ComponentCreator('/shopverse/reliability/problems/runtime/MULTI-REPLICA-RESERVATION-EXPIRY', '237'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/problems/runtime/PAYMENT-TIMEOUT-RECONCILIATION',
                component: ComponentCreator('/shopverse/reliability/problems/runtime/PAYMENT-TIMEOUT-RECONCILIATION', 'f59'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/problems/runtime/QUERYABLE-ORDER-TIMELINE',
                component: ComponentCreator('/shopverse/reliability/problems/runtime/QUERYABLE-ORDER-TIMELINE', '511'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/problems/runtime/RESERVATION-CONTENTION-STATE-MODEL',
                component: ComponentCreator('/shopverse/reliability/problems/runtime/RESERVATION-CONTENTION-STATE-MODEL', '49e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/problems/runtime/RESERVATION-TRANSACTION-IMPLEMENTATION',
                component: ComponentCreator('/shopverse/reliability/problems/runtime/RESERVATION-TRANSACTION-IMPLEMENTATION', '3e5'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/problems/runtime/RESOURCE-OWNERSHIP-AUTHORIZATION',
                component: ComponentCreator('/shopverse/reliability/problems/runtime/RESOURCE-OWNERSHIP-AUTHORIZATION', 'bd7'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/problems/runtime/RESOURCE-OWNERSHIP-SPEL-RUNTIME',
                component: ComponentCreator('/shopverse/reliability/problems/runtime/RESOURCE-OWNERSHIP-SPEL-RUNTIME', '515'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/problems/runtime/RESOURCE-OWNERSHIP-TESTS-OPERATIONS',
                component: ComponentCreator('/shopverse/reliability/problems/runtime/RESOURCE-OWNERSHIP-TESTS-OPERATIONS', '5fc'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/problems/runtime/TWO-SCHEDULER-RESERVATION-EXAMPLE',
                component: ComponentCreator('/shopverse/reliability/problems/runtime/TWO-SCHEDULER-RESERVATION-EXAMPLE', 'f0c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/RATE-LIMITING-IMPLEMENTATION-GUIDE',
                component: ComponentCreator('/shopverse/reliability/RATE-LIMITING-IMPLEMENTATION-GUIDE', 'b35'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/RELIABILITY-OVERVIEW',
                component: ComponentCreator('/shopverse/reliability/RELIABILITY-OVERVIEW', '520'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/RELIABILITY-REVISION-SHEET',
                component: ComponentCreator('/shopverse/reliability/RELIABILITY-REVISION-SHEET', '01b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/RESILIENCE4J',
                component: ComponentCreator('/shopverse/reliability/RESILIENCE4J', '7f7'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/RESILIENCE4J-COMPOSITION-OPERATIONS',
                component: ComponentCreator('/shopverse/reliability/RESILIENCE4J-COMPOSITION-OPERATIONS', '46d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/RESILIENCE4J-GENERIC',
                component: ComponentCreator('/shopverse/reliability/RESILIENCE4J-GENERIC', 'f02'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/RESILIENCE4J-RATE-LIMITER-BULKHEAD',
                component: ComponentCreator('/shopverse/reliability/RESILIENCE4J-RATE-LIMITER-BULKHEAD', '092'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/RESILIENCE4J-RETRY-CIRCUIT-TIMEOUT',
                component: ComponentCreator('/shopverse/reliability/RESILIENCE4J-RETRY-CIRCUIT-TIMEOUT', 'ee0'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/SAGA-CONSISTENCY-COMPENSATION',
                component: ComponentCreator('/shopverse/reliability/SAGA-CONSISTENCY-COMPENSATION', '0be'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/SAGA-GENERIC',
                component: ComponentCreator('/shopverse/reliability/SAGA-GENERIC', '446'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/SAGA-IMPLEMENTATION-GUIDE',
                component: ComponentCreator('/shopverse/reliability/SAGA-IMPLEMENTATION-GUIDE', '025'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/SAGA-LIVENESS-TIMEOUT-RECOVERY',
                component: ComponentCreator('/shopverse/reliability/SAGA-LIVENESS-TIMEOUT-RECOVERY', '3ca'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/SAGA-OUTBOX',
                component: ComponentCreator('/shopverse/reliability/SAGA-OUTBOX', '33d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/SHOPVERSE-SAGA-CODE-FLOW',
                component: ComponentCreator('/shopverse/reliability/SHOPVERSE-SAGA-CODE-FLOW', 'df1'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/reliability/TRANSACTIONS',
                component: ComponentCreator('/shopverse/reliability/TRANSACTIONS', 'b9f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/',
                component: ComponentCreator('/shopverse/security/', '340'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/ACCESS-REFRESH-API-KEY-IMPLEMENTATION-GUIDE',
                component: ComponentCreator('/shopverse/security/ACCESS-REFRESH-API-KEY-IMPLEMENTATION-GUIDE', 'eab'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/ACCESS-REFRESH-TOKEN-DESIGN',
                component: ComponentCreator('/shopverse/security/ACCESS-REFRESH-TOKEN-DESIGN', 'dce'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/API-KEY-AUTHORIZATION-OPERATIONS',
                component: ComponentCreator('/shopverse/security/API-KEY-AUTHORIZATION-OPERATIONS', 'a13'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/JWT-LOGIN-VALIDATION-AUTHORITIES',
                component: ComponentCreator('/shopverse/security/JWT-LOGIN-VALIDATION-AUTHORITIES', 'e03'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/JWT-OAUTH2-SPRING-SECURITY',
                component: ComponentCreator('/shopverse/security/JWT-OAUTH2-SPRING-SECURITY', '725'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/jwt/JWKS-ASYMMETRIC-JWT',
                component: ComponentCreator('/shopverse/security/jwt/JWKS-ASYMMETRIC-JWT', 'b79'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/jwt/JWT-BEST-PRACTICES',
                component: ComponentCreator('/shopverse/security/jwt/JWT-BEST-PRACTICES', '7fb'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/jwt/JWT-CLAIMS-ROLES-SCOPES',
                component: ComponentCreator('/shopverse/security/jwt/JWT-CLAIMS-ROLES-SCOPES', '304'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/jwt/JWT-FUNDAMENTALS',
                component: ComponentCreator('/shopverse/security/jwt/JWT-FUNDAMENTALS', 'e3b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/oauth/GOOGLE-AUTHENTICATION-SPRING',
                component: ComponentCreator('/shopverse/security/oauth/GOOGLE-AUTHENTICATION-SPRING', '038'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/oauth/GOOGLE-OAUTH-BFF-TOKEN-PRODUCTION',
                component: ComponentCreator('/shopverse/security/oauth/GOOGLE-OAUTH-BFF-TOKEN-PRODUCTION', '2e6'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/oauth/GOOGLE-OAUTH-CLIENT-SESSION',
                component: ComponentCreator('/shopverse/security/oauth/GOOGLE-OAUTH-CLIENT-SESSION', '2ec'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/oauth/OAUTH2-FUNDAMENTALS',
                component: ComponentCreator('/shopverse/security/oauth/OAUTH2-FUNDAMENTALS', 'd93'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/oauth/OAUTH2-GRANT-TYPES',
                component: ComponentCreator('/shopverse/security/oauth/OAUTH2-GRANT-TYPES', '3c8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/oauth/OIDC-FUNDAMENTALS',
                component: ComponentCreator('/shopverse/security/oauth/OIDC-FUNDAMENTALS', '2a8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/oauth/SSO-AND-OPENID-CONNECT',
                component: ComponentCreator('/shopverse/security/oauth/SSO-AND-OPENID-CONNECT', '615'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/oauth/TOKEN-LIFECYCLE',
                component: ComponentCreator('/shopverse/security/oauth/TOKEN-LIFECYCLE', '8f2'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/platform/SECURITY-ARCHITECT-PATH',
                component: ComponentCreator('/shopverse/security/platform/SECURITY-ARCHITECT-PATH', 'a35'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/platform/SECURITY-INCIDENT-RESPONSE',
                component: ComponentCreator('/shopverse/security/platform/SECURITY-INCIDENT-RESPONSE', 'de6'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/platform/SECURITY-INTERVIEW-WORKBOOK',
                component: ComponentCreator('/shopverse/security/platform/SECURITY-INTERVIEW-WORKBOOK', '447'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/platform/SERVICE-IDENTITY-ZERO-TRUST',
                component: ComponentCreator('/shopverse/security/platform/SERVICE-IDENTITY-ZERO-TRUST', '9f3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/principles/API-SECURITY-PRINCIPLES',
                component: ComponentCreator('/shopverse/security/principles/API-SECURITY-PRINCIPLES', 'c4b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/principles/MICROSERVICES-SECURITY-PRINCIPLES',
                component: ComponentCreator('/shopverse/security/principles/MICROSERVICES-SECURITY-PRINCIPLES', '74b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/principles/SECRETS-AND-CREDENTIALS',
                component: ComponentCreator('/shopverse/security/principles/SECRETS-AND-CREDENTIALS', 'fa1'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/principles/SECURITY-PRINCIPLES',
                component: ComponentCreator('/shopverse/security/principles/SECURITY-PRINCIPLES', '7ed'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/principles/SERVICE-TO-SERVICE-SECURITY',
                component: ComponentCreator('/shopverse/security/principles/SERVICE-TO-SERVICE-SECURITY', '2a6'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/secrets/SECRETS-IMPLEMENTATION-OPERATIONS-INTERVIEW',
                component: ComponentCreator('/shopverse/security/secrets/SECRETS-IMPLEMENTATION-OPERATIONS-INTERVIEW', 'b77'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/SECURITY-IMPLEMENTATION-GUIDE',
                component: ComponentCreator('/shopverse/security/SECURITY-IMPLEMENTATION-GUIDE', '1b4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/SECURITY-MCQ-PRACTICE',
                component: ComponentCreator('/shopverse/security/SECURITY-MCQ-PRACTICE', '4fe'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/SECURITY-REVISION-SHEET',
                component: ComponentCreator('/shopverse/security/SECURITY-REVISION-SHEET', 'fbd'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/SPRING-SECURITY-FILTERS-OWNERSHIP-ROADMAP',
                component: ComponentCreator('/shopverse/security/SPRING-SECURITY-FILTERS-OWNERSHIP-ROADMAP', '5f9'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/SPRING-SECURITY-GENERIC',
                component: ComponentCreator('/shopverse/security/SPRING-SECURITY-GENERIC', '47f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/spring-security/AUTHENTICATION-BASICS',
                component: ComponentCreator('/shopverse/security/spring-security/AUTHENTICATION-BASICS', 'e5e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/spring-security/AUTHENTICATION-INTERNALS',
                component: ComponentCreator('/shopverse/security/spring-security/AUTHENTICATION-INTERNALS', 'cd6'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/spring-security/AUTHORIZATION-METHOD-SECURITY',
                component: ComponentCreator('/shopverse/security/spring-security/AUTHORIZATION-METHOD-SECURITY', 'f97'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/spring-security/BOOT-AUTOCONFIGURATION-LIFECYCLE',
                component: ComponentCreator('/shopverse/security/spring-security/BOOT-AUTOCONFIGURATION-LIFECYCLE', '5a4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/spring-security/CSRF-CORS-BROWSER-SECURITY',
                component: ComponentCreator('/shopverse/security/spring-security/CSRF-CORS-BROWSER-SECURITY', 'c45'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/spring-security/DISTRIBUTED-AUTHORIZATION-PERMISSION-SCALE',
                component: ComponentCreator('/shopverse/security/spring-security/DISTRIBUTED-AUTHORIZATION-PERMISSION-SCALE', 'a13'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/spring-security/JWT-JWKS-RESOURCE-SERVER',
                component: ComponentCreator('/shopverse/security/spring-security/JWT-JWKS-RESOURCE-SERVER', '188'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/spring-security/OAUTH2-KEYCLOAK-SPRING-IMPLEMENTATION',
                component: ComponentCreator('/shopverse/security/spring-security/OAUTH2-KEYCLOAK-SPRING-IMPLEMENTATION', '62e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/spring-security/OAUTH2-OIDC-FLOWS',
                component: ComponentCreator('/shopverse/security/spring-security/OAUTH2-OIDC-FLOWS', '9df'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/spring-security/PASSWORD-AUTHENTICATION-RUNTIME',
                component: ComponentCreator('/shopverse/security/spring-security/PASSWORD-AUTHENTICATION-RUNTIME', '084'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/spring-security/PRODUCTION-PRACTICES',
                component: ComponentCreator('/shopverse/security/spring-security/PRODUCTION-PRACTICES', 'bd8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/spring-security/SECURITY-CONTEXT-LIFECYCLE',
                component: ComponentCreator('/shopverse/security/spring-security/SECURITY-CONTEXT-LIFECYCLE', '8c9'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/spring-security/SERVLET-FILTER-CHAIN',
                component: ComponentCreator('/shopverse/security/spring-security/SERVLET-FILTER-CHAIN', '56b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/spring-security/THREAT-MODELING-INTERVIEW-LAB',
                component: ComponentCreator('/shopverse/security/spring-security/THREAT-MODELING-INTERVIEW-LAB', '0ea'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/SUPPLY-CHAIN-PRIVACY',
                component: ComponentCreator('/shopverse/security/SUPPLY-CHAIN-PRIVACY', '367'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/security/VAULT-KUBERNETES-SECRETS-PATH',
                component: ComponentCreator('/shopverse/security/VAULT-KUBERNETES-SECRETS-PATH', '49a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/services/',
                component: ComponentCreator('/shopverse/services/', '271'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/services/readmes/API-GATEWAY-README',
                component: ComponentCreator('/shopverse/services/readmes/API-GATEWAY-README', '357'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/services/readmes/AUTH-SERVICE-README',
                component: ComponentCreator('/shopverse/services/readmes/AUTH-SERVICE-README', 'e67'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/services/readmes/CLOUD-CONFIGS-README',
                component: ComponentCreator('/shopverse/services/readmes/CLOUD-CONFIGS-README', '778'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/services/readmes/CONFIG-SERVER-README',
                component: ComponentCreator('/shopverse/services/readmes/CONFIG-SERVER-README', 'c31'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/services/readmes/DISCOVERY-SERVER-README',
                component: ComponentCreator('/shopverse/services/readmes/DISCOVERY-SERVER-README', 'f72'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/services/readmes/INVENTORY-SERVICE-README',
                component: ComponentCreator('/shopverse/services/readmes/INVENTORY-SERVICE-README', '1b1'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/services/readmes/ORDER-SERVICE-README',
                component: ComponentCreator('/shopverse/services/readmes/ORDER-SERVICE-README', 'b26'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/services/readmes/PAYMENT-SERVICE-README',
                component: ComponentCreator('/shopverse/services/readmes/PAYMENT-SERVICE-README', 'a35'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/services/readmes/SHOPVERSE-PLATFORM-README',
                component: ComponentCreator('/shopverse/services/readmes/SHOPVERSE-PLATFORM-README', '52b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/services/readmes/SHOPVERSE-WEB-README',
                component: ComponentCreator('/shopverse/services/readmes/SHOPVERSE-WEB-README', '31c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/services/readmes/USER-SERVICE-README',
                component: ComponentCreator('/shopverse/services/readmes/USER-SERVICE-README', 'd19'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/services/SERVICE-CATALOG',
                component: ComponentCreator('/shopverse/services/SERVICE-CATALOG', 'a18'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/services/SERVICE-README-AI-CAPABILITY-GAP-MATRIX',
                component: ComponentCreator('/shopverse/services/SERVICE-README-AI-CAPABILITY-GAP-MATRIX', '26c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/services/SERVICE-README-INDEX',
                component: ComponentCreator('/shopverse/services/SERVICE-README-INDEX', '7ef'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/',
                component: ComponentCreator('/shopverse/spring/', '3dc'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/annotations/SPRING-ANNOTATION-INTERNALS-COMPOSITION',
                component: ComponentCreator('/shopverse/spring/annotations/SPRING-ANNOTATION-INTERNALS-COMPOSITION', 'f4c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/annotations/SPRING-CONTAINER-CONDITIONAL-ANNOTATIONS',
                component: ComponentCreator('/shopverse/spring/annotations/SPRING-CONTAINER-CONDITIONAL-ANNOTATIONS', '37b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/annotations/SPRING-DATA-TRANSACTION-ASYNC-ANNOTATIONS',
                component: ComponentCreator('/shopverse/spring/annotations/SPRING-DATA-TRANSACTION-ASYNC-ANNOTATIONS', 'daf'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/annotations/SPRING-SECURITY-MESSAGING-TEST-ANNOTATIONS',
                component: ComponentCreator('/shopverse/spring/annotations/SPRING-SECURITY-MESSAGING-TEST-ANNOTATIONS', '352'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/annotations/SPRING-WEB-VALIDATION-ANNOTATIONS',
                component: ComponentCreator('/shopverse/spring/annotations/SPRING-WEB-VALIDATION-ANNOTATIONS', '508'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/architect-labs/',
                component: ComponentCreator('/shopverse/spring/architect-labs/', 'b25'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/architect-labs/CAPACITY-THREAD-POOL-LAB',
                component: ComponentCreator('/shopverse/spring/architect-labs/CAPACITY-THREAD-POOL-LAB', 'dda'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/architect-labs/DATABASE-CACHE-CONSISTENCY',
                component: ComponentCreator('/shopverse/spring/architect-labs/DATABASE-CACHE-CONSISTENCY', 'c8a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/architect-labs/KAFKA-REPLAY-IDEMPOTENCY',
                component: ComponentCreator('/shopverse/spring/architect-labs/KAFKA-REPLAY-IDEMPOTENCY', '77b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/architect-labs/POSTGRES-JPA-PERFORMANCE-LAB',
                component: ComponentCreator('/shopverse/spring/architect-labs/POSTGRES-JPA-PERFORMANCE-LAB', 'e68'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/architect-labs/PRODUCTION-INCIDENT-DIAGNOSIS',
                component: ComponentCreator('/shopverse/spring/architect-labs/PRODUCTION-INCIDENT-DIAGNOSIS', 'd47'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/architect-labs/SPRING-DATA-REPOSITORY-INTERNALS-LAB',
                component: ComponentCreator('/shopverse/spring/architect-labs/SPRING-DATA-REPOSITORY-INTERNALS-LAB', '4be'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/architect-labs/TRANSACTION-BOUNDARY-FAILURES',
                component: ComponentCreator('/shopverse/spring/architect-labs/TRANSACTION-BOUNDARY-FAILURES', '928'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/architect-labs/TRANSACTIONAL-OUTBOX-INBOX-CDC-LAB',
                component: ComponentCreator('/shopverse/spring/architect-labs/TRANSACTIONAL-OUTBOX-INBOX-CDC-LAB', '5e5'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/boot/SPRING-BOOT-AUTOCONFIGURATION-STARTERS',
                component: ComponentCreator('/shopverse/spring/boot/SPRING-BOOT-AUTOCONFIGURATION-STARTERS', '438'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/boot/SPRING-BOOT-CONFIGURATION-ENVIRONMENTS',
                component: ComponentCreator('/shopverse/spring/boot/SPRING-BOOT-CONFIGURATION-ENVIRONMENTS', '211'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/boot/SPRING-BOOT-PACKAGING-AOT-CONTAINERS',
                component: ComponentCreator('/shopverse/spring/boot/SPRING-BOOT-PACKAGING-AOT-CONTAINERS', '250'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/boot/SPRING-BOOT-PRODUCTION-INCIDENT-PLAYBOOK',
                component: ComponentCreator('/shopverse/spring/boot/SPRING-BOOT-PRODUCTION-INCIDENT-PLAYBOOK', '94f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/boot/SPRING-BOOT-PRODUCTION-INTERVIEW-REVISION',
                component: ComponentCreator('/shopverse/spring/boot/SPRING-BOOT-PRODUCTION-INTERVIEW-REVISION', '452'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/boot/SPRING-BOOT-PRODUCTION-MASTERY',
                component: ComponentCreator('/shopverse/spring/boot/SPRING-BOOT-PRODUCTION-MASTERY', 'b11'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/boot/SPRING-BOOT-RUNTIME-PERFORMANCE',
                component: ComponentCreator('/shopverse/spring/boot/SPRING-BOOT-RUNTIME-PERFORMANCE', 'a85'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/cassandra/SPRING-CASSANDRA-ADVANCED-DRIVER',
                component: ComponentCreator('/shopverse/spring/cassandra/SPRING-CASSANDRA-ADVANCED-DRIVER', '9ab'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/cassandra/SPRING-CASSANDRA-MAPPING-REPOSITORIES',
                component: ComponentCreator('/shopverse/spring/cassandra/SPRING-CASSANDRA-MAPPING-REPOSITORIES', '595'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/cassandra/SPRING-CASSANDRA-PRODUCTION-REACTIVE-TESTING',
                component: ComponentCreator('/shopverse/spring/cassandra/SPRING-CASSANDRA-PRODUCTION-REACTIVE-TESTING', '89d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/cloud/SPRING-CLOUD-CONFIG',
                component: ComponentCreator('/shopverse/spring/cloud/SPRING-CLOUD-CONFIG', '35d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/cloud/SPRING-CLOUD-DISCOVERY-CLIENTS',
                component: ComponentCreator('/shopverse/spring/cloud/SPRING-CLOUD-DISCOVERY-CLIENTS', 'd1c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/cloud/SPRING-CLOUD-ECOSYSTEM-GOVERNANCE',
                component: ComponentCreator('/shopverse/spring/cloud/SPRING-CLOUD-ECOSYSTEM-GOVERNANCE', '09b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/cloud/SPRING-CLOUD-INTERVIEW-REVISION',
                component: ComponentCreator('/shopverse/spring/cloud/SPRING-CLOUD-INTERVIEW-REVISION', 'ea6'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/cloud/SPRING-CLOUD-KUBERNETES-CONTRACT',
                component: ComponentCreator('/shopverse/spring/cloud/SPRING-CLOUD-KUBERNETES-CONTRACT', '29d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/cloud/SPRING-CLOUD-MCQ-PRACTICE',
                component: ComponentCreator('/shopverse/spring/cloud/SPRING-CLOUD-MCQ-PRACTICE', '8e8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/cloud/SPRING-CLOUD-OPERATIONS',
                component: ComponentCreator('/shopverse/spring/cloud/SPRING-CLOUD-OPERATIONS', 'c20'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/cloud/SPRING-CLOUD-PRODUCTION-SCENARIOS',
                component: ComponentCreator('/shopverse/spring/cloud/SPRING-CLOUD-PRODUCTION-SCENARIOS', '523'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/cloud/SPRING-CLOUD-RESILIENCE-GATEWAY',
                component: ComponentCreator('/shopverse/spring/cloud/SPRING-CLOUD-RESILIENCE-GATEWAY', 'fa3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/cloud/SPRING-CLOUD-RUNTIME-INTERNALS',
                component: ComponentCreator('/shopverse/spring/cloud/SPRING-CLOUD-RUNTIME-INTERNALS', '162'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/cloud/SPRING-CLOUD-SECURITY-IDENTITY',
                component: ComponentCreator('/shopverse/spring/cloud/SPRING-CLOUD-SECURITY-IDENTITY', '75e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/cloud/SPRING-CLOUD-TESTING-DEPLOYMENT',
                component: ComponentCreator('/shopverse/spring/cloud/SPRING-CLOUD-TESTING-DEPLOYMENT', '62c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/data/SPRING-DATA-COMMONS-INTERNALS',
                component: ComponentCreator('/shopverse/spring/data/SPRING-DATA-COMMONS-INTERNALS', 'f1c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/data/SPRING-DATA-ELASTICSEARCH',
                component: ComponentCreator('/shopverse/spring/data/SPRING-DATA-ELASTICSEARCH', 'd8d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/data/SPRING-DATA-INTERVIEW-REVISION',
                component: ComponentCreator('/shopverse/spring/data/SPRING-DATA-INTERVIEW-REVISION', '90a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/data/SPRING-DATA-JDBC',
                component: ComponentCreator('/shopverse/spring/data/SPRING-DATA-JDBC', '3b7'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/data/SPRING-DATA-MONGODB',
                component: ComponentCreator('/shopverse/spring/data/SPRING-DATA-MONGODB', '642'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/data/SPRING-DATA-MULTISTORE-CONSISTENCY',
                component: ComponentCreator('/shopverse/spring/data/SPRING-DATA-MULTISTORE-CONSISTENCY', '52c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/data/SPRING-DATA-OPTIONAL-MODULES',
                component: ComponentCreator('/shopverse/spring/data/SPRING-DATA-OPTIONAL-MODULES', '162'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/data/SPRING-DATA-R2DBC',
                component: ComponentCreator('/shopverse/spring/data/SPRING-DATA-R2DBC', 'da1'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/data/SPRING-DATA-REDIS',
                component: ComponentCreator('/shopverse/spring/data/SPRING-DATA-REDIS', '001'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/data/SPRING-DATA-REPOSITORIES-PAGING-AUDITING',
                component: ComponentCreator('/shopverse/spring/data/SPRING-DATA-REPOSITORIES-PAGING-AUDITING', '713'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/data/SPRING-DATA-TESTING-OPERATIONS',
                component: ComponentCreator('/shopverse/spring/data/SPRING-DATA-TESTING-OPERATIONS', '44e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/decisions/',
                component: ComponentCreator('/shopverse/spring/decisions/', '179'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/decisions/CACHE-ASIDE-VS-WRITE-THROUGH',
                component: ComponentCreator('/shopverse/spring/decisions/CACHE-ASIDE-VS-WRITE-THROUGH', '14d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/decisions/FEIGN-VS-HTTP-SERVICE-CLIENTS',
                component: ComponentCreator('/shopverse/spring/decisions/FEIGN-VS-HTTP-SERVICE-CLIENTS', '160'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/decisions/JPA-VS-JDBC',
                component: ComponentCreator('/shopverse/spring/decisions/JPA-VS-JDBC', 'f96'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/decisions/KAFKA-VS-SYNCHRONOUS',
                component: ComponentCreator('/shopverse/spring/decisions/KAFKA-VS-SYNCHRONOUS', '3b9'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/decisions/MVC-VS-WEBFLUX',
                component: ComponentCreator('/shopverse/spring/decisions/MVC-VS-WEBFLUX', '5f0'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/internals-production/AOP-TRANSACTION-INTERNALS',
                component: ComponentCreator('/shopverse/spring/internals-production/AOP-TRANSACTION-INTERNALS', '576'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/internals-production/CONTAINER-BEANFACTORY-AUTOCONFIG',
                component: ComponentCreator('/shopverse/spring/internals-production/CONTAINER-BEANFACTORY-AUTOCONFIG', '13f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/internals-production/HIBERNATE-JDBC-INTERNALS',
                component: ComponentCreator('/shopverse/spring/internals-production/HIBERNATE-JDBC-INTERNALS', '127'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/internals-production/PRODUCTION-LIFECYCLE',
                component: ComponentCreator('/shopverse/spring/internals-production/PRODUCTION-LIFECYCLE', '814'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/internals-production/WEB-HTTP-RUNTIME',
                component: ComponentCreator('/shopverse/spring/internals-production/WEB-HTTP-RUNTIME', '14b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/interview/SPRING-BOOT-CONTAINER-INTERVIEW',
                component: ComponentCreator('/shopverse/spring/interview/SPRING-BOOT-CONTAINER-INTERVIEW', '784'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/interview/SPRING-PRODUCTION-RUNTIME-INTERVIEW',
                component: ComponentCreator('/shopverse/spring/interview/SPRING-PRODUCTION-RUNTIME-INTERVIEW', '475'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/interview/SPRING-WEB-DATA-INTERVIEW',
                component: ComponentCreator('/shopverse/spring/interview/SPRING-WEB-DATA-INTERVIEW', '057'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/jpa/JPA-ADVANCED-REPOSITORIES-ROUTING',
                component: ComponentCreator('/shopverse/spring/jpa/JPA-ADVANCED-REPOSITORIES-ROUTING', 'b45'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/jpa/JPA-AUDITING-DELETING-TESTING',
                component: ComponentCreator('/shopverse/spring/jpa/JPA-AUDITING-DELETING-TESTING', '3c2'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/jpa/JPA-BASICS-ENTITY-MAPPING',
                component: ComponentCreator('/shopverse/spring/jpa/JPA-BASICS-ENTITY-MAPPING', '61e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/jpa/JPA-FETCHING-PERFORMANCE',
                component: ComponentCreator('/shopverse/spring/jpa/JPA-FETCHING-PERFORMANCE', 'cfb'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/jpa/JPA-RELATIONSHIPS-JSON',
                component: ComponentCreator('/shopverse/spring/jpa/JPA-RELATIONSHIPS-JSON', '4ab'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/jpa/JPA-REPOSITORIES-QUERIES',
                component: ComponentCreator('/shopverse/spring/jpa/JPA-REPOSITORIES-QUERIES', '268'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/jpa/JPA-TRANSACTIONS-LOCKING',
                component: ComponentCreator('/shopverse/spring/jpa/JPA-TRANSACTIONS-LOCKING', '456'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/kafka/SPRING-KAFKA-ADVANCED',
                component: ComponentCreator('/shopverse/spring/kafka/SPRING-KAFKA-ADVANCED', 'ff5'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/kafka/SPRING-KAFKA-BASICS',
                component: ComponentCreator('/shopverse/spring/kafka/SPRING-KAFKA-BASICS', 'ee8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/kafka/SPRING-KAFKA-CONCURRENCY-CAPACITY',
                component: ComponentCreator('/shopverse/spring/kafka/SPRING-KAFKA-CONCURRENCY-CAPACITY', '2f4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/kafka/SPRING-KAFKA-CONSUMER-IDEMPOTENCY-REPLAY',
                component: ComponentCreator('/shopverse/spring/kafka/SPRING-KAFKA-CONSUMER-IDEMPOTENCY-REPLAY', 'bed'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/kafka/SPRING-KAFKA-CONSUMERS',
                component: ComponentCreator('/shopverse/spring/kafka/SPRING-KAFKA-CONSUMERS', '956'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/kafka/SPRING-KAFKA-IDEMPOTENCY-OPERATIONS',
                component: ComponentCreator('/shopverse/spring/kafka/SPRING-KAFKA-IDEMPOTENCY-OPERATIONS', 'a67'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/kafka/SPRING-KAFKA-OPERATIONS-INCIDENT-RESPONSE',
                component: ComponentCreator('/shopverse/spring/kafka/SPRING-KAFKA-OPERATIONS-INCIDENT-RESPONSE', '0da'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/kafka/SPRING-KAFKA-RETRY-DLT-RECOVERY',
                component: ComponentCreator('/shopverse/spring/kafka/SPRING-KAFKA-RETRY-DLT-RECOVERY', '173'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/kafka/SPRING-KAFKA-RUNTIME-INTERNALS-FAILURES',
                component: ComponentCreator('/shopverse/spring/kafka/SPRING-KAFKA-RUNTIME-INTERNALS-FAILURES', 'a16'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/production/RESOURCE-POOL-CONCURRENCY-CAPACITY',
                component: ComponentCreator('/shopverse/spring/production/RESOURCE-POOL-CONCURRENCY-CAPACITY', 'ab0'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/production/STARTUP-JVM-CONTAINER-MEMORY',
                component: ComponentCreator('/shopverse/spring/production/STARTUP-JVM-CONTAINER-MEMORY', 'c3e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/spel/SPEL-LANGUAGE-EVALUATION',
                component: ComponentCreator('/shopverse/spring/spel/SPEL-LANGUAGE-EVALUATION', 'a3d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/spel/SPEL-SECURITY-PRODUCTION',
                component: ComponentCreator('/shopverse/spring/spel/SPEL-SECURITY-PRODUCTION', '770'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/spel/SPEL-SPRING-INTEGRATIONS',
                component: ComponentCreator('/shopverse/spring/spel/SPEL-SPRING-INTEGRATIONS', 'ef9'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/SPRING-AOP',
                component: ComponentCreator('/shopverse/spring/SPRING-AOP', '859'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/SPRING-ARCHITECT-INTERVIEW-WORKBOOK',
                component: ComponentCreator('/shopverse/spring/SPRING-ARCHITECT-INTERVIEW-WORKBOOK', '372'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/SPRING-ARCHITECT-PATH',
                component: ComponentCreator('/shopverse/spring/SPRING-ARCHITECT-PATH', 'a41'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/SPRING-ASYNC-PRODUCTION-ARCHITECT',
                component: ComponentCreator('/shopverse/spring/SPRING-ASYNC-PRODUCTION-ARCHITECT', '42e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/SPRING-BATCH',
                component: ComponentCreator('/shopverse/spring/SPRING-BATCH', 'f81'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/SPRING-BOOT-4-FRAMEWORK-7',
                component: ComponentCreator('/shopverse/spring/SPRING-BOOT-4-FRAMEWORK-7', '552'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/SPRING-BOOT-ANNOTATIONS-PATH',
                component: ComponentCreator('/shopverse/spring/SPRING-BOOT-ANNOTATIONS-PATH', 'cd0'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/SPRING-BOOT-ARCHITECT-PATH',
                component: ComponentCreator('/shopverse/spring/SPRING-BOOT-ARCHITECT-PATH', 'c1d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/SPRING-BOOT-INTERNALS-PRODUCTION',
                component: ComponentCreator('/shopverse/spring/SPRING-BOOT-INTERNALS-PRODUCTION', 'bcb'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/SPRING-BOOT-TESTING',
                component: ComponentCreator('/shopverse/spring/SPRING-BOOT-TESTING', '593'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/SPRING-CACHE',
                component: ComponentCreator('/shopverse/spring/SPRING-CACHE', 'b24'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/SPRING-CLOUD-ARCHITECT-PATH',
                component: ComponentCreator('/shopverse/spring/SPRING-CLOUD-ARCHITECT-PATH', '376'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/SPRING-CONTAINER-ARCHITECT',
                component: ComponentCreator('/shopverse/spring/SPRING-CONTAINER-ARCHITECT', '930'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/SPRING-DATA-ARCHITECT-PATH',
                component: ComponentCreator('/shopverse/spring/SPRING-DATA-ARCHITECT-PATH', '483'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/SPRING-DATA-CASSANDRA',
                component: ComponentCreator('/shopverse/spring/SPRING-DATA-CASSANDRA', '14b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/SPRING-DATA-JPA',
                component: ComponentCreator('/shopverse/spring/SPRING-DATA-JPA', '53c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/SPRING-ECOSYSTEM',
                component: ComponentCreator('/shopverse/spring/SPRING-ECOSYSTEM', 'c3b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/SPRING-ECOSYSTEM-INTERVIEW',
                component: ComponentCreator('/shopverse/spring/SPRING-ECOSYSTEM-INTERVIEW', 'da8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/SPRING-INTERNALS-LABS',
                component: ComponentCreator('/shopverse/spring/SPRING-INTERNALS-LABS', '40f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/SPRING-INTERVIEW-PREPARATION',
                component: ComponentCreator('/shopverse/spring/SPRING-INTERVIEW-PREPARATION', '31c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/SPRING-JPA-HIBERNATE-ARCHITECT',
                component: ComponentCreator('/shopverse/spring/SPRING-JPA-HIBERNATE-ARCHITECT', 'e45'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/SPRING-KAFKA',
                component: ComponentCreator('/shopverse/spring/SPRING-KAFKA', 'ada'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/SPRING-MCQ-PRACTICE',
                component: ComponentCreator('/shopverse/spring/SPRING-MCQ-PRACTICE', '3dc'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/SPRING-MVC-SECURITY-RUNTIME',
                component: ComponentCreator('/shopverse/spring/SPRING-MVC-SECURITY-RUNTIME', 'd84'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/SPRING-OPENFEIGN',
                component: ComponentCreator('/shopverse/spring/SPRING-OPENFEIGN', 'dd5'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/SPRING-PLATFORM-ADVANCED',
                component: ComponentCreator('/shopverse/spring/SPRING-PLATFORM-ADVANCED', 'bf1'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/SPRING-PROXY-TRANSACTION-ARCHITECT',
                component: ComponentCreator('/shopverse/spring/SPRING-PROXY-TRANSACTION-ARCHITECT', '752'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/SPRING-REACTIVE',
                component: ComponentCreator('/shopverse/spring/SPRING-REACTIVE', '001'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/SPRING-RESILIENCE4J',
                component: ComponentCreator('/shopverse/spring/SPRING-RESILIENCE4J', '355'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/SPRING-REVISION-SHEET',
                component: ComponentCreator('/shopverse/spring/SPRING-REVISION-SHEET', 'f57'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/SPRING-SPEL',
                component: ComponentCreator('/shopverse/spring/SPRING-SPEL', 'a75'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/SPRING-TRANSACTIONS',
                component: ComponentCreator('/shopverse/spring/SPRING-TRANSACTIONS', '8fa'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/SPRING-VALIDATION',
                component: ComponentCreator('/shopverse/spring/SPRING-VALIDATION', '33b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/TDD-BDD-ENGINEERING-PATH',
                component: ComponentCreator('/shopverse/spring/TDD-BDD-ENGINEERING-PATH', '8c4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/testing/ASYNC-CONTRACT-FLAKY-TESTS',
                component: ComponentCreator('/shopverse/spring/testing/ASYNC-CONTRACT-FLAKY-TESTS', '83f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/testing/BDD-DISCOVERY-SPECIFICATIONS',
                component: ComponentCreator('/shopverse/spring/testing/BDD-DISCOVERY-SPECIFICATIONS', '99f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/testing/COVERAGE-TEST-QUALITY',
                component: ComponentCreator('/shopverse/spring/testing/COVERAGE-TEST-QUALITY', '5e2'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/testing/HTTP-CLIENT-CONTRACT-TESTS',
                component: ComponentCreator('/shopverse/spring/testing/HTTP-CLIENT-CONTRACT-TESTS', 'd02'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/testing/INTEGRATION-TESTCONTAINERS',
                component: ComponentCreator('/shopverse/spring/testing/INTEGRATION-TESTCONTAINERS', '0a4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/testing/JUNIT-TESTING-FUNDAMENTALS',
                component: ComponentCreator('/shopverse/spring/testing/JUNIT-TESTING-FUNDAMENTALS', 'fbf'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/testing/MOCKITO-UNIT-TESTING',
                component: ComponentCreator('/shopverse/spring/testing/MOCKITO-UNIT-TESTING', 'e3a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/testing/SPRING-MVC-REPOSITORY-SECURITY-TESTS',
                component: ComponentCreator('/shopverse/spring/testing/SPRING-MVC-REPOSITORY-SECURITY-TESTS', '62e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/testing/SPRING-TEST-SLICES-CONTEXT-CACHE',
                component: ComponentCreator('/shopverse/spring/testing/SPRING-TEST-SLICES-CONTEXT-CACHE', '902'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/testing/TDD-BDD-INTERVIEW-REVISION',
                component: ComponentCreator('/shopverse/spring/testing/TDD-BDD-INTERVIEW-REVISION', '11d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/testing/TDD-BDD-SPRING-PRODUCTION',
                component: ComponentCreator('/shopverse/spring/testing/TDD-BDD-SPRING-PRODUCTION', 'b27'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/testing/TDD-WORKFLOW-DESIGN',
                component: ComponentCreator('/shopverse/spring/testing/TDD-WORKFLOW-DESIGN', 'd65'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/testing/TEST-CI-RELIABILITY-OPERATIONS',
                component: ComponentCreator('/shopverse/spring/testing/TEST-CI-RELIABILITY-OPERATIONS', '751'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/transactions/SPRING-TRANSACTION-PROXY-BOUNDARY-DESIGN',
                component: ComponentCreator('/shopverse/spring/transactions/SPRING-TRANSACTION-PROXY-BOUNDARY-DESIGN', '6a9'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/validation/BEAN-VALIDATION-FUNDAMENTALS',
                component: ComponentCreator('/shopverse/spring/validation/BEAN-VALIDATION-FUNDAMENTALS', 'ef1'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/validation/METHOD-CUSTOM-GROUPED-CONFIGURATION-VALIDATION',
                component: ComponentCreator('/shopverse/spring/validation/METHOD-CUSTOM-GROUPED-CONFIGURATION-VALIDATION', 'a48'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/validation/VALIDATION-ERRORS-TESTING-PRODUCTION',
                component: ComponentCreator('/shopverse/spring/validation/VALIDATION-ERRORS-TESTING-PRODUCTION', 'e23'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/web/HTTP-MESSAGE-CONVERSION-JACKSON',
                component: ComponentCreator('/shopverse/spring/web/HTTP-MESSAGE-CONVERSION-JACKSON', '1cc'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/web/SECURITY-REQUEST-RUNTIME',
                component: ComponentCreator('/shopverse/spring/web/SECURITY-REQUEST-RUNTIME', '79f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/web/SERVLET-MVC-REQUEST-LIFECYCLE',
                component: ComponentCreator('/shopverse/spring/web/SERVLET-MVC-REQUEST-LIFECYCLE', '468'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/spring/web/WEB-EXECUTION-MODELS-CAPACITY',
                component: ComponentCreator('/shopverse/spring/web/WEB-EXECUTION-MODELS-CAPACITY', 'c1d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/WALMART-INTERVIEW-QUESTIONNAIRE',
                component: ComponentCreator('/shopverse/WALMART-INTERVIEW-QUESTIONNAIRE', 'ea8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/shopverse/',
                component: ComponentCreator('/shopverse/', '7b9'),
                exact: true,
                sidebar: "docsSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
