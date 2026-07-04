import axios from 'axios';
import logger from '../lib/logger';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/AppError';
import assessmentsRepository from '../repositories/assessments.repository';
import usersRepository from '../repositories/users.repository';
import judgeService from './judge.service';
import config from '../config/env';
import prisma from '../lib/prisma';

export class AssessmentsService {
  private aiServiceUrl: string;

  constructor() {
    this.aiServiceUrl = config.AI_SERVICE_URL || 'http://localhost:8000';
  }

  private async getRecruiterProfile(userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user || !user.recruiterProfile) {
      throw new ForbiddenError('Only recruiters can manage assessment test challenges');
    }
    return user.recruiterProfile;
  }

  private async getCandidateProfile(userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user || !user.candidateProfile) {
      throw new ForbiddenError('Only candidates can practice or submit solutions');
    }
    return user.candidateProfile;
  }

  async createTest(
    userId: string,
    data: {
      title: string;
      description?: string;
      duration: number;
      passingScore: number;
      visibility: string;
      negativeMarking: boolean;
      randomQuestionOrder: boolean;
      allowedLanguages: string[];
      questions?: { codingQuestionId: string; orderIndex: number }[];
    },
  ) {
    const recruiter = await this.getRecruiterProfile(userId);
    await assessmentsRepository.ensureDefaultQuestions();

    const test = await assessmentsRepository.createTest({
      ...data,
      recruiterProfileId: recruiter.id,
    });

    const inviteLink = `${process.env.BACKEND_URL || 'http://localhost:5000'}/candidate/assessments/invite/${test.id}`;
    await assessmentsRepository.updateTest(test.id, { inviteLink });

    return assessmentsRepository.findTestById(test.id);
  }

  async getTests(userId: string) {
    const recruiter = await this.getRecruiterProfile(userId);
    return assessmentsRepository.findAllTestsForRecruiter(recruiter.id);
  }

  async getCandidateDashboard(userId: string) {
    const candidate = await this.getCandidateProfile(userId);

    await assessmentsRepository.ensureDefaultLanguages();
    await assessmentsRepository.ensureDefaultQuestions();

    const submissions = await assessmentsRepository.findSubmissionsByCandidate(candidate.id);
    const questions = await assessmentsRepository.findAllQuestions();

    const solvedQuestions = new Set(
      submissions.filter((s) => s.status === 'ACCEPTED').map((s) => s.codingQuestionId),
    );

    const easySolved = questions.filter((q) => q.difficulty === 'EASY' && solvedQuestions.has(q.id)).length;
    const mediumSolved = questions.filter((q) => q.difficulty === 'MEDIUM' && solvedQuestions.has(q.id)).length;
    const hardSolved = questions.filter((q) => q.difficulty === 'HARD' && solvedQuestions.has(q.id)).length;

    const easyTotal = questions.filter((q) => q.difficulty === 'EASY').length;
    const mediumTotal = questions.filter((q) => q.difficulty === 'MEDIUM').length;
    const hardTotal = questions.filter((q) => q.difficulty === 'HARD').length;

    const acceptedCount = submissions.filter((s) => s.status === 'ACCEPTED').length;
    const acceptanceRate = submissions.length > 0 ? Math.round((acceptedCount / submissions.length) * 100) : 100;

    const uniqueDays = new Set(
      submissions.map((s) => new Date(s.createdAt).toDateString()),
    );

    // Fetch tests that are PUBLIC, where the candidate has not submitted yet
    const upcomingTests = await prisma.codingTest.findMany({
      where: {
        deletedAt: null,
        visibility: 'PUBLIC',
      },
      include: {
        questions: true,
      },
    });

    const upcomingAssessments = upcomingTests.map((t) => ({
      id: t.id,
      title: t.title,
      duration: t.duration,
      questionsCount: t.questions.length,
    }));

    return {
      problemsSolved: solvedQuestions.size,
      acceptanceRate,
      streak: uniqueDays.size,
      distribution: {
        easy: { solved: easySolved, total: easyTotal },
        medium: { solved: mediumSolved, total: mediumTotal },
        hard: { solved: hardSolved, total: hardTotal },
      },
      submissionHistory: submissions.slice(0, 10),
      upcomingAssessments,
    };
  }

  async getQuestions(userId: string) {
    // Both Recruiters and Candidates can view questions
    await assessmentsRepository.ensureDefaultQuestions();
    return assessmentsRepository.findAllQuestions();
  }

  async getQuestionDetails(questionId: string) {
    const question = await assessmentsRepository.findQuestionById(questionId);
    if (!question) throw new NotFoundError('Coding problem not found');
    return question;
  }

  async getLanguages() {
    await assessmentsRepository.ensureDefaultLanguages();
    return assessmentsRepository.findLanguages();
  }

  async runCode(
    userId: string,
    questionId: string,
    code: string,
    languageCode: string,
    input: string,
  ) {
    await this.getCandidateProfile(userId);
    const question = await assessmentsRepository.findQuestionById(questionId);
    if (!question) throw new NotFoundError('Problem not found');

    return judgeService.execute(code, languageCode, input);
  }

  async submitCode(
    userId: string,
    questionId: string,
    code: string,
    languageCode: string,
    codingTestId?: string,
  ) {
    const candidate = await this.getCandidateProfile(userId);
    const question = await assessmentsRepository.findQuestionById(questionId);
    if (!question) throw new NotFoundError('Problem not found');

    const language = await assessmentsRepository.findLanguageByCode(languageCode);
    if (!language) throw new ValidationError('Unsupported programming language');

    const dbTestCases = question.testCases;
    if (dbTestCases.length === 0) {
      throw new ValidationError('No compilation test cases configured for this problem.');
    }

    const result = await judgeService.submit(
      code,
      languageCode,
      dbTestCases.map((tc) => ({
        id: tc.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
      })),
    );

    const submission = await assessmentsRepository.createSubmission({
      code,
      status: result.status,
      score: result.score,
      executionTime: result.executionTime,
      memoryUsage: result.memoryUsage,
      languageId: language.id,
      candidateProfileId: candidate.id,
      codingQuestionId: questionId,
      codingTestId,
    });

    await assessmentsRepository.createExecutions(
      submission.id,
      result.executions.map((e) => ({
        testCaseId: e.testCaseId,
        status: e.status,
        runtime: e.runtime,
        memory: e.memory,
        stdout: e.stdout,
        stderr: e.stderr,
        actualOutput: e.actualOutput,
      })),
    );

    // Call code review review triggers asynchronously (background job representation)
    this.queueAIReview(submission.id, code, language.name, question.title, question.description);

    return {
      submissionId: submission.id,
      status: result.status,
      score: result.score,
      executionTime: result.executionTime,
      memoryUsage: result.memoryUsage,
      executions: result.executions,
    };
  }

  private async queueAIReview(
    submissionId: string,
    code: string,
    languageName: string,
    problemTitle: string,
    problemDescription: string,
  ) {
    try {
      logger.info(`Requesting background AI code review for submission ${submissionId}`);
      const response = await axios.post(`${this.aiServiceUrl}/api/v1/assessment/review`, {
        code,
        language: languageName,
        problem_title: problemTitle,
        problem_description: problemDescription,
      });

      await prisma.codingSubmission.update({
        where: { id: submissionId },
        data: {
          aiFeedback: response.data,
        },
      });
      logger.info(`AI review completed and saved for submission ${submissionId}`);
    } catch (err: any) {
      logger.error(`AI background review query failed: ${err.message}`);
    }
  }

  async updateTest(
    userId: string,
    testId: string,
    data: {
      title?: string;
      description?: string;
      duration?: number;
      passingScore?: number;
      visibility?: string;
      negativeMarking?: boolean;
      randomQuestionOrder?: boolean;
      allowedLanguages?: string[];
    },
  ) {
    const recruiter = await this.getRecruiterProfile(userId);
    const test = await assessmentsRepository.findTestById(testId);
    if (!test) {
      throw new NotFoundError('Coding test not found');
    }
    if (test.recruiterProfileId !== recruiter.id) {
      throw new ForbiddenError('You do not have permission to modify this test');
    }
    return assessmentsRepository.updateTest(testId, data);
  }

  async deleteTest(userId: string, testId: string) {
    const recruiter = await this.getRecruiterProfile(userId);
    const test = await assessmentsRepository.findTestById(testId);
    if (!test) {
      throw new NotFoundError('Coding test not found');
    }
    if (test.recruiterProfileId !== recruiter.id) {
      throw new ForbiddenError('You do not have permission to delete this test');
    }
    return assessmentsRepository.deleteTest(testId);
  }
}

export const assessmentsService = new AssessmentsService();
export default assessmentsService;
