import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import type { AppConfig } from './config/index';
import { HealthController } from './api/health/health.controller';
import { SchedulerController } from './api/scheduler/scheduler.controller';
import { MissionsController } from './api/missions/missions.controller';
import { TriggersController } from './api/triggers/triggers.controller';
import { HistoryController } from './api/history/history.controller';
import { CalendarController } from './api/calendar/calendar.controller';
import {
  APP_CONFIG,
  CALENDAR_SERVICE,
  EVENT_LISTENER_SERVICE,
  EXECUTION_SERVICE,
  HISTORY_SERVICE,
  MONITORING_SERVICE,
  SCHEDULE_SERVICE,
  SCHEDULER_SERVICE,
  TRIGGER_SERVICE,
} from './api/tokens';
import type {
  CalendarService,
  ExecutionService,
  HistoryService,
  MissionSchedulerService,
  MonitoringService,
  ScheduleService,
  TriggerService,
} from './application/scheduler.services';
import type { EventListenerService } from './event-listener/event-listener.service';

export interface AppModuleOptions {
  config: AppConfig;
  schedulerService: MissionSchedulerService;
  scheduleService: ScheduleService;
  triggerService: TriggerService;
  calendarService: CalendarService;
  executionService: ExecutionService;
  monitoringService: MonitoringService;
  historyService: HistoryService;
  eventListenerService: EventListenerService;
}

@Module({})
export class AppModule {
  static register(options: AppModuleOptions) {
    return {
      module: AppModule,
      imports: [
        LoggerModule.forRoot({
          pinoHttp: {
            level: options.config.LOG_LEVEL,
            transport:
              options.config.NODE_ENV === 'development'
                ? { target: 'pino-pretty', options: { colorize: true } }
                : undefined,
          },
        }),
      ],
      controllers: [
        HealthController,
        SchedulerController,
        MissionsController,
        TriggersController,
        HistoryController,
        CalendarController,
      ],
      providers: [
        { provide: APP_CONFIG, useValue: options.config },
        { provide: SCHEDULER_SERVICE, useValue: options.schedulerService },
        { provide: SCHEDULE_SERVICE, useValue: options.scheduleService },
        { provide: TRIGGER_SERVICE, useValue: options.triggerService },
        { provide: CALENDAR_SERVICE, useValue: options.calendarService },
        { provide: EXECUTION_SERVICE, useValue: options.executionService },
        { provide: MONITORING_SERVICE, useValue: options.monitoringService },
        { provide: HISTORY_SERVICE, useValue: options.historyService },
        { provide: EVENT_LISTENER_SERVICE, useValue: options.eventListenerService },
      ],
    };
  }
}
