import { Request, Response, NextFunction } from 'express';
import logger from '../lib/logger';
import AppError from '../utils/AppError';
import env from '../config/env';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.details || [];
  const requestId = req.id;

  // Handle Prisma Database Client errors
  if (err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
    statusCode = 400;
    if (err.code === 'P2002') {
      message = 'Unique constraint violation: record already exists.';
      errors = [{ field: 'database', message: 'Record already exists' }];
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found.';
      errors = [{ field: 'database', message: 'Record not found' }];
    } else {
      message = 'Database operation failed.';
      errors = [{ field: 'database', message: err.message }];
    }
  }

  // Handle JWT verification errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
    errors = [{ field: 'auth', message: 'Invalid authentication token' }];
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired.';
    errors = [{ field: 'auth', message: 'Token expired' }];
  }

  const isOperational = err instanceof AppError ? err.isOperational : false;

  // Log severity metadata
  if (statusCode >= 500) {
    logger.error(`[500] Exception: ${err.message}`, {
      requestId,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
    });
  } else {
    logger.warn(`[${statusCode}] Operational: ${message}`, {
      requestId,
      url: req.originalUrl,
      method: req.method,
    });
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errors: errors.length > 0 ? errors : [{ message }],
    ...(env.NODE_ENV === 'development' && !isOperational && { stack: err.stack }),
  });
}

export default errorHandler;
