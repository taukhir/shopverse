import React, {useEffect, useRef, useState, type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import OriginalDocItemContent from '@theme-original/DocItem/Content';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import {AlertTriangle, Bookmark, BookOpen, CalendarCheck, Check, Clock3, ListTree, RotateCcw} from 'lucide-react';
import {normalizeReaderPath, readReaderState, READER_EVENT, toggleSavedPage, updatePageProgress, writeReaderState} from '@site/src/utils/readerLibrary';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import type {Props} from '@theme/DocItem/Content';
import styles from './styles.module.css';
import {learningCatalog} from '@site/src/data/learningCatalog';

const WORDS_PER_MINUTE = 220;
const NON_TOPIC_HEADINGS = new Set([
  'official references',
  'references',
  'recommended next',
  'further reading',
]);

type LearningFrontMatter = {
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  page_type?: 'Concept' | 'Tutorial' | 'Reference' | 'Runbook' | 'Case Study';
  status?: 'Generic' | 'Implemented' | 'Partial' | 'Planned';
  prerequisites?: string[];
  learning_objectives?: string[];
  technologies?: string[];
  last_reviewed?: string;
  hide_reader_chrome?: boolean;
};

export default function DocItemContent({children}: Props): ReactNode {
  const {frontMatter, metadata, toc} = useDoc();
  const {siteConfig} = useDocusaurusContext();
  const baseUrl = siteConfig.baseUrl;
  const learning = frontMatter as LearningFrontMatter;
  const containerRef = useRef<HTMLDivElement>(null);
  const [wordCount, setWordCount] = useState<number | null>(null);
  const [saved, setSaved] = useState({bookmarked: false, completed: false});
  const [lastHeading, setLastHeading] = useState<string>();
  const [progress, setProgress] = useState(0);
  const [completedLearningPaths, setCompletedLearningPaths] = useState<string[]>([]);
  const [verifiedOfficial, setVerifiedOfficial] = useState(false);

  useEffect(() => {
    const article = containerRef.current?.querySelector<HTMLElement>('.theme-doc-markdown');
    if (!article) return;
    const clone = article.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('pre, code, .reading-metadata').forEach((element) => element.remove());
    const words = (clone.textContent ?? '').trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
    const hasOfficialHeading = Array.from(article.querySelectorAll('h2')).some((heading) => heading.textContent?.toLowerCase().includes('official references'));
    const hasOfficialLink = Boolean(article.querySelector('a[href*="docs.oracle.com"],a[href*="openjdk.org"],a[href*="kubernetes.io"],a[href*="docs.spring.io"],a[href*="docs.docker.com"]'));
    setVerifiedOfficial(hasOfficialHeading && hasOfficialLink);
  }, [children]);

  useEffect(() => {
    const article = containerRef.current?.querySelector<HTMLElement>('.theme-doc-markdown');
    if (!article) return undefined;
    const cleanups: Array<() => void> = [];

    article.querySelectorAll<HTMLElement>('h2[id], h3[id], h4[id]').forEach((heading) => {
      const headingClone = heading.cloneNode(true) as HTMLElement;
      headingClone.querySelectorAll('.hash-link, button').forEach((element) => element.remove());
      const sectionTitle = headingClone.textContent?.trim() || heading.id;
      const sectionPath = normalizeReaderPath(`${window.location.pathname}#${heading.id}`, baseUrl);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = styles.sectionBookmark;

      const syncButton = () => {
        const bookmarked = readReaderState().bookmarks.some((item) => normalizeReaderPath(item.path, baseUrl) === sectionPath);
        button.classList.toggle(styles.selected, bookmarked);
        button.textContent = bookmarked ? '★' : '☆';
        button.title = bookmarked ? `Remove bookmark for ${sectionTitle}` : `Bookmark ${sectionTitle}`;
        button.setAttribute('aria-label', button.title);
        button.setAttribute('aria-pressed', String(bookmarked));
      };
      const toggleBookmark = () => {
        const next = toggleSavedPage('bookmarks', {title: `${String(metadata.title ?? 'Documentation page')} — ${sectionTitle}`, path: sectionPath, visitedAt: Date.now()}, baseUrl);
        writeReaderState(next);
      };
      button.addEventListener('click', toggleBookmark);
      window.addEventListener(READER_EVENT, syncButton);
      syncButton();
      heading.appendChild(button);
      cleanups.push(() => {
        button.removeEventListener('click', toggleBookmark);
        window.removeEventListener(READER_EVENT, syncButton);
        button.remove();
      });
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [baseUrl, children, metadata.title]);

  useEffect(() => {
    const article = containerRef.current?.querySelector<HTMLElement>('.theme-doc-markdown');
    if (!article) return undefined;
    const path = normalizeReaderPath(window.location.pathname, baseUrl);
    const previous = readReaderState().progress[path];
    setProgress(previous?.percent ?? 0);
    setLastHeading(previous?.lastHeading);
    let frame = 0;
    let lastSaved = 0;
    const track = () => {
      frame = 0;
      const rect = article.getBoundingClientRect();
      const readable = Math.max(1, article.offsetHeight - window.innerHeight * .5);
      const percent = Math.max(1, Math.min(100, ((-rect.top + window.innerHeight * .35) / readable) * 100));
      const headings = Array.from(article.querySelectorAll<HTMLElement>('h2[id],h3[id]'));
      const active = headings.filter((heading) => heading.getBoundingClientRect().top <= 150).at(-1) ?? headings[0];
      document.querySelectorAll('.table-of-contents__link.reader-active-section').forEach((link) => link.classList.remove('reader-active-section'));
      if (active) document.querySelectorAll<HTMLAnchorElement>(`.table-of-contents__link[href="#${CSS.escape(active.id)}"]`).forEach((link) => link.classList.add('reader-active-section'));
      setProgress((value) => Math.max(value, Math.round(percent)));
      if (Date.now() - lastSaved > 1000) {
        lastSaved = Date.now();
        updatePageProgress({title: String(metadata.title ?? 'Documentation page'), path, visitedAt: Date.now()}, percent, active?.id, baseUrl);
      }
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(track); };
    track(); window.addEventListener('scroll', onScroll, {passive: true});
    return () => { window.removeEventListener('scroll', onScroll); if (frame) cancelAnimationFrame(frame); };
  }, [baseUrl, children, metadata.title]);

  const minutes = wordCount === null ? null : Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
  const page = {title: String(metadata.title ?? 'Documentation page'), path: typeof window === 'undefined' ? '' : window.location.pathname, visitedAt: Date.now()};

  useEffect(() => {
    const state = readReaderState();
    const currentPath = normalizeReaderPath(window.location.pathname, baseUrl);
    setSaved({bookmarked: state.bookmarks.some((item) => normalizeReaderPath(item.path, baseUrl) === currentPath), completed: state.completed.some((item) => normalizeReaderPath(item.path, baseUrl) === currentPath)});
    setCompletedLearningPaths(state.completed.map((item) => normalizeReaderPath(item.path, baseUrl)));
  }, [baseUrl]);

  const togglePage = (collection: 'bookmarks' | 'completed') => {
    const next = toggleSavedPage(collection, {...page, path: window.location.pathname}, baseUrl);
    writeReaderState(next);
    const currentPath = normalizeReaderPath(window.location.pathname, baseUrl);
    setSaved({bookmarked: next.bookmarks.some((item) => normalizeReaderPath(item.path, baseUrl) === currentPath), completed: next.completed.some((item) => normalizeReaderPath(item.path, baseUrl) === currentPath)});
  };
  const hasLearningHeader = Boolean(
    learning.difficulty || learning.page_type || learning.status || learning.prerequisites?.length ||
    learning.learning_objectives?.length || learning.technologies?.length || learning.last_reviewed,
  );
  const pageTopics = toc
    .filter((item) => item.level === 2 && !NON_TOPIC_HEADINGS.has(item.value.toLocaleLowerCase()))
    .map((item) => ({...item, label: item.value.replace(/<[^>]*>/g, '')}));
  const reviewedDays = learning.last_reviewed ? Math.floor((Date.now() - new Date(`${learning.last_reviewed}T00:00:00`).getTime()) / 86_400_000) : Number.POSITIVE_INFINITY;
  const freshness = !learning.last_reviewed ? 'Not yet reviewed' : reviewedDays > 180 ? 'Potentially outdated' : reviewedDays > 90 ? 'Review recommended soon' : 'Recently reviewed';
  const versionSpecific = learning.technologies?.some((item) => /\b\d+(?:\.\d+)?\b/.test(item));
  const markReview = () => {
    const state = readReaderState();
    const path = normalizeReaderPath(window.location.pathname, baseUrl);
    const prior = state.progress[path];
    writeReaderState({...state, progress: {...state.progress, [path]: {...page, ...prior, path, percent: prior?.percent ?? progress, status: 'needs-review', updatedAt: Date.now()}}});
  };
  const currentLearningPage = learningCatalog.find((item) => item.path === normalizeReaderPath(String(metadata.permalink ?? ''), baseUrl));
  const completedSet = new Set(completedLearningPaths);
  const incompletePrerequisites = (currentLearningPage?.prerequisites ?? []).filter((path) => !completedSet.has(path));

  if (learning.hide_reader_chrome) {
    return <div ref={containerRef}><OriginalDocItemContent>{children}</OriginalDocItemContent></div>;
  }

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
        <button type="button" onClick={markReview}><RotateCcw aria-hidden="true" />Needs review</button>
        <span className={styles.pageProgress}>{progress}% read</span>
      </div>
      <aside className={`${styles.freshness} ${reviewedDays > 180 ? styles.outdated : ''}`} aria-label="Content freshness"><AlertTriangle aria-hidden="true"/><span><strong>{freshness}</strong>{learning.last_reviewed ? ` · last reviewed ${learning.last_reviewed}` : ' · verify version-sensitive details before production use'}{learning.status && learning.status !== 'Implemented' ? ` · ${learning.status.toLowerCase()} content` : ''}{versionSpecific ? ' · version-specific' : ''}{verifiedOfficial ? ' · verified against official documentation' : ''}</span></aside>
      {lastHeading && typeof window !== 'undefined' && !window.location.hash && <a className={styles.continueSection} href={`#${lastHeading}`}>Continue from your last-read section</a>}
      {incompletePrerequisites.length > 0 && <aside className={styles.prerequisiteWarning}><strong>Recommended first:</strong>{incompletePrerequisites.map((path) => <Link key={path} to={path}>{learningCatalog.find((item) => item.path === path)?.title ?? path}</Link>)}</aside>}
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
      {pageTopics.length > 0 && (
        <nav className={styles.topicOverview} aria-labelledby="topics-covered-title">
          <div className={styles.topicOverviewTitle} id="topics-covered-title">
            <ListTree aria-hidden="true" />
            <strong>Topics covered</strong>
            <span>{pageTopics.length} sections</span>
          </div>
          <ul>
            {pageTopics.map((topic) => (
              <li key={topic.id}><a href={`#${topic.id}`}>{topic.label}</a></li>
            ))}
          </ul>
        </nav>
      )}
      <OriginalDocItemContent>{children}</OriginalDocItemContent>
    </div>
  );
}
