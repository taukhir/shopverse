export type McqSubject =
  | 'Java'
  | 'Spring'
  | 'Spring Cloud'
  | 'System Design'
  | 'Kafka'
  | 'Microservices'
  | 'Databases'
  | 'Docker'
  | 'Kubernetes'
  | 'Security';
export type McqDifficulty = 'Easy' | 'Medium' | 'Hard';
export type McqDifficultyFilter = McqDifficulty | 'Mixed';

export type McqConcept = readonly [
  key: string,
  title: string,
  correct: string,
  distractorOne: string,
  distractorTwo: string,
  distractorThree: string,
  explanation: string,
];

export type McqQuestion = {
  id: string;
  subject: McqSubject;
  topic: string;
  difficulty: McqDifficulty;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  learnMore: {label: string; href: string};
};
