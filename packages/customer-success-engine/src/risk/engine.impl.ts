/**
 * Real Customer Risks engine — a risk register with deterministic
 * probability × impact scoring (never a model-based prediction), a
 * guarded status lifecycle, and mitigation tracking.
 *
 * @module risk/engine.impl
 */
import type { CustomerSuccessEventBus } from '../events/customer-success-event-bus.js';
import { CustomerRiskNotFoundError, InvalidCustomerRiskTransitionError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { CustomerRiskId, OrganizationId } from '../shared/identifiers.js';
import type { CustomerRiskRepository } from './repository.js';
import type { CustomerRisk, CustomerRiskLevel, CustomerRiskStatus } from './types.js';

const CUSTOMER_RISK_TRANSITIONS: Readonly<Record<CustomerRiskStatus, readonly CustomerRiskStatus[]>> = {
  identified: ['mitigating', 'accepted', 'occurred'],
  mitigating: ['resolved', 'occurred'],
  resolved: [],
  accepted: ['occurred'],
  occurred: [],
};

/** Whether a customer risk may transition from one status to another. */
export function canTransitionCustomerRisk(from: CustomerRiskStatus, to: CustomerRiskStatus): boolean {
  return CUSTOMER_RISK_TRANSITIONS[from].includes(to);
}

/** `probability * impact` — a fixed, deterministic 1–25 score. */
export function computeCustomerRiskScore(probability: number, impact: number): number {
  return probability * impact;
}

/** Deterministic banding of a risk score into a qualitative level. */
export function computeCustomerRiskLevel(score: number): CustomerRiskLevel {
  if (score <= 5) return 'low';
  if (score <= 12) return 'medium';
  if (score <= 20) return 'high';
  return 'critical';
}

export interface CreateCustomerRiskInput {
  readonly customerId: string;
  readonly title: string;
  readonly description?: string;
  readonly probability: number;
  readonly impact: number;
  readonly mitigation?: string;
}

export interface UpdateCustomerRiskInput {
  readonly title?: string;
  readonly description?: string;
  readonly probability?: number;
  readonly impact?: number;
  readonly mitigation?: string;
}

export interface CustomerRiskEngine {
  create(organizationId: OrganizationId, input: CreateCustomerRiskInput): Promise<CustomerRisk>;
  update(organizationId: OrganizationId, riskId: CustomerRiskId, input: UpdateCustomerRiskInput): Promise<CustomerRisk>;
  startMitigation(organizationId: OrganizationId, riskId: CustomerRiskId): Promise<CustomerRisk>;
  resolve(organizationId: OrganizationId, riskId: CustomerRiskId): Promise<CustomerRisk>;
  accept(organizationId: OrganizationId, riskId: CustomerRiskId): Promise<CustomerRisk>;
  markOccurred(organizationId: OrganizationId, riskId: CustomerRiskId): Promise<CustomerRisk>;
  get(organizationId: OrganizationId, riskId: CustomerRiskId): Promise<CustomerRisk | null>;
  list(organizationId: OrganizationId): Promise<readonly CustomerRisk[]>;
  findByCustomer(organizationId: OrganizationId, customerId: string): Promise<readonly CustomerRisk[]>;
  findByStatus(organizationId: OrganizationId, status: CustomerRiskStatus): Promise<readonly CustomerRisk[]>;
}

/** Creates a real {@link CustomerRiskEngine}. */
export function createCustomerRiskEngine(
  repository: CustomerRiskRepository,
  eventBus?: CustomerSuccessEventBus,
  now: () => string = nowIso,
): CustomerRiskEngine {
  async function requireRisk(organizationId: OrganizationId, riskId: CustomerRiskId): Promise<CustomerRisk> {
    const risk = await repository.findById(organizationId, riskId);
    if (!risk) throw new CustomerRiskNotFoundError(riskId);
    return risk;
  }

  async function transition(organizationId: OrganizationId, riskId: CustomerRiskId, to: CustomerRiskStatus): Promise<CustomerRisk> {
    const risk = await requireRisk(organizationId, riskId);
    if (!canTransitionCustomerRisk(risk.status, to)) {
      throw new InvalidCustomerRiskTransitionError(riskId, risk.status, to);
    }
    const updated: CustomerRisk = { ...risk, status: to, updatedAt: now() };
    await repository.save(updated);
    return updated;
  }

  return {
    async create(organizationId, input) {
      const timestamp = now();
      const risk: CustomerRisk = {
        id: generateId('customer-risk'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        customerId: input.customerId,
        title: input.title,
        description: input.description,
        probability: input.probability,
        impact: input.impact,
        score: computeCustomerRiskScore(input.probability, input.impact),
        mitigation: input.mitigation,
        status: 'identified',
      };
      await repository.save(risk);
      eventBus?.publish('risk.detected', { organizationId, riskId: risk.id, customerId: risk.customerId, score: risk.score });
      return risk;
    },

    async update(organizationId, riskId, input) {
      const risk = await requireRisk(organizationId, riskId);
      const probability = input.probability ?? risk.probability;
      const impact = input.impact ?? risk.impact;
      const updated: CustomerRisk = {
        ...risk,
        title: input.title ?? risk.title,
        description: input.description ?? risk.description,
        probability,
        impact,
        score: computeCustomerRiskScore(probability, impact),
        mitigation: input.mitigation ?? risk.mitigation,
        updatedAt: now(),
      };
      await repository.save(updated);
      return updated;
    },

    async startMitigation(organizationId, riskId) {
      return transition(organizationId, riskId, 'mitigating');
    },

    async resolve(organizationId, riskId) {
      return transition(organizationId, riskId, 'resolved');
    },

    async accept(organizationId, riskId) {
      return transition(organizationId, riskId, 'accepted');
    },

    async markOccurred(organizationId, riskId) {
      return transition(organizationId, riskId, 'occurred');
    },

    async get(organizationId, riskId) {
      return repository.findById(organizationId, riskId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },

    async findByCustomer(organizationId, customerId) {
      return repository.findByCustomer(organizationId, customerId);
    },

    async findByStatus(organizationId, status) {
      return repository.findByStatus(organizationId, status);
    },
  };
}
