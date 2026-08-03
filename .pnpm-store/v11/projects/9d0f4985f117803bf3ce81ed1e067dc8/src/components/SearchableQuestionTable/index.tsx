import React, {useId, useMemo, useState} from 'react';
import {ArrowDown, ArrowUp, ArrowUpDown, Search, X} from 'lucide-react';
import {
  dsaInterviewQuestions,
  type DsaDifficulty,
  type DsaPriority,
  type DsaTopic,
  top50Extras,
  top50QuestionTitles,
} from '@site/src/data/dsaInterviewQuestions';
import styles from './styles.module.css';

const difficulties: Array<'All' | DsaDifficulty> = ['All', 'Easy', 'Medium', 'Hard'];

type TableTopic = DsaTopic | 'Top 50';
type PriorityFilter = 'All' | 'Essential' | 'High' | 'Practice';
type SortKey = 'difficulty' | 'priority';
type SortDirection = 'asc' | 'desc';

const difficultyRank: Record<DsaDifficulty, number> = {Easy: 0, Medium: 1, Hard: 2};
const priorityRank: Record<DsaPriority, number> = {Essential: 0, High: 1, Practice: 2};

export function SearchableQuestionTable({topic}: {topic: TableTopic}) {
  const searchId = useId();
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState<'All' | DsaDifficulty>('All');
  const [priority, setPriority] = useState<PriorityFilter>('All');
  const [sortKey, setSortKey] = useState<SortKey>('difficulty');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const normalizedQuery = query.trim().toLocaleLowerCase();

  const topicQuestions = useMemo(() => {
    if (topic !== 'Top 50') return dsaInterviewQuestions.filter((question) => question.topic === topic);
    const available = [...dsaInterviewQuestions, ...top50Extras];
    return top50QuestionTitles.map((title) => available.find((question) => question.title === title))
      .filter((question): question is NonNullable<typeof question> => Boolean(question));
  }, [topic]);
  const filteredQuestions = useMemo(() => topicQuestions.filter((question) => {
    const matchesDifficulty = difficulty === 'All' || question.difficulty === difficulty;
    const matchesPriority = priority === 'All' || question.priority === priority;
    const searchable = [
      `LC ${question.leetcode}`,
      question.title,
      question.topic,
      question.dataStructure,
      question.algorithm,
      question.pattern,
      question.description,
      question.difficulty,
      question.priority,
      ...question.companies,
    ].join(' ').toLocaleLowerCase();
    return matchesDifficulty && matchesPriority && (!normalizedQuery || searchable.includes(normalizedQuery));
  }).sort((left, right) => {
    const difficultyComparison = difficultyRank[left.difficulty] - difficultyRank[right.difficulty];
    const priorityComparison = priorityRank[left.priority] - priorityRank[right.priority];
    const primaryComparison = sortKey === 'difficulty' ? difficultyComparison : priorityComparison;
    const secondaryComparison = sortKey === 'difficulty' ? priorityComparison : difficultyComparison;
    const directedPrimary = sortDirection === 'asc' ? primaryComparison : -primaryComparison;
    if (directedPrimary !== 0) return directedPrimary;
    if (secondaryComparison !== 0) return secondaryComparison;
    return topicQuestions.indexOf(left) - topicQuestions.indexOf(right);
  }), [difficulty, normalizedQuery, priority, sortDirection, sortKey, topicQuestions]);

  const changeSort = (nextKey: SortKey) => {
    if (sortKey === nextKey) {
      setSortDirection((current) => current === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSortKey(nextKey);
    setSortDirection('asc');
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown aria-hidden="true" />;
    return sortDirection === 'asc'
      ? <ArrowUp aria-hidden="true" />
      : <ArrowDown aria-hidden="true" />;
  };

  return <section className={styles.questionBank} aria-labelledby={`${searchId}-heading`}>
    <div className={styles.headingRow}>
      <div>
        <h3 id={`${searchId}-heading`}>{topic} Question Bank</h3>
        <p>Search by problem, pattern, priority, difficulty, or reported company.</p>
      </div>
      <span className={styles.resultCount} aria-live="polite">
        {filteredQuestions.length} of {topicQuestions.length}
      </span>
    </div>

    <div className={styles.controls}>
      <div className={styles.searchGroup}>
        <label htmlFor={searchId}>Search this question bank</label>
        <div className={styles.searchField}>
          <Search aria-hidden="true" />
          <input
            id={searchId}
            aria-label={`Search ${topic} interview questions`}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Problem, LC number, pattern, company, or description"
            autoComplete="off"
          />
          {query ? <button type="button" onClick={() => setQuery('')} aria-label={`Clear ${topic} search`}><X aria-hidden="true" /></button> : null}
        </div>
      </div>
      <div className={styles.filterRow}>
        <div className={styles.filterGroup}>
          <span>Difficulty</span>
          <div className={styles.filters} aria-label={`Filter ${topic} by difficulty`}>
            {difficulties.map((item) => <button
              type="button"
              key={item}
              className={difficulty === item ? styles.activeFilter : undefined}
              aria-pressed={difficulty === item}
              onClick={() => setDifficulty(item)}
            >{item}</button>)}
          </div>
        </div>
        <label className={styles.priorityFilter}>
          <span>Priority</span>
          <select value={priority} onChange={(event) => setPriority(event.target.value as PriorityFilter)} aria-label={`Filter ${topic} by priority`}>
            <option value="All">All priorities</option>
            <option value="Essential">Essential</option>
            <option value="High">High</option>
            <option value="Practice">Practice</option>
          </select>
        </label>
      </div>
    </div>

    <div className={styles.tableViewport}>
      <table>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">LC #</th>
            <th scope="col">Question</th>
            <th scope="col" aria-sort={sortKey === 'difficulty' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
              <button type="button" className={styles.sortButton} onClick={() => changeSort('difficulty')}>
                Difficulty {sortIcon('difficulty')}
              </button>
            </th>
            <th scope="col">Topic</th>
            <th scope="col" aria-sort={sortKey === 'priority' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
              <button type="button" className={styles.sortButton} onClick={() => changeSort('priority')}>
                Priority {sortIcon('priority')}
              </button>
            </th>
            <th scope="col">Data structure</th>
            <th scope="col">Algorithm / pattern</th>
            <th scope="col">Short description</th>
            <th scope="col">Reported companies</th>
          </tr>
        </thead>
        <tbody>
          {filteredQuestions.map((question, index) => <tr key={`${topic}-${question.title}`}>
            <td>{index + 1}</td>
            <td><span className={styles.leetcode}>LC {question.leetcode}</span></td>
            <td><strong>{question.title}</strong></td>
            <td><span className={`${styles.badge} ${styles[question.difficulty.toLocaleLowerCase()]}`}>{question.difficulty}</span></td>
            <td><span className={styles.topic}>{question.topic}</span></td>
            <td><span className={`${styles.badge} ${styles[question.priority.toLocaleLowerCase()]}`}>{question.priority}</span></td>
            <td><span className={styles.dataStructure}>{question.dataStructure}</span></td>
            <td><span className={styles.pattern}>{question.algorithm}</span></td>
            <td><span className={styles.description}>{question.description}</span></td>
            <td><span className={styles.companies}>{question.companies.map((company) => <small key={company}>{company}</small>)}</span></td>
          </tr>)}
        </tbody>
      </table>
    </div>
    {!filteredQuestions.length ? <div className={styles.emptyState} role="status">
      No {topic.toLocaleLowerCase()} questions match this search and difficulty.
      <button type="button" onClick={() => { setQuery(''); setDifficulty('All'); setPriority('All'); }}>Reset filters</button>
    </div> : null}
  </section>;
}
