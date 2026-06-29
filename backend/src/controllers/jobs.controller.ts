import { Request, Response } from 'express';
import jobsService from '../services/jobs.service';
import { ApiResponse } from '../utils/ApiResponse';
import { UnauthorizedError } from '../utils/AppError';
import { JobStatus } from '@prisma/client';

export class JobsController {
  async createJob(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const job = await jobsService.createJob(userId, req.body);
    return res.status(201).json(ApiResponse.success(job, 'Job posting created successfully'));
  }

  async updateJob(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const job = await jobsService.updateJob(req.params.id, userId, req.body);
    return res.json(ApiResponse.success(job, 'Job posting updated successfully'));
  }

  async deleteJob(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    await jobsService.deleteJob(req.params.id, userId);
    return res.json(ApiResponse.success({}, 'Job posting deleted successfully'));
  }

  async setStatus(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const status = req.body.status as JobStatus;
    const job = await jobsService.setJobStatus(req.params.id, userId, status);
    return res.json(ApiResponse.success(job, `Job status updated to ${status}`));
  }

  async duplicateJob(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const job = await jobsService.duplicateJob(req.params.id, userId);
    return res.status(201).json(ApiResponse.success(job, 'Job posting duplicated successfully'));
  }

  async getJobById(req: Request, res: Response) {
    const job = await jobsService.getJobById(req.params.id);
    return res.json(ApiResponse.success(job, 'Job posting retrieved successfully'));
  }

  async getAllJobs(req: Request, res: Response) {
    const userId = req.user?.userId;
    const result = await jobsService.getAllJobs(userId, req.query as any);
    return res.json(
      ApiResponse.success(result.jobs, 'Job postings retrieved successfully', {
        total: result.total,
      }),
    );
  }

  async saveJob(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const saved = await jobsService.saveJob(userId, req.params.id);
    return res.status(201).json(ApiResponse.success(saved, 'Job posting saved successfully'));
  }

  async unsaveJob(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    await jobsService.unsaveJob(userId, req.params.id);
    return res.json(ApiResponse.success({}, 'Job posting removed from saved list'));
  }

  async getSavedJobs(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const saved = await jobsService.getSavedJobs(userId);
    return res.json(ApiResponse.success(saved, 'Saved job postings retrieved successfully'));
  }
}

export const jobsController = new JobsController();
export default jobsController;
