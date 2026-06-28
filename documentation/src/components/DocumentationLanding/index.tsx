import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {
  Activity,
  ArrowRight,
  BookOpen,
  Boxes,
  Braces,
  CloudCog,
  Code2,
  Container,
  Database,
  GitBranch,
  GraduationCap,
  KeyRound,
  Network,
  SearchCheck,
  ServerCog,
  ShieldCheck,
  Workflow,
} from 'lucide-react';
import styles from './styles.module.css';

type Topic = {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
  meta: string;
};

const topics: Topic[] = [
  {
    title: 'Java',
    description: 'OOP, collections, streams, Java 8-26, concurrency, and practical interview questions.',
    href: '/java/JAVA-OOP',
    icon: <Braces aria-hidden="true" />,
    meta: 'Language foundation',
  },
  {
    title: 'Spring Ecosystem',
    description: 'Boot internals, REST, Data JPA, Security, Cloud, validation, caching, and testing.',
    href: '/spring/SPRING-ECOSYSTEM',
    icon: <Code2 aria-hidden="true" />,
    meta: 'Application platform',
  },
  {
    title: 'Data Engineering',
    description: 'Relational design, Hibernate, Liquibase, transactions, indexes, and query optimization.',
    href: '/data/DATABASE-ENGINEERING',
    icon: <Database aria-hidden="true" />,
    meta: 'Persistence',
  },
  {
    title: 'Microservices',
    description: 'Service boundaries, gateways, discovery, load balancing, Feign, and Kafka integration.',
    href: '/architecture/MICROSERVICES-GENERIC',
    icon: <Network aria-hidden="true" />,
    meta: 'Architecture',
  },
  {
    title: 'Distributed Systems',
    description: 'CAP, consistency, SAGA, outbox, locks, CQRS, resilience, and high availability.',
    href: '/architecture/DISTRIBUTED-SYSTEMS-GENERIC',
    icon: <GitBranch aria-hidden="true" />,
    meta: 'Reliability',
  },
  {
    title: 'Security',
    description: 'Spring Security filters, JWT, OAuth2, JWKS, RBAC, method security, and hardening.',
    href: '/security/SPRING-SECURITY-GENERIC',
    icon: <ShieldCheck aria-hidden="true" />,
    meta: 'Identity and access',
  },
  {
    title: 'Observability',
    description: 'Structured logs, MDC, metrics, Prometheus, Loki, Grafana, tracing, and alerting.',
    href: '/observability/LOGGING-GENERIC',
    icon: <Activity aria-hidden="true" />,
    meta: 'Operations',
  },
  {
    title: 'Delivery',
    description: 'Docker, Jenkins, GitHub Actions, deployment strategies, and operational commands.',
    href: '/operations/CI-CD-AUTOMATION',
    icon: <Container aria-hidden="true" />,
    meta: 'CI/CD',
  },
];

const caseStudyTopics: Topic[] = [
  {
    title: 'System Design',
    description: 'Understand service ownership, synchronous calls, Kafka events, databases, and infrastructure.',
    href: '/architecture/SYSTEM-DESIGN',
    icon: <Boxes aria-hidden="true" />,
    meta: 'Start here',
  },
  {
    title: 'Secure API Flow',
    description: 'Follow login, RSA JWT signing, JWKS validation, roles, permissions, and ownership checks.',
    href: '/security/JWT-OAUTH2-SPRING-SECURITY',
    icon: <KeyRound aria-hidden="true" />,
    meta: 'Authentication',
  },
  {
    title: 'Checkout SAGA',
    description: 'Trace checkout through Order, Inventory, Payment, outbox publication, and compensation.',
    href: '/reliability/SHOPVERSE-SAGA-CODE-FLOW',
    icon: <Workflow aria-hidden="true" />,
    meta: 'Core workflow',
  },
  {
    title: 'Observability',
    description: 'Investigate one transaction through JSON logs, correlation IDs, metrics, and traces.',
    href: '/observability/SHOPVERSE-OBSERVABILITY-OPERATIONS',
    icon: <SearchCheck aria-hidden="true" />,
    meta: 'Troubleshooting',
  },
  {
    title: 'Testing',
    description: 'Use unit, integration, Testcontainers, and bounded Docker verification modes.',
    href: '/development/TESTING',
    icon: <ServerCog aria-hidden="true" />,
    meta: 'Verification',
  },
  {
    title: 'Delivery',
    description: 'Build production-style images and automate validation with GitHub Actions and Jenkins.',
    href: '/operations/SHOPVERSE-DOCKER',
    icon: <CloudCog aria-hidden="true" />,
    meta: 'Deployment',
  },
];

function TopicGrid({items}: {items: Topic[]}) {
  return (
    <div className={styles.topicGrid}>
      {items.map((item) => (
        <Link className={styles.topicCard} to={item.href} key={item.title}>
          <span className={styles.topicIcon}>{item.icon}</span>
          <span className={styles.topicBody}>
            <span className={styles.topicMeta}>{item.meta}</span>
            <span className={styles.topicTitle}>{item.title}</span>
            <span className={styles.topicDescription}>{item.description}</span>
          </span>
          <ArrowRight className={styles.topicArrow} aria-hidden="true" />
        </Link>
      ))}
    </div>
  );
}

function LandingHero({
  eyebrow,
  title,
  description,
  primary,
  secondary,
  stats,
}: {
  eyebrow: string;
  title: string;
  description: string;
  primary: {label: string; href: string};
  secondary: {label: string; href: string};
  stats: Array<{value: string; label: string}>;
}) {
  return (
    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className={styles.heroActions}>
          <Link className={styles.primaryAction} to={primary.href}>
            {primary.label}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <Link className={styles.secondaryAction} to={secondary.href}>
            {secondary.label}
          </Link>
        </div>
      </div>
      <div className={styles.stats} aria-label="Documentation summary">
        {stats.map((stat) => (
          <div className={styles.stat} key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function KnowledgeHome() {
  return (
    <>
      <LandingHero
        eyebrow="Backend engineering reference"
        title="Learn the concepts. Inspect the implementation."
        description="A structured library for Java, Spring, data, distributed systems, security, observability, and delivery, connected to a working Shopverse microservices case study."
        primary={{label: 'Follow the learning path', href: '/reference/LEARNING-PATH'}}
        secondary={{label: 'Explore Shopverse', href: '/case-study/SHOPVERSE'}}
        stats={[
          {value: '8', label: 'knowledge domains'},
          {value: '3', label: 'verification levels'},
          {value: '1', label: 'complete case study'},
        ]}
      />

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.sectionKicker}>Browse by subject</span>
            <h2>Knowledge domains</h2>
          </div>
          <p>Start with a topic or follow the learning path in dependency order.</p>
        </div>
        <TopicGrid items={topics} />
      </section>

      <section className={styles.pathBand}>
        <div>
          <GraduationCap aria-hidden="true" />
          <span>
            <strong>New to the material?</strong>
            Study Java and Spring first, then data, communication, distributed consistency, and operations.
          </span>
        </div>
        <Link to="/reference/LEARNING-PATH">
          Open learning path
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </section>
    </>
  );
}

export function ShopverseHome() {
  return (
    <>
      <LandingHero
        eyebrow="Production-oriented case study"
        title="Shopverse"
        description="An observable, failure-aware commerce platform demonstrating secure and idempotent checkout across independently persisted services."
        primary={{label: 'Open system design', href: '/architecture/SYSTEM-DESIGN'}}
        secondary={{label: 'Run the feature demos', href: '/reference/FEATURES-AND-DEMOS'}}
        stats={[
          {value: '8', label: 'Spring services'},
          {value: '3', label: 'commerce databases'},
          {value: '5', label: 'core SAGA events'},
        ]}
      />

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.sectionKicker}>Implementation guide</span>
            <h2>Explore the platform</h2>
          </div>
          <p>Move from topology to business flow, then investigate security, operations, and delivery.</p>
        </div>
        <TopicGrid items={caseStudyTopics} />
      </section>
    </>
  );
}

export function DocFigure({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption: string;
}) {
  const imageUrl = useBaseUrl(src);

  return (
    <figure className={styles.figure}>
      <a href={imageUrl} target="_blank" rel="noreferrer" aria-label={`Open full-size image: ${alt}`}>
        <img src={imageUrl} alt={alt} loading="lazy" />
      </a>
      <figcaption>
        <span>{caption}</span>
        <a href={imageUrl} target="_blank" rel="noreferrer">
          Open full size
        </a>
      </figcaption>
    </figure>
  );
}

export function ReadingGuide({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <aside className={styles.readingGuide}>
      <BookOpen aria-hidden="true" />
      <div>{children}</div>
    </aside>
  );
}

const learningStages = [
  {
    number: '01',
    title: 'Java and foundations',
    description: 'Language, OOP, collections, streams, concurrency, design principles, and REST.',
    href: '#stage-1-java-and-engineering-foundations',
    icon: <Braces aria-hidden="true" />,
  },
  {
    number: '02',
    title: 'Spring ecosystem',
    description: 'Boot internals, web APIs, validation, dependency injection, and testing.',
    href: '#stage-2-spring-ecosystem',
    icon: <Code2 aria-hidden="true" />,
  },
  {
    number: '03',
    title: 'Data and persistence',
    description: 'Relational design, Hibernate, JPA, Liquibase, queries, and transactions.',
    href: '#stage-3-data-and-persistence',
    icon: <Database aria-hidden="true" />,
  },
  {
    number: '04',
    title: 'Service communication',
    description: 'Microservices, gateways, discovery, load balancing, Feign, and Kafka.',
    href: '#stage-4-microservice-communication',
    icon: <Network aria-hidden="true" />,
  },
  {
    number: '05',
    title: 'Distributed consistency',
    description: 'CAP, SAGA, outbox, CQRS, locks, resilience, and high availability.',
    href: '#stage-5-distributed-consistency',
    icon: <GitBranch aria-hidden="true" />,
  },
  {
    number: '06',
    title: 'Security',
    description: 'Spring Security, JWT, OAuth2, RBAC, method security, and ownership.',
    href: '#stage-6-security',
    icon: <ShieldCheck aria-hidden="true" />,
  },
  {
    number: '07',
    title: 'Observability and delivery',
    description: 'Logs, metrics, traces, Docker, CI/CD, deployment, and troubleshooting.',
    href: '#stage-7-observability-and-operations',
    icon: <Activity aria-hidden="true" />,
  },
];

export function LearningRoadmap() {
  return (
    <nav className={styles.roadmap} aria-label="Backend engineering learning stages">
      {learningStages.map((stage) => (
        <a className={styles.roadmapStep} href={stage.href} key={stage.number}>
          <span className={styles.roadmapNumber}>{stage.number}</span>
          <span className={styles.roadmapIcon}>{stage.icon}</span>
          <span className={styles.roadmapCopy}>
            <strong>{stage.title}</strong>
            <span>{stage.description}</span>
          </span>
          <ArrowRight aria-hidden="true" />
        </a>
      ))}
    </nav>
  );
}
