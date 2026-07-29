import { describe, expect, it } from 'vitest';
import { createEventDeclarationRepository } from '../src/extension-events/repository.impl.js';
import { createExtensionEventsEngine } from '../src/extension-events/engine.impl.js';
import { createMarketplaceEventBus } from '../src/events/index.js';
import { EventDeclarationNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';
const EXT = 'ext-1';

function setup() {
  const eventBus = createMarketplaceEventBus();
  const engine = createExtensionEventsEngine(createEventDeclarationRepository(), eventBus);
  return { engine, eventBus };
}

describe('ExtensionEventsEngine', () => {
  it('declareSubscription() creates a "subscribes" declaration', async () => {
    const { engine } = setup();
    const declaration = await engine.declareSubscription(ORG, { extensionId: EXT, eventName: 'extension.installed' });
    expect(declaration.direction).toBe('subscribes');
    expect(declaration.eventName).toBe('extension.installed');
  });

  it('declarePublication() creates a "publishes" declaration', async () => {
    const { engine } = setup();
    const declaration = await engine.declarePublication(ORG, { extensionId: EXT, eventName: 'custom.widget.rendered' });
    expect(declaration.direction).toBe('publishes');
  });

  it('removeDeclaration() removes a declaration', async () => {
    const { engine } = setup();
    const declaration = await engine.declareSubscription(ORG, { extensionId: EXT, eventName: 'extension.installed' });
    await engine.removeDeclaration(ORG, declaration.id);
    expect(await engine.getDeclaration(ORG, declaration.id)).toBeNull();
  });

  it('removeDeclaration() throws EventDeclarationNotFoundError for an unknown declaration', async () => {
    const { engine } = setup();
    await expect(engine.removeDeclaration(ORG, 'missing')).rejects.toBeInstanceOf(EventDeclarationNotFoundError);
  });

  it('checkEventCompatibility() is compatible when every declared event is known', async () => {
    const { engine } = setup();
    await engine.declareSubscription(ORG, { extensionId: EXT, eventName: 'extension.installed' });
    await engine.declarePublication(ORG, { extensionId: EXT, eventName: 'extension.enabled' });
    const result = await engine.checkEventCompatibility(ORG, EXT, ['extension.installed', 'extension.enabled', 'extension.disabled']);
    expect(result).toEqual({ compatible: true, unknownEvents: [] });
  });

  it('checkEventCompatibility() is incompatible when a declared event is unknown, listing it', async () => {
    const { engine } = setup();
    await engine.declareSubscription(ORG, { extensionId: EXT, eventName: 'not.a.real.event' });
    const result = await engine.checkEventCompatibility(ORG, EXT, ['extension.installed']);
    expect(result.compatible).toBe(false);
    expect(result.unknownEvents).toEqual(['not.a.real.event']);
  });

  it('checkEventCompatibility() deduplicates repeated unknown event names', async () => {
    const { engine } = setup();
    await engine.declareSubscription(ORG, { extensionId: EXT, eventName: 'unknown.event' });
    await engine.declarePublication(ORG, { extensionId: EXT, eventName: 'unknown.event' });
    const result = await engine.checkEventCompatibility(ORG, EXT, []);
    expect(result.unknownEvents).toEqual(['unknown.event']);
  });

  it('checkEventCompatibility() publishes compatibility.checked', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('compatibility.checked', (payload) => (seen = payload));
    await engine.declareSubscription(ORG, { extensionId: EXT, eventName: 'extension.installed' });
    await engine.checkEventCompatibility(ORG, EXT, ['extension.installed']);
    expect(seen).toEqual({ organizationId: ORG, subjectId: EXT, compatible: true });
  });

  it('checkEventCompatibility() with no declarations at all is trivially compatible', async () => {
    const { engine } = setup();
    const result = await engine.checkEventCompatibility(ORG, EXT, []);
    expect(result).toEqual({ compatible: true, unknownEvents: [] });
  });

  it('listSubscriptions() / listPublications() partition declarations correctly', async () => {
    const { engine } = setup();
    await engine.declareSubscription(ORG, { extensionId: EXT, eventName: 'extension.installed' });
    await engine.declareSubscription(ORG, { extensionId: EXT, eventName: 'extension.enabled' });
    await engine.declarePublication(ORG, { extensionId: EXT, eventName: 'custom.event' });
    expect(await engine.listSubscriptions(ORG, EXT)).toHaveLength(2);
    expect(await engine.listPublications(ORG, EXT)).toHaveLength(1);
  });

  it('declarations are isolated per extension', async () => {
    const { engine } = setup();
    await engine.declareSubscription(ORG, { extensionId: 'ext-a', eventName: 'extension.installed' });
    await engine.declareSubscription(ORG, { extensionId: 'ext-b', eventName: 'extension.installed' });
    expect(await engine.listSubscriptions(ORG, 'ext-a')).toHaveLength(1);
  });

  it('getDeclaration() returns null for an unknown id', async () => {
    const { engine } = setup();
    expect(await engine.getDeclaration(ORG, 'missing')).toBeNull();
  });

  it('declarations are isolated per organization', async () => {
    const { engine } = setup();
    await engine.declareSubscription(ORG, { extensionId: EXT, eventName: 'extension.installed' });
    await engine.declareSubscription('org-2', { extensionId: EXT, eventName: 'extension.installed' });
    expect(await engine.listSubscriptions(ORG, EXT)).toHaveLength(1);
    expect(await engine.listSubscriptions('org-2', EXT)).toHaveLength(1);
  });

  it('an extension can declare the same eventName as both a subscription and a publication', async () => {
    const { engine } = setup();
    await engine.declareSubscription(ORG, { extensionId: EXT, eventName: 'shared.event' });
    await engine.declarePublication(ORG, { extensionId: EXT, eventName: 'shared.event' });
    expect(await engine.listSubscriptions(ORG, EXT)).toHaveLength(1);
    expect(await engine.listPublications(ORG, EXT)).toHaveLength(1);
  });

  it('checkEventCompatibility() only inspects the given extension’s own declarations', async () => {
    const { engine } = setup();
    await engine.declareSubscription(ORG, { extensionId: 'ext-a', eventName: 'unknown.event' });
    const result = await engine.checkEventCompatibility(ORG, 'ext-b', []);
    expect(result).toEqual({ compatible: true, unknownEvents: [] });
  });

  it('removeDeclaration() removes only the targeted declaration, leaving others intact', async () => {
    const { engine } = setup();
    const first = await engine.declareSubscription(ORG, { extensionId: EXT, eventName: 'a' });
    await engine.declareSubscription(ORG, { extensionId: EXT, eventName: 'b' });
    await engine.removeDeclaration(ORG, first.id);
    expect(await engine.listSubscriptions(ORG, EXT)).toHaveLength(1);
  });

  it('getDeclaration() returns the exact declaration recorded', async () => {
    const { engine } = setup();
    const declaration = await engine.declareSubscription(ORG, { extensionId: EXT, eventName: 'extension.installed' });
    expect(await engine.getDeclaration(ORG, declaration.id)).toEqual(declaration);
  });

  it('getDeclaration() returns null for a declaration id from a different organization', async () => {
    const { engine } = setup();
    const declaration = await engine.declareSubscription(ORG, { extensionId: EXT, eventName: 'extension.installed' });
    expect(await engine.getDeclaration('org-2', declaration.id)).toBeNull();
  });

  it('an extension can declare subscriptions to multiple distinct events', async () => {
    const { engine } = setup();
    await engine.declareSubscription(ORG, { extensionId: EXT, eventName: 'extension.installed' });
    await engine.declareSubscription(ORG, { extensionId: EXT, eventName: 'extension.enabled' });
    await engine.declareSubscription(ORG, { extensionId: EXT, eventName: 'extension.disabled' });
    expect(await engine.listSubscriptions(ORG, EXT)).toHaveLength(3);
  });

  it('checkEventCompatibility() reports every unknown event, not just the first one', async () => {
    const { engine } = setup();
    await engine.declareSubscription(ORG, { extensionId: EXT, eventName: 'unknown.one' });
    await engine.declareSubscription(ORG, { extensionId: EXT, eventName: 'unknown.two' });
    const result = await engine.checkEventCompatibility(ORG, EXT, []);
    expect(result.unknownEvents.sort()).toEqual(['unknown.one', 'unknown.two']);
  });

  it('removeDeclaration() is isolated per organization', async () => {
    const { engine } = setup();
    const declaration = await engine.declareSubscription(ORG, { extensionId: EXT, eventName: 'a' });
    await expect(engine.removeDeclaration('org-2', declaration.id)).rejects.toBeInstanceOf(EventDeclarationNotFoundError);
  });

  it('listPublications() returns an empty array for an extension with no publications declared', async () => {
    const { engine } = setup();
    await engine.declareSubscription(ORG, { extensionId: EXT, eventName: 'a' });
    expect(await engine.listPublications(ORG, EXT)).toEqual([]);
  });

  it('checkEventCompatibility() is isolated per organization', async () => {
    const { engine } = setup();
    await engine.declareSubscription(ORG, { extensionId: EXT, eventName: 'unknown.event' });
    const result = await engine.checkEventCompatibility('org-2', EXT, []);
    expect(result).toEqual({ compatible: true, unknownEvents: [] });
  });

  it('declarePublication() and declareSubscription() for the same extension both appear in listSubscriptions/listPublications independently', async () => {
    const { engine } = setup();
    await engine.declareSubscription(ORG, { extensionId: EXT, eventName: 'sub.event' });
    await engine.declarePublication(ORG, { extensionId: EXT, eventName: 'pub.event' });
    const subs = await engine.listSubscriptions(ORG, EXT);
    const pubs = await engine.listPublications(ORG, EXT);
    expect(subs.map((s) => s.eventName)).toEqual(['sub.event']);
    expect(pubs.map((p) => p.eventName)).toEqual(['pub.event']);
  });

  it('checkEventCompatibility() with a partially known set of events is still incompatible if any is unknown', async () => {
    const { engine } = setup();
    await engine.declareSubscription(ORG, { extensionId: EXT, eventName: 'extension.installed' });
    await engine.declareSubscription(ORG, { extensionId: EXT, eventName: 'not.real' });
    const result = await engine.checkEventCompatibility(ORG, EXT, ['extension.installed']);
    expect(result.compatible).toBe(false);
  });

  it('declareSubscription() and declarePublication() both default id/timestamps consistently', async () => {
    const { engine } = setup();
    const declaration = await engine.declareSubscription(ORG, { extensionId: EXT, eventName: 'a' });
    expect(declaration.createdAt).toBe(declaration.updatedAt);
    expect(declaration.organizationId).toBe(ORG);
  });
});
