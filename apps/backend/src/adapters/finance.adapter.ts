/** Persistence adapter — Finance Engine (Chart of Accounts). Reads via `queries.findAccounts()`; writes a durable copy to Postgres. */
import type { PrismaClient } from '@prisma/client';
import type { FinanceRuntime } from '@lateen-os/finance-engine';

export async function mirrorAccounts(
  prisma: PrismaClient,
  runtime: FinanceRuntime,
  organizationId: string,
): Promise<void> {
  const { accounts } = await runtime.queries.findAccounts({ organizationId });
  for (const account of accounts) {
    await prisma.account.upsert({
      where: { id: account.id },
      create: {
        id: account.id,
        organizationId,
        code: account.code,
        name: account.name,
        accountType: account.accountType,
      },
      update: {
        name: account.name,
      },
    });
  }
}

export function subscribeFinance(
  prisma: PrismaClient,
  runtime: FinanceRuntime,
  organizationId: string,
): void {
  runtime.events.subscribe(
    'account.created',
    () => void mirrorAccounts(prisma, runtime, organizationId),
  );
}
