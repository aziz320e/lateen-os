import { IDENTITY_EVENT_NAMES } from '../domain/types';
import type { AuditLogger, IdentityEventPublisher } from '../domain/ports';
import { createDomainEvent } from '../events/nats-publisher';
import type { IdentityRepositories } from '../repositories/identity-repositories';

export class PermissionService {
  constructor(
    private readonly repos: IdentityRepositories,
    private readonly audit: AuditLogger,
    private readonly events: IdentityEventPublisher,
  ) {}

  async grant(
    organizationId: string,
    subject: string,
    subjectType: string,
    permission: string,
    grantedBy: string,
  ) {
    const grant = await this.repos.permissionGrant.create({
      data: { organizationId, subject, subjectType, permission, grantedBy },
    });

    await this.audit.log({
      organizationId,
      actorSubject: grantedBy,
      action: 'grant',
      resource: 'permission',
      resourceId: grant.id,
      outcome: 'success',
      metadata: { subject, permission },
    });

    await this.events.publish(
      createDomainEvent(
        IDENTITY_EVENT_NAMES.PermissionGranted,
        { subject, subjectType, permission, grantId: grant.id },
        organizationId,
      ),
    );

    return grant;
  }

  async revoke(grantId: string, organizationId: string, revokedBy: string) {
    const grant = await this.repos.permissionGrant.update({
      where: { id: grantId },
      data: { revokedAt: new Date() },
    });

    await this.audit.log({
      organizationId,
      actorSubject: revokedBy,
      action: 'revoke',
      resource: 'permission',
      resourceId: grantId,
      outcome: 'success',
    });

    await this.events.publish(
      createDomainEvent(
        IDENTITY_EVENT_NAMES.PermissionRevoked,
        { grantId, subject: grant.subject, permission: grant.permission },
        organizationId,
      ),
    );

    return grant;
  }
}
