import React, {useEffect, useMemo, useState} from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {
  BarChart3,
  BookOpenCheck,
  Check,
  ChevronDown,
  Code2,
  Copy,
  Filter,
  RotateCcw,
  Route,
  Search,
  Sparkles,
} from 'lucide-react';
import {walmartCodingSolutions} from '@site/src/data/walmartCodingSolutions';
import styles from './styles.module.css';

type Question = {
  id: number;
  topic: string;
  prompt: string;
  priority: number;
  occurrences: number;
};

const topicNames: Record<string, string> = {
  'CORE JAVA AND COLLECTIONS': 'Core Java and Collections',
  'CONCURRENCY AND JVM': 'Concurrency and JVM',
  'JAVA LANGUAGE, JAVA 8 AND PATTERNS': 'Java Language, Java 8 and Patterns',
  'SPRING CORE AND BOOT': 'Spring Core and Boot',
  'TRANSACTIONS AND HIBERNATE/JPA': 'Transactions and Hibernate/JPA',
  'REST APIS AND SECURITY': 'REST APIs and Security',
  'SQL, NOSQL AND CACHING': 'SQL, NoSQL and Caching',
  'KAFKA AND MESSAGING': 'Kafka and Messaging',
  'MICROSERVICES AND DISTRIBUTED TRANSACTIONS': 'Microservices and Distributed Transactions',
  'DOCKER, KUBERNETES AND OPENSHIFT': 'Docker, Kubernetes and OpenShift',
  'SYSTEM DESIGN, PERFORMANCE AND LEADERSHIP': 'System Design, Performance and Leadership',
  'CODING AND DSA': 'Coding and DSA',
};

const priorityLabels: Record<number, string> = {
  5: 'P0 · Must master',
  4: 'P1 · High value',
  3: 'P2 · Broaden later',
};

const topicGuides: Record<string, {href: string; label: string; points: string[]}> = {
  'Core Java and Collections': {
    href: '/java/CORE-JAVA-DEEP-DIVE',
    label: 'Core Java Deep Dive',
    points: ['State the public contract and invariant first.', 'Explain the relevant data structure or runtime mechanism.', 'Give average and worst-case behavior, including equality or mutability hazards.', 'Close with a concrete Java example and when you would choose an alternative.'],
  },
  'Concurrency and JVM': {
    href: '/java/JAVA-CONCURRENCY-DESIGN-REVIEW',
    label: 'Java Concurrency Design Review',
    points: ['Separate atomicity, visibility and ordering guarantees.', 'Name the ownership, synchronization or memory-model boundary.', 'Describe contention, starvation, leak or failure behavior.', 'Explain how you would test and diagnose the behavior in production.'],
  },
  'Java Language, Java 8 and Patterns': {
    href: '/java/JAVA-REVISION-SHEET',
    label: 'Java Revision Sheet',
    points: ['Define the language or pattern contract precisely.', 'Show a minimal example and the runtime or compiler consequence.', 'Compare the nearest alternative and its trade-offs.', 'Mention misuse, edge cases and a production use case.'],
  },
  'Spring Core and Boot': {
    href: '/spring/SPRING-REVISION-SHEET',
    label: 'Spring Revision Sheet',
    points: ['Name the container, proxy or request-lifecycle component involved.', 'Walk through the runtime sequence rather than listing annotations.', 'Explain configuration, scope and failure-boundary implications.', 'Finish with testing and observability signals.'],
  },
  'Transactions and Hibernate/JPA': {
    href: '/data/HIBERNATE',
    label: 'Hibernate And JPA Guide',
    points: ['Place the transaction and persistence-context boundary.', 'Explain proxy, flush, locking or isolation behavior involved.', 'Cover concurrency, rollback and stale-data failure modes.', 'State the query and operational evidence you would inspect.'],
  },
  'REST APIs and Security': {
    href: '/development/REST-API-PRODUCTION-DESIGN',
    label: 'REST API Production Design',
    points: ['Start with the HTTP contract, validation and status semantics.', 'Enforce authentication, object ownership and authorization at the service boundary.', 'Cover idempotency, pagination, retries and compatibility where relevant.', 'Describe safe errors, audit evidence and abuse controls.'],
  },
  'SQL, NoSQL and Caching': {
    href: '/data/DATABASE-REVISION-SHEET',
    label: 'Database Revision Sheet',
    points: ['Define the consistency, access-pattern and latency requirements.', 'Explain the storage/index/cache mechanism and its cost.', 'Cover concurrency, invalidation, skew and failure recovery.', 'Use query plans, metrics or correctness checks as evidence.'],
  },
  'Kafka and Messaging': {
    href: '/integration/KAFKA-REVISION-SHEET',
    label: 'Kafka Revision Sheet',
    points: ['Identify the producer key, partition and consumer-group boundary.', 'Explain delivery, ordering and offset behavior precisely.', 'Cover duplicates, retries, poison records, DLT and replay safety.', 'Name the lag, throughput and recovery signals you would monitor.'],
  },
  'Microservices and Distributed Transactions': {
    href: '/architecture/microservices/MICROSERVICES-INTERVIEW-WORKBOOK',
    label: 'Microservices Interview Workbook',
    points: ['Start with service ownership and the consistency boundary.', 'Trace the happy path and every asynchronous failure transition.', 'Explain idempotency, timeout, compensation and durable intent.', 'Include correlation, recovery evidence and operator actions.'],
  },
  'Docker, Kubernetes and OpenShift': {
    href: '/operations/kubernetes/KUBERNETES-OVERVIEW',
    label: 'Kubernetes Overview',
    points: ['Name the control-plane and workload resources involved.', 'Trace reconciliation, scheduling, networking or probe behavior.', 'Cover resource pressure, rollout and termination failure modes.', 'State the events, conditions, logs and metrics used for diagnosis.'],
  },
  'System Design, Performance and Leadership': {
    href: '/leadership/LEADERSHIP-ARCHITECTURE-INTERVIEW-WORKBOOK',
    label: 'Leadership And Architecture Interview Workbook',
    points: ['Clarify functional requirements, scale and quality attributes.', 'Estimate capacity before selecting components.', 'Explain data ownership, critical flows and failure recovery.', 'Defend trade-offs with SLOs, observability and an evolution path.'],
  },
  'Coding and DSA': {
    href: '/data-structures/DSA-INTERVIEW-QUESTION-BANK',
    label: 'Java DSA Interview Question Bank',
    points: ['Clarify input, output and edge cases.', 'State the invariant before coding.', 'Dry-run a representative example.', 'Give time and space complexity and test boundaries.'],
  },
};

function CodeSolution({question}: {question: Question}) {
  const [copied, setCopied] = useState(false);
  const solution = walmartCodingSolutions[question.id];
  if (!solution) return null;
  const copyCode = async () => {
    await navigator.clipboard.writeText(solution.code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  return <div className={styles.codeSolution}>
    <div className={styles.solutionBlock}><strong>Approach</strong><p>{solution.approach}</p></div>
    <div className={styles.complexity}><Code2 aria-hidden="true" /><strong>{solution.complexity}</strong></div>
    <div className={styles.codeHeader}><span>Java solution</span><button type="button" onClick={() => void copyCode()}>{copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}{copied ? 'Copied' : 'Copy code'}</button></div>
    <pre><code>{solution.code}</code></pre>
    <div className={styles.solutionBlock}><strong>Interview notes</strong><ul>{solution.notes.map((note) => <li key={note}>{note}</li>)}</ul></div>
  </div>;
}

function AnswerGuide({question}: {question: Question}) {
  const guide = topicGuides[question.topic];
  const hasProgram = Boolean(walmartCodingSolutions[question.id]);
  return <div className={styles.answerBody}>
    <div className={styles.answerLabel}>{hasProgram ? <Code2 aria-hidden="true" /> : <BookOpenCheck aria-hidden="true" />}<strong>{hasProgram ? 'Program and solution' : 'Answer framework'}</strong></div>
    {hasProgram ? <CodeSolution question={question} /> : <>
      <p className={styles.promptCue}><strong>Apply the framework directly to:</strong> {question.prompt}</p>
      <div className={styles.solutionBlock}><strong>A strong answer should cover</strong><ol>{guide.points.map((point) => <li key={point}>{point}</li>)}</ol></div>
    </>}
    <Link className={styles.studyRoute} to={guide.href}><Route aria-hidden="true" /><span><small>Canonical study route</small><strong>{guide.label}</strong></span></Link>
  </div>;
}

function QuestionItem({question}: {question: Question}) {
  return <details className={styles.questionDetails}>
    <summary>
      <span className={styles.questionId}>#{String(question.id).padStart(3, '0')}</span>
      <span className={styles.questionTitle}>{question.prompt}</span>
      <span className={styles.summaryMeta}><span data-priority={question.priority}>{priorityLabels[question.priority]}</span>{walmartCodingSolutions[question.id] ? <span className={styles.programBadge}>Java program</span> : null}</span>
      <ChevronDown aria-hidden="true" />
    </summary>
    <AnswerGuide question={question} />
  </details>;
}

function TopicQuestionGroup({name, questions, defaultOpen, forceOpen}: {name: string; questions: Question[]; defaultOpen: boolean; forceOpen: boolean}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = `question-group-content-${questions[0].id}`;
  useEffect(() => { if (forceOpen) setOpen(true); }, [forceOpen]);
  return <section className={styles.topicGroup} aria-labelledby={`question-group-${questions[0].id}`}>
    <header>
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls={contentId}>
        <div><span>{questions.length}</span><h3 id={`question-group-${questions[0].id}`}>{name}</h3></div>
        <small>Expand this group for {name === 'Coding and DSA' ? 'Java solutions' : 'answer frameworks'}</small>
        <ChevronDown aria-hidden="true" />
      </button>
    </header>
    {open ? <div className={styles.groupQuestions} id={contentId}>{questions.map((question) => <QuestionItem question={question} key={question.id} />)}</div> : null}
  </section>;
}

function parseQuestionBank(source: string): Question[] {
  const lines = source.split(/\r?\n/);
  const questions: Question[] = [];
  let topic = '';

  for (let index = 0; index < lines.length; index += 1) {
    const topicMatch = lines[index].match(/^=== (.+) ===$/);
    if (topicMatch) {
      topic = topicNames[topicMatch[1]] ?? topicMatch[1];
      continue;
    }

    const questionMatch = lines[index].match(/^(\d{3})\.\s+([*-]{5})\s+\|\s+Source occurrences:\s+(\d+)$/);
    if (!questionMatch || !topic) continue;

    const prompt = lines.slice(index + 1).find((line) => line.trim())?.trim();
    if (!prompt) continue;
    questions.push({
      id: Number(questionMatch[1]),
      topic,
      prompt,
      priority: questionMatch[2].split('').filter((value) => value === '*').length,
      occurrences: Number(questionMatch[3]),
    });
  }

  return questions;
}

export function WalmartQuestionExplorer() {
  const sourceUrl = useBaseUrl('/downloads/interview/walmart-interview-questionnaire.txt');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('all');
  const [priority, setPriority] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch(sourceUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`Question bank request failed (${response.status}).`);
        return response.text();
      })
      .then((source) => {
        if (!active) return;
        const parsed = parseQuestionBank(source);
        if (parsed.length !== 209) throw new Error(`Expected 209 questions but found ${parsed.length}.`);
        setQuestions(parsed);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Question bank could not be loaded.');
      });
    return () => { active = false; };
  }, [sourceUrl]);

  const topics = useMemo(() => Array.from(new Set(questions.map((question) => question.topic))), [questions]);
  const topicCounts = useMemo(() => topics.map((name) => ({
    name,
    count: questions.filter((question) => question.topic === name).length,
  })), [questions, topics]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return questions.filter((question) => {
      const matchesQuery = !normalizedQuery
        || question.prompt.toLocaleLowerCase().includes(normalizedQuery)
        || question.topic.toLocaleLowerCase().includes(normalizedQuery)
        || walmartCodingSolutions[question.id]?.approach.toLocaleLowerCase().includes(normalizedQuery);
      return matchesQuery
        && (topic === 'all' || question.topic === topic)
        && (priority === 'all' || question.priority === Number(priority));
    });
  }, [priority, query, questions, topic]);

  const updateQuery = (value: string) => setQuery(value);
  const updateTopic = (value: string) => setTopic(value);
  const updatePriority = (value: string) => setPriority(value);
  const resetFilters = () => {
    setQuery('');
    setTopic('all');
    setPriority('all');
  };
  const hasFilters = Boolean(query || topic !== 'all' || priority !== 'all');
  const maxTopicCount = Math.max(...topicCounts.map(({count}) => count), 1);
  const groupedQuestions = topics.map((name) => ({
    name,
    questions: filtered.filter((question) => question.topic === name),
  })).filter((group) => group.questions.length);

  return <section className={styles.explorer} aria-labelledby="question-explorer-heading">
    <header className={styles.hero}>
      <div className={styles.heroCopy}>
        <span className={styles.eyebrow}><Sparkles aria-hidden="true" /> Interactive study index</span>
        <h2 id="question-explorer-heading">Find the next question worth practising</h2>
        <p>Browse questions by topic, filter the complete index, then expand answer frameworks or runnable Java solutions.</p>
      </div>
      <div className={styles.heroMetric} aria-label={`${questions.length || 209} indexed questions`}>
        <strong>{questions.length || 209}</strong>
        <span>indexed prompts</span>
      </div>
    </header>

    <div className={styles.metrics} aria-label="Question bank summary">
      <article><BookOpenCheck aria-hidden="true" /><div><strong>{questions.length || '—'}</strong><span>Total prompts</span></div></article>
      <article><BarChart3 aria-hidden="true" /><div><strong>{topics.length || '—'}</strong><span>Topic groups</span></div></article>
      <article><Code2 aria-hidden="true" /><div><strong>{Object.keys(walmartCodingSolutions).length}</strong><span>Java programs</span></div></article>
      <article><Filter aria-hidden="true" /><div><strong>{questions.length ? filtered.length : '—'}</strong><span>Current results</span></div></article>
    </div>

    {topicCounts.length ? <section className={styles.distribution} aria-labelledby="topic-distribution-heading">
      <div className={styles.sectionHeading}>
        <div><BarChart3 aria-hidden="true" /><h3 id="topic-distribution-heading">Question distribution</h3></div>
        <span>Prompts per topic</span>
      </div>
      <div className={styles.bars}>
        {topicCounts.map(({name, count}) => <button
          type="button"
          className={topic === name ? styles.activeBar : undefined}
          key={name}
          onClick={() => updateTopic(topic === name ? 'all' : name)}
          aria-pressed={topic === name}
          title={`Filter to ${name}`}
        >
          <span className={styles.barLabel}>{name}</span>
          <span className={styles.barTrack} aria-hidden="true"><span style={{width: `${(count / maxTopicCount) * 100}%`}} /></span>
          <strong>{count}</strong>
        </button>)}
      </div>
    </section> : null}

    <div className={styles.controls}>
      <label className={styles.searchField}>
        <span>Search questions</span>
        <div><Search aria-hidden="true" /><input type="search" value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="Try HashMap, idempotency, Kafka…" /></div>
      </label>
      <label><span>Topic</span><select value={topic} onChange={(event) => updateTopic(event.target.value)}><option value="all">All topics</option>{topics.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
      <label><span>Priority</span><select value={priority} onChange={(event) => updatePriority(event.target.value)}><option value="all">All priorities</option><option value="5">P0 · Must master</option><option value="4">P1 · High value</option><option value="3">P2 · Broaden later</option></select></label>
      <button className={styles.reset} type="button" onClick={resetFilters} disabled={!hasFilters}><RotateCcw aria-hidden="true" /> Reset</button>
    </div>

    {error ? <div className={styles.error} role="alert"><strong>Interactive index unavailable.</strong><span>{error} Use the downloadable text or Excel tracker below.</span></div> : null}
    {!error && !questions.length ? <div className={styles.loading} role="status"><span /><span /><span /> Loading the question index…</div> : null}

    {questions.length ? <>
      <div className={styles.resultsHeading} aria-live="polite">
        <strong>{filtered.length} {filtered.length === 1 ? 'question' : 'questions'}</strong>
        <span>{hasFilters ? 'match the active filters' : 'in the complete index'}</span>
      </div>
      {filtered.length ? <div className={styles.groupList}>
        {groupedQuestions.map((group, index) => <TopicQuestionGroup name={group.name} questions={group.questions} defaultOpen={index === 0} forceOpen={hasFilters} key={group.name} />)}
      </div> : <div className={styles.empty}><Search aria-hidden="true" /><h3>No questions match</h3><p>Try a broader term or reset one of the filters.</p><button type="button" onClick={resetFilters}>Clear all filters</button></div>}
    </> : null}
  </section>;
}
