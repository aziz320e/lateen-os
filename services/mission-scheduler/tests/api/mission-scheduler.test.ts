import 'reflect-metadata';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { loadConfig } from '../../src/config/index';
import { AppModule } from '../../src/app.module';
import { createInMemoryRepository } from '../../src/repositories/mission-repositories';
import { InMemoryMissionQueue } from '../../src/queue/mission-queue';
import { NoOpSchedulerEventPublisher } from '../../src/events/nats-publisher';
import { CronEvaluator } from '../../src/schedule/cron-evaluator';
import { CalendarEvaluator } from '../../src/calendar/calendar-evaluator';
import { MockPlatformExecutor } from '../../src/execution/platform-executor';
import { EventListenerService } from '../../src/event-listener/event-listener.service';
import {
  CalendarService,
  ExecutionService,
  HistoryService,
  MissionSchedulerService,
  MonitoringService,
  ScheduleService,
  TriggerService,
} from '../../src/application/scheduler.services';
import { MISSION_TYPE_CATALOG } from '../../src/mission/catalog';

const ORG_A = '00000000-0000-4000-8000-000000000001';
const ORG_B = '00000000-0000-4000-8000-000000000002';

function createTestApp() {
  const config = loadConfig({ NODE_ENV: 'test', LOG_LEVEL: 'fatal', USE_REDIS: 'false', USE_NATS: 'false' });
  const repo = createInMemoryRepository();
  const queue = new InMemoryMissionQueue();
  const events = new NoOpSchedulerEventPublisher();
  const cron = new CronEvaluator();
  const calendar = new CalendarEvaluator();
  const executor = new MockPlatformExecutor();
  const schedulerService = new MissionSchedulerService(repo, queue, events, config);
  const scheduleService = new ScheduleService(repo, cron, calendar, schedulerService);
  const triggerService = new TriggerService(repo, schedulerService);

  return AppModule.register({
    config,
    schedulerService,
    scheduleService,
    triggerService,
    calendarService: new CalendarService(repo),
    executionService: new ExecutionService(repo, executor, events, config),
    monitoringService: new MonitoringService(repo, queue),
    historyService: new HistoryService(repo),
    eventListenerService: new EventListenerService(),
  });
}

describe('Mission Scheduler API', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await NestFactory.create(createTestApp(), new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: 'ok', service: 'mission-scheduler' });
  });

  it('GET /api/scheduler/types returns 11 mission types', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/scheduler/types' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(MISSION_TYPE_CATALOG.length);
  });

  it('POST /api/missions schedules a mission', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/missions',
      headers: { 'x-organization-id': ORG_A },
      payload: { missionType: 'LAUNCH_PRODUCT', source: 'MANUAL', mode: 'IMMEDIATE' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().missionType).toBe('LAUNCH_PRODUCT');
    expect(res.json().status).toBe('SCHEDULED');
  });

  it('POST execute completes mission via mock executor', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/missions',
      headers: { 'x-organization-id': ORG_A },
      payload: { missionType: 'EXECUTIVE_REPORT', mode: 'IMMEDIATE' },
    });
    const id = created.json().id;

    const run = await app.inject({
      method: 'POST',
      url: `/api/missions/${id}/execute`,
      headers: { 'x-organization-id': ORG_A },
    });
    expect(run.statusCode).toBe(201);
    expect(run.json().status).toBe('COMPLETED');
    expect(run.json().externalMissionId).toBeDefined();
  });

  it('registers trigger and fires mission', async () => {
    const reg = await app.inject({
      method: 'POST',
      url: '/api/triggers',
      headers: { 'x-organization-id': ORG_A },
      payload: {
        type: 'DECISION_APPROVED',
        source: 'DECISION_EVENT',
        missionType: 'MARKET_RESEARCH',
      },
    });
    const triggerId = reg.json().id;

    const fire = await app.inject({
      method: 'POST',
      url: `/api/triggers/${triggerId}/fire`,
      headers: { 'x-organization-id': ORG_A },
      payload: { decisionId: 'dec-1' },
    });
    expect(fire.statusCode).toBe(201);
    expect(fire.json().missionType).toBe('MARKET_RESEARCH');
  });

  it('tenant isolation on mission get', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/missions',
      headers: { 'x-organization-id': ORG_A },
      payload: { missionType: 'COMPLIANCE_AUDIT' },
    });
    const id = created.json().id;

    const cross = await app.inject({
      method: 'GET',
      url: `/api/missions/${id}`,
      headers: { 'x-organization-id': ORG_B },
    });
    expect(cross.statusCode).toBe(404);
  });

  it('GET /api/scheduler returns monitoring snapshot', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/scheduler',
      headers: { 'x-organization-id': ORG_A },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty('upcoming');
    expect(res.json()).toHaveProperty('running');
  });

  it('POST calendar rule', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/calendar',
      headers: { 'x-organization-id': ORG_A },
      payload: { name: 'Riyadh Business Hours' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().name).toBe('Riyadh Business Hours');
  });
});

describe('CronEvaluator', () => {
  it('validates cron expressions', () => {
    const cron = new CronEvaluator();
    expect(cron.isValid('0 9 * * 1-5')).toBe(true);
    expect(cron.isValid('not-a-cron')).toBe(false);
  });
});

describe('EventListenerService', () => {
  it('maps platform events to triggers', async () => {
    const listener = new EventListenerService();
    const result = await listener.ingestEvent({
      eventName: 'decision.approved',
      organizationId: ORG_A,
      payload: { id: '1' },
    });
    expect(result.accepted).toBe(true);
  });
});
