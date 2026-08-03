import type {McqConcept, McqDifficulty, McqDifficultyFilter, McqQuestion, McqSubject} from './types';

const variants: Array<{difficulty: McqDifficulty; stem: (topic: string) => string}> = [
  {difficulty: 'Easy', stem: (topic) => `Which statement best describes ${topic}?`},
  {difficulty: 'Easy', stem: (topic) => `What is the primary role of ${topic}?`},
  {difficulty: 'Easy', stem: (topic) => `Which claim about ${topic} is correct?`},
  {difficulty: 'Medium', stem: (topic) => `A team is reviewing ${topic}. Which recommendation is sound?`},
  {difficulty: 'Medium', stem: (topic) => `Which production behavior is most accurate for ${topic}?`},
  {difficulty: 'Medium', stem: (topic) => `When reasoning about ${topic}, which statement should guide the design?`},
  {difficulty: 'Medium', stem: (topic) => `Which explanation would be strongest in a senior interview about ${topic}?`},
  {difficulty: 'Hard', stem: (topic) => `During a failure review involving ${topic}, which conclusion is safest?`},
  {difficulty: 'Hard', stem: (topic) => `An architect challenges the design around ${topic}. Which response is defensible?`},
  {difficulty: 'Hard', stem: (topic) => `Which trade-off statement about ${topic} remains correct under production load?`},
];

const subjectGuides: Record<McqSubject, {label: string; href: string}> = {
  Java: {label: 'Study the Java Lead and Architect path', href: '/java/JAVA-LEAD-ARCHITECT-PATH'},
  Spring: {label: 'Study the Spring Architect path', href: '/spring/SPRING-ARCHITECT-PATH'},
  'Spring Cloud': {label: 'Study the Spring Cloud Architect path', href: '/spring/SPRING-CLOUD-ARCHITECT-PATH'},
  'System Design': {label: 'Study the System Design interview catalog', href: '/architecture/system-design-deep-dives/SYSTEM-DESIGN-INTERVIEW-CATALOG'},
  Kafka: {label: 'Study the Kafka Architect path', href: '/integration/KAFKA-ARCHITECT-PATH'},
  Microservices: {label: 'Study the Microservices Architect path', href: '/architecture/microservices/MICROSERVICES-ARCHITECT-PATH'},
  Databases: {label: 'Study Database Production Mastery', href: '/data/DATABASE-PRODUCTION-MASTERY'},
  Docker: {label: 'Study the Docker Architect path', href: '/operations/DOCKER-ARCHITECT-PATH'},
  Kubernetes: {label: 'Study the Kubernetes Architect path', href: '/operations/KUBERNETES-ARCHITECT-PATH'},
  Security: {label: 'Study the Security Architect path', href: '/security/platform/SECURITY-ARCHITECT-PATH'},
};

const rotate = <T,>(values: T[], count: number) => {
  const shift = count % values.length;
  return [...values.slice(shift), ...values.slice(0, shift)];
};

export function buildQuestionBank(subject: McqSubject, concepts: readonly McqConcept[]): McqQuestion[] {
  return concepts.flatMap((concept, conceptIndex) => {
    const [key, topic, correct, one, two, three, explanation] = concept;
    return variants.map((variant, variantIndex) => {
      const options = rotate([correct, one, two, three], conceptIndex + variantIndex);
      return {
        id: `${subject.toLocaleLowerCase().replaceAll(' ', '-')}-${key}-${variantIndex + 1}`,
        subject,
        topic,
        difficulty: variant.difficulty,
        prompt: variant.stem(topic),
        options,
        correctIndex: options.indexOf(correct),
        explanation,
        learnMore: subjectGuides[subject],
      };
    });
  });
}

const shuffle = <T,>(values: readonly T[], random: () => number): T[] => {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
};

export function createQuizSession(
  bank: readonly McqQuestion[],
  difficulty: McqDifficultyFilter,
  count = 20,
  random: () => number = Math.random,
): McqQuestion[] {
  const eligible = difficulty === 'Mixed' ? bank : bank.filter((question) => question.difficulty === difficulty);
  const byTopic = new Map<string, McqQuestion[]>();
  eligible.forEach((question) => byTopic.set(question.topic, [...(byTopic.get(question.topic) ?? []), question]));

  const onePerTopic = shuffle(Array.from(byTopic.entries()), random)
    .map(([, questions]) => shuffle(questions, random)[0]);
  if (onePerTopic.length >= count) return shuffle(onePerTopic, random).slice(0, count);

  const usedIds = new Set(onePerTopic.map((question) => question.id));
  const remaining = shuffle(eligible.filter((question) => !usedIds.has(question.id)), random);
  return shuffle([...onePerTopic, ...remaining.slice(0, count - onePerTopic.length)], random);
}
