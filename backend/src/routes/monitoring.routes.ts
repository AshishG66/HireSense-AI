import { Router } from 'express';
import monitoringController from '../controllers/monitoring.controller';
import asyncHandler from '../middlewares/asyncHandler';
import authenticate from '../middlewares/auth';
import { roleGuard } from '../middlewares/roleGuard';
import { ROLES } from '../constants';

const router = Router();

router.get(
  '/metrics',
  authenticate,
  roleGuard([ROLES.ADMIN]),
  asyncHandler(monitoringController.getMetrics),
);

export default router;
