/**
 * RBAC lookup — reads a user's assigned role names and effective
 * permission codes from the Postgres RBAC tables (`Role`,
 * `RoleAssignment`, `RolePermissionGroup`, `PermissionGroup`,
 * `PermissionGroupPermission`, `Permission`) seeded/administered via
 * Admin Console's `IdentityAdministrationEngine` (see
 * `seed-runner.service.ts`). This is bookkeeping lookup only — the
 * actual allow/deny decision for a permission check is always made by
 * `AuthorizationService.evaluate()` (the gateway's real Policy
 * Evaluation), never by comparing these lists directly.
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

export interface UserRbacProfile {
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
}

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  async loadProfile(userId: string): Promise<UserRbacProfile> {
    const assignments = await this.prisma.roleAssignment.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            permissionGroups: {
              include: {
                permissionGroup: { include: { permissions: { include: { permission: true } } } },
              },
            },
          },
        },
      },
    });

    const roles = new Set<string>();
    const permissions = new Set<string>();
    for (const assignment of assignments) {
      roles.add(assignment.role.name);
      for (const rolePermissionGroup of assignment.role.permissionGroups) {
        for (const groupPermission of rolePermissionGroup.permissionGroup.permissions) {
          permissions.add(groupPermission.permission.code);
        }
      }
    }

    return { roles: [...roles].sort(), permissions: [...permissions].sort() };
  }
}
