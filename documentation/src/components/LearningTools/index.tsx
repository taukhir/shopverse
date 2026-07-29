import React, {useEffect, useId, useMemo, useRef, useState} from 'react';
import Link from '@docusaurus/Link';
import {Check, ChevronLeft, ChevronRight, Clipboard, Copy, RefreshCw, Search, Shuffle, X} from 'lucide-react';
import styles from './styles.module.css';

export type WalkthroughStep = {title: string; code: string; explanation: string};
export type DryRunStep = {title: string; action: string; state?: string; result: string};
export type TopicNode = {title: string; description?: string; href?: string; children?: TopicNode[]};
export type PracticeQuestion = {question: string; answer: string; difficulty?: 'Beginner'|'Intermediate'|'Advanced'};

export function CodeWalkthrough({title = 'Code walkthrough', language = 'java', steps}: {title?: string; language?: string; steps: WalkthroughStep[]}) {
  const [active, setActive] = useState(0);
  const step = steps[active];
  return <section className={styles.tool} aria-label={title}>
    <header><div><span>Interactive code</span><h3>{title}</h3></div><strong>{active + 1}/{steps.length}</strong></header>
    <div className={styles.stepTabs} role="tablist" aria-label={`${title} steps`}>
      {steps.map((item, index) => <button key={item.title} type="button" role="tab" aria-selected={active === index} onClick={() => setActive(index)}>{index + 1}. {item.title}</button>)}
    </div>
    <div className={styles.walkthroughGrid}>
      <pre aria-label={`${step.title} ${language} code`}><code>{step.code}</code></pre>
      <div><small>How it works</small><strong>{step.title}</strong><p>{step.explanation}</p></div>
    </div>
  </section>;
}

export function StepByStepDryRun({title = 'Step-by-step dry run', steps}: {title?: string; steps: DryRunStep[]}) {
  const [current, setCurrent] = useState(0);
  const step = steps[current];
  return <section className={styles.tool} aria-label={title}>
    <header><div><span>Trace execution</span><h3>{title}</h3></div><strong>{current + 1}/{steps.length}</strong></header>
    <div className={styles.stepMeter} aria-label={`Step ${current + 1} of ${steps.length}`}>{steps.map((item, index) => <span key={item.title} className={index <= current ? styles.done : ''} />)}</div>
    <div className={styles.dryRunBody} aria-live="polite">
      <small>Step {current + 1}</small><h4>{step.title}</h4>
      <dl><div><dt>Action</dt><dd>{step.action}</dd></div>{step.state && <div><dt>State</dt><dd><code>{step.state}</code></dd></div>}<div><dt>Result</dt><dd>{step.result}</dd></div></dl>
    </div>
    <footer className={styles.navigation}>
      <button type="button" onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0}><ChevronLeft />Previous</button>
      <button type="button" onClick={() => setCurrent(0)} disabled={current === 0}><RefreshCw />Reset</button>
      <button type="button" onClick={() => setCurrent(Math.min(steps.length - 1, current + 1))} disabled={current === steps.length - 1}>Next<ChevronRight /></button>
    </footer>
  </section>;
}

export function CopyableCommandGroup({title, commands, shell = 'bash'}: {title: string; commands: string; shell?: string}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { await navigator.clipboard.writeText(commands.trim()); setCopied(true); window.setTimeout(() => setCopied(false), 1600); };
  return <section className={styles.commandGroup}>
    <header><div><Clipboard /><span><strong>{title}</strong><small>{shell}</small></span></div><button type="button" onClick={copy}>{copied ? <Check /> : <Copy />}{copied ? 'Copied all' : 'Copy all'}</button></header>
    <pre><code>{commands.trim()}</code></pre>
  </section>;
}

export function PatternComparison({title = 'Pattern comparison', columns, rows}: {title?: string; columns: string[]; rows: Array<{criterion: string; values: string[]}>}) {
  return <section className={styles.comparisonTable} aria-label={title}><h3>{title}</h3><div><table><thead><tr><th>Decision</th>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.criterion}><th>{row.criterion}</th>{columns.map((column, index) => <td key={`${row.criterion}-${column}`}>{row.values[index] ?? '—'}</td>)}</tr>)}</tbody></table></div></section>;
}

function nodeMatches(node: TopicNode, query: string): boolean { return `${node.title} ${node.description ?? ''}`.toLowerCase().includes(query) || Boolean(node.children?.some((child) => nodeMatches(child, query))); }
function TopicBranch({node, forceOpen}: {node: TopicNode; forceOpen: boolean}) {
  if (!node.children?.length) return <li className={styles.topicLeaf}>{node.href ? <Link to={node.href}>{node.title}</Link> : <strong>{node.title}</strong>}{node.description && <span>{node.description}</span>}</li>;
  const detailsRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => { if (forceOpen && detailsRef.current) detailsRef.current.open = true; }, [forceOpen]);
  return <li><details ref={detailsRef} open={forceOpen}><summary><strong>{node.title}</strong><span>{node.children.length} topics</span></summary>{node.description && <p>{node.description}</p>}<ul>{node.children.map((child) => <TopicBranch key={child.title} node={child} forceOpen={forceOpen} />)}</ul></details></li>;
}

export function InteractiveTopicTree({title, items}: {title: string; items: TopicNode[]}) {
  const searchId = useId(); const [query, setQuery] = useState(''); const normalized = query.trim().toLowerCase();
  const visible = useMemo(() => normalized ? items.filter((item) => nodeMatches(item, normalized)) : items, [items, normalized]);
  return <section className={styles.topicTree} aria-labelledby={`${searchId}-title`}><header><div><span>Explore the hierarchy</span><h3 id={`${searchId}-title`}>{title}</h3></div><label><Search /><span className="sr-only">Filter {title}</span><input id={searchId} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter topics" />{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear topic filter"><X /></button>}</label></header><ul>{visible.map((item) => <TopicBranch key={item.title} node={item} forceOpen={Boolean(normalized)} />)}</ul>{!visible.length && <p className={styles.empty}>No matching topics.</p>}</section>;
}

export function InterviewPractice({title = 'Interview practice', questions}: {title?: string; questions: PracticeQuestion[]}) {
  const [order, setOrder] = useState(() => questions.map((_, index) => index)); const [position, setPosition] = useState(0); const [revealed, setRevealed] = useState(false); const [known, setKnown] = useState<Set<number>>(() => new Set());
  const questionIndex = order[position]; const current = questions[questionIndex];
  const rate = (remembered: boolean) => { if (remembered) setKnown((values) => new Set(values).add(questionIndex)); setRevealed(false); setPosition((value) => Math.min(order.length - 1, value + 1)); };
  const shuffle = () => { setOrder((values) => [...values].sort(() => Math.random() - 0.5)); setPosition(0); setRevealed(false); setKnown(new Set()); };
  return <section className={styles.practice} aria-label={title}><header><div><span>Active recall</span><h3>{title}</h3></div><button type="button" onClick={shuffle}><Shuffle />Shuffle</button></header><div className={styles.practiceStats}><span>{position + 1} of {questions.length}</span><span>{known.size} confident</span><span>{current.difficulty ?? 'Mixed'} difficulty</span></div><div className={styles.question}><small>Question</small><h4>{current.question}</h4>{revealed ? <div className={styles.answer} aria-live="polite"><small>Answer</small><p>{current.answer}</p></div> : <button type="button" onClick={() => setRevealed(true)}>Reveal answer</button>}</div><footer className={styles.navigation}><button type="button" onClick={() => {setPosition(Math.max(0, position - 1)); setRevealed(false);}} disabled={position === 0}><ChevronLeft />Previous</button>{revealed && <><button type="button" onClick={() => rate(false)}>Review again</button><button type="button" onClick={() => rate(true)}>I knew this<Check /></button></>}</footer></section>;
}
