import { NotFoundError, ForbiddenError, InternalServerError } from '../utils/AppError';
import resumesRepository from '../repositories/resumes.repository';
import usersRepository from '../repositories/users.repository';
import storageService from './storage.service';
import queueService from './queue.service';
import axios from 'axios';
import config from '../config/env';

const DEFAULT_JD = 'General Professional Software Engineer Profile Optimization and Evaluation';

export class ResumesService {
  private async getCandidateProfile(userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user || !user.candidateProfile) {
      throw new ForbiddenError('Only candidates can manage resume listings');
    }
    return user.candidateProfile;
  }

  private async assertResumeOwnership(resumeId: string, candidateProfileId: string) {
    const resume = await resumesRepository.findById(resumeId);
    if (!resume) {
      throw new NotFoundError('Resume posting not found');
    }
    if (resume.candidateProfileId !== candidateProfileId) {
      throw new ForbiddenError('You do not own this resume document');
    }
    return resume;
  }

  async createResume(
    userId: string,
    title: string,
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
    jobDescription?: string,
  ) {
    const candidate = await this.getCandidateProfile(userId);

    const uploadResult = await storageService.upload(file);

    const existing = await resumesRepository.findAll(candidate.id);
    const isFirst = existing.length === 0;

    const resume = await resumesRepository.create(candidate.id, title, uploadResult, isFirst);

    // Automatically trigger analysis for version 1
    const firstVersion = resume.versions?.[0];
    let jobId: string | undefined;
    if (firstVersion) {
      jobId = await queueService.addJob(
        firstVersion.id,
        jobDescription || DEFAULT_JD,
        userId,
      );
    }

    return {
      ...resume,
      jobId,
    };
  }

  async addNewVersion(
    resumeId: string,
    userId: string,
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
    jobDescription?: string,
  ) {
    const candidate = await this.getCandidateProfile(userId);
    const resume = await this.assertResumeOwnership(resumeId, candidate.id);

    const maxVersion = resume.versions.reduce(
      (max, v) => (v.versionNumber > max ? v.versionNumber : max),
      0,
    );
    const nextVersion = maxVersion + 1;

    const uploadResult = await storageService.upload(file);

    const version = await resumesRepository.addVersion(resumeId, {
      ...uploadResult,
      versionNumber: nextVersion,
    });

    // Automatically trigger analysis for the new version
    const jobId = await queueService.addJob(
      version.id,
      jobDescription || DEFAULT_JD,
      userId,
    );

    return {
      ...version,
      jobId,
    };
  }

  async renameResume(id: string, userId: string, title: string) {
    const candidate = await this.getCandidateProfile(userId);
    await this.assertResumeOwnership(id, candidate.id);

    return resumesRepository.update(id, { title });
  }

  async deleteResume(id: string, userId: string) {
    const candidate = await this.getCandidateProfile(userId);
    await this.assertResumeOwnership(id, candidate.id);

    return resumesRepository.delete(id);
  }

  async setDefaultResume(id: string, userId: string) {
    const candidate = await this.getCandidateProfile(userId);
    await this.assertResumeOwnership(id, candidate.id);

    await resumesRepository.clearDefaults(candidate.id, id);

    return resumesRepository.update(id, { isDefault: true });
  }

  async triggerAnalysis(versionId: string, userId: string, jobDescription: string) {
    const candidate = await this.getCandidateProfile(userId);

    const version = await resumesRepository.findVersionById(versionId);
    if (!version) {
      throw new NotFoundError('Resume version not found');
    }

    await this.assertResumeOwnership(version.resumeId, candidate.id);

    const jobId = await queueService.addJob(versionId, jobDescription, userId);
    return { jobId };
  }

  async getJobStatus(jobId: string) {
    const status = await queueService.getJobStatus(jobId);
    if (!status) {
      throw new NotFoundError('Analysis job not found or expired');
    }
    return status;
  }

  async getResumes(userId: string) {
    const candidate = await this.getCandidateProfile(userId);
    return resumesRepository.findAll(candidate.id);
  }

  async getResumeById(id: string, userId: string) {
    const candidate = await this.getCandidateProfile(userId);
    return this.assertResumeOwnership(id, candidate.id);
  }

  async getDownloadBuffer(versionId: string, userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new ForbiddenError('Unauthorized download request');
    }

    const version = await resumesRepository.findVersionById(versionId);
    if (!version) {
      throw new NotFoundError('Resume version not found');
    }

    const isAdmin = user.role.name === 'ADMIN';
    const isOwner =
      user.role.name === 'CANDIDATE' &&
      version.resume.candidateProfileId === user.candidateProfile?.id;
    const isRecruiter = user.role.name === 'RECRUITER';

    if (!isAdmin && !isOwner && !isRecruiter) {
      throw new ForbiddenError('Not authorized to download this file');
    }

    const buffer = await storageService.download(version.storagePath || version.fileName);
    return {
      buffer,
      fileName: version.fileName,
      mimeType: version.mimeType || 'application/pdf',
    };
  }

  async buildResume(userId: string, rawProfileData: string, targetRole?: string) {
    await this.getCandidateProfile(userId);
    try {
      const response = await axios.post(`${config.AI_SERVICE_URL || 'http://localhost:8000'}/api/v1/analyzer/builder`, {
        raw_profile_data: rawProfileData,
        target_role: targetRole,
      });
      return response.data;
    } catch (err: any) {
      throw new InternalServerError(`Failed to build resume: ${err.response?.data?.detail || err.message}`);
    }
  }
}

export const resumesService = new ResumesService();
export default resumesService;
