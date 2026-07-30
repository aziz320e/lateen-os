/**
 * Database Health Check — a real `SELECT` against PostgreSQL, not a
 * cached or assumed status. Used by `GET /database/health` and folded
 * into the platform-wide `GET /health` in a future iteration.
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

export interface DatabaseHealth {
  readonly connected: boolean;
  readonly latencyMs?: number;
  readonly error?: string;
}

@Injectable()
export class DatabaseHealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<DatabaseHealth> {
    const start = performance.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { connected: true, latencyMs: Math.round(performance.now() - start) };
    } catch (error) {
      return { connected: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async version(): Promise<{ version: string | null; error?: string }> {
    try {
      const result = await this.prisma.$queryRaw<{ version: string }[]>`SELECT version()`;
      return { version: result[0]?.version ?? null };
    } catch (error) {
      return { version: null, error: error instanceof Error ? error.message : String(error) };
    }
  }
}
