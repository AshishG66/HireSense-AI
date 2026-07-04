import { Request, Response } from 'express';
import resumesService from '../services/resumes.service';
import { ApiResponse } from '../utils/ApiResponse';
import { UnauthorizedError, ValidationError } from '../utils/AppError';

export class ResumesController {
  async createResume(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const file = req.file;
    if (!file) throw new ValidationError('No resume file uploaded');

    const title = req.body.title || file.originalname;
    const jobDescription = req.body.jobDescription;
    const resume = await resumesService.createResume(userId, title, file, jobDescription);
    return res.status(201).json(ApiResponse.success(resume, 'Resume uploaded successfully'));
  }

  async addNewVersion(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const file = req.file;
    if (!file) throw new ValidationError('No resume version file uploaded');

    const jobDescription = req.body.jobDescription;
    const version = await resumesService.addNewVersion(req.params.id, userId, file, jobDescription);
    return res
      .status(201)
      .json(ApiResponse.success(version, 'New resume version uploaded successfully'));
  }

  async renameResume(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const resume = await resumesService.renameResume(req.params.id, userId, req.body.title);
    return res.json(ApiResponse.success(resume, 'Resume renamed successfully'));
  }

  async deleteResume(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    await resumesService.deleteResume(req.params.id, userId);
    return res.json(ApiResponse.success({}, 'Resume deleted successfully'));
  }

  async setDefaultResume(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const resume = await resumesService.setDefaultResume(req.params.id, userId);
    return res.json(ApiResponse.success(resume, 'Default resume updated successfully'));
  }

  async triggerAnalysis(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const result = await resumesService.triggerAnalysis(
      req.params.versionId,
      userId,
      req.body.jobDescription,
    );
    return res
      .status(202)
      .json(ApiResponse.success(result, 'Resume analysis job queued successfully'));
  }

  async getJobStatus(req: Request, res: Response) {
    const status = await resumesService.getJobStatus(req.params.jobId);
    return res.json(ApiResponse.success(status, 'Analysis job status retrieved'));
  }

  async getResumes(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const resumes = await resumesService.getResumes(userId);
    return res.json(ApiResponse.success(resumes, 'Resumes retrieved successfully'));
  }

  async getResumeById(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const resume = await resumesService.getResumeById(req.params.id, userId);
    return res.json(ApiResponse.success(resume, 'Resume retrieved successfully'));
  }

  async downloadResume(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const { buffer, fileName, mimeType } = await resumesService.getDownloadBuffer(
      req.params.versionId,
      userId,
    );

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', mimeType);
    return res.send(buffer);
  }

  async buildResume(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const { rawProfileData, targetRole } = req.body;
    if (!rawProfileData) throw new ValidationError('Raw profile text data is required');

    const result = await resumesService.buildResume(userId, rawProfileData, targetRole);
    return res.json(ApiResponse.success(result, 'Resume generated successfully'));
  }
}

export const resumesController = new ResumesController();
export default resumesController;
