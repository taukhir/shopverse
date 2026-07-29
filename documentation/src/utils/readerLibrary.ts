export type SavedPage = {title: string; path: string; visitedAt: number};
export type ReadingStatus = 'started' | 'read' | 'completed' | 'needs-review';
export type PageProgress = SavedPage & {percent: number; status: ReadingStatus; lastHeading?: string; updatedAt: number};
export type ReaderState = {
  schemaVersion: 2;
  bookmarks: SavedPage[];
  completed: SavedPage[];
  recent: SavedPage[];
  fontScale: number;
  focusMode: boolean;
  practiceMode: boolean;
  notes: Record<string, string>;
  studyDays: string[];
  analyticsConsent: boolean;
  progress: Record<string, PageProgress>;
};

export const READER_STORAGE_KEY = 'shopverse-reader-library-v2';
const LEGACY_STORAGE_KEY = 'shopverse-reader-library-v1';
export const READER_EVENT = 'shopverse-reader-library-change';

export const defaultReaderState: ReaderState = {schemaVersion: 2, bookmarks: [], completed: [], recent: [], fontScale: 1, focusMode: false, practiceMode: false, notes: {}, studyDays: [], analyticsConsent: false, progress: {}};

export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function normalizeReaderPath(path: string, baseUrl = '/') {
  const pathname = path.split(/[?#]/, 1)[0] || '/';
  const hashIndex = path.indexOf('#');
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : '';
  const normalizedBase = `/${baseUrl.replace(/^\/+|\/+$/g, '')}/`;
  const withoutBase = normalizedBase !== '/' && pathname.startsWith(normalizedBase)
    ? `/${pathname.slice(normalizedBase.length)}`
    : pathname;
  const withLeadingSlash = withoutBase.startsWith('/') ? withoutBase : `/${withoutBase}`;
  const normalizedPath = withLeadingSlash.length > 1 ? withLeadingSlash.replace(/\/+$/, '') : withLeadingSlash;
  return `${normalizedPath}${hash}`;
}

export function studyStreak(days: string[]) {
  const unique = new Set(days);
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (unique.has(localDateKey(cursor))) { streak += 1; cursor.setDate(cursor.getDate() - 1); }
  return streak;
}

export function readReaderState(): ReaderState {
  if (typeof window === 'undefined') return defaultReaderState;
  try {
    const stored = localStorage.getItem(READER_STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY) ?? '{}';
    const parsed = JSON.parse(stored) as Partial<ReaderState>;
    const migrated: ReaderState = {...defaultReaderState, ...parsed, schemaVersion: 2, progress: {...(parsed.progress ?? {})}};
    migrated.recent.forEach((page) => {
      const path = normalizeReaderPath(page.path);
      migrated.progress[path] ??= {...page, path, percent: 1, status: 'started', updatedAt: page.visitedAt};
    });
    migrated.completed.forEach((page) => {
      const path = normalizeReaderPath(page.path);
      migrated.progress[path] = {...page, ...migrated.progress[path], path, percent: 100, status: 'completed', updatedAt: migrated.progress[path]?.updatedAt ?? page.visitedAt};
    });
    if (!localStorage.getItem(READER_STORAGE_KEY)) localStorage.setItem(READER_STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return defaultReaderState;
  }
}

export function writeReaderState(state: ReaderState) {
  localStorage.setItem(READER_STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(READER_EVENT, {detail: state}));
}

export function toggleSavedPage(collection: 'bookmarks' | 'completed', page: SavedPage, baseUrl = '/'): ReaderState {
  const state = readReaderState();
  const pagePath = normalizeReaderPath(page.path, baseUrl);
  const exists = state[collection].some((item) => normalizeReaderPath(item.path, baseUrl) === pagePath);
  const next = {...state, [collection]: exists ? state[collection].filter((item) => normalizeReaderPath(item.path, baseUrl) !== pagePath) : [{...page, path: pagePath}, ...state[collection]]};
  if (collection === 'completed') next.progress = {...state.progress, [pagePath]: {...page, ...state.progress[pagePath], path: pagePath, percent: exists ? Math.min(state.progress[pagePath]?.percent ?? 99, 99) : 100, status: exists ? 'read' : 'completed', updatedAt: Date.now()}};
  return next;
}

export function updatePageProgress(page: SavedPage, percent: number, lastHeading?: string, baseUrl = '/') {
  const state = readReaderState();
  const path = normalizeReaderPath(page.path, baseUrl);
  const previous = state.progress[path];
  const nextPercent = Math.max(previous?.percent ?? 0, Math.min(100, Math.round(percent)));
  const status: ReadingStatus = previous?.status === 'completed' || previous?.status === 'needs-review'
    ? previous.status : nextPercent >= 70 ? 'read' : 'started';
  const next = {...state, progress: {...state.progress, [path]: {...page, path, percent: nextPercent, status, lastHeading: lastHeading || previous?.lastHeading, updatedAt: Date.now()}}};
  writeReaderState(next);
  return next;
}
