/**
 * Real Communication Timeline — a unified, deterministic view combining
 * CRM Engine activities, Sales Engine activities, Marketing Engine
 * leads, Workflow Engine instances, and this package's own Messages,
 * each reached exclusively through its public query API.
 *
 * @module timeline/engine.impl
 */
import type { MessageRepository } from '../message/repository.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { TimelineDeps, TimelineEntry } from './types.js';

export interface TimelineService {
  /** Builds the unified timeline for an organization, most recent first. Every external source is optional and skipped when not injected. */
  buildTimeline(organizationId: OrganizationId, limit?: number): Promise<readonly TimelineEntry[]>;
}

/** Creates a real {@link TimelineService} over the local Message repository and optionally-injected sibling package queries. */
export function createTimelineService(messageRepository: MessageRepository, deps: TimelineDeps = {}): TimelineService {
  return {
    async buildTimeline(organizationId, limit) {
      const entries: TimelineEntry[] = [];

      const messages = await messageRepository.findAll(organizationId);
      for (const message of messages) {
        entries.push({
          id: `message-${message.id}`,
          organizationId,
          source: 'message',
          entryType: message.messageType,
          label: message.body ?? message.messageType,
          occurredAt: message.createdAt,
          referenceId: message.id,
        });
      }

      if (deps.crm) {
        const { activities } = await deps.crm.queries.findActivities({ organizationId });
        for (const activity of activities) {
          entries.push({
            id: `crm-${activity.id}`,
            organizationId,
            source: 'crm',
            entryType: activity.activityType,
            label: activity.subject,
            occurredAt: activity.occurredAt,
            referenceId: activity.id,
          });
        }
      }

      if (deps.sales) {
        const { activities } = await deps.sales.queries.findActivities({ organizationId });
        for (const activity of activities) {
          entries.push({
            id: `sales-${activity.id}`,
            organizationId,
            source: 'sales',
            entryType: activity.activityType,
            label: activity.subject,
            occurredAt: activity.occurredAt,
            referenceId: activity.id,
          });
        }
      }

      if (deps.marketing) {
        const { leads } = await deps.marketing.queries.findLeads({ organizationId });
        for (const lead of leads) {
          entries.push({
            id: `marketing-${lead.id}`,
            organizationId,
            source: 'marketing',
            entryType: lead.source,
            label: lead.name,
            occurredAt: lead.createdAt,
            referenceId: lead.id,
          });
        }
      }

      if (deps.workflow) {
        const { instances } = await deps.workflow.queries.findRunningWorkflows({ organizationId });
        for (const instance of instances) {
          entries.push({
            id: `workflow-${instance.id}`,
            organizationId,
            source: 'workflow',
            entryType: instance.status,
            label: `Workflow instance ${instance.id}`,
            occurredAt: instance.startedAt,
            referenceId: instance.id,
          });
        }
      }

      const sorted = entries.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : a.occurredAt > b.occurredAt ? -1 : 0));
      return limit === undefined ? sorted : sorted.slice(0, limit);
    },
  };
}
