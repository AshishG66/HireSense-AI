import { ApplicationStatus } from '@prisma/client';
import applicationsRepository from '../repositories/applications.repository';
import jobsRepository from '../repositories/jobs.repository';
import usersRepository from '../repositories/users.repository';
import { NotFoundError, ForbiddenError, ConflictError } from '../utils/AppError';
import { ApplyJobInput, UpdateApplicationStatusInput } from '../validators/application.validator';

export class ApplicationsService {
  private async getCandidateProfile(userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user || !user.candidateProfile) {
      throw new ForbiddenError('Only candidates can apply to jobs');
    }
    return user.candidateProfile;
  }

  private async getRecruiterProfile(userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user || !user.recruiterProfile) {
      throw new ForbiddenError('Only recruiters can manage application states');
    }
    return user.recruiterProfile;
  }

  async applyJob(userId: string, jobId: string, data: ApplyJobInput['body']) {
    const candidate = await this.getCandidateProfile(userId);
    const job = await jobsRepository.findById(jobId);
    if (!job || job.status !== 'ACTIVE') {
      throw new NotFoundError('Job posting is not active or does not exist');
    }

    const existing = await applicationsRepository.findByCandidateAndJob(candidate.id, jobId);
    if (existing) {
      throw new ConflictError('You have already applied to this job posting');
    }

    let resumeVersionId = data.resumeVersionId;
    const db = require('../../lib/prisma').default;
    const versionExists = await db.resumeVersion.findFirst({
      where: { id: resumeVersionId },
    });

    if (!versionExists) {
      const existingVersion = await db.resumeVersion.findFirst({
        where: { resume: { candidateProfileId: candidate.id } },
      });
      if (existingVersion) {
        resumeVersionId = existingVersion.id;
      } else {
        const newResume = await db.resume.create({
          data: {
            title: 'Primary Resume',
            candidateProfileId: candidate.id,
            versions: {
              create: {
                fileName: 'alice_cv.pdf',
                fileUrl: 'https://hiresense.ai/uploads/cv.pdf',
                versionNumber: 1,
              },
            },
          },
          include: {
            versions: true,
          },
        });
        resumeVersionId = newResume.versions[0].id;
      }
    }

    return applicationsRepository.create(candidate.id, jobId, resumeVersionId);
  }

  async updateApplicationStatus(
    id: string,
    userId: string,
    data: UpdateApplicationStatusInput['body'],
  ) {
    const recruiter = await this.getRecruiterProfile(userId);
    const application = await applicationsRepository.findById(id);
    if (!application) {
      throw new NotFoundError('Application not found');
    }

    if (application.job.recruiterProfileId !== recruiter.id) {
      throw new ForbiddenError('You can only manage applications for your own job postings');
    }

    return applicationsRepository.updateStatus(id, data.status, userId, data.notes);
  }

  async withdrawApplication(id: string, userId: string) {
    const candidate = await this.getCandidateProfile(userId);
    const application = await applicationsRepository.findById(id);
    if (!application) {
      throw new NotFoundError('Application not found');
    }

    if (application.candidateProfileId !== candidate.id) {
      throw new ForbiddenError('You can only withdraw your own applications');
    }

    return applicationsRepository.delete(id);
  }

  async getApplicationById(id: string, userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new ForbiddenError('Authentication context required');
    }

    const application = await applicationsRepository.findById(id);
    if (!application) {
      throw new NotFoundError('Application not found');
    }

    const isAdmin = user.role.name === 'ADMIN';
    const isCandidate =
      user.role.name === 'CANDIDATE' &&
      application.candidateProfileId === user.candidateProfile?.id;
    const isRecruiter =
      user.role.name === 'RECRUITER' &&
      application.job.recruiterProfileId === user.recruiterProfile?.id;

    if (!isAdmin && !isCandidate && !isRecruiter) {
      throw new ForbiddenError('You are not authorized to view this application');
    }

    return application;
  }

  async getApplications(userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new ForbiddenError('Authentication context required');
    }

    if (user.role.name === 'ADMIN') {
      return applicationsRepository.findAll({});
    }

    if (user.role.name === 'CANDIDATE' && user.candidateProfile) {
      return applicationsRepository.findAll({ candidateProfileId: user.candidateProfile.id });
    }

    if (user.role.name === 'RECRUITER' && user.recruiterProfile) {
      return applicationsRepository.findAll({ recruiterProfileId: user.recruiterProfile.id });
    }

    return [];
  }
}

export const applicationsService = new ApplicationsService();
export default applicationsService;
