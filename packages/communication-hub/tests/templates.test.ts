import { describe, expect, it } from 'vitest';
import { createTemplateRepository, createTemplateVersionRepository } from '../src/template/repository.impl.js';
import { canTransitionTemplate, createTemplateEngine, extractVariables, renderTemplate } from '../src/template/engine.impl.js';
import { InvalidTemplateTransitionError, TemplateNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

describe('extractVariables (pure)', () => {
  it('extracts every declared variable, deduplicated, in first-appearance order', () => {
    expect(extractVariables('Hi {{name}}, your order {{orderId}} for {{name}} is ready.')).toEqual(['name', 'orderId']);
  });

  it('returns an empty list for a body with no variables', () => {
    expect(extractVariables('No variables here.')).toEqual([]);
  });
});

describe('renderTemplate (pure)', () => {
  it('substitutes every declared variable', () => {
    const rendered = renderTemplate({ body: 'Hi {{name}}, order {{orderId}} is delayed.' }, { name: 'Jordan', orderId: '1042' });
    expect(rendered).toBe('Hi Jordan, order 1042 is delayed.');
  });

  it('renders missing variables as an empty string', () => {
    const rendered = renderTemplate({ body: 'Hi {{name}}!' }, {});
    expect(rendered).toBe('Hi !');
  });
});

describe('canTransitionTemplate', () => {
  it('allows draft -> active -> archived, and draft -> archived directly', () => {
    expect(canTransitionTemplate('draft', 'active')).toBe(true);
    expect(canTransitionTemplate('active', 'archived')).toBe(true);
    expect(canTransitionTemplate('draft', 'archived')).toBe(true);
  });

  it('forbids leaving archived and reactivating', () => {
    expect(canTransitionTemplate('archived', 'draft')).toBe(false);
    expect(canTransitionTemplate('active', 'draft')).toBe(false);
  });
});

function setup() {
  const repository = createTemplateRepository();
  const versionRepository = createTemplateVersionRepository();
  const engine = createTemplateEngine(repository, versionRepository);
  return { repository, versionRepository, engine };
}

describe('createTemplateEngine', () => {
  it('createTemplate() starts at version 1, draft, with extracted variables', async () => {
    const { engine } = setup();
    const template = await engine.createTemplate(ORG, { templateType: 'email', name: 'Delay Notice', body: 'Hi {{name}}, delayed.' });
    expect(template.status).toBe('draft');
    expect(template.currentVersion).toBe(1);
    expect(template.variables).toEqual(['name']);
  });

  it('supports all 4 deterministic template types', async () => {
    const { engine } = setup();
    const types = ['email', 'sms', 'whatsapp', 'notification'] as const;
    for (const templateType of types) {
      const template = await engine.createTemplate(ORG, { templateType, name: `Template ${templateType}`, body: 'Body' });
      expect(template.templateType).toBe(templateType);
    }
  });

  it('createTemplate() records an initial version snapshot', async () => {
    const { engine } = setup();
    const template = await engine.createTemplate(ORG, { templateType: 'sms', name: 'Reminder', body: 'Hi {{name}}' });
    const history = await engine.getVersionHistory(ORG, template.id);
    expect(history).toHaveLength(1);
    expect(history[0]?.versionNumber).toBe(1);
  });

  it('updateTemplate() recomputes variables and increments the version', async () => {
    const { engine } = setup();
    const template = await engine.createTemplate(ORG, { templateType: 'sms', name: 'Reminder', body: 'Hi {{name}}' });
    const updated = await engine.updateTemplate(ORG, template.id, { body: 'Hi {{name}}, your {{item}} is ready.' });
    expect(updated.variables).toEqual(['name', 'item']);
    expect(updated.currentVersion).toBe(2);
  });

  it('updateTemplate() rejects an active template', async () => {
    const { engine } = setup();
    const template = await engine.createTemplate(ORG, { templateType: 'sms', name: 'Reminder', body: 'Hi' });
    await engine.activateTemplate(ORG, template.id);
    await expect(engine.updateTemplate(ORG, template.id, { name: 'X' })).rejects.toBeInstanceOf(InvalidTemplateTransitionError);
  });

  it('activateTemplate() moves draft -> active', async () => {
    const { engine } = setup();
    const template = await engine.createTemplate(ORG, { templateType: 'whatsapp', name: 'Greeting', body: 'Hi' });
    const active = await engine.activateTemplate(ORG, template.id);
    expect(active.status).toBe('active');
  });

  it('activateTemplate() rejects an already-active template', async () => {
    const { engine } = setup();
    const template = await engine.createTemplate(ORG, { templateType: 'whatsapp', name: 'Greeting', body: 'Hi' });
    await engine.activateTemplate(ORG, template.id);
    await expect(engine.activateTemplate(ORG, template.id)).rejects.toBeInstanceOf(InvalidTemplateTransitionError);
  });

  it('archiveTemplate() is terminal', async () => {
    const { engine } = setup();
    const template = await engine.createTemplate(ORG, { templateType: 'notification', name: 'Alert', body: 'Alert!' });
    const archived = await engine.archiveTemplate(ORG, template.id);
    expect(archived.status).toBe('archived');
    await expect(engine.archiveTemplate(ORG, template.id)).rejects.toBeInstanceOf(InvalidTemplateTransitionError);
  });

  it('throws TemplateNotFoundError for an unknown template', async () => {
    const { engine } = setup();
    await expect(engine.activateTemplate(ORG, 'missing')).rejects.toBeInstanceOf(TemplateNotFoundError);
  });

  it('getTemplate() returns null for an unknown template', async () => {
    const { engine } = setup();
    expect(await engine.getTemplate(ORG, 'missing')).toBeNull();
  });

  it('getVersionHistory() returns versions oldest first', async () => {
    const { engine } = setup();
    const template = await engine.createTemplate(ORG, { templateType: 'email', name: 'Notice', body: 'v1' });
    await engine.updateTemplate(ORG, template.id, { body: 'v2' });
    await engine.updateTemplate(ORG, template.id, { body: 'v3' });
    const history = await engine.getVersionHistory(ORG, template.id);
    expect(history.map((v) => v.versionNumber)).toEqual([1, 2, 3]);
    expect(history[2]?.snapshot.body).toBe('v3');
  });

  it('is organization-scoped', async () => {
    const { repository, engine } = setup();
    const template = await engine.createTemplate(ORG, { templateType: 'email', name: 'Notice', body: 'Body' });
    expect(await repository.findById('org-2', template.id)).toBeNull();
  });
});
