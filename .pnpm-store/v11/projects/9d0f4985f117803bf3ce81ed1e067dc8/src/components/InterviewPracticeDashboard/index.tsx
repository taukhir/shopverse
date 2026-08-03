import React, {useEffect, useMemo, useRef, useState} from 'react';
import Link from '@docusaurus/Link';
import {Download, RotateCcw, Sparkles, Target, Upload} from 'lucide-react';
import {mcqSubjects, type McqSubject} from '@site/src/data/mcq';
import {
  INTERVIEW_PRACTICE_EVENT,
  loadPracticeState,
  parsePracticeImport,
  savePracticeState,
  type PracticeAttempt,
} from '@site/src/utils/interviewPractice';
import styles from './styles.module.css';

type Role = 'Senior Java' | 'Lead Engineer' | 'Architect' | 'Financial Platform';
const roleSubjects: Record<Role, McqSubject[]> = {
  'Senior Java': ['Java', 'Spring', 'Databases', 'Kafka'],
  'Lead Engineer': ['Java', 'Spring', 'Databases', 'Kafka', 'Microservices', 'System Design', 'Kubernetes'],
  Architect: ['System Design', 'Microservices', 'Kafka', 'Databases', 'Security', 'Kubernetes', 'Spring Cloud'],
  'Financial Platform': ['Java', 'Databases', 'Kafka', 'Security', 'System Design'],
};
const practiceHref = '/leadership/interview-program/MCQ-PRACTICE-CENTER';
const intervals = [0, 1, 3, 7, 14, 30];

const percentage = (score: number, total: number) => total ? Math.round((score / total) * 100) : 0;
const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, {month: 'short', day: 'numeric'}).format(new Date(value));

export function InterviewPracticeDashboard() {
  const [attempts, setAttempts] = useState<PracticeAttempt[]>([]);
  const [role, setRole] = useState<Role>('Senior Java');
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const refresh = () => setAttempts(loadPracticeState().attempts);
    refresh();
    window.addEventListener(INTERVIEW_PRACTICE_EVENT, refresh);
    return () => window.removeEventListener(INTERVIEW_PRACTICE_EVENT, refresh);
  }, []);

  const subjectStats = useMemo(() => mcqSubjects.map((subject) => {
    const matching = attempts.filter((attempt) => attempt.subject === subject);
    const correct = matching.reduce((sum, attempt) => sum + attempt.score, 0);
    const total = matching.reduce((sum, attempt) => sum + attempt.total, 0);
    return {subject, attempts: matching.length, average: percentage(correct, total), best: matching.reduce((best, attempt) => Math.max(best, percentage(attempt.score, attempt.total)), 0)};
  }), [attempts]);

  const reviewQueue = useMemo(() => {
    const topicState = new Map<string, {subject: McqSubject; topic: string; streak: number; dueAt: number; accuracy: number}>();
    [...attempts].sort((a, b) => a.completedAt.localeCompare(b.completedAt)).forEach((attempt) => {
      attempt.topics.forEach((outcome) => {
        const key = `${attempt.subject}|${outcome.topic}`;
        const previous = topicState.get(key);
        const passed = outcome.correct === outcome.total;
        const streak = passed ? Math.min((previous?.streak ?? 0) + 1, intervals.length - 1) : 0;
        topicState.set(key, {
          subject: attempt.subject,
          topic: outcome.topic,
          streak,
          accuracy: percentage(outcome.correct, outcome.total),
          dueAt: passed ? new Date(attempt.completedAt).getTime() + intervals[streak] * 86_400_000 : 0,
        });
      });
    });
    return Array.from(topicState.values()).filter((item) => item.dueAt <= Date.now()).sort((a, b) => a.accuracy - b.accuracy).slice(0, 12);
  }, [attempts]);

  const required = roleSubjects[role];
  const readySubjects = required.filter((subject) => {
    const stat = subjectStats.find((item) => item.subject === subject);
    return stat && stat.attempts >= 2 && stat.average >= 80;
  }).length;
  const readiness = percentage(readySubjects, required.length);

  const exportProgress = () => {
    const blob = new Blob([JSON.stringify({version: 1, attempts}, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'shopverse-interview-practice.json';
    link.click();
    URL.revokeObjectURL(url);
  };
  const importProgress = async (file?: File) => {
    if (!file) return;
    try {
      const state = parsePracticeImport(await file.text());
      savePracticeState(state);
      setMessage(`Imported ${state.attempts.length} attempts.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Import failed.');
    }
  };
  const resetProgress = () => {
    if (!window.confirm('Delete all locally stored interview-practice history?')) return;
    savePracticeState({version: 1, attempts: []});
    setMessage('Local practice history reset.');
  };

  return <section className={styles.shell} aria-labelledby="practice-dashboard-title">
    <header className={styles.hero}>
      <div><span>Local-first interview preparation</span><h2 id="practice-dashboard-title">Interview Practice Dashboard</h2><p>Scores remain in this browser. No account, synchronization, selected answers, or personal profile is stored.</p></div>
      <div className={styles.heroScore}><strong>{attempts.length}</strong><span>completed tests</span></div>
    </header>

    <div className={styles.actions}>
      <button type="button" onClick={exportProgress} disabled={!attempts.length}><Download aria-hidden="true" /> Export</button>
      <button type="button" onClick={() => inputRef.current?.click()}><Upload aria-hidden="true" /> Import</button>
      <input ref={inputRef} className={styles.fileInput} type="file" accept="application/json" onChange={(event) => void importProgress(event.target.files?.[0])} />
      <button type="button" onClick={resetProgress} disabled={!attempts.length}><RotateCcw aria-hidden="true" /> Reset</button>
      {message ? <span role="status">{message}</span> : null}
    </div>

    <section className={styles.readiness} aria-labelledby="readiness-heading">
      <div><Target aria-hidden="true" /><h3 id="readiness-heading">Role readiness</h3></div>
      <label>Target role<select value={role} onChange={(event) => setRole(event.target.value as Role)}>{Object.keys(roleSubjects).map((item) => <option key={item}>{item}</option>)}</select></label>
      <div className={styles.readinessScore}><strong>{readiness}%</strong><span>{readySubjects} of {required.length} core subjects meet the gate</span></div>
      <div className={styles.track}><span style={{width: `${readiness}%`}} /></div>
      <p>Gate: at least two attempts and 80% aggregate accuracy in every core subject. MCQs measure retrieval, so complete scenario and coding mocks too.</p>
    </section>

    <section aria-labelledby="subject-progress-heading"><h3 id="subject-progress-heading">Subject progress</h3><div className={styles.subjectGrid}>
      {subjectStats.map((stat) => <article key={stat.subject} className={required.includes(stat.subject) ? styles.requiredCard : undefined}><strong>{stat.subject}</strong><span>{stat.attempts} attempts</span><b>{stat.average}% average</b><small>Best {stat.best}%</small><Link to={practiceHref}>Practice →</Link></article>)}
    </div></section>

    <div className={styles.lowerGrid}>
      <section aria-labelledby="review-heading"><h3 id="review-heading">Spaced review queue</h3>{reviewQueue.length ? <ul>{reviewQueue.map((item) => <li key={`${item.subject}-${item.topic}`}><div><strong>{item.topic}</strong><span>{item.subject} · last accuracy {item.accuracy}%</span></div><Link to={practiceHref}>Review</Link></li>)}</ul> : <p className={styles.empty}>No review items are due. Complete a test to build the queue.</p>}</section>
      <section aria-labelledby="mock-heading"><div className={styles.mockTitle}><Sparkles aria-hidden="true" /><h3 id="mock-heading">Generated mock session</h3></div><p>Run one 20-question test for each subject below, then finish with a scenario or coding round.</p><ol>{required.slice(0, 4).map((subject) => <li key={subject}><span>{subject}</span><Link to={practiceHref}>Start test</Link></li>)}</ol><Link className={styles.primaryLink} to="/leadership/interview-program/MOCK-INTERVIEW-FORMATS-QUESTION-BANK">Open scored mock formats</Link></section>
    </div>

    {attempts.length ? <section aria-labelledby="history-heading"><h3 id="history-heading">Recent attempts</h3><div className={styles.history}>{[...attempts].reverse().slice(0, 10).map((attempt) => <div key={attempt.id}><strong>{attempt.subject}</strong><span>{attempt.difficulty}</span><b>{percentage(attempt.score, attempt.total)}%</b><small>{formatDate(attempt.completedAt)}</small></div>)}</div></section> : null}
  </section>;
}
