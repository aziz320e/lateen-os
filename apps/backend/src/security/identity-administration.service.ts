/**
 * Identity Administration abstraction — a thin façade over
 * `packages/admin-console`'s real `IdentityAdministrationEngine`. Users,
 * Roles, and Permissions are administered exclusively through the
 * engine's own real CRUD (createUser/createRole/createPermission/
 * assignRole/...) — this host never reimplements RBAC bookkeeping, it
 * only mirrors the engine's own state into Postgres for durability and
 * fast lookup (the same mirror-adapter pattern as `src/adapters/*`).
 */
import { Injectable } from '@nestjs/common';
import type {
  CreatePermissionInput,
  CreateRoleInput,
  CreateUserInput,
  IdentityAdministrationEngine,
  Permission,
  Role,
  User,
} from '@lateen-os/admin-console';
import { RuntimeRegistryService } from '../runtime-registry/runtime-registry.service.js';

@Injectable()
export class IdentityAdministrationService {
  constructor(private readonly registry: RuntimeRegistryService) {}

  private engine(): IdentityAdministrationEngine | undefined {
    return this.registry.get<{ identity: IdentityAdministrationEngine }>('admin-console')?.identity;
  }

  isAvailable(): boolean {
    return this.engine() !== undefined;
  }

  async createPermission(
    organizationId: string,
    input: CreatePermissionInput,
  ): Promise<Permission | null> {
    return (await this.engine()?.createPermission(organizationId, input)) ?? null;
  }

  async createRole(organizationId: string, input: CreateRoleInput): Promise<Role | null> {
    return (await this.engine()?.createRole(organizationId, input)) ?? null;
  }

  async createUser(organizationId: string, input: CreateUserInput): Promise<User | null> {
    return (await this.engine()?.createUser(organizationId, input)) ?? null;
  }

  async assignRole(organizationId: string, userId: string, roleId: string): Promise<User | null> {
    return (await this.engine()?.assignRole(organizationId, userId, roleId)) ?? null;
  }

  async findUserByEmail(organizationId: string, email: string): Promise<User | null> {
    return (await this.engine()?.findUserByEmail(organizationId, email)) ?? null;
  }
}
