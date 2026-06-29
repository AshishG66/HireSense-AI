import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { ApiResponse } from '../utils/ApiResponse';

export const getHealth = async (req: Request, res: Response) => {
  let dbStatus = 'unreachable';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'healthy';
  } catch (error: any) {
    logger.error('Database connection failed during health check', {
      requestId: req.id,
      error: error.message,
    });
  }

  const uptime = process.uptime();
  const memory = process.memoryUsage();
  const isHealthy = dbStatus === 'healthy';

  const healthData = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      api: 'healthy',
      database: dbStatus,
    },
    system: {
      uptime: `${Math.floor(uptime)}s`,
      memory: {
        heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
        rss: `${Math.round(memory.rss / 1024 / 1024)}MB`,
      },
    },
  };

  return res
    .status(isHealthy ? 200 : 503)
    .json(ApiResponse.success(healthData, isHealthy ? 'System is healthy' : 'System is degraded'));
};
