import { Router } from 'express';
import authenticate from '../middlewares/auth';
import notificationService from '../services/notification.service';
import asyncHandler from '../middlewares/asyncHandler';
import { UnauthorizedError } from '../utils/AppError';

const router = Router();

router.get(
  '/stream',
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedError('Unauthorized');
    }
    notificationService.addClient(userId, req, res);
  }),
);

export default router;
