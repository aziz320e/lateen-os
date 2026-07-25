import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { loadConfig } from './config/index';
import { getPrismaClient, disconnectPrisma } from './database/prisma-client';
import { createRepositories } from './repositories/mission-repositories';
import { createMissionQueue } from './queue/mission-queue';
import { createPlatformExecutor } from './execution/platform-executor';
import { CronEvaluator } from './schedule/cron-evaluator';
import { CalendarEvaluator } from './calendar/calendar-evaluator';
import {
  createSchedulerEventPublisher,
  NoOpSchedulerEventPublisher,
} from './events/nats-publisher';
import { EventListenerService } from './event-listener/event-listener.service';
import {
  CalendarService,
  ExecutionService,
  HistoryService,
  MissionSchedulerService,
  MonitoringService,
  PolicyService,
  ScheduleService,
  TriggerService,
} from './application/scheduler.services';
import { initTelemetry } from './infrastructure/observability/telemetry';
import { AppModule } from './app.module';

async function bootstrap() {
  const config = loadConfig();
  const telemetry = initTelemetry(config.OTEL_SERVICE_NAME, config.OTEL_EXPORTER_OTLP_ENDPOINT);

  const prisma = getPrismaClient(config.DATABASE_URL);
  const repo = createRepositories(prisma);
  const queue = createMissionQueue(config.USE_REDIS && config.NODE_ENV !== 'test', config.REDIS_URL);
  const cron = new CronEvaluator();
  const calendar = new CalendarEvaluator();
  const executor = createPlatformExecutor(config);

  const events =
    config.NODE_ENV === 'test' || !config.USE_NATS
      ? new NoOpSchedulerEventPublisher()
      : createSchedulerEventPublisher(config.NATS_URL, config.NATS_SUBJECT_PREFIX);

  const schedulerService = new MissionSchedulerService(repo, queue, events, config);
  const scheduleService = new ScheduleService(repo, cron, calendar, schedulerService);
  const triggerService = new TriggerService(repo, schedulerService);
  const calendarService = new CalendarService(repo);
  const executionService = new ExecutionService(repo, executor, events, config);
  const monitoringService = new MonitoringService(repo, queue);
  const historyService = new HistoryService(repo);
  const eventListenerService = new EventListenerService();
  void new PolicyService(repo);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule.register({
      config,
      schedulerService,
      scheduleService,
      triggerService,
      calendarService,
      executionService,
      monitoringService,
      historyService,
      eventListenerService,
    }),
    new FastifyAdapter({ logger: false }),
  );

  app.enableCors({ origin: config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN });

  await app.listen({ port: config.PORT, host: config.HOST });
  console.log(`Mission Scheduler listening on ${config.HOST}:${config.PORT}`);

  const shutdown = async () => {
    await app.close();
    await disconnectPrisma();
    if (events && 'close' in events && typeof events.close === 'function') await events.close();
    if (queue && 'close' in queue && typeof queue.close === 'function') await queue.close();
    await telemetry?.shutdown();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((error) => {
  console.error('Failed to start Mission Scheduler', error);
  process.exit(1);
});
