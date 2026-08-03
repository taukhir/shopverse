import type {McqDifficultyFilter, McqSubject} from '@site/src/data/mcq';

export const INTERVIEW_PRACTICE_KEY = 'shopverse-interview-practice-v1';
export const INTERVIEW_PRACTICE_EVENT = 'shopverse:interview-practice-updated';

export type TopicOutcome = {topic: string; correct: number; total: number};
export type PracticeAttempt = {
  id: string;
  subject: McqSubject;
  difficulty: McqDifficultyFilter;
  score: number;
  total: number;
  answered: number;
  elapsedSeconds: number;
  completedAt: string;
  topics: TopicOutcome[];
};
export type PracticeState = {version: 1; attempts: PracticeAttempt[]};

const emptyState = (): PracticeState => ({version: 1, attempts: []});

const isAttempt = (value: unknown): value is PracticeAttempt => {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<PracticeAttempt>;
  return typeof item.id === 'string' && typeof item.subject === 'string'
    && typeof item.score === 'number' && typeof item.total === 'number'
    && typeof item.completedAt === 'string' && Array.isArray(item.topics);
};

export function loadPracticeState(): PracticeState {
  if (typeof window === 'undefined') return emptyState();
  try {
    const parsed = JSON.parse(window.localStorage.getItem(INTERVIEW_PRACTICE_KEY) ?? '{}') as Partial<PracticeState>;
    return {version: 1, attempts: Array.isArray(parsed.attempts) ? parsed.attempts.filter(isAttempt).slice(-500) : []};
  } catch {
    return emptyState();
  }
}

export function savePracticeState(state: PracticeState) {
  if (typeof window === 'undefined') return;
  const safeState: PracticeState = {version: 1, attempts: state.attempts.slice(-500)};
  window.localStorage.setItem(INTERVIEW_PRACTICE_KEY, JSON.stringify(safeState));
  window.dispatchEvent(new CustomEvent(INTERVIEW_PRACTICE_EVENT));
}

export function recordPracticeAttempt(attempt: Omit<PracticeAttempt, 'id' | 'completedAt'>) {
  const state = loadPracticeState();
  state.attempts.push({...attempt, id: crypto.randomUUID(), completedAt: new Date().toISOString()});
  savePracticeState(state);
}

export function parsePracticeImport(text: string): PracticeState {
  const parsed = JSON.parse(text) as Partial<PracticeState>;
  if (!Array.isArray(parsed.attempts) || !parsed.attempts.every(isAttempt)) throw new Error('Invalid ShopVerse practice export.');
  return {version: 1, attempts: parsed.attempts.slice(-500)};
}
