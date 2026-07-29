/** @module queries/admin-queries */
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
  SearchAdministrationQuery,
  SearchAdministrationResult,
} from './types.js';

/** Real, read-only CQRS query port over the Admin Console's own aggregates. */
export interface AdminQueries {
  findOrganizations(query: FindOrganizationsQuery): Promise<FindOrganizationsResult>;
  findTenants(query: FindTenantsQuery): Promise<FindTenantsResult>;
  findUsers(query: FindUsersQuery): Promise<FindUsersResult>;
  findRoles(query: FindRolesQuery): Promise<FindRolesResult>;
  findSettings(query: FindSettingsQuery): Promise<FindSettingsResult>;
  findAudits(query: FindAuditsQuery): Promise<FindAuditsResult>;
  findDashboard(query: FindDashboardQuery): Promise<FindDashboardResult>;
  searchAdministration(query: SearchAdministrationQuery): Promise<SearchAdministrationResult>;
}
