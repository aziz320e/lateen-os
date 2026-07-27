/** Real, in-memory {@link TemplateRepository} and {@link TemplateVersionRepository} implementations. @module template/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { Template, TemplateVersion } from './types.js';
import type { TemplateRepository, TemplateVersionRepository } from './repository.js';

/** Creates a real, in-memory {@link TemplateRepository}. */
export function createTemplateRepository(seed?: readonly Template[]): TemplateRepository {
  const repo = createInMemoryRepository<Template>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByType(organizationId, templateType) {
      return repo.list(organizationId).filter((template) => template.templateType === templateType);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((template) => template.status === status);
    },
  };
}

/** `TemplateVersion`'s natural key is `id`, but lookups are always scoped by `templateId` too — a small hand-rolled Map store. */
export function createTemplateVersionRepository(seed?: readonly TemplateVersion[]): TemplateVersionRepository {
  const store = new Map<string, TemplateVersion>();
  for (const version of seed ?? []) store.set(version.id, version);

  return {
    async save(version) {
      store.set(version.id, version);
    },
    async findById(organizationId, versionId) {
      const version = store.get(versionId);
      if (!version || version.organizationId !== organizationId) return null;
      return version;
    },
    async findAllByTemplate(organizationId, templateId) {
      return [...store.values()]
        .filter((version) => version.organizationId === organizationId && version.templateId === templateId)
        .sort((a, b) => a.versionNumber - b.versionNumber);
    },
  };
}
