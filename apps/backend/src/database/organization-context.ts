/**
 * There is no real tenant-provisioning flow yet — this host seeds and
 * serves exactly one organization per process (matching the same
 * documented placeholder pattern used by `apps/erp-web`'s
 * `DEFAULT_ORGANIZATION_ID`). Set once by the Seed Runner right after
 * it creates the real organization; read by anything that needs "the"
 * current organization id (the Persistence Adapter Layer's live event
 * subscriptions, in particular).
 */
let currentOrganizationId: string | undefined;

export function setOrganizationId(organizationId: string): void {
  currentOrganizationId = organizationId;
}

export function getOrganizationId(): string | undefined {
  return currentOrganizationId;
}
