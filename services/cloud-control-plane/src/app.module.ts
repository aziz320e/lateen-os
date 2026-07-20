import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import type { AppConfig } from './config/index';
import {
  CloudController,
  OrganizationsController,
  TenantsController,
  SubscriptionsController,
  DeploymentsController,
  BillingController,
  UsageController,
  SupportController,
  BackupsController,
  HealthController,
} from './api/cloud/cloud.controller';
import { APP_CONFIG, CLOUD_SERVICE } from './api/tokens';
import type { CloudService } from './application/cloud.service';

export interface AppModuleOptions {
  config: AppConfig;
  cloudService: CloudService;
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
        CloudController,
        OrganizationsController,
        TenantsController,
        SubscriptionsController,
        DeploymentsController,
        BillingController,
        UsageController,
        SupportController,
        BackupsController,
      ],
      providers: [
        { provide: APP_CONFIG, useValue: options.config },
        { provide: CLOUD_SERVICE, useValue: options.cloudService },
      ],
    };
  }
}
