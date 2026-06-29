import { ApplicationStatus } from '@prisma/client';
import prisma from '../lib/prisma';

export class ApplicationsRepository {
  async create(candidateProfileId: string, jobId: string, resumeVersionId: string) {
    return prisma.$transaction(async (tx) => {
      const application = await tx.application.create({
        data: {
          candidateProfileId,
          jobId,
          resumeVersionId,
          status: ApplicationStatus.APPLIED,
        },
        include: {
          job: {
            include: {
              company: true,
            },
          },
        },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: application.id,
          status: ApplicationStatus.APPLIED,
          notes: 'Application submitted successfully',
        },
      });

      return application;
    });
  }

  async updateStatus(id: string, status: ApplicationStatus, changedById: string, notes?: string) {
    return prisma.$transaction(async (tx) => {
      const application = await tx.application.update({
        where: { id },
        data: { status },
        include: {
          job: {
            include: {
              company: true,
            },
          },
        },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: id,
          status,
          notes: notes || `Status updated to ${status}`,
          changedById,
        },
      });

      return application;
    });
  }

  async delete(id: string) {
    return prisma.application.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findById(id: string) {
    return prisma.application.findFirst({
      where: { id, deletedAt: null },
      include: {
        candidateProfile: {
          include: {
            user: true,
          },
        },
        job: {
          include: {
            company: true,
          },
        },
        resumeVersion: true,
        statusHistory: {
          include: {
            changedBy: true,
          },
          orderBy: { changedAt: 'desc' },
        },
      },
    });
  }

  async findByCandidateAndJob(candidateProfileId: string, jobId: string) {
    return prisma.application.findFirst({
      where: {
        candidateProfileId,
        jobId,
        deletedAt: null,
      },
    });
  }

  async findAll(filters: { candidateProfileId?: string; recruiterProfileId?: string }) {
    const { candidateProfileId, recruiterProfileId } = filters;

    const where: any = {
      deletedAt: null,
    };

    if (candidateProfileId) {
      where.candidateProfileId = candidateProfileId;
    }

    if (recruiterProfileId) {
      where.job = {
        recruiterProfileId,
      };
    }

    return prisma.application.findMany({
      where,
      include: {
        candidateProfile: {
          include: {
            user: true,
          },
        },
        job: {
          include: {
            company: true,
          },
        },
        resumeVersion: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const applicationsRepository = new ApplicationsRepository();
export default applicationsRepository;
