import {buildQuestionBank} from './buildQuestionBank';
import {javaConcepts} from './javaConcepts';
import {springCloudConcepts} from './springCloudConcepts';
import {springConcepts} from './springConcepts';
import {systemDesignConcepts} from './systemDesignConcepts';
import {databaseConcepts, dockerConcepts, kafkaConcepts, kubernetesConcepts, microservicesConcepts, securityConcepts} from './additionalConcepts';
import type {McqQuestion, McqSubject} from './types';

export {createQuizSession} from './buildQuestionBank';
export type {McqDifficulty, McqDifficultyFilter, McqQuestion, McqSubject} from './types';

export const mcqQuestionBanks: Record<McqSubject, McqQuestion[]> = {
  Java: buildQuestionBank('Java', javaConcepts),
  Spring: buildQuestionBank('Spring', springConcepts),
  'Spring Cloud': buildQuestionBank('Spring Cloud', springCloudConcepts),
  'System Design': buildQuestionBank('System Design', systemDesignConcepts),
  Kafka: buildQuestionBank('Kafka', kafkaConcepts),
  Microservices: buildQuestionBank('Microservices', microservicesConcepts),
  Databases: buildQuestionBank('Databases', databaseConcepts),
  Docker: buildQuestionBank('Docker', dockerConcepts),
  Kubernetes: buildQuestionBank('Kubernetes', kubernetesConcepts),
  Security: buildQuestionBank('Security', securityConcepts),
};

export const mcqSubjects = Object.keys(mcqQuestionBanks) as McqSubject[];

for (const [subject, bank] of Object.entries(mcqQuestionBanks)) {
  if (bank.length !== 200 || new Set(bank.map((question) => question.id)).size !== 200) {
    throw new Error(`${subject} MCQ bank must contain exactly 200 uniquely identified questions.`);
  }
  for (const level of ['Easy', 'Medium', 'Hard'] as const) {
    if (bank.filter((question) => question.difficulty === level).length < 20) {
      throw new Error(`${subject} MCQ bank needs at least 20 ${level} questions.`);
    }
  }
}
