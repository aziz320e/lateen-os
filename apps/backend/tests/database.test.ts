import { describe, expect, it, vi } from 'vitest';
import { DatabaseController } from '../src/api/database/database.controller.js';
import { DatabaseBootstrapService } from '../src/database/database-bootstrap.service.js';
import { DatabaseHealthService } from '../src/database/database-health.service.js';
import { MigrationRunnerService } from '../src/database/migration-runner.service.js';
import { PrismaService } from '../src/database/prisma.service.js';

/**
 * Database infrastructure tests, run against the real components with no
 * live PostgreSQL available in this environment (confirmed absent — see
 * `docs` on the sandbox). This is intentional: every component here is
 * designed to degrade gracefully rather than crash, so these tests assert
 * the real observed degraded state, not a fabricated "healthy" one.
 */
describe('Connection Manager (PrismaService)', () => {
  it('does not throw when PostgreSQL is unreachable, and reports connected=false', async () => {
    const prisma = new PrismaService();
    await expect(prisma.onModuleInit()).resolves.toBeUndefined();
    expect(prisma.connected).toBe(false);
    await prisma.onModuleDestroy();
  }, // Real TCP connect attempt to an unreachable host — some environments
  // take longer than Vitest's 5s default to return ECONNREFUSED (see the
  // same rationale on the Migration Runner test below).
  30_000);
});

describe('Database Health Check', () => {
  it('check() reports connected=false with a real Prisma connection error when the database is unreachable', async () => {
    const prisma = new PrismaService();
    const health = new DatabaseHealthService(prisma);
    const result = await health.check();
    expect(result.connected).toBe(false);
    expect(result.error).toBeTruthy();
  }, 30_000);

  it('version() reports version=null with a real Prisma connection error when the database is unreachable', async () => {
    const prisma = new PrismaService();
    const health = new DatabaseHealthService(prisma);
    const result = await health.version();
    expect(result.version).toBeNull();
    expect(result.error).toBeTruthy();
  }, 30_000);
});

describe('Migration Runner', () => {
  it('deploy() does not throw and reports applied=false when the database is unreachable', async () => {
    const runner = new MigrationRunnerService();
    const result = await runner.deploy();
    expect(result.applied).toBe(false);
    expect(result.error).toBeTruthy();
  }, 30_000);
});

describe('Database Bootstrap', () => {
  it('completes without throwing even when migrations fail and the connection is unhealthy', async () => {
    const migrationRunner = {
      deploy: vi.fn().mockResolvedValue({ applied: false, error: 'unreachable' }),
    } as unknown as MigrationRunnerService;
    const health = {
      check: vi.fn().mockResolvedValue({ connected: false, error: 'unreachable' }),
    } as unknown as DatabaseHealthService;
    const bootstrap = new DatabaseBootstrapService(migrationRunner, health);
    await expect(bootstrap.onModuleInit()).resolves.toBeUndefined();
    expect(migrationRunner.deploy).toHaveBeenCalled();
    expect(health.check).toHaveBeenCalled();
  });
});

describe('GET /database/health and /database/version', () => {
  it('reports status="unhealthy" with the real error when the database is unreachable', async () => {
    const prisma = new PrismaService();
    const health = new DatabaseHealthService(prisma);
    const controller = new DatabaseController(health);
    const result = await controller.health();
    expect(result.status).toBe('unhealthy');
    expect(result.connected).toBe(false);
    expect(result.error).toBeTruthy();
  }, 30_000);

  it('reports version=null with the real error when the database is unreachable', async () => {
    const prisma = new PrismaService();
    const health = new DatabaseHealthService(prisma);
    const controller = new DatabaseController(health);
    const result = await controller.version();
    expect(result.version).toBeNull();
    expect(result.error).toBeTruthy();
  }, 30_000);
});
