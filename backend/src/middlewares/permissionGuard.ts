import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/AppError';
import auditService from '../services/audit.service';

const ROLE_PERMISSIONS: Record<string, string[]> = {
  CANDIDATE: ['Upload Resume', 'Apply Job', 'View Dashboard'],
  RECRUITER: ['Create Jobs', 'View Candidates', 'Manage Interviews'],
  ADMIN: ['Manage Users', 'Manage Companies', 'Manage Roles', 'View Analytics'],
};

export const permissionGuard = (requiredPermission: string) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication context required');
      }

      const userRoleUpper = req.user.role.toUpperCase();
      const permissions = ROLE_PERMISSIONS[userRoleUpper] || [];

      if (!permissions.includes(requiredPermission)) {
        await auditService.logSecurityEvent(
          req.user.userId,
          'SECURITY_VIOLATION_PERMISSION',
          {
            requiredPermission,
            userRole: userRoleUpper,
            url: req.originalUrl,
            method: req.method,
          },
          req,
        );

        throw new ForbiddenError('You do not have the required permission to perform this action');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default permissionGuard;
