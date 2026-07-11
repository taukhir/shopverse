export type SavedPage = {title: string; path: string; visitedAt: number};
export type ReaderState = {
  bookmarks: SavedPage[];
  completed: SavedPage[];
  recent: SavedPage[];
  fontScale: number;
  focusMode: boolean;
  studyDays: string[];
  analyticsConsent: boolean;
};

export const READER_STORAGE_KEY = 'shopverse-reader-library-v1';
export const READER_EVENT = 'shopverse-reader-library-change';

export const defaultReaderState: ReaderState = {bookmarks: [], completed: [], recent: [], fontScale: 1, focusMode: false, studyDays: [], analyticsConsent: false};

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
    return {...defaultReaderState, ...JSON.parse(localStorage.getItem(READER_STORAGE_KEY) ?? '{}')};
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
  return {...state, [collection]: exists ? state[collection].filter((item) => normalizeReaderPath(item.path, baseUrl) !== pagePath) : [{...page, path: pagePath}, ...state[collection]]};
}
