import auditRepository from '../repositories/audit.repository';

export class AuditService {
  async logSecurityEvent(userId: string | undefined, action: string, details: any, req: any) {
    const ipAddress =
      req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    return auditRepository.log({
      action,
      entity: 'Security',
      details,
      ipAddress,
      userAgent,
      userId,
    });
  }
}

export const auditService = new AuditService();
export default auditService;
