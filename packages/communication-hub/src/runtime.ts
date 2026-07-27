/**
 * Communication Runtime — the package's composition root. Wires every
 * real in-memory repository and service together: the Conversation
 * Engine, Participants, Messaging (composed with the Channel Registry),
 * Attachments, the Communication Timeline, Templates, Notifications,
 * Scheduling, Workflow Integration, the Relationship Layer (the only
 * integration point with CRM Engine, Sales Engine, Marketing Engine,
 * Business DNA, Institutional Memory, Workflow Engine, and AI
 * Workforce), the query layer, and the typed event bus.
 *
 * Repositories are created here and injected into services — they are
 * never part of the returned {@link CommunicationRuntime} surface.
 *
 * @module runtime
 */
import type { WorkforceRuntime } from '@lateen-os/ai-workforce';
import type { BusinessDnaRuntime } from '@lateen-os/business-dna';
import type { CrmRuntime } from '@lateen-os/crm-engine';
import type { InstitutionalMemoryRuntime } from '@lateen-os/institutional-memory';
import type { MarketingRuntime } from '@lateen-os/marketing-engine';
import type { SalesRuntime } from '@lateen-os/sales-engine';
import type { WorkflowRuntime } from '@lateen-os/workflow-engine';
import { createAttachmentRepository, createAttachmentService, type AttachmentService } from './attachment/index.js';
import { createChannelRegistry, type ChannelSendFunctions } from './channel/index.js';
import { createConversationLifecycle, createConversationRepository, type ConversationLifecycle } from './conversation/index.js';
import { createCommunicationEventBus, type CommunicationEventBus } from './events/index.js';
import { createMessageLifecycle, createMessageRepository, type MessageLifecycle } from './message/index.js';
import { createNotificationRepository, createNotificationService, type NotificationService } from './notification/index.js';
import { createParticipantRepository, createParticipantService, type ParticipantService } from './participant/index.js';
import { createCommunicationQueries, type CommunicationQueries } from './queries/index.js';
import {
  createRelationshipManagement,
  type RelationshipManagement,
  type RelationshipManagementDeps,
} from './relationship-management/index.js';
import { createScheduledItemRepository, createSchedulingService, type SchedulingService } from './scheduling/index.js';
import { nowIso } from './shared/id.js';
import { createTemplateEngine, createTemplateRepository, createTemplateVersionRepository, type TemplateEngine } from './template/index.js';
import { createTimelineService, type TimelineDeps, type TimelineService } from './timeline/index.js';
import {
  createWorkflowIntegrationService,
  createWorkflowRequestRepository,
  type WorkflowIntegrationDeps,
  type WorkflowIntegrationService,
} from './workflow-integration/index.js';

export interface CommunicationRuntimeDeps {
  readonly eventBus?: CommunicationEventBus;
  readonly now?: () => string;
  readonly channels?: ChannelSendFunctions;
  readonly crm?: Pick<CrmRuntime, 'customers' | 'queries'>;
  readonly sales?: Pick<SalesRuntime, 'opportunities' | 'queries'>;
  readonly marketing?: Pick<MarketingRuntime, 'campaigns' | 'queries'>;
  readonly businessDna?: Pick<BusinessDnaRuntime, 'businessProfile'>;
  readonly institutionalMemory?: Pick<InstitutionalMemoryRuntime, 'lifecycle'>;
  readonly workflow?: Pick<WorkflowRuntime, 'queries' | 'defineWorkflow' | 'startWorkflow'>;
  readonly aiWorkforce?: Pick<WorkforceRuntime, 'lifecycle'>;
}

export interface CommunicationRuntime {
  readonly conversations: ConversationLifecycle;
  readonly participants: ParticipantService;
  readonly messages: MessageLifecycle;
  readonly attachments: AttachmentService;
  readonly templates: TemplateEngine;
  readonly notifications: NotificationService;
  readonly scheduling: SchedulingService;
  readonly workflows: WorkflowIntegrationService;
  readonly relationships: RelationshipManagement;
  readonly timeline: TimelineService;
  readonly queries: CommunicationQueries;
  /** Typed event bus — subscribe to conversation/participant/message/notification events. */
  readonly events: CommunicationEventBus;
}

/** Creates a real, in-memory {@link CommunicationRuntime}. */
export function createCommunicationRuntime(deps: CommunicationRuntimeDeps = {}): CommunicationRuntime {
  const now = deps.now ?? nowIso;
  const eventBus = deps.eventBus ?? createCommunicationEventBus();

  const conversationRepository = createConversationRepository();
  const participantRepository = createParticipantRepository();
  const messageRepository = createMessageRepository();
  const attachmentRepository = createAttachmentRepository();
  const templateRepository = createTemplateRepository();
  const templateVersionRepository = createTemplateVersionRepository();
  const notificationRepository = createNotificationRepository();
  const scheduledItemRepository = createScheduledItemRepository();
  const workflowRequestRepository = createWorkflowRequestRepository();

  const channels = createChannelRegistry(deps.channels);

  const conversations = createConversationLifecycle(conversationRepository, eventBus, now);
  const participants = createParticipantService(participantRepository, eventBus, now);
  const messages = createMessageLifecycle(messageRepository, channels, eventBus, now);
  const attachments = createAttachmentService(attachmentRepository, now);
  const templates = createTemplateEngine(templateRepository, templateVersionRepository, now);
  const notifications = createNotificationService(notificationRepository, eventBus, now);
  const scheduling = createSchedulingService(scheduledItemRepository, messages, notifications, now);
  const workflows = createWorkflowIntegrationService(workflowRequestRepository, { workflow: deps.workflow }, eventBus, now);

  const relationships = createRelationshipManagement({
    crm: deps.crm,
    sales: deps.sales,
    marketing: deps.marketing,
    businessDna: deps.businessDna,
    institutionalMemory: deps.institutionalMemory,
    workflow: deps.workflow,
    aiWorkforce: deps.aiWorkforce,
  } satisfies RelationshipManagementDeps);

  const timelineDeps: TimelineDeps = { crm: deps.crm, sales: deps.sales, marketing: deps.marketing, workflow: deps.workflow };
  const timeline = createTimelineService(messageRepository, timelineDeps);

  const queries = createCommunicationQueries({
    conversationRepository,
    messageRepository,
    participantRepository,
    templateRepository,
    notificationRepository,
    scheduledItemRepository,
    timelineService: timeline,
  });

  return {
    conversations,
    participants,
    messages,
    attachments,
    templates,
    notifications,
    scheduling,
    workflows,
    relationships,
    timeline,
    queries,
    events: eventBus,
  };
}
