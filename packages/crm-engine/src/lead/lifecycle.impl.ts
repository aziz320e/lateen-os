/**
 * Real Lead Management — create / qualify / convert / reject / reopen.
 * `convert()` composes the real {@link CustomerLifecycle} rather than
 * duplicating customer-creation logic.
 *
 * @module lead/lifecycle.impl
 */
import type { CustomerLifecycle } from '../customer/lifecycle.impl.js';
import type { Customer } from '../customer/types.js';
import type { CrmEventBus } from '../events/crm-event-bus.js';
import { InvalidLeadTransitionError, LeadNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { LeadId, OrganizationId } from '../shared/identifiers.js';
import type { CrmTag, Email, Phone } from '../shared/primitives.js';
import type { LeadRepository } from './repository.js';
import type { Lead, LeadStatus } from './types.js';

const LEAD_TRANSITIONS: Readonly<Record<LeadStatus, readonly LeadStatus[]>> = {
  new: ['qualified', 'rejected'],
  qualified: ['converted', 'rejected'],
  rejected: ['new'],
  converted: [],
};

export function canTransitionLead(from: LeadStatus, to: LeadStatus): boolean {
  return LEAD_TRANSITIONS[from].includes(to);
}

export interface CreateLeadInput {
  readonly name: string;
  readonly email?: Email;
  readonly phone?: Phone;
  readonly company?: string;
  readonly source?: string;
  readonly tags?: readonly CrmTag[];
}

export interface ConvertLeadInput {
  readonly name?: string;
  readonly email?: Email;
  readonly phone?: Phone;
  readonly company?: string;
  readonly tags?: readonly CrmTag[];
}

export interface ConvertLeadResult {
  readonly lead: Lead;
  readonly customer: Customer;
}

export interface LeadLifecycle {
  create(organizationId: OrganizationId, input: CreateLeadInput): Promise<Lead>;
  qualify(organizationId: OrganizationId, leadId: LeadId): Promise<Lead>;
  convert(organizationId: OrganizationId, leadId: LeadId, patch?: ConvertLeadInput): Promise<ConvertLeadResult>;
  reject(organizationId: OrganizationId, leadId: LeadId, reason?: string): Promise<Lead>;
  reopen(organizationId: OrganizationId, leadId: LeadId): Promise<Lead>;
  transition(organizationId: OrganizationId, leadId: LeadId, to: LeadStatus): Promise<Lead>;
  get(organizationId: OrganizationId, leadId: LeadId): Promise<Lead | null>;
}

/** Creates a real {@link LeadLifecycle} backed by a {@link LeadRepository} and the real {@link CustomerLifecycle}. */
export function createLeadLifecycle(
  repository: LeadRepository,
  customerLifecycle: CustomerLifecycle,
  eventBus?: CrmEventBus,
  now: () => string = nowIso,
): LeadLifecycle {
  async function requireLead(organizationId: OrganizationId, leadId: LeadId): Promise<Lead> {
    const lead = await repository.findById(organizationId, leadId);
    if (!lead) throw new LeadNotFoundError(leadId);
    return lead;
  }

  async function transition(organizationId: OrganizationId, leadId: LeadId, to: LeadStatus): Promise<Lead> {
    const lead = await requireLead(organizationId, leadId);
    if (!canTransitionLead(lead.status, to)) {
      throw new InvalidLeadTransitionError(leadId, lead.status, to);
    }
    const updated: Lead = { ...lead, status: to, updatedAt: now() };
    await repository.save(updated);
    return updated;
  }

  return {
    async create(organizationId, input) {
      const timestamp = now();
      const lead: Lead = {
        id: generateId('lead'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        name: input.name,
        email: input.email,
        phone: input.phone,
        company: input.company,
        source: input.source,
        status: 'new',
        tags: input.tags ?? [],
      };
      await repository.save(lead);
      eventBus?.publish('lead.created', { leadId: lead.id, organizationId, name: lead.name });
      return lead;
    },

    async qualify(organizationId, leadId) {
      const qualified = await transition(organizationId, leadId, 'qualified');
      eventBus?.publish('lead.qualified', { leadId, organizationId });
      return qualified;
    },

    async convert(organizationId, leadId, patch) {
      const lead = await requireLead(organizationId, leadId);
      if (!canTransitionLead(lead.status, 'converted')) {
        throw new InvalidLeadTransitionError(leadId, lead.status, 'converted');
      }

      const customer = await customerLifecycle.create(organizationId, {
        name: patch?.name ?? lead.name,
        email: patch?.email ?? lead.email,
        phone: patch?.phone ?? lead.phone,
        company: patch?.company ?? lead.company,
        tags: patch?.tags ?? lead.tags,
        sourceLeadId: leadId,
      });

      const convertedLead: Lead = { ...lead, status: 'converted', convertedCustomerId: customer.id, updatedAt: now() };
      await repository.save(convertedLead);
      eventBus?.publish('lead.converted', { leadId, organizationId, customerId: customer.id });
      return { lead: convertedLead, customer };
    },

    async reject(organizationId, leadId, reason) {
      const lead = await requireLead(organizationId, leadId);
      if (!canTransitionLead(lead.status, 'rejected')) {
        throw new InvalidLeadTransitionError(leadId, lead.status, 'rejected');
      }
      const updated: Lead = { ...lead, status: 'rejected', rejectionReason: reason, updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async reopen(organizationId, leadId) {
      return transition(organizationId, leadId, 'new');
    },

    transition,

    async get(organizationId, leadId) {
      return repository.findById(organizationId, leadId);
    },
  };
}
