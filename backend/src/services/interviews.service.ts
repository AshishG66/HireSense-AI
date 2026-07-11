import axios from 'axios';
import logger from '../lib/logger';
import { NotFoundError, ForbiddenError, ValidationError, InternalServerError } from '../utils/AppError';
import interviewsRepository from '../repositories/interviews.repository';
import resumesRepository from '../repositories/resumes.repository';
import usersRepository from '../repositories/users.repository';
import speechService from './speech.service';
import config from '../config/env';

export class InterviewsService {
  private aiServiceUrl: string;

  constructor() {
    this.aiServiceUrl = config.AI_SERVICE_URL || 'http://localhost:8000';
  }

  private async getCandidateProfile(userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user || !user.candidateProfile) {
      throw new ForbiddenError('Only candidates can start practice interview rounds');
    }
    return user.candidateProfile;
  }

  async startSession(
    userId: string,
    data: { companyName: string; jobRole: string; difficulty: string; interviewType: string },
  ) {
    const candidate = await this.getCandidateProfile(userId);

    // 1. Fetch Candidate default resume and rawText for JD matching context
    const resumes = await resumesRepository.findAll(candidate.id);
    const defaultResume = resumes.find((r) => r.isDefault) || resumes[0];
    let resumeText = 'Candidate Profile Skills: ' + candidate.skills.join(', ');

    if (defaultResume && defaultResume.versions?.length > 0) {
      resumeText = defaultResume.versions[0].rawText || resumeText;
    }

    // 2. Fetch candidate previous interview history for question variance
    const history = await interviewsRepository.findHistoryByCandidate(candidate.id);
    const historySummary = history
      .slice(0, 3)
      .map((h) => `Role: ${h.jobRole}, Score: ${h.score}`)
      .join('; ');

    logger.info(`Requesting questions from AI service for candidate ${candidate.id}`);

    // 3. Call FastAPI to generate structured questions list
    let questions: { question_text: string; expected_criteria: string; question_type: string }[] = [];
    try {
      const response = await axios.post(`${this.aiServiceUrl}/api/v1/interview/questions`, {
        resume_text: resumeText,
        job_description: `Role profile at ${data.companyName} as ${data.jobRole}`,
        difficulty: data.difficulty,
        interview_type: data.interviewType,
        previous_history: historySummary,
      });
      questions = response.data.questions;
      logger.info(`Successfully generated questions from AI Service for candidate ${candidate.id}`);
    } catch (err: any) {
      logger.error(`AI Service call failed for interview generation: ${err.message}`, err);
      logger.info(`Initiating local fallback question generator for candidate ${candidate.id} (Company: ${data.companyName}, Role: ${data.jobRole}, Type: ${data.interviewType})`);
      questions = this.getFallbackQuestions(data.companyName, data.jobRole, data.difficulty, data.interviewType);
    }

    // 4. Register session in database
    const session = await interviewsRepository.createSession({
      candidateProfileId: candidate.id,
      companyName: data.companyName,
      jobRole: data.jobRole,
      difficulty: data.difficulty,
      interviewType: data.interviewType,
      status: 'IN_PROGRESS',
      scheduledAt: new Date(),
    });

    // 5. Add questions under this session
    await interviewsRepository.addQuestions(
      session.id,
      questions.map((q, idx) => ({
        questionText: q.question_text,
        expectedCriteria: q.expected_criteria,
        orderIndex: idx + 1,
      })),
    );

    return interviewsRepository.findById(session.id);
  }

  async submitAnswer(
    userId: string,
    sessionId: string,
    questionId: string,
    file?: { buffer: Buffer; mimetype: string },
    textAnswer?: string,
  ) {
    const candidate = await this.getCandidateProfile(userId);
    const session = await interviewsRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundError('Interview session not found');
    }
    if (session.candidateProfileId !== candidate.id) {
      throw new ForbiddenError('You do not own this interview session');
    }

    const question = session.questions.find((q) => q.id === questionId);
    if (!question) {
      throw new NotFoundError('Question not found in this session');
    }

    // 1. Perform audio transcription if file is supplied
    let transcript = textAnswer || '';
    if (file) {
      transcript = await speechService.transcribe(file.buffer, file.mimetype);
    }

    if (!transcript.trim()) {
      throw new ValidationError('No response transcript captured.');
    }

    // 2. Save raw answer to DB (Progress auto-save checkpoint)
    const savedAnswer = await interviewsRepository.saveAnswer(questionId, candidate.id, {
      transcript,
      duration: 30, // Mock duration
    });

    // 3. Evaluate answer using FastAPI grading service
    logger.info(`Evaluating answer ${savedAnswer.id} against criteria: "${question.expectedCriteria}"`);
    let evaluation;
    try {
      const response = await axios.post(`${this.aiServiceUrl}/api/v1/interview/evaluate`, {
        question: question.questionText,
        expected_criteria: question.expectedCriteria || '',
        student_answer: transcript,
        difficulty: session.difficulty || 'MEDIUM',
      });
      evaluation = response.data;
    } catch (err: any) {
      logger.error(`AI Service error: ${err.message}`);
      throw new InternalServerError(`Failed to evaluate answer: ${err.response?.data?.detail || err.message}`);
    }

    // 4. Save AI grades back to database
    await interviewsRepository.updateAnswerEvaluation(savedAnswer.id, {
      aiFeedback: evaluation.feedback,
      aiScore: evaluation.overall_score,
      technicalAccuracy: evaluation.technical_accuracy,
      communication: evaluation.communication,
      problemSolving: evaluation.problem_solving,
      confidence: evaluation.confidence,
      completeness: evaluation.completeness,
      grammar: evaluation.grammar,
    });

    return interviewsRepository.findById(sessionId);
  }

  async compileReport(userId: string, sessionId: string) {
    const candidate = await this.getCandidateProfile(userId);
    const session = await interviewsRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundError('Session not found');
    }
    if (session.candidateProfileId !== candidate.id) {
      throw new ForbiddenError('Access forbidden');
    }

    // 1. Gather all answered questions in this session
    const answers = session.questions
      .map((q) => {
        const ans = q.answers?.[0];
        if (!ans) return null;
        return {
          question: q.questionText,
          expected_criteria: q.expectedCriteria || '',
          student_answer: ans.transcript || '',
          overall_score: ans.aiScore || 0,
        };
      })
      .filter((a) => a !== null);

    if (answers.length === 0) {
      throw new ValidationError('No questions answered in this session.');
    }

    // 2. Request synthesized executive report from FastAPI
    logger.info(`Compiling final mock interview report for session ${sessionId}`);
    let report;
    try {
      const response = await axios.post(`${this.aiServiceUrl}/api/v1/interview/report`, {
        answers,
      });
      report = response.data;
    } catch (err: any) {
      logger.error(`AI Service report generation failed: ${err.message}`, err);
      logger.info(`Constructing local fallback performance report for session ${sessionId}`);
      
      // Calculate averages from actual evaluations of answers in the session
      let totalOverallScore = 0;
      let totalTechnicalScore = 0;
      let totalBehavioralScore = 0;
      let totalCommunicationScore = 0;
      let answerCount = 0;

      session.questions.forEach((q) => {
        const ans = q.answers?.[0];
        if (ans) {
          answerCount++;
          // aiScore is usually 0-10 on individual questions, overall score is 0-100.
          totalOverallScore += (ans.aiScore || 0) * 10;
          totalTechnicalScore += (ans.technicalAccuracy || 0) * 10;
          totalBehavioralScore += (ans.problemSolving || 0) * 10;
          totalCommunicationScore += (ans.communication || 0) * 10;
        }
      });

      const avgOverall = answerCount > 0 ? Math.round(totalOverallScore / answerCount) : 70;
      const avgTechnical = answerCount > 0 ? Math.round(totalTechnicalScore / answerCount) : 70;
      const avgBehavioral = answerCount > 0 ? Math.round(totalBehavioralScore / answerCount) : 70;
      const avgCommunication = answerCount > 0 ? Math.round(totalCommunicationScore / answerCount) : 70;

      // Construct a meaningful fallback report
      report = {
        overall_score: avgOverall,
        technical_score: avgTechnical,
        behavioral_score: avgBehavioral,
        communication_score: avgCommunication,
        strengths: [
          'Demonstrated good understanding of the foundational principles of the role.',
          'Maintained logical structure in responses.',
        ],
        weaknesses: [
          'Could elaborate further with specific real-world experiences or metrics.',
          'Consider deeper dive into performance optimization and scale considerations.',
        ],
        learning_resources: [
          'Review the official documentation and best practices for ' + (session.jobRole || 'the role') + '.',
          'Practice system design paradigms and standard architectural blueprints.',
        ],
        suggested_projects: [
          'Implement a small project practicing the core concepts discussed during the interview.',
          'Write a clean, modular component or utility solving a complex scenario.',
        ],
        next_difficulty: (session.difficulty || 'MEDIUM').toUpperCase(),
      };
    }

    // 3. Update session report in database
    return interviewsRepository.updateSessionStatus(sessionId, {
      status: 'EVALUATED',
      completedAt: new Date(),
      feedback: `Overall score: ${report.overall_score}/100. Strengths: ${report.strengths.slice(0, 2).join(', ')}`,
      score: report.overall_score,
      feedbackDetails: report,
    });
  }

  async getSessionDetails(userId: string, sessionId: string) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new ForbiddenError('Unauthorized');

    const session = await interviewsRepository.findById(sessionId);
    if (!session) throw new NotFoundError('Interview session not found');

    if (user.role.name === 'CANDIDATE') {
      const candidate = user.candidateProfile;
      if (!candidate || session.candidateProfileId !== candidate.id) {
        throw new ForbiddenError('Access forbidden');
      }
    }

    return session;
  }

  async getCandidateHistory(userId: string) {
    const candidate = await this.getCandidateProfile(userId);
    return interviewsRepository.findHistoryByCandidate(candidate.id);
  }

  async getRecruiterReports(userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user || user.role.name !== 'RECRUITER') {
      throw new ForbiddenError('Unauthorized: Only recruiters can browse candidate lists');
    }
    return interviewsRepository.findAllSessionsForRecruiters();
  }

  private getFallbackQuestions(
    companyName: string,
    jobRole: string,
    difficulty: string,
    interviewType: string,
  ): { question_text: string; expected_criteria: string; question_type: string }[] {
    const roleLower = jobRole.toLowerCase();
    let roleCat = 'GENERIC';
    if (roleLower.includes('frontend') || roleLower.includes('react') || roleLower.includes('web') || roleLower.includes('ui') || roleLower.includes('javascript') || roleLower.includes('typescript')) {
      roleCat = 'FRONTEND';
    } else if (roleLower.includes('backend') || roleLower.includes('node') || roleLower.includes('java') || roleLower.includes('python') || roleLower.includes('go') || roleLower.includes('database') || roleLower.includes('api')) {
      roleCat = 'BACKEND';
    } else if (roleLower.includes('devops') || roleLower.includes('cloud') || roleLower.includes('sre') || roleLower.includes('kubernetes') || roleLower.includes('docker') || roleLower.includes('aws')) {
      roleCat = 'DEVOPS';
    } else if (roleLower.includes('data') || roleLower.includes('ml') || roleLower.includes('machine learning') || roleLower.includes('ai') || roleLower.includes('model') || roleLower.includes('science')) {
      roleCat = 'DATASCIENCE';
    } else if (roleLower.includes('mobile') || roleLower.includes('ios') || roleLower.includes('android') || roleLower.includes('flutter') || roleLower.includes('app')) {
      roleCat = 'MOBILE';
    }

    const diffUpper = (difficulty || 'MEDIUM').toUpperCase();
    const diffKey = ['EASY', 'MEDIUM', 'HARD'].includes(diffUpper) ? diffUpper : 'MEDIUM';

    const techQuestions: Record<string, Record<string, { q: string; criteria: string }[]>> = {
      FRONTEND: {
        EASY: [
          { q: "What is the difference between Virtual DOM and Real DOM in React, and how does it benefit performance?", criteria: "Mention that direct DOM updates are slow; React maintains a lightweight representation in memory and reconciles changes efficiently using batching." },
          { q: "Explain the CSS Box Model. What is the difference between content-box and border-box?", criteria: "Detail margin, border, padding, and content. Contrast content-box (width equals content only) with border-box (width includes padding and border)." },
          { q: "What are semantic HTML tags and why are they important for modern web design?", criteria: "Explain accessibility (a11y), SEO optimization, and readability benefits of using tags like header, article, section, footer, and nav." }
        ],
        MEDIUM: [
          { q: "How do React hooks work? Explain the rules of hooks and how you would design a custom hook.", criteria: "State hooks must be called at top level, only in functional components. Custom hooks abstract stateful logic for reuse." },
          { q: "What are the common strategies for optimizing a React application's rendering performance?", criteria: "Mention React.memo, useCallback, useMemo, virtualized lists for large datasets, and code splitting/lazy loading." },
          { q: "Explain Cross-Origin Resource Sharing (CORS). How do you handle CORS errors during frontend-backend communication?", criteria: "Describe same-origin policy, preflight requests (OPTIONS), and configuring headers (Access-Control-Allow-Origin) on the server." }
        ],
        HARD: [
          { q: "Compare Server-Side Rendering (SSR), Static Site Generation (SSG), and Client-Side Rendering (CSR). When should you choose each?", criteria: "Compare initial load time, SEO benefits, server load, and dynamic content handling. Quote Next.js concepts like Hydration." },
          { q: "Explain React's Fiber architecture and how the concurrent rendering model works under the hood.", criteria: "Explain the split of render phase (interruptible) and commit phase (non-interruptible), priority lanes, and how useTransition handles high-priority events." },
          { q: "How would you design a scalable state management structure for a micro-frontend application?", criteria: "Explain shared state stores (Zustand/Redux), isolated state domains, custom events for cross-app communication, and avoiding global store pollution." }
        ]
      },
      BACKEND: {
        EASY: [
          { q: "What is the difference between SQL and NoSQL databases? When would you use each?", criteria: "Relational (structured, ACID compliant, schemas) vs Non-relational (flexible, horizontally scalable, key-value/document). Use SQL for transactional consistency; NoSQL for unstructured high-speed scaling." },
          { q: "Explain how asynchronous operations work in Node.js, and compare callbacks, Promises, and async/await.", criteria: "Explain the single-threaded non-blocking event loop. Compare callbacks (callback hell), Promises (then/catch syntax), and async/await (cleaner synchronous-style async code)." },
          { q: "What is the purpose of HTTP status codes? Give examples of 2xx, 3xx, 4xx, and 5xx series.", criteria: "2xx = Success (e.g. 200 OK, 201 Created), 3xx = Redirection (e.g. 301, 302), 4xx = Client Error (e.g. 400, 401, 403, 404), 5xx = Server Error (e.g. 500, 502, 503)." }
        ],
        MEDIUM: [
          { q: "Describe the phases of the Node.js event loop. How do process.nextTick and setImmediate differ?", criteria: "Phases include timers, pending callbacks, idle/prepare, poll, check, close. nextTick executes immediately after the current operation; setImmediate executes during the check phase." },
          { q: "How do you design database indexes, and how do they optimize query search times under the hood?", criteria: "B-Tree or Hash indexes. Explain that indexes speed up reads by creating search pathways but slow down writes because indexes must be updated on insert/update." },
          { q: "Compare Session-based authentication with Token-based (JWT) authentication. What are the security trade-offs?", criteria: "Sessions (stateful, server-side storage, cookie-based, easy revoking) vs JWT (stateless, client-side, self-contained, harder to invalidate before expiry without blacklisting)." }
        ],
        HARD: [
          { q: "Explain database sharding and partitioning. How do you handle cross-shard queries and joins?", criteria: "Horizontal partitioning splits data across database instances. Mention sharding keys, consistent hashing, and avoiding cross-shard joins by denormalizing or using map-reduce." },
          { q: "What is the Saga pattern in microservices, and how does it ensure distributed transaction consistency?", criteria: "A sequence of local transactions. If one fails, compensating transactions are executed in reverse order. Contrast choreography (event-driven) vs orchestration (central controller)." },
          { q: "How would you design a distributed rate limiter that handles millions of requests per second with minimal latency?", criteria: "Use Redis with Token Bucket or Sliding Window Log. Explain minimizing network roundtrips with Lua scripting, and handling local memory caches." }
        ]
      },
      DEVOPS: {
        EASY: [
          { q: "What are the core benefits of containerization using Docker?", criteria: "Portability, consistent environment between dev/prod, resource isolation, rapid spin-up times, and simplified dependency management." },
          { q: "Explain the difference between a Virtual Machine and a Docker Container.", criteria: "VMs virtualize hardware (contain full OS guest, heavy resources), whereas Containers virtualize the OS kernel (share host OS, lightweight, fast)." },
          { q: "What is CI/CD, and why is it critical in modern software engineering?", criteria: "Continuous Integration (automated tests on commit) and Continuous Deployment (automated deployments to staging/prod). Reduces manual release risk." }
        ],
        MEDIUM: [
          { q: "Explain the core Kubernetes components: Pod, Service, Deployment, and Ingress.", criteria: "Pod (smallest deployable unit), Service (network abstraction/load balancer), Deployment (manages replica sets/updates), Ingress (external HTTP/S traffic routing)." },
          { q: "What is Infrastructure as Code (IaC)? Compare declarative vs imperative IaC tools.", criteria: "Managing infrastructure via config files. Declarative (state target defined, e.g. Terraform) vs Imperative (steps/commands defined, e.g. Ansible/scripts)." },
          { q: "How do you implement centralized logging and metrics monitoring in a microservices cluster?", criteria: "ELK/PLG stacks for logs. Prometheus and Grafana for metrics. Explain node exporters, scraping intervals, and log agents (Fluentbit)." }
        ],
        HARD: [
          { q: "Design a high-availability, multi-region active-active deployment topology on AWS/GCP.", criteria: "Global load balancing (Route53/Cloud DNS), multi-region replication of database (Aurora Global/Spanner), latency-based routing, and failover health check policies." },
          { q: "Describe the rollback and deployment strategies: Blue-Green vs Canary. How do you implement them?", criteria: "Blue-Green: run identical staging environment, switch router. Canary: route a small percentage of traffic (e.g. 5%) to new version first, monitor errors." },
          { q: "Explain Service Mesh architecture (e.g. Istio) and how sidecar proxies handle cluster security and routing.", criteria: "Data plane (Envoy sidecars intercepting traffic) and Control plane (manages certificates, routing policies). Enables mTLS, fine-grained traffic splitting, and circuit breaking." }
        ]
      },
      DATASCIENCE: {
        EASY: [
          { q: "Compare Supervised, Unsupervised, and Reinforcement Learning.", criteria: "Supervised (labeled data), Unsupervised (unlabeled data, clustering/patterns), Reinforcement (agent learning from reward/penalty feedback loop)." },
          { q: "Explain Precision, Recall, and F1-Score. When is Precision more important than Recall?", criteria: "Precision (TP / (TP+FP)) vs Recall (TP / (TP+FN)). F1 is harmonic mean. Precision is critical when false positives are expensive (e.g., spam filtering)." },
          { q: "What is overfitting, and what are the standard ways to detect and prevent it?", criteria: "Model performs well on training data but poorly on test data. Prevent via cross-validation, regularization (L1/L2), pruning, dropout, or gathering more data." }
        ],
        MEDIUM: [
          { q: "What is feature engineering? Explain techniques like one-hot encoding, normalization, and handling missing data.", criteria: "Creating better inputs for ML models. Normalization scales to 0-1 range. One-hot handles categorical fields. Missing data handled via imputation (mean, median) or dropping." },
          { q: "Explain the Bias-Variance Tradeoff in Machine Learning.", criteria: "Bias (error from simplistic assumptions/underfitting) vs Variance (error from sensitivity to training data noise/overfitting). Goal is to minimize both." },
          { q: "How do Decision Trees and Random Forests differ? Explain bagging.", criteria: "Decision Tree is a single classifier. Random Forest is an ensemble of trees. Bagging (Bootstrap Aggregating) trains trees on random subsets of data and averages their votes." }
        ],
        HARD: [
          { q: "Explain the Transformer attention mechanism, specifically Self-Attention.", criteria: "Explain Query, Key, and Value matrices. Detail calculating dot products (Q*K), scaling by square root of dimension, applying Softmax, and multiplying by V." },
          { q: "How would you design a real-time ML model inference pipeline that serves millions of users with latency under 50ms?", criteria: "Model optimization (quantization, pruning, TensorRT), caching frequent predictions, distributed model registry, queueing for batching, and GPU cluster auto-scaling." },
          { q: "What is vector database indexing, and how do HNSW and IVF algorithms optimize similarity search?", criteria: "Hierarchical Navigable Small World (graph-based fast nearest neighbor) vs Inverted File Index (clustering space to search subset). Speeds up semantic search for LLMs/RAG." }
        ]
      },
      MOBILE: {
        EASY: [
          { q: "Compare Native vs Cross-platform mobile development (e.g., Swift/Kotlin vs React Native/Flutter).", criteria: "Native (maximum performance, direct API access, separate codebases) vs Cross-platform (single codebase, faster deployment, potential performance overhead)." },
          { q: "What is a mobile app lifecycle? Explain state transitions like active, background, and suspended.", criteria: "Active (foreground/visible), Background (running code but hidden), Suspended (in memory but execution paused; can be killed by OS if memory is low)." },
          { q: "How do push notifications work on iOS and Android?", criteria: "Server sends payload to APNs (Apple) or FCM (Google), which pushes it to the device, waking up the app or displaying a system alert." }
        ],
        MEDIUM: [
          { q: "What are memory leaks in mobile development, and how do you prevent them?", criteria: "Caused by strong reference cycles. Prevent using weak or unowned references (iOS) or cleaning up listener registrations in lifecycle destroy hooks (Android)." },
          { q: "How do you implement local offline caching in mobile applications?", criteria: "Use local databases (CoreData for iOS, Room/SQLite for Android) combined with repository patterns that fetch from database first, update from network asynchronously." },
          { q: "Explain the Model-View-ViewModel (MVVM) architecture in the context of mobile development.", criteria: "Model (data/business logic), View (layout/UI), ViewModel (exposes data states and handles user actions, binding view without direct UI references)." }
        ],
        HARD: [
          { q: "How do you optimize mobile application launch performance and achieve a smooth 120 FPS rendering UI?", criteria: "Optimize launch (lazy load modules, avoid heavy main-thread work, splash screen deferrals). Smooth UI (avoid main thread layouts, optimize image sizes, reuse table/list cells, use profile tools)." },
          { q: "Describe the architecture of an offline-first synchronization engine that handles bi-directional data changes and conflict resolution.", criteria: "Local queues for edits, transaction logs with vector clocks/timestamps, conflict resolution (last-write-wins or client merge), and exponential backoff retry for syncing." },
          { q: "Explain keychain/keystore secure storage and how to authenticate biometric access in native applications.", criteria: "Hardware-backed secure enclave/keystore. Key creation with biometric flags. Call system local authentication APIs to request signature using secure keys." }
        ]
      },
      GENERIC: {
        EASY: [
          { q: "Explain Big O notation and give the time complexities of common sorting algorithms.", criteria: "Big O measures execution time growth rate. Bubble Sort: O(n^2), Quick Sort/Merge Sort: O(n log n). Space complexity should also be mentioned." },
          { q: "Compare Array and Linked List data structures. What are the read and write time complexities?", criteria: "Array (contiguous memory, O(1) random access, O(n) insert/delete). Linked List (non-contiguous, O(n) search/read, O(1) insert/delete if node reference is held)." },
          { q: "What is Object-Oriented Programming? Name and explain its four core pillars.", criteria: "Encapsulation (hiding state), Abstraction (simplifying complex details), Inheritance (reusing code), Polymorphism (multiple forms/overriding methods)." }
        ],
        MEDIUM: [
          { q: "Describe Breadth-First Search (BFS) and Depth-First Search (DFS) graph traversal algorithms. When is each preferred?", criteria: "BFS uses queue (finds shortest path in unweighted graphs). DFS uses stack/recursion (useful for topological sort, cycle detection, path finding)." },
          { q: "Explain the SOLID design principles.", criteria: "Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion. Briefly explain each principle's purpose." },
          { q: "How do you design a highly available URL shortener service (like bit.ly)?", criteria: "Details on hash generation (Base62 encoding of MD5/snowflake IDs), database selection (caching redirects in Redis, storing in Postgres/Cassandra), and load balancing redirects." }
        ],
        HARD: [
          { q: "Explain distributed consensus and describe the Raft or Paxos algorithm.", criteria: "How multiple nodes agree on state. Raft stages: leader election, log replication, safety. Resolves split-brain using term numbers and majority quorums." },
          { q: "Compare Lock-free concurrency with Lock-based concurrency. What are CAS operations?", criteria: "Lock-based uses mutexes (susceptible to deadlocks, priority inversion). Lock-free uses Compare-And-Swap (CAS) atomic hardware instructions to avoid thread blocking." },
          { q: "How would you design a scalable distributed job scheduler that guarantees at-least-once execution of tasks?", criteria: "Use partition queue, worker heartbeats, state stores to track job progress (pending, processing, completed), and a dead-letter queue for failed retries." }
        ]
      }
    };

    const behavioralQuestions: Record<string, { q: string; criteria: string }[]> = {
      Google: [
        { q: "Describe a time you worked on a project with highly ambiguous requirements. How did you resolve the ambiguity and drive progress?", criteria: "STAR method. Show proactive scoping, stakeholder communication, creating structural milestones, and validating assumptions early." },
        { q: "Tell me about a time you proposed a creative, non-obvious solution to a complex engineering problem. What made your approach unique?", criteria: "Show original thinking, technical depth, evaluating trade-offs, getting team buy-in, and successfully executing the design." }
      ],
      Amazon: [
        { q: "Describe a situation where you had to make a fast decision with incomplete data to meet a critical deadline. What was the outcome?", criteria: "STAR method. Highlight Bias for Action, analytical risk assessment, mitigating fallout, and ownership of the resulting outcome." },
        { q: "Tell me about a time you went out of your way to solve a customer's problem or went above and beyond your core job description.", criteria: "Highlight Customer Obsession and Ownership. Focus on empathy, root-cause resolution, and long-term improvements." }
      ],
      Microsoft: [
        { q: "Describe a significant project failure or setback you experienced. What did you learn, and how did you use that knowledge in later work?", criteria: "Highlight Growth Mindset. Focus on self-reflection, learning from mistakes, adjusting strategies, and adapting to change." },
        { q: "Tell me about a time you had to work with a difficult team member or a stakeholder with completely opposite goals. How did you build consensus?", criteria: "Highlight collaboration and inclusion. Show listening skills, finding common ground, respectful negotiation, and aligning to shared objectives." }
      ],
      Meta: [
        { q: "Describe a time you had to deliver a high-impact feature or hotfix under extremely tight deadlines. How did you balance speed and quality?", criteria: "Highlight Move Fast and Focus on Impact. Explain prioritizing tasks, automated testing safety nets, incremental rollouts, and trade-off management." },
        { q: "Tell me about a time you built or designed a system that scaled exceptionally well. How did you plan for future traffic or data volume?", criteria: "Focus on technical foresight. Discuss load testing, identifying potential bottlenecks (database, queue, network), and modular scaling principles." }
      ],
      Apple: [
        { q: "Tell me about a time you refused to compromise on code quality or user experience details even when faced with scheduling pressures.", criteria: "Highlight Attention to Detail and Craftsmanship. Explain why the quality standard was crucial, how you negotiated, and how you delivered a refined result." },
        { q: "Describe a situation where you had to design a feature that balanced user functionality with strict privacy or security guidelines.", criteria: "Highlight Apple's values of privacy and security. Discuss local data processing, encryption techniques, minimal data collection, and threat modeling." }
      ],
      GENERIC: [
        { q: "Tell me about a time you had a technical disagreement with a team member. How did you express your view and reach a resolution?", criteria: "Show communication skills, analyzing objective trade-offs (benchmarking, docs), compromising, and committing to the final team decision." },
        { q: "Describe a complex technical bug you encountered in production. Walk me through your diagnostics and how you resolved the root cause.", criteria: "Highlight structured troubleshooting (logs, tracing, local replication), isolating the failure domain, executing a safe hotfix, and adding post-mortem safeguards." }
      ]
    };

    const hrQuestions = [
      { q: "Why do you want to join our company, and what unique value do you bring to this specific role?", criteria: "Demonstrate interest in the target company's mission/products, highlight matching skills, and show how the candidate's background solves company problems." },
      { q: "Where do you see yourself in 3-5 years, and how does this role align with your career goals?", criteria: "Outline professional growth goals, desire to master current responsibilities, taking on leadership or deep technical expertise, and commitment to the role." },
      { q: "Describe a situation where you had to manage competing priorities. How did you organize your work and communicate status?", criteria: "STAR method. Highlight prioritization frameworks (e.g. Eisenhower Matrix, business value), negotiating deadlines, and proactive communication." },
      { q: "What are your salary expectations and relocation preferences?", criteria: "Professional articulation of requirements based on market standards, showing flexibility and alignment with company constraints." }
    ];

    const situationalQuestions = [
      { q: "Imagine we have a production outage affecting 10% of users, but logs are corrupted. How do you approach diagnosis under pressure?", criteria: "Remain calm. Propose step-by-step containment, checking telemetry/metrics, reverting recent commits/deployments, and communicating with users while troubleshooting." },
      { q: "You are assigned to work on a legacy codebase with zero documentation. What is your strategy to understand it and build new features?", criteria: "Run the app, trace user requests, read existing tests, sketch system flows, document learnings, refactor with small testable increments, and avoid large rewrites." },
      { q: "A product manager wants to add a feature that you believe will severely degrade application load times. How do you handle this?", criteria: "Communicate objectively using metrics, present alternative implementations or optimizations, explain impact on user retention, and align on compromises." }
    ];

    const companyKey = Object.keys(behavioralQuestions).find(k => k.toLowerCase() === (companyName || '').toLowerCase()) || 'GENERIC';
    const companyBehavioral = behavioralQuestions[companyKey];
    const genericBehavioral = behavioralQuestions['GENERIC'];

    const typeUpper = (interviewType || 'MIXED').toUpperCase();
    const result: { question_text: string; expected_criteria: string; question_type: string }[] = [];

    if (typeUpper === 'TECHNICAL') {
      const pool = techQuestions[roleCat]?.[diffKey] || techQuestions['GENERIC']['MEDIUM'];
      pool.slice(0, 3).forEach(item => {
        result.push({ question_text: item.q, expected_criteria: item.criteria, question_type: 'TECHNICAL' });
      });
      result.push({ question_text: companyBehavioral[0].q, expected_criteria: companyBehavioral[0].criteria, question_type: 'BEHAVIORAL' });
      result.push({ question_text: situationalQuestions[0].q, expected_criteria: situationalQuestions[0].criteria, question_type: 'SITUATIONAL' });
    } else if (typeUpper === 'BEHAVIORAL') {
      companyBehavioral.forEach(item => {
        result.push({ question_text: item.q, expected_criteria: item.criteria, question_type: 'BEHAVIORAL' });
      });
      genericBehavioral.forEach(item => {
        result.push({ question_text: item.q, expected_criteria: item.criteria, question_type: 'BEHAVIORAL' });
      });
      result.push({ question_text: situationalQuestions[0].q, expected_criteria: situationalQuestions[0].criteria, question_type: 'SITUATIONAL' });
    } else if (typeUpper === 'HR') {
      hrQuestions.slice(0, 3).forEach(item => {
        result.push({ question_text: item.q, expected_criteria: item.criteria, question_type: 'HR' });
      });
      result.push({ question_text: companyBehavioral[0].q, expected_criteria: companyBehavioral[0].criteria, question_type: 'BEHAVIORAL' });
      result.push({ question_text: genericBehavioral[0].q, expected_criteria: genericBehavioral[0].criteria, question_type: 'BEHAVIORAL' });
    } else if (typeUpper === 'SITUATIONAL') {
      situationalQuestions.slice(0, 3).forEach(item => {
        result.push({ question_text: item.q, expected_criteria: item.criteria, question_type: 'SITUATIONAL' });
      });
      const pool = techQuestions[roleCat]?.[diffKey] || techQuestions['GENERIC']['MEDIUM'];
      result.push({ question_text: pool[0].q, expected_criteria: pool[0].criteria, question_type: 'TECHNICAL' });
      result.push({ question_text: companyBehavioral[0].q, expected_criteria: companyBehavioral[0].criteria, question_type: 'BEHAVIORAL' });
    } else { // MIXED or default
      const pool = techQuestions[roleCat]?.[diffKey] || techQuestions['GENERIC']['MEDIUM'];
      result.push({ question_text: pool[0].q, expected_criteria: pool[0].criteria, question_type: 'TECHNICAL' });
      result.push({ question_text: pool[1].q, expected_criteria: pool[1].criteria, question_type: 'TECHNICAL' });
      result.push({ question_text: companyBehavioral[0].q, expected_criteria: companyBehavioral[0].criteria, question_type: 'BEHAVIORAL' });
      result.push({ question_text: situationalQuestions[0].q, expected_criteria: situationalQuestions[0].criteria, question_type: 'SITUATIONAL' });
      result.push({ question_text: hrQuestions[0].q, expected_criteria: hrQuestions[0].criteria, question_type: 'HR' });
    }

    // Ensure we always return exactly 5 questions
    while (result.length < 5) {
      const backup = genericBehavioral[result.length % genericBehavioral.length];
      result.push({ question_text: backup.q, expected_criteria: backup.criteria, question_type: 'BEHAVIORAL' });
    }
    return result.slice(0, 5);
  }
}

export const interviewsService = new InterviewsService();
export default interviewsService;
