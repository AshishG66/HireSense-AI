import prisma from '../lib/prisma';
import { InterviewStatus } from '@prisma/client';

export class InterviewsRepository {
  async createSession(data: {
    candidateProfileId: string;
    companyName: string;
    jobRole: string;
    difficulty: string;
    interviewType: string;
    status: InterviewStatus;
    scheduledAt: Date;
  }) {
    return prisma.interviewSession.create({
      data,
      include: {
        questions: true,
      },
    });
  }

  async addQuestions(
    sessionId: string,
    questions: { questionText: string; expectedCriteria: string; orderIndex: number }[],
  ) {
    return prisma.$transaction(
      questions.map((q) =>
        prisma.interviewQuestion.create({
          data: {
            sessionId,
            questionText: q.questionText,
            expectedCriteria: q.expectedCriteria,
            orderIndex: q.orderIndex,
          },
        }),
      ),
    );
  }

  async saveAnswer(
    questionId: string,
    candidateProfileId: string,
    data: {
      transcript?: string;
      duration?: number;
      audioUrl?: string;
    },
  ) {
    return prisma.interviewAnswer.upsert({
      where: {
        questionId_candidateProfileId: {
          questionId,
          candidateProfileId,
        },
      },
      update: data,
      create: {
        questionId,
        candidateProfileId,
        ...data,
      },
    });
  }

  async updateAnswerEvaluation(
    answerId: string,
    data: {
      aiFeedback: string;
      aiScore: number;
      technicalAccuracy: number;
      communication: number;
      problemSolving: number;
      confidence: number;
      completeness: number;
      grammar: number;
    },
  ) {
    return prisma.interviewAnswer.update({
      where: { id: answerId },
      data,
    });
  }

  async updateSessionStatus(
    sessionId: string,
    data: {
      status: InterviewStatus;
      startedAt?: Date;
      completedAt?: Date;
      feedback?: string;
      score?: number;
      feedbackDetails?: any;
    },
  ) {
    return prisma.interviewSession.update({
      where: { id: sessionId },
      data,
      include: {
        questions: {
          include: {
            answers: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    return prisma.interviewSession.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            answers: true,
          },
        },
        candidateProfile: true,
      },
    });
  }

  async findHistoryByCandidate(candidateProfileId: string) {
    return prisma.interviewSession.findMany({
      where: { candidateProfileId, deletedAt: null },
      include: {
        questions: {
          include: {
            answers: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllSessionsForRecruiters() {
    return prisma.interviewSession.findMany({
      where: { deletedAt: null },
      include: {
        candidateProfile: true,
        questions: {
          include: {
            answers: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const interviewsRepository = new InterviewsRepository();
export default interviewsRepository;
