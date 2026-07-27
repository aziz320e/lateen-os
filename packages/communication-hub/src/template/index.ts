/**
 * Templates — email, SMS, WhatsApp, and notification templates, with
 * deterministic variable rendering and immutable version history.
 * @module template
 */
export * from './types.js';
export * from './repository.js';
export { createTemplateRepository, createTemplateVersionRepository } from './repository.impl.js';
export {
  createTemplateEngine,
  canTransitionTemplate,
  renderTemplate,
  extractVariables,
  type TemplateEngine,
  type CreateTemplateInput,
  type UpdateTemplateInput,
} from './engine.impl.js';
