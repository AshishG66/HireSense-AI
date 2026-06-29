import { Prisma, JobStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { CreateJobInput, EditJobInput, QueryJobInput } from '../validators/job.validator';

export class JobsRepository {
  async create(recruiterProfileId: string, companyId: string, data: CreateJobInput['body']) {
    return prisma.job.create({
      data: {
        title: data.title,
        description: data.description,
        responsibilities: data.responsibilities,
        requiredSkills: data.requiredSkills,
        preferredSkills: data.preferredSkills,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        experienceLevel: data.experienceLevel,
        employmentType: data.employmentType,
        location: data.location,
        remoteType: data.remoteType,
        openings: data.openings,
        deadline: data.deadline ? new Date(data.deadline) : null,
        status: data.status,
        companyId,
        recruiterProfileId,
      },
      include: {
        company: true,
      },
    });
  }

  async update(id: string, data: EditJobInput['body']) {
    return prisma.job.update({
      where: { id },
      data: {
        ...data,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
      },
      include: {
        company: true,
      },
    });
  }

  async delete(id: string) {
    return prisma.job.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findById(id: string) {
    return prisma.job.findFirst({
      where: { id, deletedAt: null },
      include: {
        company: true,
        recruiterProfile: true,
        applications: {
          include: {
            candidateProfile: true,
          },
        },
      },
    });
  }

  async findAll(params: QueryJobInput['query'] & { recruiterProfileId?: string }) {
    const { search, status, remoteType, employmentType, experienceLevel, page, limit, sort } =
      params;

    const where: Prisma.JobWhereInput = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status as JobStatus;
    } else if (!params.recruiterProfileId) {
      where.status = JobStatus.ACTIVE;
    }

    if (remoteType) {
      where.remoteType = { equals: remoteType, mode: 'insensitive' };
    }

    if (employmentType) {
      where.employmentType = { equals: employmentType, mode: 'insensitive' };
    }

    if (experienceLevel) {
      where.experienceLevel = { equals: experienceLevel, mode: 'insensitive' };
    }

    if (params.recruiterProfileId) {
      where.recruiterProfileId = params.recruiterProfileId;
    }

    let orderBy: Prisma.JobOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort) {
      const [field, order] = sort.split(':');
      if (field && (order === 'asc' || order === 'desc')) {
        orderBy = { [field]: order };
      }
    }

    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          company: true,
          _count: {
            select: { applications: true },
          },
        },
      }),
      prisma.job.count({ where }),
    ]);

    return { jobs, total };
  }

  async duplicate(id: string) {
    const job = await this.findById(id);
    if (!job) return null;

    return prisma.job.create({
      data: {
        title: `Copy of ${job.title}`,
        description: job.description,
        responsibilities: job.responsibilities,
        requiredSkills: job.requiredSkills,
        preferredSkills: job.preferredSkills,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        experienceLevel: job.experienceLevel,
        employmentType: job.employmentType,
        location: job.location,
        remoteType: job.remoteType,
        openings: job.openings,
        deadline: job.deadline,
        status: JobStatus.DRAFT,
        companyId: job.companyId,
        recruiterProfileId: job.recruiterProfileId,
      },
      include: {
        company: true,
      },
    });
  }

  async save(candidateProfileId: string, jobId: string) {
    return prisma.savedJob.create({
      data: {
        candidateProfileId,
        jobId,
      },
    });
  }

  async unsave(candidateProfileId: string, jobId: string) {
    return prisma.savedJob.delete({
      where: {
        candidateProfileId_jobId: {
          candidateProfileId,
          jobId,
        },
      },
    });
  }

  async findSaved(candidateProfileId: string) {
    return prisma.savedJob.findMany({
      where: { candidateProfileId },
      include: {
        job: {
          include: {
            company: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findSavedRecord(candidateProfileId: string, jobId: string) {
    return prisma.savedJob.findUnique({
      where: {
        candidateProfileId_jobId: {
          candidateProfileId,
          jobId,
        },
      },
    });
  }
}

export const jobsRepository = new JobsRepository();
export default jobsRepository;
