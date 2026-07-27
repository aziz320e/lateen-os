/**
 * Real Templates engine — create / update / activate / archive with
 * immutable version history, plus deterministic variable rendering, for
 * the 4 required template types.
 *
 * @module template/engine.impl
 */
import { InvalidTemplateTransitionError, TemplateNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, TemplateId } from '../shared/identifiers.js';
import type { TemplateRepository, TemplateVersionRepository } from './repository.js';
import type { Template, TemplateStatus, TemplateType, TemplateVersion } from './types.js';

const TEMPLATE_TRANSITIONS: Readonly<Record<TemplateStatus, readonly TemplateStatus[]>> = {
  draft: ['active', 'archived'],
  active: ['archived'],
  archived: [],
};

export function canTransitionTemplate(from: TemplateStatus, to: TemplateStatus): boolean {
  return TEMPLATE_TRANSITIONS[from].includes(to);
}

/** Pure, deterministic `{{variable}}` substitution. Missing variables render as an empty string. */
export function renderTemplate(template: Pick<Template, 'body'>, variableValues: Readonly<Record<string, string>>): string {
  return template.body.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => variableValues[key] ?? '');
}

/** Pure: extracts every `{{variable}}` name declared in a template body, in first-appearance order, deduplicated. */
export function extractVariables(body: string): readonly string[] {
  const seen = new Set<string>();
  const variables: string[] = [];
  for (const match of body.matchAll(/\{\{(\w+)\}\}/g)) {
    const name = match[1]!;
    if (!seen.has(name)) {
      seen.add(name);
      variables.push(name);
    }
  }
  return variables;
}

export interface CreateTemplateInput {
  readonly templateType: TemplateType;
  readonly name: string;
  readonly body: string;
}

export interface UpdateTemplateInput {
  readonly name?: string;
  readonly body?: string;
}

export interface TemplateEngine {
  createTemplate(organizationId: OrganizationId, input: CreateTemplateInput): Promise<Template>;
  updateTemplate(organizationId: OrganizationId, templateId: TemplateId, patch: UpdateTemplateInput): Promise<Template>;
  activateTemplate(organizationId: OrganizationId, templateId: TemplateId): Promise<Template>;
  archiveTemplate(organizationId: OrganizationId, templateId: TemplateId): Promise<Template>;
  getTemplate(organizationId: OrganizationId, templateId: TemplateId): Promise<Template | null>;
  getVersionHistory(organizationId: OrganizationId, templateId: TemplateId): Promise<readonly TemplateVersion[]>;
}

/** Creates a real {@link TemplateEngine} backed by a {@link TemplateRepository} and {@link TemplateVersionRepository}. */
export function createTemplateEngine(
  repository: TemplateRepository,
  versionRepository: TemplateVersionRepository,
  now: () => string = nowIso,
): TemplateEngine {
  async function requireTemplate(organizationId: OrganizationId, templateId: TemplateId): Promise<Template> {
    const template = await repository.findById(organizationId, templateId);
    if (!template) throw new TemplateNotFoundError(templateId);
    return template;
  }

  async function snapshotVersion(template: Template): Promise<void> {
    const version: TemplateVersion = {
      id: generateId('template-version'),
      organizationId: template.organizationId,
      templateId: template.id,
      versionNumber: template.currentVersion,
      snapshot: template,
      createdAt: now(),
    };
    await versionRepository.save(version);
  }

  return {
    async createTemplate(organizationId, input) {
      const timestamp = now();
      const template: Template = {
        id: generateId('template'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        templateType: input.templateType,
        name: input.name,
        body: input.body,
        variables: extractVariables(input.body),
        status: 'draft',
        currentVersion: 1,
      };
      await repository.save(template);
      await snapshotVersion(template);
      return template;
    },

    async updateTemplate(organizationId, templateId, patch) {
      const template = await requireTemplate(organizationId, templateId);
      if (template.status !== 'draft') {
        throw new InvalidTemplateTransitionError(templateId, template.status, 'updated');
      }
      const body = patch.body ?? template.body;
      const updated: Template = {
        ...template,
        name: patch.name ?? template.name,
        body,
        variables: extractVariables(body),
        currentVersion: template.currentVersion + 1,
        updatedAt: now(),
      };
      await repository.save(updated);
      await snapshotVersion(updated);
      return updated;
    },

    async activateTemplate(organizationId, templateId) {
      const template = await requireTemplate(organizationId, templateId);
      if (!canTransitionTemplate(template.status, 'active')) {
        throw new InvalidTemplateTransitionError(templateId, template.status, 'active');
      }
      const updated: Template = { ...template, status: 'active', updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async archiveTemplate(organizationId, templateId) {
      const template = await requireTemplate(organizationId, templateId);
      if (!canTransitionTemplate(template.status, 'archived')) {
        throw new InvalidTemplateTransitionError(templateId, template.status, 'archived');
      }
      const updated: Template = { ...template, status: 'archived', updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async getTemplate(organizationId, templateId) {
      return repository.findById(organizationId, templateId);
    },

    async getVersionHistory(organizationId, templateId) {
      return versionRepository.findAllByTemplate(organizationId, templateId);
    },
  };
}
