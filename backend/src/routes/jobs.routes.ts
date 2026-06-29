import { Router } from 'express';
import jobsController from '../controllers/jobs.controller';
import applicationsController from '../controllers/applications.controller';
import { createJobSchema, editJobSchema, queryJobSchema } from '../validators/job.validator';
import { applyJobSchema } from '../validators/application.validator';
import validate from '../middlewares/validate';
import asyncHandler from '../middlewares/asyncHandler';
import { authenticate, optionalAuthenticate } from '../middlewares/auth';
import { roleGuard } from '../middlewares/roleGuard';
import { ROLES } from '../constants';

const router = Router();

router.get(
  '/',
  optionalAuthenticate,
  validate(queryJobSchema),
  asyncHandler(jobsController.getAllJobs),
);
router.get(
  '/saved',
  authenticate,
  roleGuard([ROLES.CANDIDATE]),
  asyncHandler(jobsController.getSavedJobs),
);
router.get('/:id', asyncHandler(jobsController.getJobById));

// Recruiter operations
router.post(
  '/',
  authenticate,
  roleGuard([ROLES.RECRUITER, ROLES.ADMIN]),
  validate(createJobSchema),
  asyncHandler(jobsController.createJob),
);
router.patch(
  '/:id',
  authenticate,
  roleGuard([ROLES.RECRUITER, ROLES.ADMIN]),
  validate(editJobSchema),
  asyncHandler(jobsController.updateJob),
);
router.delete(
  '/:id',
  authenticate,
  roleGuard([ROLES.RECRUITER, ROLES.ADMIN]),
  asyncHandler(jobsController.deleteJob),
);
router.patch(
  '/:id/status',
  authenticate,
  roleGuard([ROLES.RECRUITER, ROLES.ADMIN]),
  asyncHandler(jobsController.setStatus),
);
router.post(
  '/:id/duplicate',
  authenticate,
  roleGuard([ROLES.RECRUITER, ROLES.ADMIN]),
  asyncHandler(jobsController.duplicateJob),
);

// Candidate operations
router.post(
  '/:id/save',
  authenticate,
  roleGuard([ROLES.CANDIDATE]),
  asyncHandler(jobsController.saveJob),
);
router.delete(
  '/:id/save',
  authenticate,
  roleGuard([ROLES.CANDIDATE]),
  asyncHandler(jobsController.unsaveJob),
);

// Application operation
router.post(
  '/:id/apply',
  authenticate,
  roleGuard([ROLES.CANDIDATE]),
  validate(applyJobSchema),
  asyncHandler(applicationsController.applyJob),
);

export default router;
