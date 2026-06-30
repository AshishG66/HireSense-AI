import { Request, Response } from 'express';
import authService from '../services/auth.service';
import { ApiResponse } from '../utils/ApiResponse';
import env from '../config/env';
import { UnauthorizedError } from '../utils/AppError';

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
};

const refreshCookieOptions = {
  ...cookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const accessCookieOptions = {
  ...cookieOptions,
  maxAge: 15 * 60 * 1000,
};

export class AuthController {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body);
    return res
      .status(201)
      .json(ApiResponse.success(result, 'Registration successful. Verification token issued.'));
  }

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body);

    res.cookie('accessToken', result.accessToken, accessCookieOptions);
    res.cookie('refreshToken', result.refreshToken, refreshCookieOptions);

    return res.json(ApiResponse.success({ user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken }, 'Login successful'));
  }

  async logout(req: Request, res: Response) {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (token) {
      await authService.logout(token);
    }

    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);

    return res.json(ApiResponse.success({}, 'Logout successful'));
  }

  async refresh(req: Request, res: Response) {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (!token) {
      throw new UnauthorizedError('Refresh token is required');
    }

    const result = await authService.refresh(token);

    res.cookie('accessToken', result.accessToken, accessCookieOptions);
    res.cookie('refreshToken', result.refreshToken, refreshCookieOptions);

    return res.json(ApiResponse.success({ accessToken: result.accessToken, refreshToken: result.refreshToken }, 'Tokens refreshed successfully'));
  }

  async verifyEmail(req: Request, res: Response) {
    const result = await authService.verifyEmail(req.body.token);
    return res.json(ApiResponse.success(result, 'Email verification successful'));
  }

  async forgotPassword(req: Request, res: Response) {
    const result = await authService.forgotPassword(req.body.email);
    return res.json(
      ApiResponse.success(result, 'If the email exists, a reset token has been issued.'),
    );
  }

  async resetPassword(req: Request, res: Response) {
    const result = await authService.resetPassword(req.body);
    return res.json(ApiResponse.success(result, 'Password has been reset successfully'));
  }

  async changePassword(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedError('User context required');
    }
    const result = await authService.changePassword(userId, req.body);
    return res.json(ApiResponse.success(result, 'Password changed successfully'));
  }

  async getCurrentUser(req: Request, res: Response) {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedError('Unauthorized');
    }
    return res.json(ApiResponse.success({ user }, 'Current user context retrieved'));
  }
}

export const authController = new AuthController();
export default authController;
