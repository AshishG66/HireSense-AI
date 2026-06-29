import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/AppError';
import auditService from '../services/audit.service';

export const roleGuard = (allowedRoles: string[]) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication context required');
      }

      const allowedRolesUpper = allowedRoles.map((r) => r.toUpperCase());
      const userRoleUpper = req.user.role.toUpperCase();

      if (!allowedRolesUpper.includes(userRoleUpper)) {
        await auditService.logSecurityEvent(
          req.user.userId,
          'SECURITY_VIOLATION_ROLE',
          {
            allowedRoles: allowedRolesUpper,
            userRole: userRoleUpper,
            url: req.originalUrl,
            method: req.method,
          },
          req,
        );

        throw new ForbiddenError('You do not have permission to access this resource');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default roleGuard;
