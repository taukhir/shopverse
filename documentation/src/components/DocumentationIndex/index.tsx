import React, {useMemo, useState} from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {useDocsSidebar} from '@docusaurus/plugin-content-docs/client';
import type {PropSidebarItem, PropSidebarItemCategory} from '@docusaurus/plugin-content-docs';
import {
  ChevronDown,
  Download,
  ListCollapse,
  ListTree,
  Search,
  X,
} from 'lucide-react';
import styles from './styles.module.css';

type NavigableItem = Exclude<PropSidebarItem, {type: 'html'}>;

function isCategory(item: PropSidebarItem): item is PropSidebarItemCategory {
  return item.type === 'category';
}

function isNavigable(item: PropSidebarItem): item is NavigableItem {
  return item.type !== 'html';
}

function itemId(item: NavigableItem, parentId = 'docs') {
  const value = item.label.toLocaleLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${parentId}-${value}`;
}

function pageCount(item: NavigableItem): number {
  if (!isCategory(item)) return 1;
  return (item.href ? 1 : 0) + item.items.filter(isNavigable).reduce((total, child) => total + pageCount(child), 0);
}

function searchableText(item: NavigableItem): string {
  if (!isCategory(item)) return `${item.label} ${item.href}`.toLocaleLowerCase();
  return `${item.label} ${item.href ?? ''} ${item.items.filter(isNavigable).map(searchableText).join(' ')}`.toLocaleLowerCase();
}

function filterItem(item: NavigableItem, query: string): NavigableItem | null {
  if (!query) return item;
  if (!isCategory(item)) return searchableText(item).includes(query) ? item : null;
  if (`${item.label} ${item.href ?? ''}`.toLocaleLowerCase().includes(query)) return item;

  const children = item.items.filter(isNavigable)
    .map((child) => filterItem(child, query))
    .filter((child): child is NavigableItem => child !== null);
  return children.length ? {...item, items: children} : null;
}

function collectCategoryIds(items: NavigableItem[], parentId = 'docs', ids = new Set<string>()) {
  items.forEach((item) => {
    if (!isCategory(item)) return;
    const id = itemId(item, parentId);
    ids.add(id);
    collectCategoryIds(item.items.filter(isNavigable), id, ids);
  });
  return ids;
}

function levelLabel(level: number) {
  if (level === 0) return 'Umbrella';
  if (level === 1) return 'Subpage group';
  return 'Topics';
}

function HierarchyItem({
  item,
  level,
  parentId,
  expanded,
  forceOpen,
  onExpandedChange,
}: {
  item: NavigableItem;
  level: number;
  parentId: string;
  expanded: Set<string>;
  forceOpen: boolean;
  onExpandedChange: (id: string, open: boolean) => void;
}) {
  if (!isCategory(item)) {
    return <Link className={styles.pageLink} to={item.href}>
      <span>{item.label}</span>
      <small>{level <= 1 ? 'Subpage' : 'Topic'}</small>
    </Link>;
  }

  const id = itemId(item, parentId);
  const children = item.items.filter(isNavigable);
  return <details
    className={styles.hierarchyGroup}
    data-level={Math.min(level, 2)}
    id={id}
    open={forceOpen || expanded.has(id)}
    onToggle={(event) => {
      if (!forceOpen) onExpandedChange(id, event.currentTarget.open);
    }}
  >
    <summary>
      <span className={styles.summaryIcon}><ChevronDown aria-hidden="true" /></span>
      <span className={styles.summaryCopy}>
        <strong>{item.label}</strong>
        <small>{levelLabel(level)}</small>
      </span>
      <span className={styles.pageCount}>{pageCount(item)} pages</span>
    </summary>
    <div className={styles.groupBody}>
      {item.href ? <Link className={styles.overviewLink} to={item.href}>
        Open {level === 0 ? 'umbrella page' : 'overview'}
      </Link> : null}
      <div className={styles.children}>
        {children.map((child) => <HierarchyItem
          item={child}
          level={level + 1}
          parentId={id}
          expanded={expanded}
          forceOpen={forceOpen}
          onExpandedChange={onExpandedChange}
          key={`${id}-${child.label}`}
        />)}
      </div>
    </div>
  </details>;
}

export function DocumentationIndex() {
  const sidebar = useDocsSidebar();
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const workbookUrl = useBaseUrl('/downloads/dsa/Lead_Java_DSA_Interview_Handbook.xlsx');

  const umbrellas = useMemo(() => (sidebar?.items ?? [])
    .filter(isCategory)
    .map((item) => filterItem(item, normalizedQuery))
    .filter((item): item is NavigableItem => item !== null), [normalizedQuery, sidebar]);
  const allCategoryIds = useMemo(() => collectCategoryIds(
    (sidebar?.items ?? []).filter(isCategory),
  ), [sidebar]);
  const visiblePages = umbrellas.reduce((total, item) => total + pageCount(item), 0);
  const totalPages = (sidebar?.items ?? []).filter(isCategory).reduce((total, item) => total + pageCount(item), 0);

  const updateExpanded = (id: string, open: boolean) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  return <section className={styles.index} aria-labelledby="complete-documentation-index">
    <div className={styles.heading}>
      <div>
        <span>Root-level directory</span>
        <h2 id="complete-documentation-index">Complete documentation index</h2>
        <p>Expand an umbrella, open a subpage group, and follow its focused topic pages.</p>
      </div>
      <div className={styles.summary} aria-label="Documentation index totals">
        <strong>{umbrellas.length}</strong>
        <span>umbrellas</span>
        <strong>{visiblePages}</strong>
        <span>{normalizedQuery ? `matching of ${totalPages}` : 'indexed pages'}</span>
      </div>
    </div>

    <div className={styles.featuredResource}>
      <span><Download aria-hidden="true" /></span>
      <div>
        <strong>Lead Java DSA Interview Handbook</strong>
        <small>Download the Excel companion with Top 50 and topic-specific question sheets.</small>
      </div>
      <a href={workbookUrl} download>Download Excel</a>
    </div>

    <div className={styles.controls}>
      <label className={styles.searchField}>
        <Search aria-hidden="true" />
        <span className="sr-only">Search the complete documentation index</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search umbrella pages, subpages, and topics"
          aria-label="Search the complete documentation index"
        />
        {query ? <button type="button" onClick={() => setQuery('')} aria-label="Clear documentation index search">
          <X aria-hidden="true" />
        </button> : null}
      </label>
      <div className={styles.expansionControls}>
        <button type="button" onClick={() => setExpanded(new Set(allCategoryIds))} disabled={Boolean(normalizedQuery)}>
          <ListTree aria-hidden="true" /> Expand all
        </button>
        <button type="button" onClick={() => setExpanded(new Set())} disabled={Boolean(normalizedQuery)}>
          <ListCollapse aria-hidden="true" /> Collapse all
        </button>
      </div>
    </div>

    <div className={styles.hierarchy} aria-live="polite">
      {umbrellas.map((item) => <HierarchyItem
        item={item}
        level={0}
        parentId="docs"
        expanded={expanded}
        forceOpen={Boolean(normalizedQuery)}
        onExpandedChange={updateExpanded}
        key={item.label}
      />)}
      {!umbrellas.length ? <div className={styles.emptyState} role="status">
        <strong>No documentation entries match “{query}”.</strong>
        <button type="button" onClick={() => setQuery('')}>Clear search</button>
      </div> : null}
    </div>
  </section>;
}
