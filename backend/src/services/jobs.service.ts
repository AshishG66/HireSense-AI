import { JobStatus } from '@prisma/client';
import jobsRepository from '../repositories/jobs.repository';
import usersRepository from '../repositories/users.repository';
import { NotFoundError, ForbiddenError, ConflictError } from '../utils/AppError';
import { CreateJobInput, EditJobInput, QueryJobInput } from '../validators/job.validator';

export class JobsService {
  private async getRecruiterProfile(userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user || !user.recruiterProfile) {
      throw new ForbiddenError('Only recruiters can manage job postings');
    }
    return user.recruiterProfile;
  }

  private async getCandidateProfile(userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user || !user.candidateProfile) {
      throw new ForbiddenError('Only candidates can perform this action');
    }
    return user.candidateProfile;
  }

  async createJob(userId: string, data: CreateJobInput['body']) {
    const recruiter = await this.getRecruiterProfile(userId);
    return jobsRepository.create(recruiter.id, recruiter.companyId, data);
  }

  async updateJob(id: string, userId: string, data: EditJobInput['body']) {
    const recruiter = await this.getRecruiterProfile(userId);
    const job = await jobsRepository.findById(id);
    if (!job) {
      throw new NotFoundError('Job posting not found');
    }

    if (job.recruiterProfileId !== recruiter.id) {
      throw new ForbiddenError('You can only update your own job postings');
    }

    return jobsRepository.update(id, data);
  }

  async deleteJob(id: string, userId: string) {
    const recruiter = await this.getRecruiterProfile(userId);
    const job = await jobsRepository.findById(id);
    if (!job) {
      throw new NotFoundError('Job posting not found');
    }

    if (job.recruiterProfileId !== recruiter.id) {
      throw new ForbiddenError('You can only delete your own job postings');
    }

    return jobsRepository.delete(id);
  }

  async setJobStatus(id: string, userId: string, status: JobStatus) {
    const recruiter = await this.getRecruiterProfile(userId);
    const job = await jobsRepository.findById(id);
    if (!job) {
      throw new NotFoundError('Job posting not found');
    }

    if (job.recruiterProfileId !== recruiter.id) {
      throw new ForbiddenError('You can only modify your own job postings');
    }

    return jobsRepository.update(id, { status });
  }

  async duplicateJob(id: string, userId: string) {
    const recruiter = await this.getRecruiterProfile(userId);
    const job = await jobsRepository.findById(id);
    if (!job) {
      throw new NotFoundError('Job posting not found');
    }

    if (job.recruiterProfileId !== recruiter.id) {
      throw new ForbiddenError('You can only duplicate your own job postings');
    }

    return jobsRepository.duplicate(id);
  }

  async getJobById(id: string) {
    const job = await jobsRepository.findById(id);
    if (!job) {
      throw new NotFoundError('Job posting not found');
    }
    return job;
  }

  async getAllJobs(userId: string | undefined, query: QueryJobInput['query']) {
    let recruiterProfileId: string | undefined = undefined;

    if (userId) {
      const user = await usersRepository.findById(userId);
      if (user && user.role.name === 'RECRUITER' && user.recruiterProfile) {
        recruiterProfileId = user.recruiterProfile.id;
      }
    }

    return jobsRepository.findAll({
      ...query,
      recruiterProfileId,
    });
  }

  async saveJob(userId: string, jobId: string) {
    const candidate = await this.getCandidateProfile(userId);
    const job = await jobsRepository.findById(jobId);
    if (!job) {
      throw new NotFoundError('Job posting not found');
    }

    const existing = await jobsRepository.findSavedRecord(candidate.id, jobId);
    if (existing) {
      throw new ConflictError('Job is already saved');
    }

    return jobsRepository.save(candidate.id, jobId);
  }

  async unsaveJob(userId: string, jobId: string) {
    const candidate = await this.getCandidateProfile(userId);
    const existing = await jobsRepository.findSavedRecord(candidate.id, jobId);
    if (!existing) {
      throw new NotFoundError('Saved job posting record not found');
    }

    return jobsRepository.unsave(candidate.id, jobId);
  }

  async getSavedJobs(userId: string) {
    const candidate = await this.getCandidateProfile(userId);
    return jobsRepository.findSaved(candidate.id);
  }
}

export const jobsService = new JobsService();
export default jobsService;
