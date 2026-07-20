import { randomUUID } from 'node:crypto';
import type { Capability } from '@lateen-os/capability-engine';
import type { Machine, Product } from '@lateen-os/business-dna';
import type { CapabilityId, OrganizationId } from '../../domain/identifiers.js';
import type { CapabilityEnginePort } from '../../ports/outbound/capability-engine-port.js';
import type { BusinessDnaPort } from '../../ports/outbound/business-dna-port.js';
import type { CacheStore } from '../cache/redis-cache.js';

function deriveCapabilities(
  organizationId: OrganizationId,
  products: readonly Product[],
  machines: readonly Machine[],
): Capability[] {
  const now = new Date().toISOString();
  const capabilities = new Map<string, Capability>();

  for (const product of products) {
    const id = `cap-product-${product.code}` as CapabilityId;
    capabilities.set(id as string, {
      id,
      organizationId,
      code: `CAP-${product.code}`,
      name: `${product.name} Production`,
      description: `Derived from product ${product.code}`,
      category: product.category === 'signage' ? 'printing' : 'assembly',
      status: 'active',
      tags: [product.category, product.productionType],
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
  }

  for (const machine of machines) {
    const id = `cap-machine-${machine.code}` as CapabilityId;
    capabilities.set(id as string, {
      id,
      organizationId,
      code: `CAP-${machine.code}`,
      name: `${machine.name} Operation`,
      description: `Derived from machine ${machine.code}`,
      category: machine.category === 'print' ? 'cutting' : 'finishing',
      status: 'active',
      tags: [machine.type, machine.category],
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
  }

  if (capabilities.size === 0) {
    const fallbackId = randomUUID() as CapabilityId;
    capabilities.set(fallbackId as string, {
      id: fallbackId,
      organizationId,
      code: 'CAP-GENERAL',
      name: 'General Manufacturing',
      category: 'assembly',
      status: 'active',
      tags: ['general'],
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
  }

  return [...capabilities.values()];
}

export class BusinessDnaCapabilityEngineClient implements CapabilityEnginePort {
  constructor(
    private readonly businessDna: BusinessDnaPort,
    private readonly cache: CacheStore,
  ) {}

  private async loadCapabilities(organizationId: OrganizationId): Promise<Capability[]> {
    const cacheKey = `capabilities:${organizationId}`;
    const cached = await this.cache.get<Capability[]>(cacheKey);
    if (cached) return cached;

    const [products, machines] = await Promise.all([
      this.businessDna.listProducts(organizationId),
      this.businessDna.listMachines(organizationId),
    ]);
    const capabilities = deriveCapabilities(organizationId, products, machines);
    await this.cache.set(cacheKey, capabilities);
    return capabilities;
  }

  async listCapabilities(organizationId: OrganizationId): Promise<readonly Capability[]> {
    return this.loadCapabilities(organizationId);
  }

  async getCapability(organizationId: OrganizationId, capabilityId: CapabilityId): Promise<Capability | null> {
    const capabilities = await this.loadCapabilities(organizationId);
    return capabilities.find((capability) => capability.id === capabilityId) ?? null;
  }

  async findCapabilitiesByTags(
    organizationId: OrganizationId,
    tags: readonly string[],
  ): Promise<readonly Capability[]> {
    const capabilities = await this.loadCapabilities(organizationId);
    return capabilities.filter((capability) =>
      tags.some((tag) => capability.tags.includes(tag as Capability['tags'][number])),
    );
  }
}
