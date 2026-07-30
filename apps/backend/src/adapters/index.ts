/**
 * Persistence Adapter Layer — the only place in this application that
 * imports both a business engine's runtime type and `@prisma/client`.
 * No engine ever imports Prisma; every adapter here only ever reads
 * through an engine's own real query layer or event bus, then writes to
 * Postgres. Repositories inside engines are never touched.
 */
import type { PrismaClient } from '@prisma/client';
import type { BusinessDnaRuntime } from '@lateen-os/business-dna';
import type { CrmRuntime } from '@lateen-os/crm-engine';
import type { FinanceRuntime } from '@lateen-os/finance-engine';
import type { HrRuntime } from '@lateen-os/hr-engine';
import type { InventoryRuntime } from '@lateen-os/inventory-engine';
import type { ProjectRuntime } from '@lateen-os/project-management-engine';
import {
  mirrorOrganization,
  mirrorProducts,
  subscribeBusinessDna,
} from './business-dna.adapter.js';
import { mirrorCustomers, subscribeCrm } from './crm.adapter.js';
import { mirrorAccounts, subscribeFinance } from './finance.adapter.js';
import { mirrorEmployees, subscribeHr } from './hr.adapter.js';
import { mirrorWarehouses } from './inventory.adapter.js';
import { mirrorProjects, subscribeProjectManagement } from './project-management.adapter.js';

export interface MirroredRuntimes {
  readonly businessDna?: BusinessDnaRuntime;
  readonly hr?: HrRuntime;
  readonly crm?: CrmRuntime;
  readonly inventory?: InventoryRuntime;
  readonly finance?: FinanceRuntime;
  readonly projectManagement?: ProjectRuntime;
}

/** Runs every adapter's full backfill once — used by the Seed Runner right after seeding, and safe to re-run anytime as a reconciliation pass. */
export async function mirrorAll(
  prisma: PrismaClient,
  runtimes: MirroredRuntimes,
  organizationId: string,
): Promise<void> {
  if (runtimes.businessDna) {
    await mirrorOrganization(prisma, runtimes.businessDna, organizationId);
    await mirrorProducts(prisma, runtimes.businessDna, organizationId);
  }
  if (runtimes.hr) await mirrorEmployees(prisma, runtimes.hr, organizationId);
  if (runtimes.crm) await mirrorCustomers(prisma, runtimes.crm, organizationId);
  if (runtimes.inventory) await mirrorWarehouses(prisma, runtimes.inventory, organizationId);
  if (runtimes.finance) await mirrorAccounts(prisma, runtimes.finance, organizationId);
  if (runtimes.projectManagement)
    await mirrorProjects(prisma, runtimes.projectManagement, organizationId);
}

/** Wires real-time event-driven mirroring for every adapter that has a real creation/update event to subscribe to. */
export function subscribeAll(
  prisma: PrismaClient,
  runtimes: MirroredRuntimes,
  organizationId: string,
): void {
  if (runtimes.businessDna) subscribeBusinessDna(prisma, runtimes.businessDna, organizationId);
  if (runtimes.hr) subscribeHr(prisma, runtimes.hr, organizationId);
  if (runtimes.crm) subscribeCrm(prisma, runtimes.crm, organizationId);
  if (runtimes.finance) subscribeFinance(prisma, runtimes.finance, organizationId);
  if (runtimes.projectManagement)
    subscribeProjectManagement(prisma, runtimes.projectManagement, organizationId);
  // inventory-engine has no warehouse.created event — see inventory.adapter.ts.
}
