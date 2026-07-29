/**
 * Real {@link AdminQueries} implementation — a CQRS read layer
 * composed over the Admin Console repositories. Repositories are taken
 * as constructor dependencies but never returned to callers.
 *
 * @module queries/admin-queries.impl
 */
import type { AuditEntryRepository } from '../audit/repository.js';
import type { DashboardSnapshotRepository } from '../dashboard/repository.js';
import type { FeatureFlagRepository } from '../feature-flags/repository.js';
import type { RoleRepository, UserRepository } from '../identity/repository.js';
import type { OrganizationRepository } from '../organizations/repository.js';
import type { SettingRepository } from '../settings/repository.js';
import type { TenantRepository } from '../tenants/repository.js';
import type { AdminQueries } from './admin-queries.js';
import type {
  FindAuditsQuery,
  FindAuditsResult,
  FindDashboardQuery,
  FindDashboardResult,
  FindOrganizationsQuery,
  FindOrganizationsResult,
  FindRolesQuery,
  FindRolesResult,
  FindSettingsQuery,
  FindSettingsResult,
  FindTenantsQuery,
  FindTenantsResult,
  FindUsersQuery,
  FindUsersResult,
  SearchAdministrationMatch,
  SearchAdministrationQuery,
  SearchAdministrationResult,
} from './types.js';

export interface AdminQueriesDeps {
  readonly organizationRepository: OrganizationRepository;
  readonly tenantRepository: TenantRepository;
  readonly userRepository: UserRepository;
  readonly roleRepository: RoleRepository;
  readonly settingRepository: SettingRepository;
  readonly auditEntryRepository: AuditEntryRepository;
  readonly dashboardSnapshotRepository: DashboardSnapshotRepository;
  readonly featureFlagRepository: FeatureFlagRepository;
}

function paginate<T>(items: readonly T[], offset?: number, limit?: number): readonly T[] {
  const start = offset ?? 0;
  return limit === undefined ? items.slice(start) : items.slice(start, start + limit);
}

function scoreLabel(label: string, keyword: string): number {
  const normalizedLabel = label.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase();
  if (normalizedLabel === normalizedKeyword) return 3;
  if (normalizedLabel.includes(normalizedKeyword)) return 2;
  return 0;
}

/** Creates a real {@link AdminQueries} read port over the given repositories. */
export function createAdminQueries(deps: AdminQueriesDeps): AdminQueries {
  return {
    async findOrganizations(query: FindOrganizationsQuery): Promise<FindOrganizationsResult> {
      let organizations = await deps.organizationRepository.findAll();
      if (query.status) organizations = organizations.filter((organization) => organization.status === query.status);
      return { organizations: paginate(organizations, query.offset, query.limit), total: organizations.length };
    },

    async findTenants(query: FindTenantsQuery): Promise<FindTenantsResult> {
      let tenants = await deps.tenantRepository.findAll(query.organizationId);
      if (query.status) tenants = tenants.filter((tenant) => tenant.status === query.status);
      return { tenants: paginate(tenants, query.offset, query.limit), total: tenants.length };
    },

    async findUsers(query: FindUsersQuery): Promise<FindUsersResult> {
      let users = await deps.userRepository.findAll(query.organizationId);
      if (query.status) users = users.filter((user) => user.status === query.status);
      return { users: paginate(users, query.offset, query.limit), total: users.length };
    },

    async findRoles(query: FindRolesQuery): Promise<FindRolesResult> {
      let roles = await deps.roleRepository.findAll(query.organizationId);
      if (query.status) roles = roles.filter((role) => role.status === query.status);
      return { roles: paginate(roles, query.offset, query.limit), total: roles.length };
    },

    async findSettings(query: FindSettingsQuery): Promise<FindSettingsResult> {
      const all = await deps.settingRepository.findAll();
      let settings = all.filter((setting) => setting.scope === 'global' || setting.organizationId === query.organizationId);
      if (query.scope) settings = settings.filter((setting) => setting.scope === query.scope);
      return { settings: paginate(settings, query.offset, query.limit), total: settings.length };
    },

    async findAudits(query: FindAuditsQuery): Promise<FindAuditsResult> {
      let audits = await deps.auditEntryRepository.findAll(query.organizationId);
      if (query.action) audits = audits.filter((audit) => audit.action === query.action);
      return { audits: paginate(audits, query.offset, query.limit), total: audits.length };
    },

    async findDashboard(query: FindDashboardQuery): Promise<FindDashboardResult> {
      const all = await deps.dashboardSnapshotRepository.findAll(query.organizationId);
      if (all.length === 0) return { dashboard: null };
      const latest = all.reduce((current, candidate) => (candidate.generatedAt >= current.generatedAt ? candidate : current));
      return { dashboard: latest };
    },

    async searchAdministration(query: SearchAdministrationQuery): Promise<SearchAdministrationResult> {
      const [tenants, users, roles, featureFlags] = await Promise.all([
        deps.tenantRepository.findAll(query.organizationId),
        deps.userRepository.findAll(query.organizationId),
        deps.roleRepository.findAll(query.organizationId),
        deps.featureFlagRepository.findAll(query.organizationId),
      ]);

      const matches: SearchAdministrationMatch[] = [];
      for (const tenant of tenants) {
        const score = scoreLabel(tenant.name, query.keyword);
        if (score > 0) matches.push({ recordType: 'tenant', id: tenant.id, label: tenant.name, score });
      }
      for (const user of users) {
        const score = Math.max(scoreLabel(user.email, query.keyword), scoreLabel(user.displayName, query.keyword));
        if (score > 0) matches.push({ recordType: 'user', id: user.id, label: user.displayName, score });
      }
      for (const role of roles) {
        const score = scoreLabel(role.name, query.keyword);
        if (score > 0) matches.push({ recordType: 'role', id: role.id, label: role.name, score });
      }
      for (const flag of featureFlags) {
        const score = scoreLabel(flag.key, query.keyword);
        if (score > 0) matches.push({ recordType: 'feature-flag', id: flag.id, label: flag.key, score });
      }

      matches.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      });

      const limited = query.limit === undefined ? matches : matches.slice(0, query.limit);
      return { matches: limited, total: matches.length };
    },
  };
}
