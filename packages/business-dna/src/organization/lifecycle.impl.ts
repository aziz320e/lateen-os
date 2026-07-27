/**
 * Real Organization Lifecycle — the tenant root aggregate's guarded state
 * machine. Governs create / update / archive / restore, plus activate /
 * suspend to keep every {@link OrganizationStatus} reachable.
 *
 * @module organization/lifecycle.impl
 */
import type { BusinessDnaEventBus } from '../events/business-dna-event-bus.js';
import { InvalidOrganizationTransitionError, OrganizationCodeConflictError, OrganizationNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { BusinessCode, CurrencyCode, ISODate, LocaleCode, Timezone } from '../shared/primitives.js';
import type { OrganizationRepository } from './repository.js';
import type {
  IndustryVertical,
  Organization,
  OrganizationStatus,
  ProductionModel,
  ServiceCoverage,
  SlaTier,
} from './types.js';

const ORGANIZATION_TRANSITIONS: Readonly<Record<OrganizationStatus, readonly OrganizationStatus[]>> = {
  draft: ['active', 'archived'],
  active: ['suspended', 'archived'],
  suspended: ['active', 'archived'],
  archived: ['active'],
};

export function canTransitionOrganization(from: OrganizationStatus, to: OrganizationStatus): boolean {
  return ORGANIZATION_TRANSITIONS[from].includes(to);
}

export interface CreateOrganizationInput {
  readonly code: BusinessCode;
  readonly name: string;
  readonly legalName: string;
  readonly registrationNumber: string;
  readonly taxId: string;
  readonly domain?: string;
  readonly defaultCurrency: CurrencyCode;
  readonly defaultLocale: LocaleCode;
  readonly timezone: Timezone;
  readonly foundedAt?: ISODate;
  readonly industryVerticals?: readonly IndustryVertical[];
  readonly productionModel?: ProductionModel;
  readonly serviceCoverage?: ServiceCoverage;
  readonly proactiveAiEnabled?: boolean;
  readonly defaultSlaTier?: SlaTier;
}

export interface UpdateOrganizationInput {
  readonly name?: string;
  readonly legalName?: string;
  readonly domain?: string;
  readonly defaultCurrency?: CurrencyCode;
  readonly defaultLocale?: LocaleCode;
  readonly timezone?: Timezone;
  readonly industryVerticals?: readonly IndustryVertical[];
  readonly productionModel?: ProductionModel;
  readonly serviceCoverage?: ServiceCoverage;
  readonly proactiveAiEnabled?: boolean;
  readonly defaultSlaTier?: SlaTier;
}

export interface OrganizationLifecycle {
  create(input: CreateOrganizationInput): Promise<Organization>;
  update(organizationId: OrganizationId, patch: UpdateOrganizationInput): Promise<Organization>;
  archive(organizationId: OrganizationId): Promise<Organization>;
  restore(organizationId: OrganizationId): Promise<Organization>;
  activate(organizationId: OrganizationId): Promise<Organization>;
  suspend(organizationId: OrganizationId): Promise<Organization>;
  transition(organizationId: OrganizationId, to: OrganizationStatus): Promise<Organization>;
  get(organizationId: OrganizationId): Promise<Organization | null>;
}

/** Creates a real {@link OrganizationLifecycle} backed by an {@link OrganizationRepository}. */
export function createOrganizationLifecycle(
  repository: OrganizationRepository,
  eventBus?: BusinessDnaEventBus,
  now: () => string = nowIso,
): OrganizationLifecycle {
  async function requireOrganization(organizationId: OrganizationId): Promise<Organization> {
    const organization = await repository.findById(organizationId, organizationId);
    if (!organization) throw new OrganizationNotFoundError(organizationId);
    return organization;
  }

  async function transition(organizationId: OrganizationId, to: OrganizationStatus): Promise<Organization> {
    const organization = await requireOrganization(organizationId);
    if (!canTransitionOrganization(organization.status, to)) {
      throw new InvalidOrganizationTransitionError(organizationId, organization.status, to);
    }
    const updated: Organization = { ...organization, status: to, updatedAt: now() };
    await repository.save(updated);
    return updated;
  }

  return {
    async create(input) {
      const existing = await repository.findByCode(input.code);
      if (existing) throw new OrganizationCodeConflictError(input.code);

      const timestamp = now();
      const organization: Organization = {
        id: generateId('org'),
        createdAt: timestamp,
        updatedAt: timestamp,
        code: input.code,
        name: input.name,
        legalName: input.legalName,
        registrationNumber: input.registrationNumber,
        taxId: input.taxId,
        domain: input.domain,
        status: 'draft',
        defaultCurrency: input.defaultCurrency,
        defaultLocale: input.defaultLocale,
        timezone: input.timezone,
        foundedAt: input.foundedAt,
        operatingModel: 'ai_first',
        proactiveAiEnabled: input.proactiveAiEnabled ?? false,
        industryVerticals: input.industryVerticals ?? [],
        productionModel: input.productionModel ?? 'make_to_order',
        serviceCoverage: input.serviceCoverage ?? 'local',
        defaultSlaTier: input.defaultSlaTier,
      };
      await repository.save(organization);
      eventBus?.publish('organization.created', { code: organization.code, name: organization.name });
      return organization;
    },

    async update(organizationId, patch) {
      const organization = await requireOrganization(organizationId);
      if (organization.status === 'archived') {
        throw new InvalidOrganizationTransitionError(organizationId, organization.status, 'updated');
      }
      const updated: Organization = { ...organization, ...patch, updatedAt: now() };
      await repository.save(updated);
      eventBus?.publish('organization.updated', { organizationId });
      return updated;
    },

    async archive(organizationId) {
      const archived = await transition(organizationId, 'archived');
      eventBus?.publish('organization.archived', { organizationId });
      return archived;
    },

    async restore(organizationId) {
      const organization = await requireOrganization(organizationId);
      if (organization.status !== 'archived') {
        throw new InvalidOrganizationTransitionError(organizationId, organization.status, 'active');
      }
      const restored = await transition(organizationId, 'active');
      eventBus?.publish('organization.restored', { organizationId });
      return restored;
    },

    async activate(organizationId) {
      const organization = await requireOrganization(organizationId);
      if (organization.status !== 'draft' && organization.status !== 'suspended') {
        throw new InvalidOrganizationTransitionError(organizationId, organization.status, 'active');
      }
      const activated = await transition(organizationId, 'active');
      eventBus?.publish('organization.activated', { organizationId });
      return activated;
    },

    async suspend(organizationId) {
      const organization = await requireOrganization(organizationId);
      if (organization.status !== 'active') {
        throw new InvalidOrganizationTransitionError(organizationId, organization.status, 'suspended');
      }
      const suspended = await transition(organizationId, 'suspended');
      eventBus?.publish('organization.suspended', { organizationId });
      return suspended;
    },

    transition,

    async get(organizationId) {
      return repository.findById(organizationId, organizationId);
    },
  };
}
