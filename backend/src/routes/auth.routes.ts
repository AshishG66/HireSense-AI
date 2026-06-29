import { Router } from 'express';
import authController from '../controllers/auth.controller';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../validators/auth.validator';
import validate from '../middlewares/validate';
import asyncHandler from '../middlewares/asyncHandler';
import authenticate from '../middlewares/auth';

const router = Router();

router.post('/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.post('/logout', asyncHandler(authController.logout));
router.post('/refresh', asyncHandler(authController.refresh));
router.post('/verify-email', validate(verifyEmailSchema), asyncHandler(authController.verifyEmail));
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword),
);
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  asyncHandler(authController.resetPassword),
);

// Authenticated routes
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  asyncHandler(authController.changePassword),
);
router.get('/me', authenticate, asyncHandler(authController.getCurrentUser));

export default router;
