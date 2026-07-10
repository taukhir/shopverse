import React, {useEffect, useRef, useState, type ReactNode} from 'react';
import OriginalDocItemContent from '@theme-original/DocItem/Content';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import {Bookmark, BookOpen, CalendarCheck, Check, Clock3} from 'lucide-react';
import {readReaderState, toggleSavedPage, writeReaderState} from '@site/src/utils/readerLibrary';
import type {Props} from '@theme/DocItem/Content';
import styles from './styles.module.css';

const WORDS_PER_MINUTE = 220;

type LearningFrontMatter = {
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  page_type?: 'Concept' | 'Tutorial' | 'Reference' | 'Runbook' | 'Case Study';
  status?: 'Generic' | 'Implemented' | 'Partial' | 'Planned';
  prerequisites?: string[];
  learning_objectives?: string[];
  technologies?: string[];
  last_reviewed?: string;
};

export default function DocItemContent({children}: Props): ReactNode {
  const {frontMatter, metadata} = useDoc();
  const learning = frontMatter as LearningFrontMatter;
  const containerRef = useRef<HTMLDivElement>(null);
  const [wordCount, setWordCount] = useState<number | null>(null);
  const [saved, setSaved] = useState({bookmarked: false, completed: false});

  useEffect(() => {
    const article = containerRef.current?.querySelector<HTMLElement>('.theme-doc-markdown');
    if (!article) return;
    const clone = article.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('pre, code, .reading-metadata').forEach((element) => element.remove());
    const words = (clone.textContent ?? '').trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
  }, [children]);

  const minutes = wordCount === null ? null : Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
  const page = {title: String(metadata.title ?? 'Documentation page'), path: typeof window === 'undefined' ? '' : window.location.pathname, visitedAt: Date.now()};

  useEffect(() => {
    const state = readReaderState();
    setSaved({bookmarked: state.bookmarks.some((item) => item.path === window.location.pathname), completed: state.completed.some((item) => item.path === window.location.pathname)});
  }, []);

  const togglePage = (collection: 'bookmarks' | 'completed') => {
    const next = toggleSavedPage(collection, {...page, path: window.location.pathname});
    writeReaderState(next);
    setSaved({bookmarked: next.bookmarks.some((item) => item.path === window.location.pathname), completed: next.completed.some((item) => item.path === window.location.pathname)});
  };
  const hasLearningHeader = Boolean(
    learning.difficulty || learning.page_type || learning.status || learning.prerequisites?.length ||
    learning.learning_objectives?.length || learning.technologies?.length || learning.last_reviewed,
  );

  return (
    <div ref={containerRef}>
      <div className={`${styles.metadata} reading-metadata`} aria-label="Reading information">
        <span><Clock3 aria-hidden="true" />{minutes ? `${minutes} min read` : 'Calculating reading time'}</span>
        {wordCount !== null && <span><BookOpen aria-hidden="true" />{wordCount.toLocaleString()} words</span>}
        {learning.last_reviewed && <span><CalendarCheck aria-hidden="true" />Reviewed {learning.last_reviewed}</span>}
      </div>
      <div className={styles.readerActions} aria-label="Reader actions">
        <button className={saved.bookmarked ? styles.selected : ''} type="button" onClick={() => togglePage('bookmarks')}><Bookmark aria-hidden="true" />{saved.bookmarked ? 'Bookmarked' : 'Bookmark'}</button>
        <button className={saved.completed ? styles.selected : ''} type="button" onClick={() => togglePage('completed')}><Check aria-hidden="true" />{saved.completed ? 'Completed' : 'Mark complete'}</button>
      </div>
      {hasLearningHeader && (
        <aside className={styles.learningHeader} aria-label="Guide details">
          <div className={styles.badges}>
            {learning.page_type && <span>{learning.page_type}</span>}
            {learning.difficulty && <span>{learning.difficulty}</span>}
            {learning.status && <span className={styles[`status${learning.status.replace(' ', '')}`]}>{learning.status}</span>}
          </div>
          {(learning.prerequisites?.length || learning.learning_objectives?.length) && (
            <div className={styles.guideGrid}>
              {learning.prerequisites?.length && <div><strong>Prerequisites</strong><ul>{learning.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul></div>}
              {learning.learning_objectives?.length && <div><strong>What you will learn</strong><ul>{learning.learning_objectives.map((item) => <li key={item}>{item}</li>)}</ul></div>}
            </div>
          )}
          {learning.technologies?.length && <div className={styles.technologies}>{learning.technologies.map((item) => <span key={item}>{item}</span>)}</div>}
        </aside>
      )}
      <OriginalDocItemContent>{children}</OriginalDocItemContent>
    </div>
  );
}
