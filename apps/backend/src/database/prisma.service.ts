/**
 * Connection Manager — the single `PrismaClient` instance for this host,
 * lifecycle-managed by Nest. Connection failures are logged and do not
 * crash the process (matching the same resilience discipline as the
 * Runtime Registry) — `DatabaseHealthService` reports the real,
 * observed connection state instead of assuming one.
 */
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private _connected = false;

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this._connected = true;
      this.logger.log('Connected to PostgreSQL.');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Could not connect to PostgreSQL: ${message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this._connected) {
      await this.$disconnect();
    }
  }

  get connected(): boolean {
    return this._connected;
  }
}
