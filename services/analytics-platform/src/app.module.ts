import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import type { AppConfig } from './config/index';
import {
  AnalyticsController,
  DashboardController,
  MetricsController,
  ReportsController,
  AlertsController,
  ExportsController,
  HealthController,
} from './api/analytics/analytics.controller';
import { APP_CONFIG, ANALYTICS_SERVICE } from './api/tokens';
import type { AnalyticsService } from './application/analytics.service';

export interface AppModuleOptions {
  config: AppConfig;
  analyticsService: AnalyticsService;
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
        AnalyticsController,
        DashboardController,
        MetricsController,
        ReportsController,
        AlertsController,
        ExportsController,
      ],
      providers: [
        { provide: APP_CONFIG, useValue: options.config },
        { provide: ANALYTICS_SERVICE, useValue: options.analyticsService },
      ],
    };
  }
}
