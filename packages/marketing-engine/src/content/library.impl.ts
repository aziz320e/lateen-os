/**
 * Real Content Library — manages templates, campaign assets, landing
 * pages, and media references.
 *
 * @module content/library.impl
 */
import type { MarketingEventBus } from '../events/marketing-event-bus.js';
import { ContentItemNotFoundError, InvalidContentTransitionError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { CampaignId, ContentItemId, OrganizationId } from '../shared/identifiers.js';
import type { MarketingTag } from '../shared/primitives.js';
import type { ContentRepository } from './repository.js';
import type { ContentItem, ContentType } from './types.js';

export interface CreateContentItemInput {
  readonly title: string;
  readonly contentType: ContentType;
  readonly campaignId?: CampaignId;
  readonly body?: string;
  readonly url?: string;
  readonly tags?: readonly MarketingTag[];
}

export interface UpdateContentItemInput {
  readonly title?: string;
  readonly body?: string;
  readonly url?: string;
  readonly tags?: readonly MarketingTag[];
}

export interface ContentLibrary {
  createContent(organizationId: OrganizationId, input: CreateContentItemInput): Promise<ContentItem>;
  updateContent(organizationId: OrganizationId, contentItemId: ContentItemId, patch: UpdateContentItemInput): Promise<ContentItem>;
  publishContent(organizationId: OrganizationId, contentItemId: ContentItemId): Promise<ContentItem>;
  archiveContent(organizationId: OrganizationId, contentItemId: ContentItemId): Promise<ContentItem>;
  getContent(organizationId: OrganizationId, contentItemId: ContentItemId): Promise<ContentItem | null>;
  listByCampaign(organizationId: OrganizationId, campaignId: CampaignId): Promise<readonly ContentItem[]>;
}

/** Creates a real {@link ContentLibrary} backed by a {@link ContentRepository}. */
export function createContentLibrary(
  repository: ContentRepository,
  eventBus?: MarketingEventBus,
  now: () => string = nowIso,
): ContentLibrary {
  async function requireContent(organizationId: OrganizationId, contentItemId: ContentItemId): Promise<ContentItem> {
    const item = await repository.findById(organizationId, contentItemId);
    if (!item) throw new ContentItemNotFoundError(contentItemId);
    return item;
  }

  return {
    async createContent(organizationId, input) {
      const timestamp = now();
      const item: ContentItem = {
        id: generateId('content-item'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        title: input.title,
        contentType: input.contentType,
        status: 'draft',
        campaignId: input.campaignId,
        body: input.body,
        url: input.url,
        tags: input.tags ?? [],
      };
      await repository.save(item);
      eventBus?.publish('content.created', { contentItemId: item.id, organizationId, contentType: item.contentType });
      return item;
    },

    async updateContent(organizationId, contentItemId, patch) {
      const item = await requireContent(organizationId, contentItemId);
      if (item.status !== 'draft') {
        throw new InvalidContentTransitionError(contentItemId, item.status, 'updated');
      }
      const updated: ContentItem = {
        ...item,
        title: patch.title ?? item.title,
        body: patch.body ?? item.body,
        url: patch.url ?? item.url,
        tags: patch.tags ?? item.tags,
        updatedAt: now(),
      };
      await repository.save(updated);
      return updated;
    },

    async publishContent(organizationId, contentItemId) {
      const item = await requireContent(organizationId, contentItemId);
      if (item.status !== 'draft') {
        throw new InvalidContentTransitionError(contentItemId, item.status, 'published');
      }
      const updated: ContentItem = { ...item, status: 'published', updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async archiveContent(organizationId, contentItemId) {
      const item = await requireContent(organizationId, contentItemId);
      if (item.status === 'archived') {
        throw new InvalidContentTransitionError(contentItemId, item.status, 'archived');
      }
      const updated: ContentItem = { ...item, status: 'archived', updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async getContent(organizationId, contentItemId) {
      return repository.findById(organizationId, contentItemId);
    },

    async listByCampaign(organizationId, campaignId) {
      return repository.findByCampaign(organizationId, campaignId);
    },
  };
}
