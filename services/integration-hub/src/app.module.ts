import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import type { AppConfig } from './config/index';
import { HealthController } from './api/health/health.controller';
import { ConnectorsController } from './api/connectors/connectors.controller';
import { SyncController } from './api/sync/sync.controller';
import { WebhooksController } from './api/webhooks/webhooks.controller';
import { JobsController } from './api/jobs/jobs.controller';
import {
  APP_CONFIG,
  CONNECTOR_SERVICE,
  JOB_SERVICE,
  MAPPING_SERVICE,
  MONITORING_SERVICE,
  SYNC_SERVICE,
  WEBHOOK_SERVICE,
} from './api/tokens';
import type { ConnectorService, MonitoringService, SyncService } from './application/integration.services';
import type { JobService } from './jobs/job.service';
import type { MappingService } from './mapping/mapping.service';
import type { WebhookService } from './webhooks/webhook.service';

export interface AppModuleOptions {
  config: AppConfig;
  connectorService: ConnectorService;
  syncService: SyncService;
  webhookService: WebhookService;
  jobService: JobService;
  mappingService: MappingService;
  monitoringService: MonitoringService;
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
      controllers: [HealthController, ConnectorsController, SyncController, WebhooksController, JobsController],
      providers: [
        { provide: APP_CONFIG, useValue: options.config },
        { provide: CONNECTOR_SERVICE, useValue: options.connectorService },
        { provide: SYNC_SERVICE, useValue: options.syncService },
        { provide: WEBHOOK_SERVICE, useValue: options.webhookService },
        { provide: JOB_SERVICE, useValue: options.jobService },
        { provide: MAPPING_SERVICE, useValue: options.mappingService },
        { provide: MONITORING_SERVICE, useValue: options.monitoringService },
      ],
    };
  }
}
