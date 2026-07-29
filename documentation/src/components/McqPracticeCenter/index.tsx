import React, {useEffect, useMemo, useState} from 'react';
import Link from '@docusaurus/Link';
import {CheckCircle2, ChevronLeft, ChevronRight, Clock3, LockKeyhole, RotateCcw, XCircle} from 'lucide-react';
import {
  createQuizSession,
  mcqQuestionBanks,
  mcqSubjects,
  type McqDifficultyFilter,
  type McqQuestion,
  type McqSubject,
} from '@site/src/data/mcq';
import styles from './styles.module.css';

type Stage = 'setup' | 'quiz' | 'results';
type Answers = Record<string, number>;
const difficulties: McqDifficultyFilter[] = ['Mixed', 'Easy', 'Medium', 'Hard'];

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainder = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
}

export function McqPracticeCenter({
  initialSubject = 'Java',
  subjectLocked = false,
}: {
  initialSubject?: McqSubject;
  subjectLocked?: boolean;
}) {
  const [stage, setStage] = useState<Stage>('setup');
  const [subject, setSubject] = useState<McqSubject>(initialSubject);
  const [difficulty, setDifficulty] = useState<McqDifficultyFilter>('Mixed');
  const [questions, setQuestions] = useState<McqQuestion[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [current, setCurrent] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [finalElapsed, setFinalElapsed] = useState(0);

  useEffect(() => {
    if (stage !== 'quiz') return undefined;
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [stage, startedAt]);

  const score = useMemo(
    () => questions.reduce((total, question) => total + (answers[question.id] === question.correctIndex ? 1 : 0), 0),
    [answers, questions],
  );
  const answered = Object.keys(answers).length;
  const percentage = questions.length ? Math.round((score / questions.length) * 100) : 0;

  const startTest = () => {
    const now = Date.now();
    setQuestions(createQuizSession(mcqQuestionBanks[subject], difficulty, 20));
    setAnswers({});
    setCurrent(0);
    setStartedAt(now);
    setElapsed(0);
    setFinalElapsed(0);
    setStage('quiz');
  };

  const submitTest = () => {
    setFinalElapsed(Math.floor((Date.now() - startedAt) / 1000));
    setStage('results');
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const reset = () => {
    setStage('setup');
    setQuestions([]);
    setAnswers({});
    setCurrent(0);
  };

  if (stage === 'setup') {
    return <section className={styles.shell} aria-labelledby="mcq-practice-heading">
      <div className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Interview retrieval practice</span>
          <h2 id="mcq-practice-heading">{subjectLocked ? `${subject} MCQ test` : 'Build a 20-question test'}</h2>
          <p>Choose a subject and difficulty. Every session samples across the subject's major concepts.</p>
        </div>
        <div className={styles.bankStat} data-testid="bank-size"><strong>{mcqQuestionBanks[subject].length}</strong><span>questions available</span></div>
      </div>

      {!subjectLocked ? <fieldset className={styles.selector}>
        <legend>1. Choose a subject</legend>
        <div className={styles.subjectGrid}>
          {mcqSubjects.map((item) => <button key={item} type="button" aria-pressed={subject === item} className={subject === item ? styles.selectedCard : styles.subjectCard} onClick={() => setSubject(item)}>
            <strong>{item}</strong><span>200 questions · 20 concepts</span>
          </button>)}
        </div>
      </fieldset> : <div className={styles.focusedSubject}><strong>{subject}</strong><span>200 questions across 20 interview-critical concepts</span></div>}

      <fieldset className={styles.selector}>
        <legend>2. Choose difficulty</legend>
        <div className={styles.difficultyRow}>
          {difficulties.map((item) => <button key={item} type="button" aria-pressed={difficulty === item} className={difficulty === item ? styles.activeDifficulty : undefined} onClick={() => setDifficulty(item)}>{item}</button>)}
        </div>
      </fieldset>

      <div className={styles.startPanel}>
        <div><LockKeyhole aria-hidden="true" /><span>Answers and explanations remain locked until you submit.</span></div>
        <button type="button" className={styles.primaryButton} onClick={startTest}>Start 20-question test</button>
      </div>
    </section>;
  }

  if (stage === 'results') {
    return <section className={styles.shell} aria-labelledby="mcq-results-heading">
      <div className={styles.resultHero} aria-live="polite">
        <span className={styles.eyebrow}>{subject} · {difficulty}</span>
        <h2 id="mcq-results-heading">Test results</h2>
        <div className={styles.score}>{score}<small>/ {questions.length}</small></div>
        <strong className={styles.percentage}>{percentage}%</strong>
        <div className={styles.resultStats}>
          <span><CheckCircle2 aria-hidden="true" /> {score} correct</span>
          <span><XCircle aria-hidden="true" /> {answered - score} incorrect</span>
          <span>{questions.length - answered} unanswered</span>
          <span><Clock3 aria-hidden="true" /> {formatTime(finalElapsed)}</span>
        </div>
        <button type="button" className={styles.primaryButton} onClick={reset}><RotateCcw aria-hidden="true" /> New test</button>
      </div>

      <div className={styles.reviewHeader}><h3>Answer review</h3><p>Open any question to inspect the correct answer and explanation.</p></div>
      <div className={styles.reviewList}>
        {questions.map((question, index) => {
          const selected = answers[question.id];
          const correct = selected === question.correctIndex;
          const status = selected === undefined ? 'Unanswered' : correct ? 'Correct' : 'Incorrect';
          return <details key={question.id} className={styles.reviewItem}>
            <summary><span>Q{index + 1}. {question.topic}</span><strong className={correct ? styles.correctText : styles.incorrectText}>{status}</strong></summary>
            <div className={styles.reviewBody}>
              <p className={styles.reviewPrompt}>{question.prompt}</p>
              <ol className={styles.reviewOptions} type="A">
                {question.options.map((option, optionIndex) => <li key={option} className={optionIndex === question.correctIndex ? styles.correctOption : optionIndex === selected ? styles.wrongOption : undefined}>
                  {option}{optionIndex === question.correctIndex ? <strong> Correct answer</strong> : optionIndex === selected ? <em> Your answer</em> : null}
                </li>)}
              </ol>
              <div className={styles.explanation}><strong>Explanation</strong><p>{question.explanation}</p></div>
              <Link className={styles.studyLink} to={question.learnMore.href}>{question.learnMore.label} →</Link>
            </div>
          </details>;
        })}
      </div>
    </section>;
  }

  const question = questions[current];
  return <section className={styles.shell} aria-labelledby="mcq-question-heading">
    <div className={styles.quizHeader}>
      <div><span>{subject} · {difficulty}</span><strong>Question {current + 1} of {questions.length}</strong></div>
      <div className={styles.liveStats}><span>{answered} answered</span><span><Clock3 aria-hidden="true" /> {formatTime(elapsed)}</span></div>
    </div>
    <div className={styles.progressTrack}><span style={{width: `${((current + 1) / questions.length) * 100}%`}} /></div>

    <div className={styles.quizLayout}>
      <article className={styles.questionCard}>
        <div className={styles.questionMeta}><span>{question.topic}</span><span className={styles[question.difficulty.toLowerCase()]}>{question.difficulty}</span></div>
        <fieldset>
          <legend id="mcq-question-heading">{question.prompt}</legend>
          <div className={styles.options}>
            {question.options.map((option, optionIndex) => <label key={option} className={answers[question.id] === optionIndex ? styles.selectedOption : undefined}>
              <input type="radio" name={question.id} checked={answers[question.id] === optionIndex} onChange={() => setAnswers((currentAnswers) => ({...currentAnswers, [question.id]: optionIndex}))} />
              <span>{String.fromCharCode(65 + optionIndex)}</span><strong>{option}</strong>
            </label>)}
          </div>
        </fieldset>
        <div className={styles.quizActions}>
          <button type="button" disabled={current === 0} onClick={() => setCurrent((value) => value - 1)}><ChevronLeft aria-hidden="true" /> Previous</button>
          {current < questions.length - 1
            ? <button type="button" onClick={() => setCurrent((value) => value + 1)}>Next <ChevronRight aria-hidden="true" /></button>
            : <button type="button" className={styles.submitButton} onClick={submitTest}>Submit test</button>}
        </div>
      </article>

      <aside className={styles.navigator} aria-label="Question navigator">
        <h3>Questions</h3>
        <div>{questions.map((item, index) => <button key={item.id} type="button" aria-label={`Go to question ${index + 1}${answers[item.id] !== undefined ? ', answered' : ''}`} aria-current={current === index ? 'step' : undefined} data-answered={answers[item.id] !== undefined} onClick={() => setCurrent(index)}>{index + 1}</button>)}</div>
        <p><LockKeyhole aria-hidden="true" /> Review is locked during the test.</p>
        <button type="button" className={styles.submitWide} onClick={submitTest}>Submit test</button>
      </aside>
    </div>
  </section>;
}
