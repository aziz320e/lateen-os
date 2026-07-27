/**
 * Real Audit Timeline engine — aggregates audit events from Security,
 * Governance, Compliance, Workflow, and Communication into one
 * chronological view. Composes the real, optional query ports of every
 * source package (never a repository).
 *
 * @module audit-timeline/engine.impl
 */
import type { ComplianceRuntime } from '@lateen-os/ai-compliance-engine';
import type { GovernanceRuntime } from '@lateen-os/ai-governance-engine';
import type { SecurityRuntime } from '@lateen-os/ai-security-engine';
import type { CommunicationRuntime } from '@lateen-os/communication-hub';
import type { WorkflowRuntime } from '@lateen-os/workflow-engine';
import { generateId, nowIso } from '../shared/id.js';
import type { AuditTimelineEntryId, OrganizationId } from '../shared/identifiers.js';
import type { AuditTimelineRepository } from './repository.js';
import type { AuditTimelineEntry, AuditTimelineSource } from './types.js';

export interface AuditTimelineDeps {
  readonly aiSecurity?: Pick<SecurityRuntime, 'queries'>;
  readonly aiGovernance?: Pick<GovernanceRuntime, 'queries'>;
  readonly aiCompliance?: Pick<ComplianceRuntime, 'queries'>;
  readonly workflow?: Pick<WorkflowRuntime, 'queries'>;
  readonly communicationHub?: Pick<CommunicationRuntime, 'queries'>;
}

export interface AuditTimelineEngine {
  aggregateTimeline(organizationId: OrganizationId): Promise<readonly AuditTimelineEntry[]>;
  get(organizationId: OrganizationId, entryId: AuditTimelineEntryId): Promise<AuditTimelineEntry | null>;
  list(organizationId: OrganizationId): Promise<readonly AuditTimelineEntry[]>;
  findBySource(organizationId: OrganizationId, source: AuditTimelineSource): Promise<readonly AuditTimelineEntry[]>;
}

/** Creates a real {@link AuditTimelineEngine} over the optional Security/Governance/Compliance/Workflow/Communication collaborators. */
export function createAuditTimelineEngine(
  repository: AuditTimelineRepository,
  deps: AuditTimelineDeps = {},
  now: () => string = nowIso,
): AuditTimelineEngine {
  async function record(organizationId: OrganizationId, source: AuditTimelineSource, label: string, occurredAt: string, referenceId: string): Promise<AuditTimelineEntry> {
    const timestamp = now();
    const entry: AuditTimelineEntry = {
      id: generateId('audit-timeline-entry'),
      organizationId,
      createdAt: timestamp,
      updatedAt: timestamp,
      source,
      label,
      occurredAt,
      referenceId,
    };
    await repository.save(entry);
    return entry;
  }

  return {
    async aggregateTimeline(organizationId) {
      const entries: AuditTimelineEntry[] = [];

      if (deps.aiSecurity) {
        const { violations } = await deps.aiSecurity.queries.findViolations({ organizationId });
        for (const violation of violations) {
          entries.push(await record(organizationId, 'security', `${violation.category}: ${violation.action} (${violation.outcome})`, violation.occurredAt, violation.id));
        }
      }

      if (deps.aiGovernance) {
        const { events } = await deps.aiGovernance.queries.findGovernanceEvents({ organizationId });
        for (const event of events) {
          entries.push(await record(organizationId, 'governance', `${event.decisionType}: ${event.outcome}`, event.occurredAt, event.id));
        }
      }

      if (deps.aiCompliance) {
        const { audits } = await deps.aiCompliance.queries.findAudits({ organizationId });
        for (const audit of audits) {
          entries.push(await record(organizationId, 'compliance', `${audit.title} (${audit.status})`, audit.completedAt ?? audit.startedAt ?? audit.createdAt, audit.id));
        }
      }

      if (deps.workflow) {
        const { instances } = await deps.workflow.queries.findRunningWorkflows({ organizationId });
        for (const instance of instances) {
          entries.push(await record(organizationId, 'workflow', `Workflow instance ${instance.status}`, instance.completedAt ?? instance.startedAt, instance.id));
        }
      }

      if (deps.communicationHub) {
        const { entries: timelineEntries } = await deps.communicationHub.queries.findTimeline({ organizationId });
        for (const timelineEntry of timelineEntries) {
          entries.push(await record(organizationId, 'communication', timelineEntry.label, timelineEntry.occurredAt, timelineEntry.referenceId));
        }
      }

      return [...entries].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    },

    async get(organizationId, entryId) {
      return repository.findById(organizationId, entryId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },

    async findBySource(organizationId, source) {
      return repository.findBySource(organizationId, source);
    },
  };
}
