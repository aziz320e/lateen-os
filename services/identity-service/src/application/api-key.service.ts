import { IDENTITY_EVENT_NAMES } from '../domain/types';
import type { AuditLogger, IdentityEventPublisher, PasswordHasher } from '../domain/ports';
import type { CreateApiKeyRequest } from '../domain/types';
import { createDomainEvent } from '../events/nats-publisher';
import { generateApiKey, hashToken } from '../infrastructure/auth/password-hasher';
import type { IdentityRepositories } from '../repositories/identity-repositories';

export class ApiKeyService {
  constructor(
    private readonly repos: IdentityRepositories,
    private readonly passwordHasher: PasswordHasher,
    private readonly audit: AuditLogger,
    private readonly events: IdentityEventPublisher,
  ) {}

  async list(organizationId: string) {
    const org = await this.repos.organizationIdentity.findFirst({ where: { organizationId } });
    if (!org) return [];
    const keys = await this.repos.apiKey.findMany({ where: { organizationId: org.id, status: 'active' } });
    return keys.map((k) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      roles: k.roles,
      permissions: k.permissions,
      expiresAt: k.expiresAt,
      lastUsedAt: k.lastUsedAt,
      createdAt: k.createdAt,
    }));
  }

  async create(request: CreateApiKeyRequest) {
    const org = await this.repos.organizationIdentity.findFirst({ where: { organizationId: request.organizationId } });
    if (!org) throw new Error('Organization not found');

    const { fullKey, prefix } = generateApiKey();
    const keyHash = await this.passwordHasher.hash(fullKey);

    const apiKey = await this.repos.apiKey.create({
      data: {
        organizationId: org.id,
        name: request.name,
        keyPrefix: prefix,
        keyHash,
        roles: request.roles ?? [],
        permissions: request.permissions ?? [],
        expiresAt: request.expiresAt,
      },
    });

    await this.audit.log({
      organizationId: request.organizationId,
      actorSubject: request.actorSubject,
      action: 'create',
      resource: 'api_key',
      resourceId: apiKey.id,
      outcome: 'success',
    });

    await this.events.publish(
      createDomainEvent(
        IDENTITY_EVENT_NAMES.ApiKeyCreated,
        { apiKeyId: apiKey.id, name: request.name },
        request.organizationId,
      ),
    );

    return { id: apiKey.id, name: apiKey.name, key: fullKey, keyPrefix: prefix, expiresAt: apiKey.expiresAt };
  }

  async revoke(id: string, organizationId: string, actorSubject: string) {
    const org = await this.repos.organizationIdentity.findFirst({ where: { organizationId } });
    if (!org) throw new Error('Organization not found');

    await this.repos.apiKey.update({ where: { id, organizationId: org.id }, data: { status: 'revoked' } });

    await this.audit.log({
      organizationId,
      actorSubject,
      action: 'revoke',
      resource: 'api_key',
      resourceId: id,
      outcome: 'success',
    });
  }

  async authenticate(apiKeyRaw: string): Promise<{ organizationId: string; roles: string[]; permissions: string[] } | null> {
    const prefix = apiKeyRaw.replace(/^lk_/, '').slice(0, 8);
    const keys = await this.repos.apiKey.findMany({ where: { keyPrefix: prefix, status: 'active' } });
    for (const key of keys) {
      if (await this.passwordHasher.verify(apiKeyRaw, key.keyHash)) {
        if (key.expiresAt && key.expiresAt < new Date()) return null;
        await this.repos.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } });
        const org = await this.repos.organizationIdentity.findUnique({ where: { id: key.organizationId } });
        return {
          organizationId: org!.organizationId,
          roles: (key.roles as string[]) ?? [],
          permissions: (key.permissions as string[]) ?? [],
        };
      }
    }
    return null;
  }
}
