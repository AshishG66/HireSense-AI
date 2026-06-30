import crypto from 'crypto';
import usersRepository from '../repositories/users.repository';
import refreshTokensRepository from '../repositories/refreshTokens.repository';
import { hashPassword, comparePassword, signAccessToken, signRefreshToken } from '../utils/auth';
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
  NotFoundError,
} from '../utils/AppError';
import {
  RegisterInput,
  LoginInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from '../validators/auth.validator';

export class AuthService {
  async register(data: RegisterInput['body']) {
    const existing = await usersRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('Email address already in use');
    }

    const hashedPassword = await hashPassword(data.password);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create the user base
    const user = await usersRepository.create({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: data.role,
    });

    // Apply exact hashed passwords and token states
    const updatedUser = await usersRepository.update(user.id, {
      passwordHash: hashedPassword,
      verificationToken,
    });

    return {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role.name,
        isEmailVerified: updatedUser.isEmailVerified,
      },
    };
  }

  async login(data: LoginInput['body']) {
    const user = await usersRepository.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await comparePassword(data.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role.name,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Save token to database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await refreshTokensRepository.save(user.id, refreshToken, expiresAt);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role.name,
        isEmailVerified: user.isEmailVerified,
      },
      accessToken,
      refreshToken,
    };
  }

  async logout(refreshToken: string) {
    try {
      await refreshTokensRepository.delete(refreshToken);
    } catch (error) {
      // Gracefully swallow if token was deleted
    }
  }

  async refresh(token: string) {
    const savedToken = await refreshTokensRepository.find(token);
    if (
      !savedToken ||
      (savedToken.expiresAt && new Date() > savedToken.expiresAt) ||
      savedToken.revokedAt
    ) {
      if (savedToken) {
        await refreshTokensRepository.delete(token);
      }
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = savedToken.user;
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role.name,
    };

    const accessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);

    await refreshTokensRepository.delete(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await refreshTokensRepository.save(user.id, newRefreshToken, expiresAt);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async verifyEmail(token: string) {
    const user = await usersRepository.findByVerificationToken(token);
    if (!user) {
      throw new ValidationError('Invalid or expired verification token');
    }

    await usersRepository.update(user.id, {
      isEmailVerified: true,
      verificationToken: null,
    });

    return { message: 'Email verified successfully' };
  }

  async forgotPassword(email: string) {
    const user = await usersRepository.findByEmail(email);
    if (!user) {
      return { message: 'If the email exists, a reset token has been issued.' };
    }

    const resetPasswordToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordExpires = new Date();
    resetPasswordExpires.setHours(resetPasswordExpires.getHours() + 1);

    await usersRepository.update(user.id, {
      resetPasswordToken,
      resetPasswordExpires,
    });

    return { message: 'If the email exists, a reset token has been issued.' };
  }

  async resetPassword(data: ResetPasswordInput['body']) {
    const user = await usersRepository.findByResetToken(data.token);
    if (!user || !user.resetPasswordExpires || new Date() > user.resetPasswordExpires) {
      throw new ValidationError('Invalid or expired password reset token');
    }

    const hashedPassword = await hashPassword(data.newPassword);

    await usersRepository.update(user.id, {
      passwordHash: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    await refreshTokensRepository.deleteManyForUser(user.id);

    return { message: 'Password has been reset successfully' };
  }

  async changePassword(userId: string, data: ChangePasswordInput['body']) {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isMatch = await comparePassword(data.oldPassword, user.passwordHash);
    if (!isMatch) {
      throw new ValidationError('Incorrect current password');
    }

    const hashedPassword = await hashPassword(data.newPassword);

    await usersRepository.update(userId, {
      passwordHash: hashedPassword,
    });

    await refreshTokensRepository.deleteManyForUser(userId);

    return { message: 'Password changed successfully' };
  }
}

export const authService = new AuthService();
export default authService;
