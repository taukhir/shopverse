import fs from 'node:fs/promises';
import path from 'node:path';
import {SpreadsheetFile, Workbook} from '@oai/artifact-tool';

const outputDir = path.resolve('documentation/static/downloads/interview');
const topicGroups = [
  ['Core Java and Collections', 'Collections', 5, [
    'Explain the internal working of HashMap.', 'How do equals() and hashCode() affect HashMap keys?', 'What happens when two HashMap keys have the same hash code?', 'Why does HashMap allow one null key?', 'How are HashMap collisions handled?', 'What is rehashing and when does HashMap resize?', 'Why is the default HashMap load factor 0.75?', 'Compare HashMap, Hashtable and ConcurrentHashMap.', 'Compare ArrayList and LinkedList.', 'Compare HashSet, LinkedHashSet and TreeSet.', 'How does HashSet work internally?', 'What makes a Java object a safe HashMap key?', 'What is fail-fast versus fail-safe iteration?', 'How do Comparable and Comparator differ?', 'How does sorting handle null values?', 'What are the time complexities of common Java collections?', 'How does PriorityQueue work internally?', 'When would you use an EnumMap or IdentityHashMap?', 'What is the difference between Collection, Collections and Arrays?', 'What are immutable collections and defensive copies?', 'How does WeakHashMap work and when is it useful?', 'What is the difference between shallow and deep copy?', 'How do ArrayDeque and Stack differ?', 'What is a view collection such as subList()?', 'How do mutable keys break a HashMap?'
  ]],
  ['Concurrency and JVM', 'Threads, Locks and Runtime', 5, [
    'How can you create a thread in Java?', 'What is the difference between Runnable and Callable?', 'What is thread safety?', 'Explain synchronized and monitor locking.', 'What causes a deadlock and how do you prevent it?', 'What is livelock and starvation?', 'What makes a lock reentrant?', 'Compare ReentrantLock and synchronized.', 'What are ReadWriteLock and StampedLock used for?', 'How does ConcurrentHashMap behave during concurrent reads and writes?', 'What are volatile and happens-before?', 'Explain safe publication and the Java Memory Model.', 'How does ExecutorService manage tasks?', 'How should a thread pool be sized?', 'How does CompletableFuture work and what executor does it use?', 'What is ThreadLocal and how can it leak in a thread pool?', 'What causes StackOverflowError?', 'What is a Java memory leak even with garbage collection?', 'How do you diagnose OutOfMemoryError?', 'Explain heap, stack, metaspace and direct memory.', 'How does garbage collection work internally?', 'Compare common JVM garbage collectors.', 'What causes high GC pause time?', 'How do you investigate a CPU or thread contention incident?', 'What is the difference between process, thread and virtual thread?'
  ]],
  ['Java Language, Java 8 and Patterns', 'Language and Design', 4, [
    'Why is String immutable in Java?', 'How do you design an immutable class?', 'Compare String, StringBuilder and StringBuffer.', 'What are functional interfaces?', 'Explain lambda expressions and method references.', 'What is the difference between intermediate and terminal Stream operations?', 'How do Optional and null-handling differ?', 'What are default and static methods in interfaces?', 'Explain Java generics and type erasure.', 'What is the difference between checked and unchecked exceptions?', 'How do try-with-resources and suppressed exceptions work?', 'Explain singleton pattern and its thread-safe implementations.', 'What is double-checked locking and why does it require volatile?', 'When do you use Builder pattern?', 'When do you use Factory pattern?', 'When do you use Strategy pattern?', 'When do you use Decorator pattern?', 'When do you use Chain of Responsibility?', 'Compare Adapter, Facade and Composite patterns?', 'What is Dependency Inversion Principle and how does Spring use it?'
  ]],
  ['Spring Core and Boot', 'Container and Web Runtime', 5, [
    'What is the difference between Spring Framework and Spring Boot?', 'What happens internally when a Spring Boot application starts?', 'Explain the Spring bean lifecycle.', 'What is dependency injection?', 'Why is constructor injection preferred over field or setter injection?', 'How does Spring resolve multiple beans of the same type?', 'Compare @Primary and @Qualifier.', 'Compare @Component, @Service and @Repository.', 'What causes a circular dependency and how should it be removed?', 'What are bean scopes and when do they matter?', 'How does auto-configuration work?', 'What are starters and conditional annotations?', 'How do Spring profiles and externalized configuration work?', 'What is Spring AOP and where is it useful?', 'How does DispatcherServlet implement the front-controller pattern?', 'What is the difference between @Controller and @RestController?', 'How do servlet filters, Spring interceptors and AOP advice differ?', 'How do Actuator health, readiness and liveness endpoints work?'
  ]],
  ['Transactions and Hibernate/JPA', 'Transactions, ORM and Locking', 5, [
    'Why does @Transactional not start a transaction on a private method?', 'Why does self-invocation bypass @Transactional?', 'How can you apply transactions safely to self-invoked work?', 'Do static methods participate in proxy-based transactions?', 'When should you use TransactionTemplate?', 'What are transaction propagation modes?', 'Explain transaction isolation levels with examples.', 'Why use read-only transactions?', 'Does readOnly=true prevent writes?', 'Where should a transaction boundary be placed?', 'What are rollback rules for checked and unchecked exceptions?', 'When do you need SELECT FOR UPDATE or pessimistic locking?', 'Compare optimistic and pessimistic locking.', 'What is @Version and how does optimistic locking fail?', 'What is the N+1 query problem?', 'How do fetch join, EntityGraph and batch fetching address N+1?', 'Explain JPA entity lifecycle states.', 'How does first-level Hibernate cache work?', 'What is second-level cache and what are its consistency risks?', 'Can another Hibernate session read stale cached data?', 'How do query cache and second-level cache differ?', 'What are lazy loading and LazyInitializationException?'
  ]],
  ['REST APIs and Security', 'HTTP and Service Security', 4, [
    'Compare GET, POST, PUT, PATCH and DELETE semantics.', 'How do RequestParam and PathVariable differ?', 'How do you make a POST API idempotent?', 'How should an idempotency key be stored and replayed?', 'How do you design pagination for millions of records?', 'How do you version an API without breaking clients?', 'Compare REST and SOAP.', 'What makes an API RESTful?', 'How do you model API errors consistently?', 'How do you secure REST APIs with JWT or OAuth2?', 'At which layers should authentication and authorization occur in microservices?', 'Why must downstream services still enforce authorization?', 'How do API gateway and service authorization responsibilities differ?', 'How do rate limiting, CORS and CSRF differ?', 'How do you design a book-store or e-commerce REST API?'
  ]],
  ['SQL, NoSQL and Caching', 'Databases', 4, [
    'Compare SQL and NoSQL databases.', 'Explain ACID properties.', 'What is an index and when can it hurt performance?', 'Compare partition key and index.', 'Compare normalization and denormalization.', 'Compare PostgreSQL and MySQL.', 'How do isolation and MVCC affect reads?', 'How do you identify and improve a slow query?', 'When should a relational database be preferred for strict ACID?', 'Why can Cassandra sustain very high write throughput?', 'What trade-offs does Cassandra make for consistency and queries?', 'How do Redis cache-aside and write-through caching differ?', 'What are cache stampede, penetration and avalanche?', 'How do you invalidate a distributed cache safely?', 'When is MongoDB eventual consistency acceptable?'
  ]],
  ['Kafka and Messaging', 'Kafka Reliability and RabbitMQ', 5, [
    'Explain Kafka architecture: broker, topic, partition, producer and consumer.', 'Why are partitions needed in Kafka?', 'How does Kafka preserve ordering?', 'How do keys affect partition selection and per-aggregate ordering?', 'What is a consumer group?', 'Can two consumers in one group consume the same partition?', 'What happens when consumers outnumber partitions?', 'What happens when partitions outnumber consumers?', 'What is consumer lag and what causes it?', 'How do you reduce consumer lag safely?', 'Compare commitSync and commitAsync.', 'What happens if an offset commit fails?', 'How do you handle poison messages?', 'What is a dead-letter topic and when should it be replayed?', 'How do you avoid duplicate processing at consumer level?', 'How do you make a Kafka consumer idempotent?', 'How does an idempotent Kafka producer use PID and sequence numbers?', 'What does Kafka exactly-once semantics cover and not cover?', 'How do retries affect ordering?', 'How do rebalances affect consumers?', 'How do you monitor Kafka reliability and performance?', 'Compare Kafka and RabbitMQ.', 'When should you use a synchronous API instead of Kafka?', 'Compare Kafka with ActiveMQ or MQTT.', 'How are Kafka reliability and parallelism achieved together?'
  ]],
  ['Microservices and Distributed Transactions', 'Architecture and Failure Recovery', 5, [
    'Compare monolith and microservices.', 'When should you retain a monolith?', 'Why should each microservice own its database?', 'How do services choose which events to consume?', 'Compare events and commands.', 'How do API and event-driven communication complement each other?', 'How do you handle failures in a saga?', 'What should happen when inventory does not reply in a saga?', 'Why are timeouts, retries and idempotency required in a saga?', 'How do compensation and database rollback differ?', 'What is the transactional outbox pattern?', 'What is the inbox or consumer-deduplication pattern?', 'Compare 2PC and Saga.', 'How does two-phase commit work?', 'What distributed transaction patterns exist besides 2PC and Saga?', 'What are CQRS and event sourcing?', 'How do you design correlation IDs, tracing and recovery for a distributed flow?'
  ]],
  ['Docker, Kubernetes and OpenShift', 'Platform Operations', 4, [
    'What problem does Docker solve?', 'Compare Docker and Kubernetes.', 'How does Kubernetes detect that a pod is unhealthy?', 'What are liveness, readiness and startup probes?', 'What does a ReplicaSet do?', 'How do Deployment rolling updates work?', 'How do CPU and memory requests and limits affect pods?', 'How does Horizontal Pod Autoscaler make scaling decisions?', 'How does Kubernetes service discovery and load balancing work?', 'What happens during pod termination?', 'What is TKGI and how does it manage Kubernetes clusters?', 'How does OpenShift differ from upstream Kubernetes?'
  ]],
  ['System Design, Performance and Leadership', 'Design and Operations', 5, [
    'How would you design a movie-ticket booking system?', 'How would you design an Instagram feed?', 'How would you design Twitter or a large social timeline?', 'What does an API gateway do?', 'How does a load balancer work?', 'Compare horizontal and vertical scaling.', 'How do you design a rate limiter?', 'Explain CAP theorem with a practical trade-off.', 'How do you monitor and evaluate system performance?', 'Which golden signals and SLOs would you use?', 'How do you plan capacity and estimate instance count?', 'How do you explain a complete project architecture to an interviewer?'
  ]],
  ['Coding and DSA', 'Algorithms', 4, [
    'Solve Two Sum and explain the time-space trade-off.', 'Solve Merge Intervals and state the ordering invariant.', 'Solve Jump Game and explain the greedy proof.', 'Solve Three Sum while avoiding duplicate triplets.', 'Solve Coin Change and compare dynamic programming approaches.', 'Solve Meeting Rooms and identify the required data structure.', 'Find a missing number efficiently.', 'Find the longest substring without repeating characters.', 'Reverse, detect cycles in and merge linked lists.', 'Solve Trapping Rain Water and compare approaches.', 'Design a minimum stack.', 'Find the next element in a nearly sorted sequence.', 'Find the missing number in a binary-tree traversal.'
  ]],
];

const excludedQuestions = new Set([
  'How do you investigate a CPU or thread contention incident?',
  'What is the difference between process, thread and virtual thread?',
  'How do you diagnose OutOfMemoryError?',
  'What causes high GC pause time?',
  'Compare common JVM garbage collectors.',
  'When do you use Decorator pattern?',
  'When do you use Chain of Responsibility?',
  'Compare Adapter, Facade and Composite patterns?',
  'What is Dependency Inversion Principle and how does Spring use it?',
  'When do you use Factory pattern?',
]);

const questions = topicGroups.flatMap(([topic, subtopic, basePriority, prompts]) => prompts.map((question, index) => ({
  topic,
  subtopic,
  question,
  priority: Math.max(3, basePriority - (index > 15 ? 1 : 0)),
  occurrences: 1,
  type: topic === 'Coding and DSA' ? 'Coding' : topic.includes('System') ? 'System design / scenario' : 'Theory / scenario',
  difficulty: topic === 'Coding and DSA' ? 'Medium' : basePriority === 5 ? 'Advanced' : 'Intermediate',
}))).filter(({question}) => !excludedQuestions.has(question));

if (questions.length !== 209) throw new Error(`Expected 209 questions, got ${questions.length}`);

const stars = (priority) => '*'.repeat(priority) + '-'.repeat(5 - priority);
const groups = [...new Set(questions.map(({topic}) => topic))];
const priorityLabels = {5: 'P0 - must master', 4: 'P1 - high value', 3: 'P2 - broaden after P0/P1'};

await fs.mkdir(outputDir, {recursive: true});
const text = [
  'SOURCE INTERVIEW QUESTION BANK',
  '209 prompts reconstructed from the referenced screenshot/video conversation.',
  '',
  'Important: Priority is a preparation rating, not a verified employer frequency. Source occurrences',
  'counts repetition in the source material only; the available transcript does not preserve per-frame',
  'duplicates, so every de-duplicated prompt is recorded as 1. It is not a verified Walmart asked-count.',
  '',
];
let id = 1;
for (const topic of groups) {
  text.push(`=== ${topic.toUpperCase()} ===`, '');
  for (const item of questions.filter((candidate) => candidate.topic === topic)) {
    text.push(`${String(id).padStart(3, '0')}. ${stars(item.priority)} | Source occurrences: ${item.occurrences}`, item.question, '');
    id += 1;
  }
}
await fs.writeFile(path.join(outputDir, 'walmart-interview-questionnaire.txt'), text.join('\n'), 'utf8');

const workbook = Workbook.create();
const bank = workbook.worksheets.add('Question Bank');
bank.showGridLines = false;
bank.getRange('A1:J1').merge();
bank.getRange('A1').values = [['Walmart Interview Questionnaire - 209 prompts']];
bank.getRange('A2:J3').merge();
bank.getRange('A2').values = [[
  'Priority is a study recommendation, not a verified employer frequency. Source occurrences means repetition in the supplied source only; because per-frame duplicate evidence is unavailable in the preserved transcript, each de-duplicated question is recorded as 1.'
]];
const headers = ['ID', 'Topic', 'Subtopic', 'Interview question', 'Priority', 'Stars', 'Source occurrences', 'Question type', 'Difficulty', 'Status'];
bank.getRange('A5:J5').values = [headers];
bank.getRange(`A6:J${questions.length + 5}`).values = questions.map((item, index) => [
  index + 1, item.topic, item.subtopic, item.question, item.priority, stars(item.priority), item.occurrences, item.type, item.difficulty, 'Not started',
]);
bank.getRange('A1:J1').format = {fill: '#12355B', font: {bold: true, color: '#FFFFFF', size: 16}, horizontalAlignment: 'center'};
bank.getRange('A2:J3').format = {fill: '#EAF2F8', font: {italic: true, color: '#1F2937'}, wrapText: true, verticalAlignment: 'center'};
bank.getRange('A5:J5').format = {fill: '#0F766E', font: {bold: true, color: '#FFFFFF'}, horizontalAlignment: 'center', wrapText: true};
bank.getRange(`A6:J${questions.length + 5}`).format.wrapText = true;
bank.getRange(`A5:J${questions.length + 5}`).format.borders = {preset: 'all', style: 'thin', color: '#D1D5DB'};
bank.getRange(`A6:A${questions.length + 5}`).format.horizontalAlignment = 'center';
bank.getRange(`E6:G${questions.length + 5}`).format.horizontalAlignment = 'center';
bank.getRange(`J6:J${questions.length + 5}`).dataValidation = {rule: {type: 'list', values: ['Not started', 'In progress', 'Revised', 'Mock-ready']}};
bank.getRange(`E6:E${questions.length + 5}`).conditionalFormats.add('cellIs', {operator: 'equal', formula: 5, format: {fill: '#FEE2E2', font: {bold: true, color: '#991B1B'}}});
bank.getRange(`E6:E${questions.length + 5}`).conditionalFormats.add('cellIs', {operator: 'equal', formula: 4, format: {fill: '#FEF3C7', font: {bold: true, color: '#92400E'}}});
bank.getRange(`E6:E${questions.length + 5}`).conditionalFormats.add('cellIs', {operator: 'equal', formula: 3, format: {fill: '#DBEAFE', font: {bold: true, color: '#1E40AF'}}});
bank.freezePanes.freezeRows(5);
bank.getRange(`A5:J${questions.length + 5}`).format.autofitRows();
for (const [range, width] of [['A:A', 8], ['B:B', 27], ['C:C', 25], ['D:D', 70], ['E:E', 10], ['F:F', 14], ['G:G', 18], ['H:H', 23], ['I:I', 14], ['J:J', 16]]) bank.getRange(range).format.columnWidth = width;
bank.tables.add(`A5:J${questions.length + 5}`, true, 'QuestionBankTable').style = 'TableStyleMedium2';

const summary = workbook.worksheets.add('Summary');
summary.showGridLines = false;
summary.getRange('A1:F1').merge();
summary.getRange('A1').values = [['Preparation summary']];
summary.getRange('A3:C3').values = [['Topic', 'Questions', 'Highest priority']];
summary.getRange(`A4:C${groups.length + 3}`).values = groups.map((topic) => {
  const inTopic = questions.filter((item) => item.topic === topic);
  return [topic, inTopic.length, Math.max(...inTopic.map((item) => item.priority))];
});
summary.getRange('E3:F3').values = [['Priority', 'Question count']];
summary.getRange('E4:F6').values = [5, 4, 3].map((priority) => [priorityLabels[priority], questions.filter((item) => item.priority === priority).length]);
summary.getRange('A1:F1').format = {fill: '#12355B', font: {bold: true, color: '#FFFFFF', size: 16}, horizontalAlignment: 'center'};
summary.getRange('A3:C3').format = summary.getRange('E3:F3').format = {fill: '#0F766E', font: {bold: true, color: '#FFFFFF'}};
summary.getRange(`A3:C${groups.length + 3}`).format.borders = summary.getRange('E3:F6').format.borders = {preset: 'all', style: 'thin', color: '#D1D5DB'};
summary.getRange('A:F').format.autofitColumns();
summary.getRange('A:A').format.columnWidth = 42;
summary.getRange('E:E').format.columnWidth = 28;

const readMe = workbook.worksheets.add('Read Me');
readMe.showGridLines = false;
readMe.getRange('A1:D1').merge();
readMe.getRange('A1').values = [['How to use this question bank']];
readMe.getRange('A3:B7').values = [
  ['Field', 'Meaning'],
  ['Priority', 'P0 / 5 stars: master first; P1 / 4 stars: high value; P2 / 3 stars: broaden after the first two.'],
  ['Source occurrences', 'Counts repetition only within the source material. It is not a verified employer asked-count.'],
  ['Status', 'Use the drop-down to track retrieval and mock readiness.'],
  ['Scope', 'Prompts are reconstructed from the preserved conversation; use linked documentation for the answers and production details.'],
];
readMe.getRange('A1:D1').format = {fill: '#12355B', font: {bold: true, color: '#FFFFFF', size: 16}, horizontalAlignment: 'center'};
readMe.getRange('A3:B3').format = {fill: '#0F766E', font: {bold: true, color: '#FFFFFF'}};
readMe.getRange('A3:B7').format = {wrapText: true, verticalAlignment: 'top', borders: {preset: 'all', style: 'thin', color: '#D1D5DB'}};
readMe.getRange('A:A').format.columnWidth = 23;
readMe.getRange('B:B').format.columnWidth = 95;
readMe.getRange('A3:B7').format.autofitRows();

const errors = await workbook.inspect({kind: 'match', searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A', options: {useRegex: true, maxResults: 20}, summary: 'formula error scan'});
if (errors.ndjson.includes('#REF!') || errors.ndjson.includes('#DIV/0!') || errors.ndjson.includes('#VALUE!')) throw new Error(errors.ndjson);
const exported = await SpreadsheetFile.exportXlsx(workbook);
await exported.save(path.join(outputDir, 'walmart-interview-questionnaire.xlsx'));
console.log(JSON.stringify({questions: questions.length, outputDir, summary: groups.map((topic) => [topic, questions.filter((item) => item.topic === topic).length])}));
