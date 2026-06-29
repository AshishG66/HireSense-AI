import { Router } from 'express';
import applicationsController from '../controllers/applications.controller';
import { updateApplicationStatusSchema } from '../validators/application.validator';
import validate from '../middlewares/validate';
import asyncHandler from '../middlewares/asyncHandler';
import authenticate from '../middlewares/auth';
import { roleGuard } from '../middlewares/roleGuard';
import { ROLES } from '../constants';

const router = Router();

router.get('/', authenticate, asyncHandler(applicationsController.getApplications));
router.get('/:id', authenticate, asyncHandler(applicationsController.getApplicationById));
router.delete(
  '/:id',
  authenticate,
  roleGuard([ROLES.CANDIDATE]),
  asyncHandler(applicationsController.withdrawApplication),
);

router.patch(
  '/:id/status',
  authenticate,
  roleGuard([ROLES.RECRUITER, ROLES.ADMIN]),
  validate(updateApplicationStatusSchema),
  asyncHandler(applicationsController.updateStatus),
);

export default router;
