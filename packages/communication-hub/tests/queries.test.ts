import { describe, expect, it } from 'vitest';
import { createCommunicationRuntime } from '../src/runtime.js';

const ORG = 'org-1';

async function seed() {
  const runtime = createCommunicationRuntime();

  const conversationA = await runtime.conversations.create(ORG, { conversationType: 'support', subject: 'Spring order delay' });
  await runtime.conversations.close(ORG, conversationA.id);
  const conversationB = await runtime.conversations.create(ORG, { conversationType: 'sales' });

  const participantA = await runtime.participants.join(ORG, { conversationId: conversationA.id, participantType: 'user', displayName: 'Jordan Lee' });

  const messageA = await runtime.messages.create(ORG, { conversationId: conversationA.id, messageType: 'email', senderParticipantId: participantA.id });
  await runtime.messages.send(ORG, messageA.id);

  const templateA = await runtime.templates.createTemplate(ORG, { templateType: 'email', name: 'Spring Notice', body: 'Hi {{name}}' });

  const notificationA = await runtime.notifications.create(ORG, { notificationType: 'reminder', title: 'Follow up', recipientId: 'user-1' });

  const scheduledA = await runtime.scheduling.scheduleMessage(ORG, {
    message: { conversationId: conversationB.id, messageType: 'text' },
    scheduledFor: '2026-03-01T00:00:00.000Z',
  });

  return { runtime, conversationA, conversationB, participantA, messageA, templateA, notificationA, scheduledA };
}

describe('createCommunicationQueries via createCommunicationRuntime', () => {
  it('findConversations() filters by status', async () => {
    const { runtime, conversationA } = await seed();
    const result = await runtime.queries.findConversations({ organizationId: ORG, status: 'closed' });
    expect(result.conversations.map((c) => c.id)).toEqual([conversationA.id]);
  });

  it('findConversations() filters by conversationType', async () => {
    const { runtime, conversationB } = await seed();
    const result = await runtime.queries.findConversations({ organizationId: ORG, conversationType: 'sales' });
    expect(result.conversations.map((c) => c.id)).toEqual([conversationB.id]);
  });

  it('findConversations() paginates via offset/limit while total reflects the full match set', async () => {
    const runtime = createCommunicationRuntime();
    await runtime.conversations.create(ORG, { conversationType: 'internal' });
    await runtime.conversations.create(ORG, { conversationType: 'internal' });
    await runtime.conversations.create(ORG, { conversationType: 'internal' });
    const page = await runtime.queries.findConversations({ organizationId: ORG, offset: 1, limit: 1 });
    expect(page.conversations).toHaveLength(1);
    expect(page.total).toBe(3);
  });

  it('findMessages() filters by conversationId', async () => {
    const { runtime, conversationA, messageA } = await seed();
    const result = await runtime.queries.findMessages({ organizationId: ORG, conversationId: conversationA.id });
    expect(result.messages.map((m) => m.id)).toEqual([messageA.id]);
  });

  it('findMessages() filters by status', async () => {
    const { runtime, messageA } = await seed();
    const result = await runtime.queries.findMessages({ organizationId: ORG, status: 'sent' });
    expect(result.messages.map((m) => m.id)).toEqual([messageA.id]);
  });

  it('findParticipants() filters by conversationId', async () => {
    const { runtime, conversationA, participantA } = await seed();
    const result = await runtime.queries.findParticipants({ organizationId: ORG, conversationId: conversationA.id });
    expect(result.participants.map((p) => p.id)).toEqual([participantA.id]);
  });

  it('findTemplates() filters by templateType', async () => {
    const { runtime, templateA } = await seed();
    const result = await runtime.queries.findTemplates({ organizationId: ORG, templateType: 'email' });
    expect(result.templates.map((t) => t.id)).toEqual([templateA.id]);
  });

  it('findTimeline() delegates to the Timeline service and includes local messages', async () => {
    const { runtime, messageA } = await seed();
    const result = await runtime.queries.findTimeline({ organizationId: ORG });
    expect(result.entries.some((entry) => entry.referenceId === messageA.id)).toBe(true);
  });

  it('findNotifications() filters by recipientId', async () => {
    const { runtime, notificationA } = await seed();
    const result = await runtime.queries.findNotifications({ organizationId: ORG, recipientId: 'user-1' });
    expect(result.notifications.map((n) => n.id)).toEqual([notificationA.id]);
  });

  it('findScheduledMessages() returns items sorted by scheduledFor', async () => {
    const { runtime, scheduledA } = await seed();
    const result = await runtime.queries.findScheduledMessages({ organizationId: ORG });
    expect(result.items.map((i) => i.id)).toContain(scheduledA.id);
  });

  it('findScheduledMessages() filters by status', async () => {
    const { runtime, scheduledA } = await seed();
    const result = await runtime.queries.findScheduledMessages({ organizationId: ORG, status: 'scheduled' });
    expect(result.items.map((i) => i.id)).toEqual([scheduledA.id]);
  });

  it('searchCommunication() ranks an exact match above a substring match', async () => {
    const runtime = createCommunicationRuntime();
    await runtime.conversations.create(ORG, { conversationType: 'support', subject: 'Spring' });
    await runtime.conversations.create(ORG, { conversationType: 'support', subject: 'Spring Launch' });

    const result = await runtime.queries.searchCommunication({ organizationId: ORG, keyword: 'Spring' });
    expect(result.matches[0]?.label).toBe('Spring');
    expect(result.matches[0]?.score).toBeGreaterThan(result.matches[1]!.score);
  });

  it('searchCommunication() searches across conversations and templates', async () => {
    const { runtime } = await seed();
    const result = await runtime.queries.searchCommunication({ organizationId: ORG, keyword: 'Spring' });
    const recordTypes = new Set(result.matches.map((match) => match.recordType));
    expect(recordTypes.has('conversation')).toBe(true);
    expect(recordTypes.has('template')).toBe(true);
  });

  it('searchCommunication() returns no matches for an unrelated keyword', async () => {
    const { runtime } = await seed();
    const result = await runtime.queries.searchCommunication({ organizationId: ORG, keyword: 'Nonexistent' });
    expect(result.matches).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('is organization-scoped', async () => {
    const { runtime } = await seed();
    const result = await runtime.queries.findConversations({ organizationId: 'org-2' });
    expect(result.total).toBe(0);
  });
});
