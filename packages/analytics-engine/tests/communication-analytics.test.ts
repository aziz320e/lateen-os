import { describe, expect, it } from 'vitest';
import { createCommunicationRuntime } from '@lateen-os/communication-hub';
import { createCommunicationAnalyticsRepository } from '../src/communication-analytics/repository.impl.js';
import {
  computeAverageResponseTimeMinutes,
  computeDeliveryRate,
  computeReadRate,
  createCommunicationAnalyticsEngine,
} from '../src/communication-analytics/engine.impl.js';

const ORG = 'org-1';

describe('computeAverageResponseTimeMinutes (pure)', () => {
  it('averages consecutive sentAt deltas within each conversation', () => {
    const minutes = computeAverageResponseTimeMinutes({
      'conv-1': [{ sentAt: '2026-01-01T00:00:00.000Z' }, { sentAt: '2026-01-01T00:10:00.000Z' }],
    });
    expect(minutes).toBe(10);
  });

  it('returns 0 when no conversation has more than one message', () => {
    expect(computeAverageResponseTimeMinutes({ 'conv-1': [{ sentAt: '2026-01-01T00:00:00.000Z' }] })).toBe(0);
  });
});

describe('computeDeliveryRate / computeReadRate (pure)', () => {
  it('computes percentages, 0 for zero dispatched', () => {
    expect(computeDeliveryRate(10, 8)).toBe(80);
    expect(computeDeliveryRate(0, 0)).toBe(0);
    expect(computeReadRate(10, 4)).toBe(40);
  });
});

function setup() {
  const repository = createCommunicationAnalyticsRepository();
  return { repository };
}

describe('createCommunicationAnalyticsEngine — fully offline (no Communication Hub injected)', () => {
  it('returns a zeroed snapshot', async () => {
    const { repository } = setup();
    const engine = createCommunicationAnalyticsEngine(repository, {});
    const snapshot = await engine.computeSnapshot(ORG);
    expect(snapshot.messageVolume).toBe(0);
    expect(snapshot.notificationStats).toEqual({ total: 0, sent: 0, read: 0 });
  });
});

describe('createCommunicationAnalyticsEngine — with a real Communication Hub', () => {
  async function seedMessages() {
    const communicationHub = createCommunicationRuntime();
    const conversation = await communicationHub.conversations.create(ORG, { conversationType: 'customer' });

    const first = await communicationHub.messages.create(ORG, { conversationId: conversation.id, messageType: 'text', body: 'hello' });
    await communicationHub.messages.send(ORG, first.id);
    await communicationHub.messages.deliver(ORG, first.id);
    await communicationHub.messages.markRead(ORG, first.id);

    const second = await communicationHub.messages.create(ORG, { conversationId: conversation.id, messageType: 'text', body: 'follow-up' });
    await communicationHub.messages.send(ORG, second.id);

    const notification = await communicationHub.notifications.create(ORG, { notificationType: 'user', title: 'Ping' });
    await communicationHub.notifications.send(ORG, notification.id);

    return { communicationHub, conversation };
  }

  it('computes real message volume', async () => {
    const { communicationHub } = await seedMessages();
    const { repository } = setup();
    const engine = createCommunicationAnalyticsEngine(repository, { communicationHub });
    const snapshot = await engine.computeSnapshot(ORG);
    expect(snapshot.messageVolume).toBe(2);
  });

  it('computes real delivery and read rates', async () => {
    // Of the 2 dispatched messages, only the first reached delivered/read
    // (the second was only sent) — so both rates are 50%, not 100%.
    const { communicationHub } = await seedMessages();
    const { repository } = setup();
    const engine = createCommunicationAnalyticsEngine(repository, { communicationHub });
    const snapshot = await engine.computeSnapshot(ORG);
    expect(snapshot.deliveryRate).toBe(50);
    expect(snapshot.readRate).toBe(50);
  });

  it('computes real notification statistics', async () => {
    const { communicationHub } = await seedMessages();
    const { repository } = setup();
    const engine = createCommunicationAnalyticsEngine(repository, { communicationHub });
    const snapshot = await engine.computeSnapshot(ORG);
    expect(snapshot.notificationStats).toEqual({ total: 1, sent: 1, read: 0 });
  });
});

describe('createCommunicationAnalyticsEngine — get / list / org scoping', () => {
  it('get() returns null for an unknown snapshot', async () => {
    const { repository } = setup();
    const engine = createCommunicationAnalyticsEngine(repository, {});
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('list() returns every computed snapshot', async () => {
    const { repository } = setup();
    const engine = createCommunicationAnalyticsEngine(repository, {});
    await engine.computeSnapshot(ORG);
    await engine.computeSnapshot(ORG);
    expect(await engine.list(ORG)).toHaveLength(2);
  });

  it('is organization-scoped', async () => {
    const { repository } = setup();
    const engine = createCommunicationAnalyticsEngine(repository, {});
    const snapshot = await engine.computeSnapshot(ORG);
    expect(await repository.findById('org-2', snapshot.id)).toBeNull();
  });
});
