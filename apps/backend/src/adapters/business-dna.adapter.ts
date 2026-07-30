/**
 * Persistence adapter — Business DNA (Organization, Business Profile,
 * Product). Reads exclusively through `business-dna`'s own real runtime
 * (`organization.get`, `businessProfile.get`, `queries.findProducts`) —
 * never a repository — and writes a durable, queryable copy into
 * Postgres via Prisma. The in-memory runtime remains the source of
 * truth for business logic; Postgres is a mirror, not a replacement.
 *
 * `organization.created`'s real event payload carries only `{ code,
 * name }` (no id), so the event handler re-reads the current state
 * through the query layer rather than trying to reconstruct a row from
 * a partial payload — simpler and always consistent, at the cost of one
 * extra read per event, which is negligible at this data volume.
 */
import type { PrismaClient } from '@prisma/client';
import type { BusinessDnaRuntime } from '@lateen-os/business-dna';

export async function mirrorOrganization(
  prisma: PrismaClient,
  runtime: BusinessDnaRuntime,
  organizationId: string,
): Promise<void> {
  const organization = await runtime.organization.get(organizationId);
  if (!organization) return;
  await prisma.organization.upsert({
    where: { id: organization.id },
    create: {
      id: organization.id,
      code: organization.code,
      name: organization.name,
      legalName: organization.legalName,
      registrationNumber: organization.registrationNumber,
      taxId: organization.taxId,
      status: organization.status,
      defaultCurrency: organization.defaultCurrency,
      defaultLocale: organization.defaultLocale,
      timezone: organization.timezone,
    },
    update: {
      name: organization.name,
      legalName: organization.legalName,
      status: organization.status,
    },
  });

  const profile = await runtime.businessProfile.get(organizationId);
  if (profile) {
    await prisma.businessProfile.upsert({
      where: { organizationId },
      create: {
        organizationId,
        displayName: profile.displayName,
        legalEntity: profile.legalEntity as object,
      },
      update: { displayName: profile.displayName, legalEntity: profile.legalEntity as object },
    });
  }
}

export async function mirrorProducts(
  prisma: PrismaClient,
  runtime: BusinessDnaRuntime,
  organizationId: string,
): Promise<void> {
  const { products } = await runtime.queries.findProducts({ organizationId: organizationId });
  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      create: {
        id: product.id,
        organizationId,
        code: product.code,
        name: product.name,
        category: product.category,
        productionType: product.productionType,
        unitOfMeasure: product.unitOfMeasure,
        currency: product.currency,
        basePrice: product.basePrice ?? null,
        costPrice: product.costPrice ?? null,
      },
      update: {
        name: product.name,
        basePrice: product.basePrice ?? null,
        costPrice: product.costPrice ?? null,
      },
    });
  }
}

/** Subscribes to the real event bus so new/updated organizations, profiles, and products are mirrored as they happen — not only at seed time. */
export function subscribeBusinessDna(
  prisma: PrismaClient,
  runtime: BusinessDnaRuntime,
  organizationId: string,
): void {
  runtime.events.subscribe(
    'organization.created',
    () => void mirrorOrganization(prisma, runtime, organizationId),
  );
  runtime.events.subscribe(
    'organization.updated',
    () => void mirrorOrganization(prisma, runtime, organizationId),
  );
  runtime.events.subscribe(
    'business-profile.updated',
    () => void mirrorOrganization(prisma, runtime, organizationId),
  );
  runtime.events.subscribe(
    'product.created',
    () => void mirrorProducts(prisma, runtime, organizationId),
  );
  runtime.events.subscribe(
    'product.updated',
    () => void mirrorProducts(prisma, runtime, organizationId),
  );
}
