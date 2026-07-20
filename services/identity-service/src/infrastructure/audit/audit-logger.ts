import type { Prisma } from '@prisma/identity-client';
import type { PrismaClient } from '@prisma/identity-client';
import type { AuditLogger } from '../../domain/ports';
import type { AuditEntry } from '../../domain/types';

export class PrismaAuditLogger implements AuditLogger {
  constructor(private readonly prisma: PrismaClient) {}

  async log(entry: AuditEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        organizationId: entry.organizationId,
        actorSubject: entry.actorSubject,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        outcome: entry.outcome,
        metadata: (entry.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }
}

export class NoOpAuditLogger implements AuditLogger {
  async log(_entry: AuditEntry): Promise<void> {
    /* no-op for tests */
  }
}
