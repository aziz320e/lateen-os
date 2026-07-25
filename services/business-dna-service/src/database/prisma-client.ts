import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | undefined;

export function createPrismaClient(databaseUrl?: string): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
  });
}

export function getPrismaClient(databaseUrl?: string): PrismaClient {
  if (!prisma) {
    prisma = createPrismaClient(databaseUrl);
  }
  return prisma;
}

export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = undefined;
  }
}

export type { PrismaClient };
