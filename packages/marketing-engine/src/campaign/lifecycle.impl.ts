/**
 * Real Campaign Lifecycle — `create / update / schedule / launch / pause
 * / resume / complete / archive`, built atop a guarded, deterministic
 * status state machine.
 *
 * @module campaign/lifecycle.impl
 */
import type { MarketingEventBus } from '../events/marketing-event-bus.js';
import { CampaignNotFoundError, InvalidCampaignTransitionError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { CampaignId, EmployeeId, OrganizationId } from '../shared/identifiers.js';
import type { CurrencyCode, ISODateTime, MarketingTag } from '../shared/primitives.js';
import type { CampaignRepository } from './repository.js';
import type { Campaign, CampaignStatus, CampaignType } from './types.js';

const CAMPAIGN_TRANSITIONS: Readonly<Record<CampaignStatus, readonly CampaignStatus[]>> = {
  draft: ['scheduled', 'active', 'archived'],
  scheduled: ['active', 'archived'],
  active: ['paused', 'completed', 'archived'],
  paused: ['active', 'completed', 'archived'],
  completed: ['archived'],
  archived: [],
};

export function canTransitionCampaign(from: CampaignStatus, to: CampaignStatus): boolean {
  return CAMPAIGN_TRANSITIONS[from].includes(to);
}

export interface CreateCampaignInput {
  readonly name: string;
  readonly campaignType: CampaignType;
  readonly ownerId?: EmployeeId;
  readonly budget?: string;
  readonly currency?: CurrencyCode;
  readonly tags?: readonly MarketingTag[];
}

export interface UpdateCampaignInput {
  readonly name?: string;
  readonly ownerId?: EmployeeId;
  readonly budget?: string;
  readonly currency?: CurrencyCode;
  readonly tags?: readonly MarketingTag[];
}

export interface ScheduleCampaignInput {
  readonly scheduledAt: ISODateTime;
  readonly endAt?: ISODateTime;
}

export interface CampaignLifecycle {
  create(organizationId: OrganizationId, input: CreateCampaignInput): Promise<Campaign>;
  update(organizationId: OrganizationId, campaignId: CampaignId, patch: UpdateCampaignInput): Promise<Campaign>;
  schedule(organizationId: OrganizationId, campaignId: CampaignId, input: ScheduleCampaignInput): Promise<Campaign>;
  launch(organizationId: OrganizationId, campaignId: CampaignId): Promise<Campaign>;
  pause(organizationId: OrganizationId, campaignId: CampaignId): Promise<Campaign>;
  resume(organizationId: OrganizationId, campaignId: CampaignId): Promise<Campaign>;
  complete(organizationId: OrganizationId, campaignId: CampaignId): Promise<Campaign>;
  archive(organizationId: OrganizationId, campaignId: CampaignId): Promise<Campaign>;
  get(organizationId: OrganizationId, campaignId: CampaignId): Promise<Campaign | null>;
}

/** Creates a real {@link CampaignLifecycle} backed by a {@link CampaignRepository}. */
export function createCampaignLifecycle(
  repository: CampaignRepository,
  eventBus?: MarketingEventBus,
  now: () => string = nowIso,
): CampaignLifecycle {
  async function requireCampaign(organizationId: OrganizationId, campaignId: CampaignId): Promise<Campaign> {
    const campaign = await repository.findById(organizationId, campaignId);
    if (!campaign) throw new CampaignNotFoundError(campaignId);
    return campaign;
  }

  async function transition(organizationId: OrganizationId, campaignId: CampaignId, to: CampaignStatus): Promise<Campaign> {
    const campaign = await requireCampaign(organizationId, campaignId);
    if (!canTransitionCampaign(campaign.status, to)) {
      throw new InvalidCampaignTransitionError(campaignId, campaign.status, to);
    }
    const updated: Campaign = { ...campaign, status: to, updatedAt: now() };
    await repository.save(updated);
    return updated;
  }

  return {
    async create(organizationId, input) {
      const timestamp = now();
      const campaign: Campaign = {
        id: generateId('campaign'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        name: input.name,
        campaignType: input.campaignType,
        status: 'draft',
        ownerId: input.ownerId,
        budget: input.budget,
        currency: input.currency,
        tags: input.tags ?? [],
      };
      await repository.save(campaign);
      eventBus?.publish('campaign.created', { campaignId: campaign.id, organizationId, name: campaign.name });
      return campaign;
    },

    async update(organizationId, campaignId, patch) {
      const campaign = await requireCampaign(organizationId, campaignId);
      if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
        throw new InvalidCampaignTransitionError(campaignId, campaign.status, 'updated');
      }
      const updated: Campaign = {
        ...campaign,
        name: patch.name ?? campaign.name,
        ownerId: patch.ownerId ?? campaign.ownerId,
        budget: patch.budget ?? campaign.budget,
        currency: patch.currency ?? campaign.currency,
        tags: patch.tags ?? campaign.tags,
        updatedAt: now(),
      };
      await repository.save(updated);
      return updated;
    },

    async schedule(organizationId, campaignId, input) {
      const campaign = await requireCampaign(organizationId, campaignId);
      if (!canTransitionCampaign(campaign.status, 'scheduled')) {
        throw new InvalidCampaignTransitionError(campaignId, campaign.status, 'scheduled');
      }
      const updated: Campaign = {
        ...campaign,
        status: 'scheduled',
        scheduledAt: input.scheduledAt,
        endAt: input.endAt,
        updatedAt: now(),
      };
      await repository.save(updated);
      return updated;
    },

    async launch(organizationId, campaignId) {
      const launched = await transition(organizationId, campaignId, 'active');
      const updated: Campaign = { ...launched, launchedAt: now() };
      await repository.save(updated);
      eventBus?.publish('campaign.launched', { campaignId, organizationId });
      return updated;
    },

    async pause(organizationId, campaignId) {
      const paused = await transition(organizationId, campaignId, 'paused');
      const updated: Campaign = { ...paused, pausedAt: now() };
      await repository.save(updated);
      eventBus?.publish('campaign.paused', { campaignId, organizationId });
      return updated;
    },

    async resume(organizationId, campaignId) {
      return transition(organizationId, campaignId, 'active');
    },

    async complete(organizationId, campaignId) {
      const completed = await transition(organizationId, campaignId, 'completed');
      const updated: Campaign = { ...completed, completedAt: now() };
      await repository.save(updated);
      eventBus?.publish('campaign.completed', { campaignId, organizationId });
      return updated;
    },

    async archive(organizationId, campaignId) {
      return transition(organizationId, campaignId, 'archived');
    },

    async get(organizationId, campaignId) {
      return repository.findById(organizationId, campaignId);
    },
  };
}
