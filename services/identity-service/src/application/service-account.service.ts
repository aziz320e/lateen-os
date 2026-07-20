import type { AuditLogger, PasswordHasher } from '../domain/ports';
import type { CreateServiceAccountRequest } from '../domain/types';
import { generateSecureToken } from '../infrastructure/auth/password-hasher';
import type { IdentityRepositories } from '../repositories/identity-repositories';

export class ServiceAccountService {
  constructor(
    private readonly repos: IdentityRepositories,
    private readonly passwordHasher: PasswordHasher,
    private readonly audit: AuditLogger,
  ) {}

  async list(organizationId: string) {
    const org = await this.repos.organizationIdentity.findFirst({ where: { organizationId } });
    if (!org) return [];
    const accounts = await this.repos.serviceAccount.findMany({ where: { organizationId: org.id, status: 'active' } });
    return accounts.map((a) => ({
      id: a.id,
      name: a.name,
      clientId: a.clientId,
      roles: a.roles,
      permissions: a.permissions,
      createdAt: a.createdAt,
    }));
  }

  async create(request: CreateServiceAccountRequest) {
    const org = await this.repos.organizationIdentity.findFirst({ where: { organizationId: request.organizationId } });
    if (!org) throw new Error('Organization not found');

    const clientId = `sa_${generateSecureToken(12)}`;
    const clientSecret = generateSecureToken(32);
    const clientSecretHash = await this.passwordHasher.hash(clientSecret);

    const account = await this.repos.serviceAccount.create({
      data: {
        organizationId: org.id,
        name: request.name,
        clientId,
        clientSecretHash,
        roles: request.roles ?? [],
        permissions: request.permissions ?? [],
      },
    });

    await this.audit.log({
      organizationId: request.organizationId,
      actorSubject: request.actorSubject,
      action: 'create',
      resource: 'service_account',
      resourceId: account.id,
      outcome: 'success',
    });

    return { id: account.id, name: account.name, clientId, clientSecret };
  }

  async authenticate(clientId: string, clientSecret: string) {
    const account = await this.repos.serviceAccount.findFirst({ where: { clientId, status: 'active' } });
    if (!account) return null;
    if (!(await this.passwordHasher.verify(clientSecret, account.clientSecretHash))) return null;
    const org = await this.repos.organizationIdentity.findUnique({ where: { id: account.organizationId } });
    return {
      subject: account.id,
      organizationId: org!.organizationId,
      roles: (account.roles as string[]) ?? [],
      permissions: (account.permissions as string[]) ?? [],
    };
  }
}
