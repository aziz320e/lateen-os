/**
 * Real Project Risks engine — a risk register with deterministic
 * probability × impact scoring (never a model-based prediction), a
 * guarded status lifecycle, and mitigation tracking.
 *
 * @module risk/engine.impl
 */
import type { ProjectId } from '../project/types.js';
import type { ProjectEventBus } from '../events/project-event-bus.js';
import { InvalidRiskTransitionError, ProjectRiskNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, ProjectRiskId } from '../shared/identifiers.js';
import type { ProjectRiskRepository } from './repository.js';
import type { ProjectRisk, RiskLevel, RiskStatus } from './types.js';

const RISK_TRANSITIONS: Readonly<Record<RiskStatus, readonly RiskStatus[]>> = {
  identified: ['mitigating', 'accepted', 'occurred'],
  mitigating: ['resolved', 'occurred'],
  resolved: [],
  accepted: ['occurred'],
  occurred: [],
};

/** Whether a risk may transition from one status to another. */
export function canTransitionRisk(from: RiskStatus, to: RiskStatus): boolean {
  return RISK_TRANSITIONS[from].includes(to);
}

/** `probability * impact` — a fixed, deterministic 1–25 score. */
export function computeRiskScore(probability: number, impact: number): number {
  return probability * impact;
}

/** Deterministic banding of a risk score into a qualitative level. */
export function computeRiskLevel(score: number): RiskLevel {
  if (score <= 5) return 'low';
  if (score <= 12) return 'medium';
  if (score <= 20) return 'high';
  return 'critical';
}

export interface CreateProjectRiskInput {
  readonly projectId: ProjectId;
  readonly title: string;
  readonly description?: string;
  readonly probability: number;
  readonly impact: number;
  readonly mitigation?: string;
}

export interface UpdateProjectRiskInput {
  readonly title?: string;
  readonly description?: string;
  readonly probability?: number;
  readonly impact?: number;
  readonly mitigation?: string;
}

export interface ProjectRiskEngine {
  create(organizationId: OrganizationId, input: CreateProjectRiskInput): Promise<ProjectRisk>;
  update(organizationId: OrganizationId, riskId: ProjectRiskId, input: UpdateProjectRiskInput): Promise<ProjectRisk>;
  startMitigation(organizationId: OrganizationId, riskId: ProjectRiskId): Promise<ProjectRisk>;
  resolve(organizationId: OrganizationId, riskId: ProjectRiskId): Promise<ProjectRisk>;
  accept(organizationId: OrganizationId, riskId: ProjectRiskId): Promise<ProjectRisk>;
  markOccurred(organizationId: OrganizationId, riskId: ProjectRiskId): Promise<ProjectRisk>;
  get(organizationId: OrganizationId, riskId: ProjectRiskId): Promise<ProjectRisk | null>;
  list(organizationId: OrganizationId): Promise<readonly ProjectRisk[]>;
  findByProject(organizationId: OrganizationId, projectId: ProjectId): Promise<readonly ProjectRisk[]>;
  findByStatus(organizationId: OrganizationId, status: RiskStatus): Promise<readonly ProjectRisk[]>;
}

/** Creates a real {@link ProjectRiskEngine}. */
export function createProjectRiskEngine(
  repository: ProjectRiskRepository,
  eventBus?: ProjectEventBus,
  now: () => string = nowIso,
): ProjectRiskEngine {
  async function requireRisk(organizationId: OrganizationId, riskId: ProjectRiskId): Promise<ProjectRisk> {
    const risk = await repository.findById(organizationId, riskId);
    if (!risk) throw new ProjectRiskNotFoundError(riskId);
    return risk;
  }

  async function transition(organizationId: OrganizationId, riskId: ProjectRiskId, to: RiskStatus): Promise<ProjectRisk> {
    const risk = await requireRisk(organizationId, riskId);
    if (!canTransitionRisk(risk.status, to)) {
      throw new InvalidRiskTransitionError(riskId, risk.status, to);
    }
    const updated: ProjectRisk = { ...risk, status: to, updatedAt: now() };
    await repository.save(updated);
    return updated;
  }

  return {
    async create(organizationId, input) {
      const timestamp = now();
      const risk: ProjectRisk = {
        id: generateId('project-risk'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        projectId: input.projectId,
        title: input.title,
        description: input.description,
        probability: input.probability,
        impact: input.impact,
        score: computeRiskScore(input.probability, input.impact),
        mitigation: input.mitigation,
        status: 'identified',
      };
      await repository.save(risk);
      eventBus?.publish('risk.created', { organizationId, riskId: risk.id, projectId: risk.projectId, score: risk.score });
      return risk;
    },

    async update(organizationId, riskId, input) {
      const risk = await requireRisk(organizationId, riskId);
      const probability = input.probability ?? risk.probability;
      const impact = input.impact ?? risk.impact;
      const updated: ProjectRisk = {
        ...risk,
        title: input.title ?? risk.title,
        description: input.description ?? risk.description,
        probability,
        impact,
        score: computeRiskScore(probability, impact),
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

    async findByProject(organizationId, projectId) {
      return repository.findByProject(organizationId, projectId);
    },

    async findByStatus(organizationId, status) {
      return repository.findByStatus(organizationId, status);
    },
  };
}
