import { Router } from 'express';
import multer from 'multer';
import interviewsController from '../controllers/interviews.controller';
import asyncHandler from '../middlewares/asyncHandler';
import authenticate from '../middlewares/auth';
import { roleGuard } from '../middlewares/roleGuard';
import { ROLES } from '../constants';

const router = Router();
const upload = multer({ limits: { fileSize: 15 * 1024 * 1024 } });

router.post(
  '/',
  authenticate,
  roleGuard([ROLES.CANDIDATE]),
  asyncHandler(interviewsController.startSession),
);

router.post(
  '/:sessionId/questions/:questionId/answer',
  authenticate,
  roleGuard([ROLES.CANDIDATE]),
  upload.single('audio'),
  asyncHandler(interviewsController.submitAnswer),
);

router.post(
  '/:sessionId/report',
  authenticate,
  roleGuard([ROLES.CANDIDATE]),
  asyncHandler(interviewsController.compileReport),
);

router.get(
  '/history',
  authenticate,
  roleGuard([ROLES.CANDIDATE]),
  asyncHandler(interviewsController.getCandidateHistory),
);

router.get(
  '/recruiter/reports',
  authenticate,
  roleGuard([ROLES.RECRUITER]),
  asyncHandler(interviewsController.getRecruiterReports),
);

router.get(
  '/:sessionId',
  authenticate,
  asyncHandler(interviewsController.getSessionDetails),
);

export default router;
