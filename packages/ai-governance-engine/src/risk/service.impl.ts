/**
 * Real Risk Governance service — a risk register with risk levels,
 * mitigation plans, acceptance, and escalation.
 *
 * @module risk/service.impl
 */
import type { GovernanceEventBus } from '../events/governance-event-bus.js';
import { InvalidRiskTransitionError, RiskNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, RiskId } from '../shared/identifiers.js';
import type { RiskRepository } from './repository.js';
import type { Risk, RiskLevel, RiskStatus } from './types.js';

const RISK_TRANSITIONS: Readonly<Record<RiskStatus, readonly RiskStatus[]>> = {
  open: ['mitigating', 'accepted', 'escalated', 'closed'],
  mitigating: ['accepted', 'escalated', 'closed'],
  accepted: ['escalated', 'closed'],
  escalated: ['mitigating', 'closed'],
  closed: [],
};

/** Whether a risk may transition from one status to another. */
export function canTransitionRisk(from: RiskStatus, to: RiskStatus): boolean {
  return RISK_TRANSITIONS[from].includes(to);
}

export interface CreateRiskInput {
  readonly title: string;
  readonly category: string;
  readonly riskLevel: RiskLevel;
  readonly description?: string;
  readonly owner?: string;
}

export interface RiskRegister {
  createRisk(organizationId: OrganizationId, input: CreateRiskInput): Promise<Risk>;
  addMitigationPlan(organizationId: OrganizationId, riskId: RiskId, plan: string): Promise<Risk>;
  accept(organizationId: OrganizationId, riskId: RiskId, acceptedBy: string): Promise<Risk>;
  escalate(organizationId: OrganizationId, riskId: RiskId): Promise<Risk>;
  close(organizationId: OrganizationId, riskId: RiskId): Promise<Risk>;
  get(organizationId: OrganizationId, riskId: RiskId): Promise<Risk | null>;
  listByLevel(organizationId: OrganizationId, riskLevel: RiskLevel): Promise<readonly Risk[]>;
  listByStatus(organizationId: OrganizationId, status: RiskStatus): Promise<readonly Risk[]>;
}

/** Creates a real {@link RiskRegister} backed by a {@link RiskRepository}. */
export function createRiskRegister(
  repository: RiskRepository,
  eventBus?: GovernanceEventBus,
  now: () => string = nowIso,
): RiskRegister {
  async function requireRisk(organizationId: OrganizationId, riskId: RiskId): Promise<Risk> {
    const risk = await repository.findById(organizationId, riskId);
    if (!risk) throw new RiskNotFoundError(riskId);
    return risk;
  }

  async function transition(organizationId: OrganizationId, riskId: RiskId, to: RiskStatus, patch: Partial<Risk> = {}): Promise<Risk> {
    const risk = await requireRisk(organizationId, riskId);
    if (!canTransitionRisk(risk.status, to)) {
      throw new InvalidRiskTransitionError(riskId, risk.status, to);
    }
    const updated: Risk = { ...risk, ...patch, status: to, updatedAt: now() };
    await repository.save(updated);
    return updated;
  }

  return {
    async createRisk(organizationId, input) {
      const timestamp = now();
      const risk: Risk = {
        id: generateId('risk'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        title: input.title,
        description: input.description,
        category: input.category,
        riskLevel: input.riskLevel,
        status: 'open',
        owner: input.owner,
      };
      await repository.save(risk);
      eventBus?.publish('risk.created', { organizationId, riskId: risk.id, riskLevel: risk.riskLevel });
      return risk;
    },

    async addMitigationPlan(organizationId, riskId, plan) {
      return transition(organizationId, riskId, 'mitigating', { mitigationPlan: plan });
    },

    async accept(organizationId, riskId, acceptedBy) {
      return transition(organizationId, riskId, 'accepted', { acceptedBy, acceptedAt: now() });
    },

    async escalate(organizationId, riskId) {
      const updated = await transition(organizationId, riskId, 'escalated');
      eventBus?.publish('risk.escalated', { organizationId, riskId });
      return updated;
    },

    async close(organizationId, riskId) {
      return transition(organizationId, riskId, 'closed');
    },

    async get(organizationId, riskId) {
      return repository.findById(organizationId, riskId);
    },

    async listByLevel(organizationId, riskLevel) {
      return repository.findByLevel(organizationId, riskLevel);
    },

    async listByStatus(organizationId, status) {
      return repository.findByStatus(organizationId, status);
    },
  };
}
