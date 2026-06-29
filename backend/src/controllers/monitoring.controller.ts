import { Request, Response } from 'express';
import monitoringService from '../services/monitoring.service';
import { ApiResponse } from '../utils/ApiResponse';

export class MonitoringController {
  async getMetrics(req: Request, res: Response) {
    const metrics = await monitoringService.getMetrics();
    return res.json(ApiResponse.success(metrics, 'System monitoring metrics retrieved successfully'));
  }
}

export const monitoringController = new MonitoringController();
export default monitoringController;
