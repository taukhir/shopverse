export type SavedPage = {title: string; path: string; visitedAt: number};
export type ReaderState = {
  bookmarks: SavedPage[];
  completed: SavedPage[];
  recent: SavedPage[];
  fontScale: number;
  focusMode: boolean;
  studyDays: string[];
};

export const READER_STORAGE_KEY = 'shopverse-reader-library-v1';
export const READER_EVENT = 'shopverse-reader-library-change';

export const defaultReaderState: ReaderState = {bookmarks: [], completed: [], recent: [], fontScale: 1, focusMode: false, studyDays: []};

export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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

export function toggleSavedPage(collection: 'bookmarks' | 'completed', page: SavedPage): ReaderState {
  const state = readReaderState();
  const exists = state[collection].some((item) => item.path === page.path);
  return {...state, [collection]: exists ? state[collection].filter((item) => item.path !== page.path) : [page, ...state[collection]]};
}
