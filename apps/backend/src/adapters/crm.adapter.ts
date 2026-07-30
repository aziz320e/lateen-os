/** Persistence adapter — CRM Engine (Customer). Reads via `queries.findCustomers()`; writes a durable copy to Postgres. */
import type { PrismaClient } from '@prisma/client';
import type { CrmRuntime } from '@lateen-os/crm-engine';

export async function mirrorCustomers(
  prisma: PrismaClient,
  runtime: CrmRuntime,
  organizationId: string,
): Promise<void> {
  const { customers } = await runtime.queries.findCustomers({ organizationId });
  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { id: customer.id },
      create: {
        id: customer.id,
        organizationId,
        name: customer.name,
        email: customer.email ?? null,
        company: customer.company ?? null,
        status: customer.status,
      },
      update: {
        name: customer.name,
        status: customer.status,
      },
    });
  }
}

export function subscribeCrm(
  prisma: PrismaClient,
  runtime: CrmRuntime,
  organizationId: string,
): void {
  runtime.events.subscribe(
    'customer.created',
    () => void mirrorCustomers(prisma, runtime, organizationId),
  );
  runtime.events.subscribe(
    'customer.updated',
    () => void mirrorCustomers(prisma, runtime, organizationId),
  );
}
