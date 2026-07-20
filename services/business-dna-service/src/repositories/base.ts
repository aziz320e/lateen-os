import type { PrismaClient } from '@prisma/client';
import type { OrganizationId } from '@lateen-os/business-dna';
import type { Entity } from '@lateen-os/shared-kernel/core';
import type { Identifier } from '@lateen-os/shared-kernel/identity';

export function toIsoDateTime(date: Date): string {
  return date.toISOString();
}

export function toIsoDate(date: Date | null | undefined): string | undefined {
  return date ? date.toISOString().slice(0, 10) : undefined;
}

export function parseDate(value: string | undefined): Date | undefined {
  return value ? new Date(value) : undefined;
}

export function asJson<T>(value: unknown): T {
  return (value ?? {}) as T;
}

export abstract class TenantPrismaRepository<
  TEntity extends Entity<Identifier> & { readonly organizationId: OrganizationId },
  TRow extends { id: string; organizationId: string; createdAt: Date; updatedAt: Date },
> {
  constructor(protected readonly prisma: PrismaClient) {}

  protected abstract readonly delegate: {
    findFirst(args: unknown): Promise<TRow | null>;
    upsert(args: unknown): Promise<TRow>;
    delete(args: unknown): Promise<TRow>;
    findMany(args: unknown): Promise<TRow[]>;
  };

  protected abstract toDomain(row: TRow): TEntity;
  protected abstract toCreate(row: TEntity): Record<string, unknown>;
  protected abstract toUpdate(row: TEntity): Record<string, unknown>;

  async findById(organizationId: OrganizationId, id: Identifier): Promise<TEntity | null> {
    const row = await this.delegate.findFirst({
      where: { id: id as string, organizationId: organizationId as string },
    });
    return row ? this.toDomain(row) : null;
  }

  async save(entity: TEntity): Promise<void> {
    const id = entity.id as string;
    const organizationId = entity.organizationId as string;
    await this.delegate.upsert({
      where: { id },
      create: { id, organizationId, ...this.toCreate(entity) },
      update: this.toUpdate(entity),
    });
  }

  async delete(organizationId: OrganizationId, id: Identifier): Promise<void> {
    await this.delegate.delete({
      where: { id: id as string },
    });
  }

  protected async findManyByOrg(organizationId: OrganizationId): Promise<TEntity[]> {
    const rows = await this.delegate.findMany({
      where: { organizationId: organizationId as string },
    });
    return rows.map((row) => this.toDomain(row));
  }
}
