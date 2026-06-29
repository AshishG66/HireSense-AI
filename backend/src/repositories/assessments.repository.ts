import prisma from '../lib/prisma';

export class AssessmentsRepository {
  async createTest(data: {
    title: string;
    description?: string;
    duration: number;
    passingScore: number;
    visibility: string;
    negativeMarking: boolean;
    randomQuestionOrder: boolean;
    allowedLanguages: string[];
    recruiterProfileId: string;
    questions?: { codingQuestionId: string; orderIndex: number }[];
  }) {
    return prisma.codingTest.create({
      data: {
        title: data.title,
        description: data.description,
        duration: data.duration,
        passingScore: data.passingScore,
        visibility: data.visibility,
        negativeMarking: data.negativeMarking,
        randomQuestionOrder: data.randomQuestionOrder,
        allowedLanguages: data.allowedLanguages,
        recruiterProfileId: data.recruiterProfileId,
        questions: data.questions
          ? {
              create: data.questions.map((q) => ({
                codingQuestionId: q.codingQuestionId,
                orderIndex: q.orderIndex,
              })),
            }
          : undefined,
      },
      include: {
        questions: {
          include: {
            codingQuestion: true,
          },
        },
      },
    });
  }

  async updateTest(
    id: string,
    data: {
      title?: string;
      description?: string;
      duration?: number;
      passingScore?: number;
      visibility?: string;
      negativeMarking?: boolean;
      randomQuestionOrder?: boolean;
      allowedLanguages?: string[];
      inviteLink?: string;
    },
  ) {
    return prisma.codingTest.update({
      where: { id },
      data,
    });
  }

  async deleteTest(id: string) {
    return prisma.codingTest.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findTestById(id: string) {
    return prisma.codingTest.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            codingQuestion: {
              include: {
                testCases: true,
              },
            },
          },
        },
        submissions: {
          include: {
            candidateProfile: true,
          },
        },
      },
    });
  }

  async findAllTestsForRecruiter(recruiterProfileId: string) {
    return prisma.codingTest.findMany({
      where: { recruiterProfileId, deletedAt: null },
      include: {
        questions: true,
        submissions: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findQuestionById(id: string) {
    return prisma.codingQuestion.findUnique({
      where: { id },
      include: {
        testCases: true,
      },
    });
  }

  async findAllQuestions() {
    return prisma.codingQuestion.findMany({
      include: {
        testCases: true,
      },
    });
  }

  async createQuestion(data: {
    title: string;
    description: string;
    difficulty: string;
    points: number;
    timeLimit: number;
    memoryLimit: number;
    category: string;
    hints: string[];
    editorial?: string;
    testCases?: { input: string; expectedOutput: string; isSample: boolean; isHidden: boolean; explanation?: string }[];
  }) {
    return prisma.codingQuestion.create({
      data: {
        title: data.title,
        description: data.description,
        difficulty: data.difficulty,
        points: data.points,
        timeLimit: data.timeLimit,
        memoryLimit: data.memoryLimit,
        category: data.category,
        hints: data.hints,
        editorial: data.editorial,
        testCases: data.testCases
          ? {
              create: data.testCases,
            }
          : undefined,
      },
    });
  }

  async createSubmission(data: {
    code: string;
    status: string;
    score: number;
    executionTime: number;
    memoryUsage: number;
    languageId: string;
    candidateProfileId: string;
    codingQuestionId: string;
    codingTestId?: string;
    aiFeedback?: any;
  }) {
    return prisma.codingSubmission.create({
      data,
    });
  }

  async createExecutions(
    submissionId: string,
    executions: { testCaseId: string; status: string; runtime: number; memory: number; stdout?: string; stderr?: string; actualOutput?: string }[],
  ) {
    return prisma.$transaction(
      executions.map((exec) =>
        prisma.codingExecution.create({
          data: {
            submissionId,
            testCaseId: exec.testCaseId,
            status: exec.status,
            runtime: exec.runtime,
            memory: exec.memory,
            stdout: exec.stdout,
            stderr: exec.stderr,
            actualOutput: exec.actualOutput,
          },
        }),
      ),
    );
  }

  async findSubmissionsByCandidate(candidateProfileId: string) {
    return prisma.codingSubmission.findMany({
      where: { candidateProfileId },
      include: {
        codingQuestion: true,
        language: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findSubmissionsByQuestion(codingQuestionId: string, candidateProfileId: string) {
    return prisma.codingSubmission.findMany({
      where: { codingQuestionId, candidateProfileId },
      include: {
        language: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findLanguageByCode(code: string) {
    return prisma.codingLanguage.findUnique({
      where: { code },
    });
  }

  async findLanguages() {
    return prisma.codingLanguage.findMany({
      where: { isActive: true },
    });
  }

  async ensureDefaultLanguages() {
    const langs = await prisma.codingLanguage.findMany();
    if (langs.length === 0) {
      await prisma.codingLanguage.createMany({
        data: [
          { name: 'Python 3', code: 'python' },
          { name: 'JavaScript (Node)', code: 'javascript' },
          { name: 'Java', code: 'java' },
          { name: 'C++', code: 'cpp' },
          { name: 'C', code: 'c' },
        ],
      });
    }
  }

  async ensureDefaultQuestions() {
    const qs = await prisma.codingQuestion.findMany();
    if (qs.length === 0) {
      await this.createQuestion({
        title: 'Two Sum',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.',
        difficulty: 'EASY',
        points: 10,
        timeLimit: 1000,
        memoryLimit: 128000,
        category: 'Arrays',
        hints: ['Try using a hash map to look up targets in O(1) time.'],
        editorial: 'A simple solution is to iterate through nums and keep a map of targets.',
        testCases: [
          { input: '2,7,11,15\\n9', expectedOutput: '[0,1]', isSample: true, isHidden: false, explanation: 'nums[0] + nums[1] == 9, so we return [0, 1].' },
          { input: '3,2,4\\n6', expectedOutput: '[1,2]', isSample: false, isHidden: true },
        ],
      });

      await this.createQuestion({
        title: 'Palindrome Number',
        description: 'Given an integer x, return true if x is a palindrome, and false otherwise.',
        difficulty: 'EASY',
        points: 10,
        timeLimit: 1000,
        memoryLimit: 128000,
        category: 'Math',
        hints: ['Convert the number to string or reverse the integers digit by digit.'],
        editorial: 'Negative numbers cannot be palindromes.',
        testCases: [
          { input: '121', expectedOutput: 'true', isSample: true, isHidden: false },
          { input: '-121', expectedOutput: 'false', isSample: false, isHidden: true },
        ],
      });
    }
  }
}

export const assessmentsRepository = new AssessmentsRepository();
export default assessmentsRepository;
