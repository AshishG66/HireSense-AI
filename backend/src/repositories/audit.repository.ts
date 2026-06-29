import prisma from '../lib/prisma';

export class AuditRepository {
  async log(data: {
    action: string;
    entity: string;
    entityId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
    userId?: string;
  }) {
    return prisma.auditLog.create({
      data,
    });
  }
}

export const auditRepository = new AuditRepository();
export default auditRepository;
