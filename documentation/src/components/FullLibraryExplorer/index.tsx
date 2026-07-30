import React, {useMemo, useState} from 'react';
import Link from '@docusaurus/Link';
import catalog from '@site/src/data/generatedDocCatalog.json';
import {CheckCircle2, Code2, FlaskConical, Search, ShieldCheck, X} from 'lucide-react';
import styles from './styles.module.css';

type Entry = (typeof catalog)[number];

const freshnessOptions = [
  'All',
  'Fresh (90 days)',
  'Review soon (91-180 days)',
  'Potentially outdated (180+ days)',
];

export default function FullLibraryExplorer() {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('All');
  const [difficulty, setDifficulty] = useState('All');
  const [type, setType] = useState('All');
  const [technology, setTechnology] = useState('All');
  const [status, setStatus] = useState('All');
  const [scope, setScope] = useState('All');
  const [owner, setOwner] = useState('All');
  const [feature, setFeature] = useState('All');
  const [freshness, setFreshness] = useState('All');
  const [reviewedAfter, setReviewedAfter] = useState('');

  const values = (key: keyof Entry) => ['All', ...Array.from(new Set(catalog
    .flatMap((item) => Array.isArray(item[key]) ? item[key] as string[] : [String(item[key])])
    .filter(Boolean))).sort()];
  const topics = values('topic');
  const difficulties = values('difficulty');
  const types = values('pageType');
  const technologies = ['All', ...Array.from(new Set(catalog.flatMap((item) => item.technologies))).sort()];
  const statuses = values('status');
  const scopes = values('scope');
  const owners = values('owner');

  const pages = useMemo(() => catalog.filter((item) => {
    const text = `${item.title} ${item.topic} ${item.pageType} ${item.scope} ${item.owner} ${item.technologies.join(' ')}`.toLowerCase();
    const days = item.lastReviewed
      ? Math.floor((Date.now() - new Date(`${item.lastReviewed}T00:00:00`).getTime()) / 86_400_000)
      : Number.POSITIVE_INFINITY;
    const featureMatch = feature === 'All'
      || (feature === 'Interview' && item.hasInterview)
      || (feature === 'Code' && item.hasCode)
      || (feature === 'Labs' && item.isLab)
      || (feature === 'Runbooks' && item.isRunbook)
      || (feature === 'Officially verified' && item.verifiedOfficial);
    const freshMatch = freshness === 'All'
      || (freshness === 'Fresh (90 days)' && days <= 90)
      || (freshness === 'Review soon (91-180 days)' && days > 90 && days <= 180)
      || (freshness === 'Potentially outdated (180+ days)' && days > 180);
    return (!query || text.includes(query.toLowerCase()))
      && (topic === 'All' || item.topic === topic)
      && (difficulty === 'All' || item.difficulty === difficulty)
      && (type === 'All' || item.pageType === type)
      && (technology === 'All' || item.technologies.includes(technology))
      && (status === 'All' || item.status === status)
      && (scope === 'All' || item.scope === scope)
      && (owner === 'All' || item.owner === owner)
      && (!reviewedAfter || Boolean(item.lastReviewed && item.lastReviewed >= reviewedAfter))
      && featureMatch && freshMatch;
  }), [difficulty, feature, freshness, owner, query, reviewedAfter, scope, status, technology, topic, type]);

  const reset = () => {
    setQuery(''); setTopic('All'); setDifficulty('All'); setType('All');
    setTechnology('All'); setStatus('All'); setScope('All'); setOwner('All'); setFeature('All'); setFreshness('All'); setReviewedAfter('');
  };

  return <section className={styles.library}>
    <header><div><span>All documentation</span><h2>Full library explorer</h2><p>Filter every generated page by learning metadata and content evidence.</p></div><strong>{pages.length}/{catalog.length}</strong></header>
    <div className={styles.controls}>
      <label className={styles.search}><Search/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search all documentation" aria-label="Search all documentation"/>{query && <button onClick={() => setQuery('')} aria-label="Clear search"><X/></button>}</label>
      <div className={styles.filters}>
        <Filter label="Topic" value={topic} values={topics} set={setTopic}/><Filter label="Difficulty" value={difficulty} values={difficulties} set={setDifficulty}/>
        <Filter label="Page type" value={type} values={types} set={setType}/><Filter label="Technology" value={technology} values={technologies} set={setTechnology}/>
        <Filter label="Status" value={status} values={statuses} set={setStatus}/><Filter label="Freshness" value={freshness} values={freshnessOptions} set={setFreshness}/>
        <Filter label="Scope" value={scope} values={scopes} set={setScope}/><Filter label="Owner" value={owner} values={owners} set={setOwner}/>
        <label><span>Reviewed after</span><input type="date" value={reviewedAfter} onChange={(event) => setReviewedAfter(event.target.value)} /></label>
        <Filter label="Contains" value={feature} values={['All', 'Interview', 'Code', 'Labs', 'Runbooks', 'Officially verified']} set={setFeature}/>
      </div>
      <button className={styles.reset} onClick={reset}>Reset all filters</button>
    </div>
    <div className={styles.results}>{pages.slice(0, 120).map((item) => <Link to={item.path} key={item.path}>
      <span className={styles.meta}>{item.topic} &middot; {item.difficulty}</span><strong>{item.title}</strong>
      <small>{item.pageType} &middot; {item.status} &middot; {item.scope} &middot; {item.owner}{item.lastReviewed ? ` · reviewed ${item.lastReviewed}` : ''}</small>
      <span className={styles.flags}>{item.hasCode && <i><Code2/>Code</i>}{item.hasInterview && <i><CheckCircle2/>Interview</i>}{item.isLab && <i><FlaskConical/>Lab</i>}{item.verifiedOfficial && <i><ShieldCheck/>Verified</i>}</span>
    </Link>)}</div>
    {pages.length > 120 && <p className={styles.limit}>Showing the first 120 matches. Narrow the filters to find a specific guide.</p>}
  </section>;
}

function Filter({label, value, values, set}: {label: string; value: string; values: string[]; set: (value: string) => void}) {
  return <label><span>{label}</span><select value={value} onChange={(event) => set(event.target.value)}>{values.map((item) => <option key={item}>{item}</option>)}</select></label>;
}
