import { Router } from 'express';
import assessmentsController from '../controllers/assessments.controller';
import asyncHandler from '../middlewares/asyncHandler';
import authenticate from '../middlewares/auth';
import { roleGuard } from '../middlewares/roleGuard';
import { ROLES } from '../constants';

const router = Router();

router.post(
  '/tests',
  authenticate,
  roleGuard([ROLES.RECRUITER]),
  asyncHandler(assessmentsController.createTest),
);

router.get(
  '/tests',
  authenticate,
  roleGuard([ROLES.RECRUITER]),
  asyncHandler(assessmentsController.getTests),
);

router.get(
  '/candidate/dashboard',
  authenticate,
  roleGuard([ROLES.CANDIDATE]),
  asyncHandler(assessmentsController.getCandidateDashboard),
);

router.get(
  '/candidate/questions',
  authenticate,
  roleGuard([ROLES.CANDIDATE]),
  asyncHandler(assessmentsController.getQuestions),
);

router.get(
  '/candidate/questions/:questionId',
  authenticate,
  asyncHandler(assessmentsController.getQuestionDetails),
);

router.get(
  '/languages',
  authenticate,
  asyncHandler(assessmentsController.getLanguages),
);

router.post(
  '/candidate/questions/:questionId/run',
  authenticate,
  roleGuard([ROLES.CANDIDATE]),
  asyncHandler(assessmentsController.runCode),
);

router.post(
  '/candidate/questions/:questionId/submit',
  authenticate,
  roleGuard([ROLES.CANDIDATE]),
  asyncHandler(assessmentsController.submitCode),
);

export default router;
