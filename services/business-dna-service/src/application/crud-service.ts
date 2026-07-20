import { randomUUID } from 'node:crypto';
import type { OrganizationId } from '@lateen-os/business-dna';
import type { DomainEventPublisher } from '../domain/ports.js';
import type { Repositories } from '../repositories/prisma-repositories.js';

export interface CrudRepository<TEntity> {
  findById(organizationId: OrganizationId, id: string): Promise<TEntity | null>;
  save(entity: TEntity): Promise<void>;
  delete(organizationId: OrganizationId, id: string): Promise<void>;
}

export class EntityCrudService<TEntity extends { id: string; organizationId?: OrganizationId }> {
  constructor(
    private readonly repository: CrudRepository<TEntity>,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly entityName: string,
    private readonly isTenantScoped: boolean,
  ) {}

  async get(organizationId: OrganizationId, id: string): Promise<TEntity | null> {
    return this.repository.findById(organizationId, id);
  }

  async create(organizationId: OrganizationId, body: Record<string, unknown>): Promise<TEntity> {
    const now = new Date().toISOString();
    const entity = {
      ...body,
      id: (body.id as string) ?? randomUUID(),
      ...(this.isTenantScoped ? { organizationId } : {}),
      createdAt: now,
      updatedAt: now,
    } as unknown as TEntity;

    await this.repository.save(entity);
    await this.eventPublisher.publish({
      eventName: `${this.entityName}.created`,
      eventId: randomUUID(),
      occurredAt: now,
      organizationId: organizationId as OrganizationId,
      aggregateId: entity.id,
      payload: { id: entity.id },
    });

    return entity;
  }

  async update(organizationId: OrganizationId, id: string, body: Record<string, unknown>): Promise<TEntity | null> {
    const existing = await this.repository.findById(organizationId, id);
    if (!existing) return null;

    const entity = {
      ...existing,
      ...body,
      id,
      ...(this.isTenantScoped ? { organizationId } : {}),
      updatedAt: new Date().toISOString(),
    } as unknown as TEntity;

    await this.repository.save(entity);
    await this.eventPublisher.publish({
      eventName: `${this.entityName}.updated`,
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
      organizationId: organizationId as OrganizationId,
      aggregateId: id,
      payload: { id },
    });

    return entity;
  }

  async remove(organizationId: OrganizationId, id: string): Promise<boolean> {
    const existing = await this.repository.findById(organizationId, id);
    if (!existing) return false;

    await this.repository.delete(organizationId, id);
    await this.eventPublisher.publish({
      eventName: `${this.entityName}.deleted`,
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
      organizationId: organizationId as OrganizationId,
      aggregateId: id,
      payload: { id },
    });

    return true;
  }
}

export function createApplicationServices(
  repositories: Repositories,
  eventPublisher: DomainEventPublisher,
) {
  return {
    organization: new EntityCrudService(repositories.organization, eventPublisher, 'organization', false),
    branch: new EntityCrudService(repositories.branch, eventPublisher, 'branch', true),
    department: new EntityCrudService(repositories.department, eventPublisher, 'department', true),
    employee: new EntityCrudService(repositories.employee, eventPublisher, 'employee', true),
    role: new EntityCrudService(repositories.role, eventPublisher, 'role', true),
    permission: new EntityCrudService(repositories.permission, eventPublisher, 'permission', true),
    customer: new EntityCrudService(repositories.customer, eventPublisher, 'customer', true),
    supplier: new EntityCrudService(repositories.supplier, eventPublisher, 'supplier', true),
    product: new EntityCrudService(repositories.product, eventPublisher, 'product', true),
    service: new EntityCrudService(repositories.service, eventPublisher, 'service', true),
    machine: new EntityCrudService(repositories.machine, eventPublisher, 'machine', true),
    project: new EntityCrudService(repositories.project, eventPublisher, 'project', true),
    quotation: new EntityCrudService(repositories.quotation, eventPublisher, 'quotation', true),
    order: new EntityCrudService(repositories.order, eventPublisher, 'order', true),
    invoice: new EntityCrudService(repositories.invoice, eventPublisher, 'invoice', true),
    workflow: new EntityCrudService(repositories.workflow, eventPublisher, 'workflow', true),
    policy: new EntityCrudService(repositories.policy, eventPublisher, 'policy', true),
    kpi: new EntityCrudService(repositories.kpi, eventPublisher, 'kpi', true),
    asset: new EntityCrudService(repositories.asset, eventPublisher, 'asset', true),
    agent: new EntityCrudService(repositories.agent, eventPublisher, 'agent', true),
  };
}

export type ApplicationServices = ReturnType<typeof createApplicationServices>;
