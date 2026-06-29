import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/env';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Hash a plain text password using bcryptjs.
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare a plain text password with a hashed password.
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Sign an Access Token.
 */
export const signAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: '15m',
  });
};

/**
 * Sign a Refresh Token.
 */
export const signRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN as any,
  });
};

/**
 * Verify a JSON Web Token and return decoded payload.
 */
export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.JWT_SECRET) as TokenPayload;
};
