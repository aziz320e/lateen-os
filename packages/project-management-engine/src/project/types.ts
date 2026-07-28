/** @module project/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { MilestoneId, PhaseId, PortfolioId, ProgramId, ProjectId } from '../shared/identifiers.js';
import type { ISODate } from '../shared/primitives.js';

export type { MilestoneId, PhaseId, PortfolioId, ProgramId, ProjectId };

export type PortfolioStatus = 'active' | 'archived';

/** A top-level, organization-wide grouping of related programs and projects. */
export interface Portfolio extends TenantAuditableEntity<PortfolioId> {
  readonly code: string;
  readonly name: string;
  readonly description?: string;
  readonly status: PortfolioStatus;
}

export type ProgramStatus = 'active' | 'archived';

/** A group of related projects, optionally under a Portfolio. */
export interface Program extends TenantAuditableEntity<ProgramId> {
  readonly code: string;
  readonly name: string;
  readonly portfolioId?: PortfolioId;
  readonly description?: string;
  readonly status: ProgramStatus;
}

export type ProjectStatus = 'draft' | 'active' | 'on_hold' | 'completed' | 'cancelled' | 'archived';

/** The real, authoritative project aggregate — this package's own identifier namespace, never synced with Business DNA's contracts-only Project module. */
export interface Project extends TenantAuditableEntity<ProjectId> {
  readonly code: string;
  readonly name: string;
  readonly description?: string;
  readonly portfolioId?: PortfolioId;
  readonly programId?: ProgramId;
  /** Optional link to a real CRM Engine customer, resolved via the Relationship Layer. */
  readonly customerId?: string;
  /** Optional link to a real HR Engine employee acting as project manager, resolved via the Relationship Layer. */
  readonly ownerId?: string;
  readonly startDate?: ISODate;
  readonly targetEndDate?: ISODate;
  readonly actualEndDate?: ISODate;
  readonly status: ProjectStatus;
  /** Stamped on `archive()`; consumed by `restore()` to return to the correct prior status. */
  readonly statusBeforeArchive?: ProjectStatus;
  readonly currentVersion: number;
}

export type PhaseStatus = 'planned' | 'active' | 'completed';

/** An ordered stage within a project. */
export interface Phase extends TenantAuditableEntity<PhaseId> {
  readonly projectId: ProjectId;
  readonly name: string;
  readonly sequence: number;
  readonly startDate?: ISODate;
  readonly endDate?: ISODate;
  readonly status: PhaseStatus;
}

export type MilestoneStatus = 'pending' | 'reached' | 'missed';

/** A dated checkpoint within a project, optionally scoped to one phase. */
export interface Milestone extends TenantAuditableEntity<MilestoneId> {
  readonly projectId: ProjectId;
  readonly phaseId?: PhaseId;
  readonly name: string;
  readonly targetDate: ISODate;
  readonly actualDate?: ISODate;
  readonly status: MilestoneStatus;
}
