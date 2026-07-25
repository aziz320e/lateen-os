import { PrismaClient } from '@prisma/integration-hub-client';

let prisma: PrismaClient | undefined;

export function getPrismaClient(databaseUrl?: string): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient(
      databaseUrl ? { datasources: { db: { url: databaseUrl } } } : undefined,
    );
  }
  return prisma;
}

export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = undefined;
  }
}
