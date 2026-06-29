import { Request, Response } from 'express';
import applicationsService from '../services/applications.service';
import { ApiResponse } from '../utils/ApiResponse';
import { UnauthorizedError } from '../utils/AppError';

export class ApplicationsController {
  async applyJob(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const application = await applicationsService.applyJob(userId, req.params.id, req.body);
    return res
      .status(201)
      .json(ApiResponse.success(application, 'Application submitted successfully'));
  }

  async updateStatus(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const application = await applicationsService.updateApplicationStatus(
      req.params.id,
      userId,
      req.body,
    );
    return res.json(ApiResponse.success(application, 'Application status updated successfully'));
  }

  async withdrawApplication(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    await applicationsService.withdrawApplication(req.params.id, userId);
    return res.json(ApiResponse.success({}, 'Application withdrawn successfully'));
  }

  async getApplicationById(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const application = await applicationsService.getApplicationById(req.params.id, userId);
    return res.json(ApiResponse.success(application, 'Application retrieved successfully'));
  }

  async getApplications(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const applications = await applicationsService.getApplications(userId);
    return res.json(ApiResponse.success(applications, 'Applications retrieved successfully'));
  }
}

export const applicationsController = new ApplicationsController();
export default applicationsController;
