import type { PrismaClient } from '@prisma/identity-client';

export class IdentityRepositories {
  constructor(private readonly prisma: PrismaClient) {}

  get organizationIdentity() {
    return this.prisma.organizationIdentity;
  }

  get user() {
    return this.prisma.user;
  }

  get serviceAccount() {
    return this.prisma.serviceAccount;
  }

  get apiKey() {
    return this.prisma.apiKey;
  }

  get session() {
    return this.prisma.session;
  }

  get refreshToken() {
    return this.prisma.refreshToken;
  }

  get device() {
    return this.prisma.device;
  }

  get auditLog() {
    return this.prisma.auditLog;
  }

  get permissionGrant() {
    return this.prisma.permissionGrant;
  }
}

export function createRepositories(prisma: PrismaClient): IdentityRepositories {
  return new IdentityRepositories(prisma);
}
