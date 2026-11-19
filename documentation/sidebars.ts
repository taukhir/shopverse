import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';
const sidebars: SidebarsConfig = {
  docsSidebar: [
    'README',
    'DOCUMENTATION-INDEX',
    // BEGIN MYCHECKOUT IMPORT
    {
      'type': 'category',
      'label': 'mycheckout',
      'link': {
        'type': 'doc',
        'id': 'mycheckout/overview'
      },
      'collapsed': true,
      'items': [
        'mycheckout/overview',
        {
          'type': 'category',
          'label': 'Architecture and platform',
          'items': [
            'mycheckout/api-and-event-catalog',
            'mycheckout/coverage-audit',
            {
              'type': 'category',
              'label': 'NextGen Commerce: End-to-End System Guide',
              'link': {
                'type': 'doc',
                'id': 'mycheckout/end-to-end-system/part-1'
              },
              'items': [
                'mycheckout/end-to-end-system/part-1',
                'mycheckout/end-to-end-system/part-2',
                'mycheckout/end-to-end-system/part-3',
                'mycheckout/end-to-end-system/part-4',
                'mycheckout/end-to-end-system/part-5',
                'mycheckout/end-to-end-system/part-6'
              ]
            },
            'mycheckout/architecture/readme',
            'mycheckout/architecture/recheck-notes'
          ]
        },
        {
          'type': 'category',
          'label': 'Checkout and payment flows',
          'items': [
            {
              'type': 'category',
              'label': 'Create Checkout — Complete Flow',
              'link': {
                'type': 'doc',
                'id': 'mycheckout/create-checkout-flow/part-1'
              },
              'items': [
                'mycheckout/create-checkout-flow/part-1',
                'mycheckout/create-checkout-flow/part-2'
              ]
            },
            {
              'type': 'category',
              'label': 'Checkout Payment and CDC Complete Flow',
              'link': {
                'type': 'doc',
                'id': 'mycheckout/payment-cdc-sequence-guide/part-1'
              },
              'items': [
                'mycheckout/payment-cdc-sequence-guide/part-1',
                'mycheckout/payment-cdc-sequence-guide/part-2',
                'mycheckout/payment-cdc-sequence-guide/part-3'
              ]
            },
            {
              'type': 'category',
              'label': 'Place Order — Complete Flow',
              'link': {
                'type': 'doc',
                'id': 'mycheckout/place-order-flow/part-1'
              },
              'items': [
                'mycheckout/place-order-flow/part-1',
                'mycheckout/place-order-flow/part-2',
                'mycheckout/place-order-flow/part-3'
              ]
            },
            {
              'type': 'category',
              'label': 'Guest checkout: end-to-end flow',
              'link': {
                'type': 'doc',
                'id': 'mycheckout/guest-checkout-flow/part-1'
              },
              'items': [
                'mycheckout/guest-checkout-flow/part-1',
                'mycheckout/guest-checkout-flow/part-2',
                'mycheckout/guest-checkout-flow/part-3',
                'mycheckout/guest-checkout-flow/part-4',
                'mycheckout/guest-checkout-flow/part-5',
                'mycheckout/guest-checkout-flow/part-6'
              ]
            }
          ]
        },
        {
          'type': 'category',
          'label': 'Fulfillment',
          'items': [
            {
              'type': 'category',
              'label': 'Fulfilment',
              'link': {
                'type': 'doc',
                'id': 'mycheckout/fulfilment-understanding-notes/part-1'
              },
              'items': [
                'mycheckout/fulfilment-understanding-notes/part-1',
                'mycheckout/fulfilment-understanding-notes/part-2'
              ]
            },
            {
              'type': 'category',
              'label': 'Fulfillment API catalog',
              'link': {
                'type': 'doc',
                'id': 'mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1'
              },
              'items': [
                'mycheckout/fulfillment-docs/fulfillment-api-catalog/part-1',
                'mycheckout/fulfillment-docs/fulfillment-api-catalog/part-2',
                'mycheckout/fulfillment-docs/fulfillment-api-catalog/part-3',
                'mycheckout/fulfillment-docs/fulfillment-api-catalog/part-4',
                'mycheckout/fulfillment-docs/fulfillment-api-catalog/part-5'
              ]
            },
            'mycheckout/fulfillment-docs/fulfillment-bug-context',
            {
              'type': 'category',
              'label': 'Completeness check',
              'link': {
                'type': 'doc',
                'id': 'mycheckout/fulfillment-docs/fulfillment-complete-context/part-1'
              },
              'items': [
                'mycheckout/fulfillment-docs/fulfillment-complete-context/part-1',
                'mycheckout/fulfillment-docs/fulfillment-complete-context/part-2'
              ]
            },
            'mycheckout/fulfillment-docs/fulfillment-configuration-catalog',
            {
              'type': 'category',
              'label': 'Fulfillment: End-to-End Guide',
              'link': {
                'type': 'doc',
                'id': 'mycheckout/fulfillment-docs/fulfillment-end-to-end/part-1'
              },
              'items': [
                'mycheckout/fulfillment-docs/fulfillment-end-to-end/part-1',
                'mycheckout/fulfillment-docs/fulfillment-end-to-end/part-2',
                'mycheckout/fulfillment-docs/fulfillment-end-to-end/part-3',
                'mycheckout/fulfillment-docs/fulfillment-end-to-end/part-4',
                'mycheckout/fulfillment-docs/fulfillment-end-to-end/part-5',
                'mycheckout/fulfillment-docs/fulfillment-end-to-end/part-6'
              ]
            },
            {
              'type': 'category',
              'label': 'Fulfillment: Interview Prep Guide',
              'link': {
                'type': 'doc',
                'id': 'mycheckout/fulfillment-docs/fulfillment-interview-prep/part-1'
              },
              'items': [
                'mycheckout/fulfillment-docs/fulfillment-interview-prep/part-1',
                'mycheckout/fulfillment-docs/fulfillment-interview-prep/part-2',
                'mycheckout/fulfillment-docs/fulfillment-interview-prep/part-3'
              ]
            },
            {
              'type': 'category',
              'label': 'Redis and Delivery Fee: Deep Dive',
              'link': {
                'type': 'doc',
                'id': 'mycheckout/fulfillment-docs/fulfillment-redis-and-delivery-fee/part-1'
              },
              'items': [
                'mycheckout/fulfillment-docs/fulfillment-redis-and-delivery-fee/part-1',
                'mycheckout/fulfillment-docs/fulfillment-redis-and-delivery-fee/part-2'
              ]
            },
            {
              'type': 'category',
              'label': 'Fulfillment reverse-engineering reference',
              'link': {
                'type': 'doc',
                'id': 'mycheckout/fulfillment-docs/fulfillment-reverse-engineering/part-1'
              },
              'items': [
                'mycheckout/fulfillment-docs/fulfillment-reverse-engineering/part-1',
                'mycheckout/fulfillment-docs/fulfillment-reverse-engineering/part-2'
              ]
            },
            {
              'type': 'category',
              'label': 'Fulfillment source evidence index',
              'link': {
                'type': 'doc',
                'id': 'mycheckout/fulfillment-docs/fulfillment-source-index/part-1'
              },
              'items': [
                'mycheckout/fulfillment-docs/fulfillment-source-index/part-1',
                'mycheckout/fulfillment-docs/fulfillment-source-index/part-2',
                'mycheckout/fulfillment-docs/fulfillment-source-index/part-3'
              ]
            },
            {
              'type': 'category',
              'label': 'Fulfilment Engineering Reference',
              'link': {
                'type': 'doc',
                'id': 'mycheckout/fulfillment-docs/fulfilment-understanding-notes/part-1'
              },
              'items': [
                'mycheckout/fulfillment-docs/fulfilment-understanding-notes/part-1',
                'mycheckout/fulfillment-docs/fulfilment-understanding-notes/part-2',
                'mycheckout/fulfillment-docs/fulfilment-understanding-notes/part-3',
                'mycheckout/fulfillment-docs/fulfilment-understanding-notes/part-4'
              ]
            },
            'mycheckout/fulfillment-docs/readme',
            'mycheckout/fulfillment-docs/fulfillment-availability-issue-fix'
          ]
        },
        {
          'type': 'category',
          'label': 'Interview preparation',
          'items': [
            {
              'type': 'category',
              'label': 'AWS Interview Preparation for Checkout',
              'link': {
                'type': 'doc',
                'id': 'mycheckout/aws-interview-prep/part-1'
              },
              'items': [
                'mycheckout/aws-interview-prep/part-1',
                'mycheckout/aws-interview-prep/part-2'
              ]
            },
            {
              'type': 'category',
              'label': 'Checkout Platform: Interview Preparation',
              'link': {
                'type': 'doc',
                'id': 'mycheckout/interview-prep/part-1'
              },
              'items': [
                'mycheckout/interview-prep/part-1',
                'mycheckout/interview-prep/part-2',
                'mycheckout/interview-prep/part-3',
                'mycheckout/interview-prep/part-4',
                'mycheckout/interview-prep/part-5',
                'mycheckout/interview-prep/part-6',
                'mycheckout/interview-prep/part-7'
              ]
            }
          ]
        }
      ]
    },
    // END MYCHECKOUT IMPORT
    {
      type: 'category',
      label: 'Interview Questionnaires',
      link: {type: 'doc', id: 'INTERVIEW-QUESTIONNAIRES'},
      items: [
        'WALMART-INTERVIEW-QUESTIONNAIRE',
      ],
    },
    {
      type: 'category',
      label: 'Documentation Guide',
      link: {type: 'doc', id: 'reference/DOCUMENTATION-GUIDE'},
      collapsed: true,
      items: [
        {
          type: 'category',
          label: 'Start And Learning Paths',
          items: [
            'reference/LEARNING-PATH',
            {
              type: 'category',
              label: 'Shopverse Features And Demos',
              link: {type: 'doc', id: 'reference/FEATURES-AND-DEMOS'},
              items: [
                'reference/FEATURES-SECURITY-CHECKOUT',
                'reference/FEATURES-RELIABILITY-OBSERVABILITY',
              ],
            },
          ],
        },
        {
          type: 'category',
          label: 'Structure And Maintenance',
          items: [
            'reference/DOCUMENTATION-STRUCTURE',
            'reference/DOCUMENTATION-MAINTENANCE-MAP',
            'reference/DOCUMENTATION-COMPONENTS',
            'reference/VISUAL-REFERENCE-STANDARD',
          ],
        },
        {
          type: 'category',
          label: 'Quality And Validation',
          items: [
            'reference/DOCUMENTATION-QUALITY-AUDIT',
            'reference/OVERVIEW-COVERAGE-AUDIT',
            'reference/FINAL-DOCUMENTATION-AUDIT',
            'reference/CODE-CROSS-CHECK',
          ],
        },
        {
          type: 'category',
          label: 'Reference',
          items: [
            'reference/GLOSSARY',
            'reference/DISTRIBUTED-SYSTEMS-INTERVIEW',
            'operations/OPERATIONS-CHEATSHEET',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: '1. Engineering Foundations',
      link: {type: 'doc', id: 'development/ENGINEERING-FOUNDATIONS-OVERVIEW'},
      collapsed: false,
      items: [
        'development/ENGINEERING-FOUNDATIONS-OVERVIEW',
        {
          type: 'category',
          label: 'Engineering Principles',
          link: {type: 'doc', id: 'development/ENGINEERING-PRINCIPLES'},
          items: [
            'development/SOLID-JAVA-SHOPVERSE',
            'development/PRODUCTION-DESIGN-PRINCIPLES',
          ],
        },
        {
          type: 'category',
          label: 'Design Patterns',
          link: {type: 'doc', id: 'development/DESIGN-PATTERNS'},
          items: [
            {
              type: 'category',
              label: 'Creational Patterns',
              link: {type: 'doc', id: 'development/design-patterns/CREATIONAL-PATTERNS'},
              items: [
                'development/design-patterns/immutable-class',
                'development/design-patterns/factory',
                'development/design-patterns/abstract-factory',
                'development/design-patterns/builder',
                'development/design-patterns/prototype',
                'development/design-patterns/singleton',
              ],
            },
            'development/design-patterns/DESIGN-PATTERN-SELECTION-CHEATSHEET',
            {
              type: 'category',
              label: 'Structural Patterns',
              link: {type: 'doc', id: 'development/design-patterns/STRUCTURAL-PATTERNS'},
              items: [
                'development/design-patterns/adapter',
                'development/design-patterns/bridge',
                'development/design-patterns/decorator',
                'development/design-patterns/proxy',
                'development/design-patterns/composite',
                'development/design-patterns/facade',
                'development/design-patterns/flyweight',
              ],
            },
            {
              type: 'category',
              label: 'Behavioral Patterns',
              link: {type: 'doc', id: 'development/design-patterns/BEHAVIORAL-PATTERNS'},
              items: [
                'development/design-patterns/strategy',
                'development/design-patterns/observer',
                'development/design-patterns/chain-of-responsibility',
                'development/design-patterns/template-method',
                'development/design-patterns/command',
                'development/design-patterns/iterator',
                'development/design-patterns/mediator',
                'development/design-patterns/memento',
                'development/design-patterns/interpreter',
                'development/design-patterns/visitor',
                'development/design-patterns/state',
              ],
            },
          ],
        },
        {
          type: 'category',
          label: 'Leadership And Architecture',
          link: {type: 'doc', id: 'leadership/LEADERSHIP-ARCHITECTURE-SCENARIOS'},
          items: [
            {
              type: 'category',
              label: 'Architect Practice And Evidence',
              link: {type: 'doc', id: 'leadership/ARCHITECT-PRACTICE-EVIDENCE-PATH'},
              items: [
                'leadership/architect-practice/ARCHITECT-RUNTIME-DESIGN-REASONING',
                'leadership/architect-practice/ARCHITECT-FAILURE-DIAGNOSIS',
                'leadership/architect-practice/ARCHITECT-SCALE-SECURITY-TRADEOFFS',
                'leadership/architect-practice/ARCHITECT-PRODUCTION-EVIDENCE-WORKBOOK',
              ],
            },
            {
              type: 'category',
              label: 'Architecture Portfolio And Mock Interviews',
              link: {type: 'doc', id: 'leadership/interview-program/LEAD-ARCHITECT-PREPARATION-DASHBOARD'},
              items: [
                'leadership/ARCHITECTURE-PORTFOLIO-MOCK-INTERVIEW-PROGRAM',
                'leadership/interview-program/ROLE-BASED-PREPARATION-ROUTES',
                'leadership/interview-program/REVISION-READINESS-SCORECARD',
                'leadership/interview-program/INTERVIEW-PRACTICE-DASHBOARD',
                'leadership/interview-program/MCQ-PRACTICE-CENTER',
                'leadership/interview-program/DAY-ZERO-DIAGNOSTIC-ASSESSMENT',
                'leadership/interview-program/DAY-ZERO-ASSESSOR-SCORING-ROUTING',
                'leadership/interview-program/ARCHITECTURE-PORTFOLIO-BUILDING',
                'leadership/interview-program/MOCK-INTERVIEW-FORMATS-QUESTION-BANK',
                'leadership/interview-program/SYSTEM-DESIGN-BEHAVIORAL-LEADERSHIP-ROUNDS',
                'leadership/interview-program/TWELVE-WEEK-PREPARATION-PROGRAM',
              ],
            },
            'leadership/MONOLITH-TO-MICROSERVICES-STRATEGY',
            'leadership/ENGINEERING-LEADERSHIP-PRACTICES',
            'leadership/ARCHITECTURE-DECISIONS-AND-DISAGREEMENTS',
            'leadership/PRODUCTION-PERFORMANCE-AND-AVAILABILITY',
            'leadership/ZERO-DOWNTIME-DELIVERY',
            'leadership/LEGACY-TO-SPRING-BOOT-MODERNIZATION',
            'leadership/LEADERSHIP-ARCHITECTURE-INTERVIEW-WORKBOOK',
            'leadership/ENGINEERING-LEADERSHIP-INTERVIEW-SCENARIOS',
          ],
        },
        {
          type: 'category',
          label: 'REST API Design',
          link: {type: 'doc', id: 'development/REST-API-GENERIC'},
          items: [
            'development/REST-API-GENERIC',
            'development/REST-API-HTTP-CONTRACTS',
            'development/REST-API-PRODUCTION-DESIGN',
          ],
        },
        {
          type: 'category',
          label: 'Algorithms And Data Structures',
          link: {type: 'doc', id: 'data-structures/README'},
          items: [
            'data-structures/DATA-STRUCTURES-FUNDAMENTALS',
            'data-structures/ALGORITHM-COMPLEXITY-PROBLEM-SOLVING',
            'data-structures/LINEAR-DATA-STRUCTURES',
            'data-structures/NON-LINEAR-DATA-STRUCTURES',
            'data-structures/GRAPH-ALGORITHMS-INTERVIEW',
            'data-structures/DYNAMIC-PROGRAMMING-INTERVIEW',
            'data-structures/BACKTRACKING-TRIE-INTERVIEW',
            'data-structures/CONCURRENT-JAVA-CODING-EXERCISES',
            'data-structures/MACHINE-CODING-OOD-INTERVIEW',
            {
              type: 'category',
              label: 'Java Programming Interviews',
              link: {type: 'doc', id: 'data-structures/programming/JAVA-PROGRAMMING-INTERVIEW-PATH'},
              items: [
                {
                  type: 'category',
                  label: 'Arrays',
                  link: {type: 'doc', id: 'data-structures/programming/arrays/ARRAYS-OVERVIEW'},
                  items: [
                    'data-structures/programming/arrays/TWO-SUM-FAMILY',
                    'data-structures/programming/arrays/KADANE-FAMILY',
                    'data-structures/programming/arrays/ARRAY-PROBLEMS-01-10',
                    'data-structures/programming/arrays/ARRAY-PROBLEMS-11-20',
                    'data-structures/programming/arrays/ARRAY-PROBLEMS-21-30',
                    'data-structures/programming/arrays/ARRAY-30-PROBLEM-ROADMAP',
                    'data-structures/programming/arrays/ARRAY-INTERVIEW-REVISION',
                  ],
                },
              ],
            },
            'data-structures/DSA-INTERVIEW-QUESTION-BANK',
          ],
        },
        {
          type: 'category',
          label: 'Git Engineering Guide',
          link: {type: 'doc', id: 'operations/GIT-COMMANDS'},
          items: [
            'operations/GIT-DAILY-SYNC-CONFLICTS',
            'operations/GIT-HISTORY-RECOVERY-COLLABORATION',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: '2. Java',
      items: [
        {
          type: 'category',
          label: 'Quarkus Beginner-To-Advanced',
          link: {type: 'doc', id: 'quarkus/README'},
          items: [
            'quarkus/QUARKUS-FUNDAMENTALS',
            'quarkus/QUARKUS-REST-CDI-CONFIG',
            'quarkus/QUARKUS-OPENAPI-FUNDAMENTALS',
            'quarkus/QUARKUS-OPENAPI-PROVIDER',
            'quarkus/QUARKUS-OPENAPI-CLIENT-ARTIFACTS',
            'quarkus/QUARKUS-DATA-TRANSACTIONS-TESTING',
            'quarkus/QUARKUS-INTEGRATION-SECURITY-OBSERVABILITY',
            'quarkus/QUARKUS-NATIVE-KUBERNETES-PRODUCTION',
            'quarkus/QUARKUS-PRODUCTION-HA-SCALING',
            'quarkus/QUARKUS-CHECKOUT-TUTORIAL',
            'quarkus/QUARKUS-INTERVIEW-REVISION',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: '3. Spring And Spring Boot',
      items: [
        {
          type: 'category',
          label: 'Container And Configuration',
          link: {type: 'doc', id: 'development/SPRING-BOOT-INTERNALS'},
          items: [
            'development/spring-boot-internals/STARTUP-AUTOCONFIGURATION',
            'development/spring-boot-internals/STARTUP-EXTENSION-POINTS',
            'development/spring-boot-internals/DI-BEAN-LIFECYCLE-AOP',
            'development/spring-boot-internals/DEPENDENCY-INJECTION-BEAN-RESOLUTION',
            'development/spring-boot-internals/AUTOWIRING-CIRCULAR-REFERENCE-INTERNALS',
            'development/spring-boot-internals/BEAN-SCOPES-LIFECYCLE',
            'development/spring-boot-internals/SPRING-BEAN-LIFECYCLE-GC-STATIC-REFERENCES',
            'development/spring-boot-internals/CONFIGURATION-PROPERTIES',
          ],
        },
        {
          type: 'category',
          label: 'Web MVC, Security And REST',
          items: [
            {
              type: 'category',
              label: 'REST API Design',
              link: {type: 'doc', id: 'development/SPRING-REST-APIS'},
              items: [
                'development/spring-rest/REST-BASICS-CRUD',
                'development/spring-rest/REST-CONTROLLER-REQUEST-MAPPING',
                'development/spring-rest/REST-ERROR-CONTRACTS',
                'development/spring-rest/REST-SECURE-FILE-TRANSFER',
                'development/spring-rest/REST-PAGINATION-CONDITIONAL-REQUESTS',
                'development/spring-rest/REST-IDEMPOTENT-COMMANDS',
                'development/spring-rest/REST-OPENAPI-CONTRACT-GOVERNANCE',
                'development/spring-rest/REST-CLIENTS-FEIGN',
                'development/spring-rest/REST-TESTING',
              ],
            },
          ],
        },
        {
          type: 'category',
          label: 'Production Runtime And Labs',
          items: [
            'development/spring-boot-internals/INFRASTRUCTURE-INTERNALS',
            'development/spring-boot-internals/OPERATIONS-INTERNALS',
            'development/spring-boot-internals/PRODUCTION-TUNING',
            'operations/SPRING-BOOT-ACTUATOR',
          ],
        },
        {
          type: 'category',
          label: 'Advanced Platform And Interview Practice',
          items: [
            {
              type: 'category',
              label: 'Spring Interview Preparation',
              items: [
                'development/spring-rest/REST-INTERVIEW-WORKBOOK',
              ],
            },
          ],
        },
        {
          type: 'category',
          label: 'Compatibility Routes',
          collapsed: true,
          items: [
            'development/spring-boot-internals/SERVLET-DISPATCHER-SERVLET',
            'development/spring-boot-internals/WEB-MVC-SERVLET-FILTERS',
            'development/spring-rest/REST-MAPPING-VALIDATION-ERRORS',
            'development/spring-rest/REST-FILES-PAGINATION-IDEMPOTENCY',
            'development/spring-rest/REST-TESTING-INTERVIEW',
          ],
        },
        'development/ENGINEERING-FOUNDATIONS-REVISION',
      ],
    },
    {
      type: 'category',
      label: '4. Microservices And Distributed Systems',
      items: [
        'reliability/RELIABILITY-OVERVIEW',
        {
          type: 'category',
          label: 'Architecture Basics',
          items: [
            {
              type: 'category',
              label: 'API Gateway Engineering',
              link: {type: 'doc', id: 'development/API-GATEWAY-GENERIC'},
              items: [
                'development/API-GATEWAY-ARCHITECTURE',
                'development/API-GATEWAY-REACTIVE-FILTER-LIFECYCLE',
                'development/API-GATEWAY-OPERATIONS',
              ],
            },
            'development/SPRING-CLOUD-GATEWAY-ADVANCED',
          ],
        },
        {
          type: 'category',
          label: 'Consistency And Coordination',
          items: [
            'reliability/DISTRIBUTED-TRANSACTIONS-LOCKS',
            {
              type: 'category',
              label: 'Locking And Work Ownership',
              items: [
                'reliability/locking/LOCKING-AND-WORK-OWNERSHIP',
                'reliability/DISTRIBUTED-SCHEDULER-WORK-CLAIMS',
                'reliability/locking/SPRING-DISTRIBUTED-LOCKING-OPTIONS',
                'reliability/locking/DATABASE-LOCKING-AND-CLAIMS',
                'reliability/locking/SCHEDULER-LOCKING-SHEDLOCK',
                'reliability/locking/DISTRIBUTED-LOCKS-AND-FENCING',
                'reliability/locking/PARTITION-AND-QUEUE-OWNERSHIP',
              ],
            },
            {
              type: 'category',
              label: 'SAGA And Transactional Outbox',
              link: {type: 'doc', id: 'reliability/SAGA-GENERIC'},
              items: [
                'reliability/SAGA-CONSISTENCY-COMPENSATION',
                'reliability/SAGA-LIVENESS-TIMEOUT-RECOVERY',
                'reliability/OUTBOX-DELIVERY-OPERATIONS',
                'reliability/OUTBOX-PRODUCTION-FAILURE-MODES',
              ],
            },
            'reliability/OUTBOX-PATTERN',
            'reliability/INBOX-PATTERN',
            'reliability/SAGA-IMPLEMENTATION-GUIDE',
            'reliability/OUTBOX-IMPLEMENTATION-GUIDE',
          ],
        },
        {
          type: 'category',
          label: 'Reliability Patterns',
          items: [
            'reliability/IDEMPOTENCY-GENERIC',
            {
              type: 'category',
              label: 'Resilience4j Engineering',
              link: {type: 'doc', id: 'reliability/RESILIENCE4J-GENERIC'},
              items: [
                'reliability/RESILIENCE4J-RATE-LIMITER-BULKHEAD',
                'reliability/RESILIENCE4J-RETRY-CIRCUIT-TIMEOUT',
                'reliability/RESILIENCE4J-COMPOSITION-OPERATIONS',
              ],
            },
            'reliability/DISTRIBUTED-RATE-LIMITING',
            'reliability/HIGH-AVAILABILITY-SPOF',
            'reliability/DISTRIBUTED-FAILURE-CONSENSUS',
          ],
        },
        {
          type: 'category',
          label: 'Messaging And Integration',
          link: {type: 'doc', id: 'integration/README'},
          items: [
            'integration/MESSAGING-PLATFORM-SELECTION',
            'integration/APACHE-KAFKA',
            {
              type: 'category',
              label: 'Event Streaming Application Platforms',
              link: {type: 'doc', id: 'integration/EVENT-STREAMING-APPLICATION-PATH'},
              items: [
                {
                  type: 'category',
                  label: 'Spring Cloud Stream',
                  link: {type: 'doc', id: 'integration/streaming/SPRING-CLOUD-STREAM-OVERVIEW'},
                  items: [
                    'integration/streaming/SPRING-CLOUD-STREAM-FUNCTIONS-BINDINGS',
                    'integration/streaming/SPRING-CLOUD-STREAM-KAFKA-PRODUCTION',
                  ],
                },
                {
                  type: 'category',
                  label: 'Kafka Streams',
                  link: {type: 'doc', id: 'integration/streaming/KAFKA-STREAMS-OVERVIEW'},
                  items: [
                    'integration/streaming/KAFKA-STREAMS-STATEFUL-PRODUCTION',
                  ],
                },
                {
                  type: 'category',
                  label: 'Kafka Connect',
                  link: {type: 'doc', id: 'integration/streaming/KAFKA-CONNECT-OVERVIEW'},
                  items: [
                    'integration/streaming/KAFKA-CONNECT-CDC-PRODUCTION',
                  ],
                },
                'integration/streaming/EVENT-STREAMING-INTERVIEW-REVISION',
              ],
            },
            {
              type: 'category',
              label: 'Kafka Architect Path',
              link: {type: 'doc', id: 'integration/KAFKA-ARCHITECT-PATH'},
              items: [
                'integration/KAFKA-MCQ-PRACTICE',
                'integration/KAFKA-ARCHITECT-OVERVIEW',
                'integration/kafka/KAFKA-PRODUCTION-MASTERY',
                'integration/kafka/KAFKA-INTERNALS',
                'integration/kafka/KAFKA-PRODUCER-RELIABILITY-BACKPRESSURE',
                'integration/kafka/KAFKA-CAPACITY-PERFORMANCE-PLANNING',
                'integration/kafka/KAFKA-CONSUMER-GROUPS-REBALANCING-ORDERING',
                'integration/kafka/KAFKA-CONSUMER-OFFSET-COMMITS',
                'integration/kafka/KAFKA-CONSUMER-MULTITHREADING',
                'integration/kafka/KAFKA-PRODUCTION-FAILURE-PLAYBOOK',
                'integration/kafka/KAFKA-SECURITY-OPERATIONS',
                'integration/kafka/KAFKA-ECOSYSTEM',
                'integration/kafka/KAFKA-MULTI-CLUSTER-DISASTER-RECOVERY',
                'integration/kafka/KAFKA-ARCHITECT-LABS',
                'integration/KAFKA-REVISION-SHEET',
              ],
            },
            {
              type: 'category',
              label: 'RabbitMQ And Spring AMQP',
              link: {type: 'doc', id: 'integration/RABBITMQ-SPRING-AMQP-ARCHITECT-PATH'},
              items: [
                'integration/rabbitmq/RABBITMQ-INTERNALS-RELIABILITY',
                'integration/rabbitmq/RABBITMQ-OPERATIONS-INTERVIEW',
              ],
            },
          ],
        },
        'reliability/RELIABILITY-REVISION-SHEET',
      ],
    },
    {
      type: 'category',
      label: '5. Logging And Observability',
      link: {type: 'doc', id: 'observability/OBSERVABILITY-OVERVIEW'},
      items: [
        'observability/OBSERVABILITY-OVERVIEW',
        'observability/OBSERVABILITY',
        'observability/LOGGING-GENERIC',
        'observability/PII-SAFE-LOGGING',
        'observability/MDC-GENERIC',
        {
          type: 'category',
          label: 'Micrometer Metrics',
          link: {type: 'doc', id: 'observability/MICROMETER-METRICS'},
          items: [
            'observability/MICROMETER-COUNTERS',
            'observability/MICROMETER-TIMERS-TAGS-OPERATIONS',
          ],
        },
        'observability/PROMETHEUS',
        'observability/LOKI',
        'observability/PROMTAIL',
        'observability/GRAFANA',
        'observability/OBSERVABILITY-IMPLEMENTATION-GUIDE',
        'observability/DISTRIBUTED-TRACING-INTERNALS-PERFORMANCE',
        'observability/OBSERVABILITY-REVISION-SHEET',
      ],
    },
    {
      type: 'category',
      label: '6. Delivery, Containers And CI/CD',
      link: {type: 'doc', id: 'operations/README'},
      items: [
        'operations/README',
        {
          type: 'category',
          label: 'Maven Engineering Path',
          link: {type: 'doc', id: 'operations/MAVEN-OVERVIEW'},
          items: [
            'operations/MAVEN-ENGINEERING-PATH',
            'operations/maven/MAVEN-POM-LIFECYCLE-PLUGINS',
            'operations/maven/MAVEN-DEPENDENCIES-REACTOR',
            'operations/maven/MAVEN-CI-SECURITY-REPRODUCIBILITY',
            'operations/maven/MAVEN-TROUBLESHOOTING-INTERVIEW-REVISION',
          ],
        },
        {
          type: 'category',
          label: 'Gradle Engineering Path',
          link: {type: 'doc', id: 'operations/GRADLE-OVERVIEW'},
          items: [
            'operations/GRADLE-ENGINEERING-PATH',
            'operations/gradle/GRADLE-BUILD-LIFECYCLE-TASKS',
            'operations/gradle/GRADLE-DEPENDENCIES-MULTI-MODULE',
            'operations/gradle/GRADLE-CI-SECURITY-REPRODUCIBILITY',
            'operations/gradle/GRADLE-TROUBLESHOOTING-INTERVIEW-REVISION',
          ],
        },
        {
          type: 'category',
          label: 'Terraform And OpenTofu IaC',
          link: {type: 'doc', id: 'operations/INFRASTRUCTURE-AS-CODE-OVERVIEW'},
          items: [
            'operations/INFRASTRUCTURE-AS-CODE-ARCHITECT-PATH',
            'operations/iac/IAC-IMPLEMENTATION-OPERATIONS-INTERVIEW',
          ],
        },
        {
          type: 'category',
          label: 'Performance And Chaos Engineering',
          link: {type: 'doc', id: 'operations/PERFORMANCE-CHAOS-ENGINEERING-PATH'},
          items: [
            'operations/performance-chaos/PRODUCTION-SLOWNESS-DIAGNOSIS-RUNBOOK',
            'operations/performance-chaos/PERFORMANCE-CHAOS-LABS-INTERVIEW',
          ],
        },
        {
          type: 'category',
          label: 'Platform Engineering And Golden Paths',
          link: {type: 'doc', id: 'operations/PLATFORM-ENGINEERING-GOLDEN-PATH'},
          items: [
            'operations/platform-engineering/PLATFORM-OPERATIONS-INTERVIEW',
          ],
        },
        'operations/SHELL-AUTOMATION-ENGINEERING-PATH',
        {
          type: 'category',
          label: 'Helm, GitOps And Argo CD',
          link: {type: 'doc', id: 'operations/HELM-GITOPS-ARGOCD-OVERVIEW'},
          items: [
            'operations/HELM-GITOPS-ARGOCD-PATH',
            'operations/helm-gitops/HELM-CHART-ENGINEERING',
            'operations/helm-gitops/GITOPS-DELIVERY-DESIGN',
            'operations/helm-gitops/ARGOCD-PRODUCTION-OPERATIONS',
            'operations/helm-gitops/HELM-GITOPS-ARGOCD-INTERVIEW-REVISION',
          ],
        },
        {
          type: 'category',
          label: 'Linux Production Troubleshooting',
          link: {type: 'doc', id: 'operations/LINUX-OVERVIEW'},
          items: [
            'operations/LINUX-PRODUCTION-TROUBLESHOOTING-PATH',
            'operations/linux/LINUX-PROCESS-CPU-MEMORY',
            'operations/linux/LINUX-FILESYSTEM-STORAGE',
            'operations/linux/LINUX-SERVICES-NETWORK-CONTAINERS',
            'operations/linux/LINUX-INCIDENT-LABS-REVISION',
          ],
        },
        {
          type: 'category',
          label: 'Kubernetes Beginner-To-Architect',
          link: {type: 'doc', id: 'operations/kubernetes/KUBERNETES-OVERVIEW'},
          items: [
            'operations/KUBERNETES-ARCHITECT-PATH',
            'operations/KUBERNETES-MCQ-PRACTICE',
            {
              type: 'category',
              label: '1. Foundations And Client Access',
              items: [
                'operations/KUBERNETES-WORKLOAD-ENGINEERING',
                'operations/kubernetes/KUBERNETES-KUBECTL-MANIFESTS-COMMANDS',
                'operations/kubernetes/KUBERNETES-KUBECONFIG-ACCESS',
                'operations/kubernetes/KUBERNETES-CONTROL-PLANE-INTERNALS',
              ],
            },
            {
              type: 'category',
              label: '2. Workloads And Data Plane',
              items: [
                'operations/kubernetes/KUBERNETES-WORKLOADS-SCHEDULING',
                'operations/kubernetes/KUBERNETES-NETWORKING-SERVICES',
                'operations/kubernetes/KUBERNETES-STORAGE-STATEFUL',
              ],
            },
            {
              type: 'category',
              label: '3. Security And Platform Operations',
              items: [
                'operations/kubernetes/KUBERNETES-SECURITY-MULTITENANCY',
                'operations/kubernetes/KUBERNETES-CLUSTER-OPERATIONS',
              ],
            },
            {
              type: 'category',
              label: '4. Infrastructure And TKGI',
              items: [
                'operations/kubernetes/KUBERNETES-CONTAINERS-VMS-BOSH',
                {
                  type: 'category',
                  label: 'TKGI Beginner-To-Architect',
                  link: {type: 'doc', id: 'operations/kubernetes/TKGI-OVERVIEW-PATH'},
                  items: [
                    'operations/kubernetes/TKGI-CONTROL-PLANE-ARCHITECTURE',
                    'operations/kubernetes/TKGI-API-SERVER-LIFECYCLE',
                    'operations/kubernetes/TKGI-UAA-SECURITY',
                    'operations/kubernetes/TKGI-DATABASE-STATE',
                    'operations/kubernetes/TKGI-BOSH-LIFECYCLE',
                    'operations/kubernetes/TKGI-HARBOR-REGISTRY',
                    'operations/kubernetes/TKGI-CONSOLE-MONITORING',
                    'operations/kubernetes/TKGI-ARCHITECTURE-OPERATIONS',
                    {
                      type: 'category',
                      label: 'TKGI Production Platform Operations',
                      link: {type: 'doc', id: 'operations/kubernetes/TKGI-PRODUCTION-OPERATIONS-PATH'},
                      items: [
                        'operations/kubernetes/TKGI-INSTALLATION-FOUNDATION',
                        'operations/kubernetes/TKGI-PLANS-SIZING-CAPACITY',
                        'operations/kubernetes/TKGI-NETWORKING-LOAD-BALANCERS',
                        'operations/kubernetes/TKGI-UPGRADE-LIFECYCLE',
                        'operations/kubernetes/TKGI-BACKUP-RESTORE-DR',
                        'operations/kubernetes/TKGI-TELEMETRY-SINKS-OBSERVABILITY',
                        'operations/kubernetes/TKGI-PRODUCTION-INCIDENT-REVISION',
                      ],
                    },
                  ],
                },
              ],
            },
            {
              type: 'category',
              label: '5. Troubleshooting And Revision',
              items: [
                'operations/kubernetes/KUBERNETES-TROUBLESHOOTING-INTERVIEW-REVISION',
              ],
            },
          ],
        },
        {
          type: 'category',
          label: 'Deployment Strategies',
          link: {type: 'doc', id: 'operations/DEPLOYMENT-STRATEGIES'},
          items: [
            'operations/DEPLOYMENT-STRATEGY-SELECTION',
            'operations/DEPLOYMENT-TRAFFIC-ROLLBACK',
            'operations/DEPLOYMENT-CONTRACTS-RELEASE-GATES',
          ],
        },
        {
          type: 'category',
          label: 'Docker Beginner-To-Architect',
          link: {type: 'doc', id: 'operations/DOCKER'},
          items: [
            'operations/DOCKER-ARCHITECT-PATH',
            'operations/DOCKER-MCQ-PRACTICE',
            'operations/docker/DOCKER-PRODUCTION-MASTERY',
            'operations/DOCKER-INTERNALS-LAYERS-STORAGE',
            'operations/docker/DOCKER-ENGINE-RUNTIME-INTERNALS',
            'operations/docker/DOCKER-IMAGES-BUILDKIT-SUPPLY-CHAIN',
            'operations/docker/DOCKER-STORAGE-NETWORKING-INTERNALS',
            'operations/docker/DOCKER-SECURITY-PRODUCTION-OPERATIONS',
            'operations/docker/DOCKER-TROUBLESHOOTING-INTERVIEW-REVISION',
          ],
        },
        'operations/MINIO',
        'operations/SHOPVERSE-DOCKER',
        'operations/LOCAL-DOCKER-IMPLEMENTATION-GUIDE',
        'operations/CI-CD-AUTOMATION',
        {
          type: 'category',
          label: 'Jenkins Architect Path',
          link: {type: 'doc', id: 'operations/JENKINS-ARCHITECT-PATH'},
          items: [
            'operations/JENKINS',
            'operations/SHOPVERSE-JENKINS',
            'operations/jenkins/JENKINS-SHARED-LIBRARIES-MULTIBRANCH',
            'operations/jenkins/JENKINS-SCALING-SECURITY-OPERATIONS',
          ],
        },
        'operations/GITHUB-ACTIONS',
        {
          type: 'category',
          label: 'Docusaurus Documentation Engineering',
          link: {type: 'doc', id: 'operations/DOCUSAURUS'},
          items: [
            'operations/DOCUSAURUS-AUTHORING-NAVIGATION',
            'operations/DOCUSAURUS-COMPONENTS-DEPLOYMENT',
          ],
        },
        'operations/DOCUMENT-EXPORTS',
        'operations/SPRING-BOOT-ADMIN',
      ],
    },
    {
      type: 'category',
      label: '7. Cloud And AWS',
      link: {type: 'doc', id: 'cloud/README'},
      collapsed: true,
      items: [
        'cloud/README',
        'cloud/CLOUD-FUNDAMENTALS',
        {
          type: 'category',
          label: 'AWS',
          link: {type: 'doc', id: 'cloud/aws/AWS-UMBRELLA'},
          collapsed: false,
          items: [
            'cloud/aws/AWS-UMBRELLA',
            'cloud/aws/AWS-VPC-NETWORKING',
            'cloud/aws/AWS-COMPUTE-EBS-SCALING',
            'cloud/aws/AWS-ELASTIC-BEANSTALK',
            'cloud/aws/AWS-DATABASES',
            'cloud/aws/AWS-EVENTS-STORAGE',
            'cloud/aws/AWS-LAMBDA-SERVERLESS',
            'cloud/aws/AWS-CLOUDWATCH',
            {
              type: 'category',
              label: 'Amazon EKS Production Engineering',
              link: {type: 'doc', id: 'cloud/aws/EKS-PRODUCTION-ARCHITECT-PATH'},
              items: [
                'cloud/aws/eks/EKS-OPERATIONS-INTERVIEW',
              ],
            },
          ],
        },
        'cloud/CLOUD-AWS-REVISION-SHEET',
      ],
    },
    {
      type: 'category',
      label: '8. Production Platform Engineering',
      items: [
        {
          type: 'category',
          label: 'Integrated Production Capstone',
          link: {type: 'doc', id: 'case-study/PRODUCTION-CAPSTONE-PATH'},
          items: [
            'case-study/production-capstone/CAPSTONE-IMPLEMENTATION-EVIDENCE',
          ],
        },
        'operations/SRE-DR-CHAOS',
        'operations/PERFORMANCE-CAPACITY-FINOPS',
      ],
    },
    {
      type: 'category',
      label: '9. Shopverse Implementation',
      link: {type: 'doc', id: 'case-study/SHOPVERSE'},
      collapsed: true,
      items: [
        {
          type: 'category',
          label: 'Overview And Demo',
          link: {type: 'doc', id: 'case-study/SHOPVERSE'},
          collapsed: false,
          items: [
            'case-study/SHOPVERSE',
            {
              type: 'category',
              label: 'Complete Shopverse Demo',
              link: {type: 'doc', id: 'case-study/COMPLETE-DEMO'},
              items: [
                {
                  type: 'category',
                  label: 'Demo Setup And Checkout',
                  link: {type: 'doc', id: 'case-study/COMPLETE-DEMO-SETUP-CHECKOUT'},
                  items: [
                    'case-study/DEMO-PLATFORM-AUTHENTICATION',
                    'case-study/DEMO-SEED-CHECKOUT-SAGA',
                  ],
                },
                {
                  type: 'category',
                  label: 'Recovery And Observability Proof',
                  link: {type: 'doc', id: 'case-study/COMPLETE-DEMO-RECOVERY-OBSERVABILITY'},
                  items: [
                    'case-study/DEMO-IDEMPOTENCY-OUTBOX-RECOVERY',
                    'case-study/DEMO-OBSERVABILITY-AUTOMATION',
                  ],
                },
              ],
            },
            {
              type: 'category',
              label: 'Shopverse Architecture Audit',
              link: {type: 'doc', id: 'case-study/SHOPVERSE-ONBOARDING-ARCHITECTURE-AUDIT'},
              items: [
                'case-study/SHOPVERSE-ARCHITECTURE-CURRENT-STATE',
                'case-study/SHOPVERSE-ARCHITECTURE-REFACTORING-READINESS',
                'case-study/SHOPVERSE-ARCHITECTURE-REVISION',
              ],
            },
          ],
        },
        {
          type: 'category',
          label: 'Architecture And Services',
          items: [
            {
              type: 'category',
              label: 'Service Landscape',
              link: {type: 'doc', id: 'services/README'},
              items: [
                'services/SERVICE-CATALOG',
                'services/SERVICE-README-AI-CAPABILITY-GAP-MATRIX',
                {
                  type: 'category',
                  label: 'Service README Mirrors',
                  link: {type: 'doc', id: 'services/SERVICE-README-INDEX'},
                  collapsed: true,
                  items: [
                    'services/readmes/API-GATEWAY-README',
                    'services/readmes/AUTH-SERVICE-README',
                    'services/readmes/USER-SERVICE-README',
                    'services/readmes/ORDER-SERVICE-README',
                    'services/readmes/INVENTORY-SERVICE-README',
                    'services/readmes/PAYMENT-SERVICE-README',
                    'services/readmes/CONFIG-SERVER-README',
                    'services/readmes/CLOUD-CONFIGS-README',
                    'services/readmes/DISCOVERY-SERVER-README',
                    'services/readmes/SHOPVERSE-PLATFORM-README',
                    'services/readmes/SHOPVERSE-WEB-README',
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'category',
          label: 'API And Gateway',
          items: [
            'development/API-GUIDE',
          ],
        },
        {
          type: 'category',
          label: 'Implementation Guides',
          collapsed: false,
          items: [
            'development/API-GATEWAY-IMPLEMENTATION-GUIDE',
            'reliability/RATE-LIMITING-IMPLEMENTATION-GUIDE',
            'reliability/SAGA-IMPLEMENTATION-GUIDE',
            'reliability/OUTBOX-IMPLEMENTATION-GUIDE',
            'observability/OBSERVABILITY-IMPLEMENTATION-GUIDE',
            'operations/LOCAL-DOCKER-IMPLEMENTATION-GUIDE',
          ],
        },
        {
          type: 'category',
          label: 'Platform Infrastructure',
          collapsed: false,
          items: [
            'platform/README',
            'platform/DUPLICATE-LOGIC',
            'platform/MIGRATION-CHECKLIST',
            'platform/BEFORE-AFTER-FILES',
            'platform/CONFIG-PROPERTIES',
            'platform/TROUBLESHOOTING',
            'platform/COMMON-ERROR',
            'platform/WEB-PAGINATION',
            'platform/OBSERVABILITY-STARTER',
            'platform/SECURITY-STARTER',
            'platform/KAFKA-PARSING',
            'platform/OUTBOX-STARTER',
            'platform/KAFKA-RECOVERY-STARTER',
          ],
        },
        {
          type: 'category',
          label: 'Checkout Reliability',
          items: [
            'reliability/SAGA-OUTBOX',
            'reliability/SHOPVERSE-SAGA-CODE-FLOW',
            'reliability/TRANSACTIONS',
            'reliability/RESILIENCE4J',
          ],
        },
        {
          type: 'category',
          label: 'Observability',
          items: [
            'observability/OBSERVABILITY',
            'observability/SHOPVERSE-OBSERVABILITY-OPERATIONS',
            {
              type: 'category',
              label: 'Correlation And Trace Propagation',
              link: {type: 'doc', id: 'observability/MDC-CORRELATION-TRACING'},
              items: [
                'observability/CORRELATION-IDENTIFIERS-HTTP-PROPAGATION',
                'observability/MDC-KAFKA-ASYNC-PROPAGATION',
                'observability/DISTRIBUTED-TRACING-INTERNALS-PERFORMANCE',
              ],
            },
            'observability/STRUCTURED-LOGGING',
          ],
        },
        {
          type: 'category',
          label: 'Operations And Testing',
          items: [
            {
              type: 'category',
              label: 'Shopverse Testing Strategy',
              link: {type: 'doc', id: 'development/TESTING'},
              items: [
                'development/TESTING-ARCHITECTURE-COVERAGE',
                'development/TESTING-MODES-CI-TRIAGE',
              ],
            },
            {
              type: 'category',
              label: 'Shopverse Debugging',
              link: {type: 'doc', id: 'development/DEBUGGING'},
              items: [
                'development/DEBUGGING-REQUEST-PLATFORM',
                'development/DEBUGGING-DATA-SAGA-KAFKA',
                'development/DEBUGGING-OBSERVABILITY-RECOVERY',
              ],
            },
          ],
        },
        {
          type: 'category',
          label: 'Problems And Solutions',
          items: [
            'reliability/PROBLEMS-AND-SOLUTIONS',
            'reliability/problems/README',
            'reliability/problems/CURRENT-PROBLEMS-AND-SOLUTIONS',
            {
              type: 'category',
              label: 'Runtime Reliability Problems',
              items: [
                'reliability/problems/RUNTIME-RELIABILITY-PROBLEMS',
                'reliability/problems/runtime/INDEX-AND-LOCKING',
                'reliability/problems/runtime/DISTRIBUTED-CHECKOUT',
                'reliability/problems/runtime/QUERYABLE-ORDER-TIMELINE',
                {
                  type: 'category',
                  label: 'Resource Ownership Authorization',
                  link: {type: 'doc', id: 'reliability/problems/runtime/RESOURCE-OWNERSHIP-AUTHORIZATION'},
                  items: [
                    'reliability/problems/runtime/RESOURCE-OWNERSHIP-SPEL-RUNTIME',
                    'reliability/problems/runtime/RESOURCE-OWNERSHIP-TESTS-OPERATIONS',
                  ],
                },
                {
                  type: 'category',
                  label: 'Reservation Expiry And Recovery',
                  items: [
                    'reliability/problems/runtime/MULTI-REPLICA-RESERVATION-EXPIRY',
                    {
                      type: 'category',
                      label: 'Atomic Inventory Reservation',
                      link: {type: 'doc', id: 'reliability/problems/runtime/ATOMIC-RESERVATION-CLAIM'},
                      items: [
                        'reliability/problems/runtime/RESERVATION-CONTENTION-STATE-MODEL',
                        'reliability/problems/runtime/ATOMIC-CONDITIONAL-RESERVATION-CLAIM',
                        'reliability/problems/runtime/RESERVATION-TRANSACTION-IMPLEMENTATION',
                      ],
                    },
                    'reliability/problems/runtime/TWO-SCHEDULER-RESERVATION-EXAMPLE',
                    'reliability/problems/runtime/LATE-PAYMENT-AFTER-EXPIRY',
                  ],
                },
                'reliability/problems/runtime/IDEMPOTENT-CHECKOUT',
                'reliability/problems/runtime/CATALOG-LOOKUP-CHECKOUT',
                'reliability/problems/runtime/KAFKA-IDEMPOTENCY',
                'reliability/problems/runtime/PAYMENT-TIMEOUT-RECONCILIATION',
              ],
            },
            'reliability/problems/OUTBOX-RUNTIME-PROBLEMS',
            'reliability/problems/ORDER-STATUS-DEAD-TRANSITION-PROBLEM',
            'reliability/problems/DOCKER-RUNTIME-IMAGE-PROBLEMS',
            'reliability/problems/DEPENDENCY-VERIFICATION-PROBLEMS',
            {
              type: 'category',
              label: 'Optimization Solutions',
              items: [
                'reliability/problems/OPTIMIZATION-SOLUTIONS',
                'reliability/problems/optimization/OPTIMIZATION-BASELINE',
                'reliability/problems/optimization/DOCKER-BUILD-CONTEXT-PLATFORM',
                'reliability/problems/optimization/ORDER-SERVICE-TEST-OPTIMIZATION',
                'reliability/problems/optimization/DOCKER-IMAGE-SIZE-OPTIMIZATION',
                'reliability/problems/optimization/JAR-SIZE-OPTIMIZATION',
                'reliability/problems/optimization/DOCKER-COMPOSE-PROFILES',
                'reliability/problems/optimization/GRADLE-DEPENDENCY-OPTIMIZATION',
                'reliability/problems/optimization/GRADLE-BUILD-PERFORMANCE',
                'reliability/problems/optimization/RUNTIME-OPTIMIZATION',
                'reliability/problems/optimization/VERIFICATION-AND-DOCUMENTATION',
              ],
            },
            'reliability/problems/PROBLEMS-SUMMARY-LINKS',
          ],
        },
      ],
    },
  ],
};

export default sidebars;
